'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { logAction } from '@/lib/audit'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function exigirAdministrador(supabase: ReturnType<typeof createServerActionClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  if (!perfil?.tipo_usuario?.toLowerCase().includes('administrador')) {
    throw new Error('Acesso negado: apenas administradores podem gerenciar níveis de acesso.')
  }

  return session
}

function revalidarTelas() {
  for (const modulo of ['ebd', 'ibv', 'ibuc']) {
    revalidatePath(`/aplicacao/${modulo}/admin/niveis-acesso`)
    revalidatePath(`/aplicacao/${modulo}/admin/permissoes`)
  }
}

export async function criarNivelAcesso(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  const session = await exigirAdministrador(supabase)

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) throw new Error('Informe o nome do nível de acesso.')

  const { error } = await supabase.from('niveis_acesso').insert({ nome })

  if (error) {
    if (error.code === '23505') throw new Error('Esse nível de acesso já existe.')
    throw new Error(`Erro ao criar nível de acesso: ${error.message}`)
  }

  await logAction(supabase, session.user, {
    action: 'NOVO NÍVEL DE ACESSO',
    tableName: 'niveis_acesso',
    details: `Criou o nível de acesso "${nome}".`
  })

  revalidarTelas()
}

export async function excluirNivelAcesso(id: string, nome: string) {
  const supabase = createServerActionClient({ cookies })
  const session = await exigirAdministrador(supabase)

  const { error } = await supabase.from('niveis_acesso').delete().eq('id', id)
  if (error) throw new Error(`Erro ao remover nível de acesso: ${error.message}`)

  await logAction(supabase, session.user, {
    action: 'REMOÇÃO DE NÍVEL DE ACESSO',
    tableName: 'niveis_acesso',
    details: `Removeu o nível de acesso "${nome}".`
  })

  revalidarTelas()
}
