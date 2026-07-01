'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { logAction } from '@/lib/audit'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function enviarMaterial(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const arquivo = formData.get('arquivo') as File

  if (!arquivo || arquivo.size === 0) {
    throw new Error('Nenhum arquivo selecionado.')
  }

  // 1. Cria um nome único para o arquivo (evita que um arquivo apague o outro com o mesmo nome)
  const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
  const nomeUnico = `${Date.now()}-${nomeSeguro}`

  // 2. Faz o upload para o Storage (Bucket 'materiais')
  const { error: uploadError } = await supabase.storage
    .from('ibv_materiais')
    .upload(nomeUnico, arquivo)

  if (uploadError) {
    console.error("Erro no upload:", uploadError)
    throw new Error('Falha ao enviar o arquivo para a nuvem.')
  }

  // 3. Pega a URL pública (o link de download)
  const { data: { publicUrl } } = supabase.storage
    .from('ibv_materiais')
    .getPublicUrl(nomeUnico)

  // 4. Salva os dados na tabela do banco
  const { error: dbError } = await supabase.from('ibv_materiais').insert({
    titulo,
    descricao,
    arquivo_url: publicUrl,
  })

  if (dbError) {
    throw new Error('Falha ao salvar os dados no banco.')
  }

  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    await logAction(supabase, session.user, {
      action: 'ENVIO DE MATERIAL',
      tableName: 'ibv_materiais',
      details: `O material "${titulo}" foi enviado com sucesso. URL: ${publicUrl}`
    })
  }

  // Atualiza as páginas
  revalidatePath('/aplicacao/ibv/admin/materiais')
  revalidatePath('/aplicacao/ibv/materiais')
}