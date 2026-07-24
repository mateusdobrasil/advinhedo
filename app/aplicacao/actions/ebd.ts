'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function salvarChamadaUnificada(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // 1. Extrai dados gerais da classe
  const turma_id = formData.get('turma_id') as string
  const data_aula = formData.get('data_aula') as string
  const visitantes = Number(formData.get('visitantes')) || 0
  const oferta = Number(formData.get('oferta')) || 0

  // Pega a lista bruta de alunos que veio do formulário
  const alunoIdsRaw = formData.getAll('aluno_ids') as string[]

  if (!alunoIdsRaw || alunoIdsRaw.length === 0) {
    throw new Error('Nenhum aluno encontrado para registrar a chamada.')
  }

  // 🔥 O ESCUDO ANTI-DUPLICIDADE:
  // Usa o Set() para arrancar qualquer ID repetido da lista.
  // Resolve o erro: "cannot affect row a second time"
  const alunoIds = Array.from(new Set(alunoIdsRaw))

  // 🧹 LIMPEZA DE PORTADOR ANTIGO:
  // Visitantes/oferta do dia ficam guardados numa única linha "portadora" (o primeiro aluno da lista).
  // Se esse portador mudar de um dia para o outro (ex.: o aluno que carregava o valor foi
  // desmatriculado ou a ordem da turma mudou), a linha antiga pode ficar com um valor "fantasma"
  // que nunca é zerado e é contado em dobro nos relatórios. Por isso zeramos aqui qualquer linha
  // desta data que não seja mais a portadora antes de gravar o novo valor.
  const { error: erroLimpeza } = await supabase
    .from('ebd_frequencia')
    .update({ visitantes: 0, oferta: 0 })
    .eq('turma_id', turma_id)
    .eq('data_aula', data_aula)
    .neq('aluno_id', alunoIds[0])

  if (erroLimpeza) {
    console.error("❌ ERRO AO LIMPAR DADOS GERAIS ANTIGOS:", erroLimpeza)
  }

  // 2. Constrói o array de registros para o banco
  const registrosParaSalvar = alunoIds.map((aluno_id, index) => {
    const presente = formData.has(`presente_${aluno_id}`)
    const trouxe_biblia = formData.has(`biblia_${aluno_id}`)
    const trouxe_revista = formData.has(`revista_${aluno_id}`)
    
    // TÉCNICA DE SEGURANÇA: Salva a oferta e visitantes APENAS na linha do primeiro aluno único
    const salvarDadosGerais = index === 0

    return {
      turma_id,
      aluno_id,
      data_aula,
      presente,
      trouxe_biblia,
      trouxe_revista,
      visitantes: salvarDadosGerais ? visitantes : 0,
      oferta: salvarDadosGerais ? oferta : 0
    }
  })

  // 3. O UPSERT: Insere novos ou atualiza existentes
  const { error } = await supabase
    .from('ebd_frequencia')
    .upsert(registrosParaSalvar, { 
      onConflict: 'aluno_id, turma_id, data_aula' 
    })

  // 4. Tratamento do Erro
  if (error) {
    console.error("❌ ERRO AO SALVAR NO BANCO:", error)
    throw new Error(`Falha ao registrar no banco de dados: ${error.message}`)
  }

  // 5. Atualiza a tela
  revalidatePath(`/aplicacao/ebd/admin/ebd/${turma_id}`)
}