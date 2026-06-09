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
    .from('frequencia_ebd')
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