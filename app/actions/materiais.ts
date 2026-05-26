'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
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
    .from('materiais')
    .upload(nomeUnico, arquivo)

  if (uploadError) {
    console.error("Erro no upload:", uploadError)
    throw new Error('Falha ao enviar o arquivo para a nuvem.')
  }

  // 3. Pega a URL pública (o link de download)
  const { data: { publicUrl } } = supabase.storage
    .from('materiais')
    .getPublicUrl(nomeUnico)

  // 4. Salva os dados na tabela do banco
  const { error: dbError } = await supabase.from('materiais').insert({
    titulo,
    descricao,
    arquivo_url: publicUrl,
  })

  if (dbError) {
    throw new Error('Falha ao salvar os dados no banco.')
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
      acao: 'NOME DA AÇÃO (Ex: NOVA MATRÍCULA)',
      tabela_afetada: 'nome_da_tabela',
      detalhes: `Descreva o que aconteceu aqui.`
    })
  }

  // Atualiza as páginas
  revalidatePath('/ibv/admin/materiais')
  revalidatePath('/ibv/materiais')
}