'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function lancarDiario(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. Descobre quem é o Administrador/Professor que está fazendo o lançamento
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Usuário não autenticado.')

  // Cada módulo tem sua própria tabela isolada: ebd_diario_classe, ibv_diario_classe, ibuc_diario_classe
  const modulo = formData.get('modulo') as string
  const tabela = `${modulo}_diario_classe`

  // 2. Pega os dados do formulário
  const id = formData.get('id') as string
  const aluno_id = formData.get('aluno_id') as string
  const turma_id = formData.get('turma_id') as string
  const materia_id = formData.get('materia_id') as string
  const faltas = parseInt(formData.get('faltas') as string)
  const nota = parseFloat(formData.get('nota') as string)
  const observacao = formData.get('observacao') as string || null

  if (!Number.isNaN(nota) && (nota < 0 || nota > 10)) {
    throw new Error('A nota deve estar entre 0 e 10.')
  }

  // 🛡️ TRAVA ANTI-DUPLICIDADE: só verifica ao criar um lançamento novo
  if (!id) {
    const { data: existente } = await supabase
      .from(tabela)
      .select('id')
      .eq('aluno_id', aluno_id)
      .eq('turma_id', turma_id)
      .eq('materia_id', materia_id)
      .maybeSingle()

    if (existente) {
      throw new Error('⚠️ Já existe um lançamento para este aluno nesta turma/matéria. Edite o lançamento existente.')
    }
  }

  // 3. SALVA A NOTA NO DIÁRIO
  const dados = { aluno_id, turma_id, materia_id, faltas, nota, observacao }
  const { error: diarioError } = id
    ? await supabase.from(tabela).update(dados).eq('id', id)
    : await supabase.from(tabela).insert(dados)

  if (diarioError) {
    console.error("Erro ao salvar no diário:", diarioError)
    throw new Error('Não foi possível salvar o registro no banco.')
  }

  // 👇 NOVA BUSCA: Pegar o nome do aluno para o log
  const { data: aluno } = await supabase
    .from('perfis')
    .select('nome_completo')
    .eq('id', aluno_id)
    .single()

  const nomeAluno = aluno?.nome_completo || 'Aluno Desconhecido'
  
  // 4. O ESPIÃO DA AUDITORIA (Agora com o nome do aluno!)
  await logAction(supabase, session.user, {
    action: 'LANÇAMENTO DE NOTA',
    tableName: tabela,
    details: `Lançou nota ${nota} e ${faltas} faltas para o aluno: ${nomeAluno}`
  })

  revalidatePath(`/aplicacao/${modulo}/admin/diario`)
  revalidatePath(`/aplicacao/${modulo}/admin/auditoria`)
}