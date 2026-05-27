'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function matricularAluno(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  // Dados Acadêmicos
  const aluno_id = formData.get('aluno_id') as string
  const turma_id = formData.get('turma_id') as string

  // 🛡️ TRAVA ANTI-DUPLICIDADE INDIVIDUAL
  const { data: matriculaExistente } = await supabase
    .from('matriculas')
    .select('id')
    .eq('aluno_id', aluno_id)
    .eq('turma_id', turma_id)
    .maybeSingle()

  if (matriculaExistente) {
    throw new Error('⚠️ Este aluno já está matriculado nesta turma!')
  }

  // Dados Financeiros
  const valorMatricula = parseFloat(formData.get('valor_matricula') as string) || 0
  const valorMensalidade = parseFloat(formData.get('valor_mensalidade') as string) || 0
  const qtdeParcelas = parseInt(formData.get('quantidade_parcelas') as string) || 0
  const dataVencimentoInicial = formData.get('data_primeiro_vencimento') as string

  // 1. CRIAR A MATRÍCULA
  const { data: novaMatricula, error: erroMatricula } = await supabase
    .from('matriculas')
    .insert({
      aluno_id,
      turma_id,
      status: 'Ativo'
    })
    .select()
    .single()

  if (erroMatricula) throw new Error(`Erro ao matricular: ${erroMatricula.message}`)

  // 2. LÓGICA DE LANÇAMENTO FINANCEIRO
  const lancamentosFinanceiros = []

  // A) Lança a Taxa de Matrícula (se houver valor)
  if (valorMatricula > 0) {
    lancamentosFinanceiros.push({
      aluno_id,
      matricula_id: novaMatricula.id,
      turma_id,
      tipo: 'Taxa de Matrícula',
      valor: valorMatricula,
      data_vencimento: dataVencimentoInicial || new Date().toISOString().split('T')[0],
      status: 'Pendente',
      parcela: 'Única'
    })
  }

  // B) Lança as Mensalidades automaticamente baseadas no tempo de curso
  if (valorMensalidade > 0 && qtdeParcelas > 0 && dataVencimentoInicial) {
    const [anoStr, mesStr, diaStr] = dataVencimentoInicial.split('-')
    const anoInicial = parseInt(anoStr)
    const mesInicial = parseInt(mesStr)
    const diaInicial = parseInt(diaStr)

    for (let i = 0; i < qtdeParcelas; i++) {
      const dataCalculada = new Date(anoInicial, (mesInicial - 1) + i, diaInicial)
      const dataFormatada = dataCalculada.toISOString().split('T')[0]

      lancamentosFinanceiros.push({
        aluno_id,
        matricula_id: novaMatricula.id,
        turma_id,
        tipo: 'Mensalidade',
        valor: valorMensalidade,
        data_vencimento: dataFormatada,
        status: 'Pendente',
        parcela: `${i + 1}/${qtdeParcelas}`
      })
    }
  }

  // 3. INSERIR TUDO NO BANCO DE UMA SÓ VEZ (Lote)
  if (lancamentosFinanceiros.length > 0) {
    const { error: erroFinanceiro } = await supabase
      .from('financeiro')
      .insert(lancamentosFinanceiros)

    if (erroFinanceiro) {
      console.error("Erro ao gerar parcelas:", erroFinanceiro)
      throw new Error("Matrícula concluída, mas houve erro ao gerar o financeiro automático.")
    }
  }

  // Atualiza as páginas
  revalidatePath('/ibv/admin/matriculas')
  revalidatePath('/ibv/admin/turmas')
}

// ==========================================
// FUNÇÃO PARA TRANCAR / REATIVAR MATRÍCULAS
// ==========================================
export async function alterarStatusMatricula(matriculaId: string, novoStatus: string) {
  const supabase = createServerActionClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const { error } = await supabase
    .from('matriculas')
    .update({ status: novoStatus })
    .eq('id', matriculaId)

  if (error) throw new Error(`Erro ao alterar status: ${error.message}`)

  revalidatePath('/ibv/admin/matriculas')
  revalidatePath('/ibv/admin/turmas')
}

// ==========================================
// FUNÇÃO PARA MATRÍCULA EM LOTE (VÁRIOS ALUNOS)
// ==========================================
export async function matricularEmLote(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const turma_id = formData.get('turma_id') as string
  const alunos_selecionados = formData.getAll('alunos_selecionados') as string[]

  if (!alunos_selecionados || alunos_selecionados.length === 0) {
    throw new Error('Selecione pelo menos um aluno para matricular.')
  }

  // 🛡️ TRAVA ANTI-DUPLICIDADE EM LOTE
  // Verifica no banco quais desses alunos já estão nessa turma
  const { data: matriculasExistentes } = await supabase
    .from('matriculas')
    .select('aluno_id')
    .eq('turma_id', turma_id)
    .in('aluno_id', alunos_selecionados)

  // Cria uma lista apenas com os IDs dos que já estão matriculados
  const alunosJaMatriculados = matriculasExistentes?.map(m => m.aluno_id) || []

  // Filtra a lista original, mantendo APENAS os alunos que ainda NÃO estão matriculados
  const alunosParaMatricular = alunos_selecionados.filter(id => !alunosJaMatriculados.includes(id))

  // Se todos os alunos selecionados já estiverem matriculados, bloqueia a operação
  if (alunosParaMatricular.length === 0) {
    throw new Error('⚠️ Todos os alunos selecionados já estão matriculados nesta turma.')
  }

  // Dados Financeiros Padrão para o Lote
  const valorMatricula = parseFloat(formData.get('valor_matricula') as string) || 0
  const valorMensalidade = parseFloat(formData.get('valor_mensalidade') as string) || 0
  const qtdeParcelas = parseInt(formData.get('quantidade_parcelas') as string) || 0
  const dataVencimentoInicial = formData.get('data_primeiro_vencimento') as string

  const lancamentosFinanceiros = []

  // Loop para processar APENAS os alunos filtrados e válidos
  for (const aluno_id of alunosParaMatricular) {
    // 1. Cria a Matrícula
    const { data: novaMatricula, error: erroMatricula } = await supabase
      .from('matriculas')
      .insert({
        aluno_id,
        turma_id,
        status: 'Ativo'
      })
      .select()
      .single()

    if (erroMatricula) {
      console.error(`Erro ao matricular aluno ${aluno_id}:`, erroMatricula.message)
      continue 
    }

    // 2. Prepara o Financeiro daquele aluno
    if (valorMatricula > 0) {
      lancamentosFinanceiros.push({
        aluno_id,
        matricula_id: novaMatricula.id,
        turma_id,
        tipo: 'Taxa de Matrícula',
        valor: valorMatricula,
        data_vencimento: dataVencimentoInicial || new Date().toISOString().split('T')[0],
        status: 'Pendente',
        parcela: 'Única'
      })
    }

    if (valorMensalidade > 0 && qtdeParcelas > 0 && dataVencimentoInicial) {
      const [anoStr, mesStr, diaStr] = dataVencimentoInicial.split('-')
      const anoInicial = parseInt(anoStr)
      const mesInicial = parseInt(mesStr)
      const diaInicial = parseInt(diaStr)

      for (let i = 0; i < qtdeParcelas; i++) {
        const dataCalculada = new Date(anoInicial, (mesInicial - 1) + i, diaInicial)
        const dataFormatada = dataCalculada.toISOString().split('T')[0]

        lancamentosFinanceiros.push({
          aluno_id,
          matricula_id: novaMatricula.id,
          turma_id,
          tipo: 'Mensalidade',
          valor: valorMensalidade,
          data_vencimento: dataFormatada,
          status: 'Pendente',
          parcela: `${i + 1}/${qtdeParcelas}`
        })
      }
    }
  }

  // 3. Insere todo o financeiro gerado de uma só vez no banco
  if (lancamentosFinanceiros.length > 0) {
    const { error: erroFinanceiro } = await supabase
      .from('financeiro')
      .insert(lancamentosFinanceiros)

    if (erroFinanceiro) throw new Error("Matrículas concluídas, mas houve erro ao gerar financeiro.")
  }

  revalidatePath('/ibv/admin/matriculas')
  revalidatePath('/ibv/admin/turmas')
}