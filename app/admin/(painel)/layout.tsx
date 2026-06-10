import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AdminPainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  // Verifica se o navegador do usuário tem o carimbo de acesso
  const isAuthenticated = cookieStore.get('admin_acesso_site')?.value === 'autorizado'

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  )
}