'use server'

import { logAction } from '@/lib/audit'
import { paraMaiusculo } from '@/lib/texto'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarAviso(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const titulo = paraMaiusculo(formData.get('titulo'))
  const conteudo = formData.get('conteudo') as string
  const poloForm = formData.get('polo') as string
  // "Todos" é um valor sentinela usado nos filtros de avisos (polo.eq.Todos) — não maiusculizar
  const polo = poloForm && poloForm !== 'Todos' ? paraMaiusculo(poloForm) : poloForm
  const turma_id = formData.get('turma_id') as string

  // Montamos o objeto de dados. Se não escolher turma, deixamos vazio (Geral)
  const dadosDoAviso: any = { titulo, conteudo, polo }
  if (turma_id) {
    dadosDoAviso.turma_id = turma_id
  }

  const { error } = await supabase.from('avisos').insert(dadosDoAviso)

  if (error) {
    console.error("ERRO AO CRIAR AVISO:", error)
    throw new Error(`Erro ao publicar aviso: ${error.message}`)
  }

  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    await logAction(supabase, session.user, {
      action: 'CRIAÇÃO DE AVISO',
      tableName: 'avisos',
      details: `Criou o aviso "${titulo}" para o polo ${polo || 'Geral'}.`
    })
  }

  for (const modulo of ['ebd', 'ibv', 'ibuc']) {
    revalidatePath(`/aplicacao/${modulo}/admin/avisos`)
  }
}