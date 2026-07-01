'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function criarAviso(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const titulo = formData.get('titulo') as string
  const conteudo = formData.get('conteudo') as string
  const polo = formData.get('polo') as string
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

  revalidatePath('/aplicacao/ibv/admin/avisos')
}