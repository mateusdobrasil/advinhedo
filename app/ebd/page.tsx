import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Analytics } from "@vercel/analytics/next"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verifica sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca cargo (forçamos sem cache para não dar erro de leitura antiga)
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  const cargos = perfil?.tipo_usuario || ''

  // 3. Log para você ver no terminal o que o banco está enviando
  console.log("CARGO DETECTADO NO DASHBOARD:", cargos)

  const cargosAdmin = ['administrador', 'secretario', 'tesoureiro', 'cadastro', 'professor']
  const temAcessoAdmin = cargosAdmin.some(cargo => cargos.includes(cargo))

  if (temAcessoAdmin) {
    redirect('/ebd/admin')
  } else {
    redirect('/ebd/aluno')
  }
}