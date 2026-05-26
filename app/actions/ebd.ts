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

  const alunoIds = formData.getAll('aluno_ids') as string[]

  if (!alunoIds || alunoIds.length === 0) {
    throw new Error('Nenhum aluno encontrado para registrar a chamada.')
  }

  // 2. Constrói o array de registros para o banco (Alinhado 100% com o seu SQL)
  const registrosParaSalvar = alunoIds.map((aluno_id, index) => {
    const presente = formData.has(`presente_${aluno_id}`)
    const trouxe_biblia = formData.has(`biblia_${aluno_id}`)
    const trouxe_revista = formData.has(`revista_${aluno_id}`)
    
    // TÉCNICA DE SEGURANÇA: Salva a oferta e visitantes APENAS na linha do primeiro aluno
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
      // REMOVIDO o campo 'faltas' que estava a causar conflito com o SQL
    }
  })

  // 3. Estratégia de "Limpa e Grava de Novo" para permitir edições fáceis da chamada do dia
  const { error: deleteError } = await supabase
    .from('frequencia_ebd')
    .delete()
    .eq('turma_id', turma_id)
    .eq('data_aula', data_aula)

  if (deleteError) {
    console.error("❌ ERRO AO LIMPAR CHAMADA ANTERIOR:", deleteError)
    throw new Error(`Erro ao preparar o banco: ${deleteError.message}`)
  }

  // 4. Insere a nova lista de presença (agora respeitando exatamente a estrutura da sua tabela)
  const { error: insertError } = await supabase
    .from('frequencia_ebd')
    .insert(registrosParaSalvar)

  if (insertError) {
    console.error("❌ ERRO AO INSERIR DADOS NA TABELA FREQUENCIA_EBD:", insertError)
    throw new Error(`Erro no banco: ${insertError.message}`)
  }

  // 5. Atualiza os componentes visuais na tela
  revalidatePath(`/ibv/admin/ebd/${turma_id}`)
}