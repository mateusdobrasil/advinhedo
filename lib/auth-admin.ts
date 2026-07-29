import { createServerActionClient } from '@supabase/auth-helpers-nextjs'

export async function exigirAdministrador(supabase: ReturnType<typeof createServerActionClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autorizado')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  if (!perfil?.tipo_usuario?.toLowerCase().includes('administrador')) {
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação.')
  }

  return session
}
