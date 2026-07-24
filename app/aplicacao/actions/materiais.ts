'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { logAction } from '@/lib/audit'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const MODULOS_VALIDOS = ['ebd', 'ibv', 'ibuc'] as const
type Modulo = typeof MODULOS_VALIDOS[number]

export async function enviarMaterial(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const modulo = formData.get('modulo') as string
  if (!MODULOS_VALIDOS.includes(modulo as Modulo)) {
    throw new Error('Módulo inválido para o envio do material.')
  }

  // Cada módulo tem seu próprio bucket de Storage e sua própria tabela — mesmo nome nos dois:
  // ebd_materiais, ibv_materiais, ibuc_materiais (isolamento total entre EBD/IBV/IBUC)
  const nomeBucket = `${modulo}_materiais`
  const nomeTabela = `${modulo}_materiais`

  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const arquivo = formData.get('arquivo') as File

  if (!arquivo || arquivo.size === 0) {
    throw new Error('Nenhum arquivo selecionado.')
  }

  // 1. Cria um nome único para o arquivo (evita que um arquivo apague o outro com o mesmo nome)
  const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
  const nomeUnico = `${Date.now()}-${nomeSeguro}`

  // 2. Faz o upload para o Storage (bucket exclusivo do módulo)
  const { error: uploadError } = await supabase.storage
    .from(nomeBucket)
    .upload(nomeUnico, arquivo)

  if (uploadError) {
    console.error("Erro no upload:", uploadError)
    throw new Error('Falha ao enviar o arquivo para a nuvem.')
  }

  // 3. Pega a URL pública (o link de download)
  const { data: { publicUrl } } = supabase.storage
    .from(nomeBucket)
    .getPublicUrl(nomeUnico)

  // 4. Salva os dados na tabela do banco (tabela exclusiva do módulo)
  const { error: dbError } = await supabase.from(nomeTabela).insert({
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
      tableName: nomeTabela,
      details: `O material "${titulo}" foi enviado com sucesso. URL: ${publicUrl}`
    })
  }

  // Atualiza as páginas do módulo que enviou o material
  revalidatePath(`/aplicacao/${modulo}/admin/materiais`)
  revalidatePath(`/aplicacao/${modulo}/aluno/materiais`)
}
