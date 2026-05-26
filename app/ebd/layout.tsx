import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Analytics } from "@vercel/analytics/next"
import BotaoSair from '../components/BotaoSair'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  // Verifica Autenticação Global do Dashboard
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Busca os dados do perfil logado
  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome_completo, tipo_usuario')
    .eq('id', session.user.id)
    .single()

  const tipoUsuario = perfil?.tipo_usuario || 'ALUNO'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      
      {/* Navbar Global (Ficará visível em TODAS as páginas do Dashboard) */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <Link href="/ebd" className="font-black text-xl text-blue-700 tracking-tight hover:text-blue-800 transition">
          Portal IBV
        </Link>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <Link 
            href="/ebd/perfil" 
            className="flex items-center gap-2 group transition"
            title="Configurações de Perfil"
          >
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition line-clamp-1">
                    {perfil?.nome_completo || 'Meu Perfil'}
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none">
                    {tipoUsuario}
                </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-50 transition">
                <span className="text-xl">⚙️</span>
            </div>
          </Link>

          <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
          
          <BotaoSair />
        </div>
      </nav>

      {/* Conteúdo Específico de Cada Página (children) */}
      <div className="flex-1">
        {children}
      </div>

    </div>
  )
}