'use server'

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

  // COLE ISSO DEPOIS QUE O SEU CÓDIGO FIZER UM INSERT/UPDATE IMPORTANTE

  // 1. Descobre quem é o Admin que está fazendo a ação
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    const { data: admin } = await supabase
      .from('perfis')
      .select('nome_completo')
      .eq('id', session.user.id)
      .single()

    // 2. Grava a ação no banco
    await supabase.from('auditoria').insert({
      usuario_id: session.user.id,
      usuario_nome: admin?.nome_completo || 'Sistema',
      acao: 'Criar Avisos',
      tabela_afetada: 'avisos',
      detalhes: `Foi criado um novo aviso.`
    })
  }

  revalidatePath('/aplicacao/ibv/admin/avisos')
}