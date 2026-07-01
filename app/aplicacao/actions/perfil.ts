'use server'

import { logAction } from '@/lib/audit'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function atualizarPerfil(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Pega quem está logado
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const nome = formData.get('nome') as string
  const novaSenha = formData.get('senha') as string

  // 1. Atualiza o nome na tabela 'perfis'
  if (nome) {
    const { error: perfilError } = await supabase
      .from('perfis')
      .update({ nome_completo: nome })
      .eq('id', session.user.id)

    if (perfilError) throw new Error('Erro ao atualizar o nome.')
  }
 

  // 2. Atualiza a senha (se o usuário digitou alguma coisa)
  if (novaSenha && novaSenha.length >= 6) {
    const { error: authError } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (authError) throw new Error('Erro ao atualizar a senha. A senha deve ter no mínimo 6 caracteres.')
  }

  // 3. Grava a ação de auditoria
  if (session) {
    await logAction(supabase, session.user, {
      action: 'ATUALIZAÇÃO DE PERFIL',
      tableName: 'perfis',
      details: `O usuário ${nome || session.user.email} atualizou seu próprio perfil. Nova senha foi ${novaSenha ? 'definida' : 'mantida'}.`
    })
  }

  // Atualiza as páginas que mostram o nome do usuário
  revalidatePath('/aplicacao/ibv')
  revalidatePath('/aplicacao/ibv/perfil')
}