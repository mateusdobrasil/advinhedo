export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorUsuario from '../../../components/CriadorUsuario'

interface PageProps {
  searchParams: any
}

export default async function CadastroCentralPage({ searchParams }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca o perfil do usuário logado para checar acesso
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // 3. TRAVA DE SEGURANÇA: Administrador, Administrativo e Professor
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/ebd') // Se não tiver permissão, redireciona para fora do admin
  }

  // =================================================================
  // 4. LÓGICA DO FILTRO DE BUSCA (Search Params)
  // =================================================================
  const resolvedSearch = await searchParams
  const busca = resolvedSearch?.q || ''

  let query = supabase.from('perfis').select('*').order('nome_completo')

  // Se houver busca, aplicamos um filtro OR (Nome, Email ou Cargo)
  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%,tipo_usuario.ilike.%${busca}%`)
  }

  const { data: usuarios } = await query

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👥 Cadastro Central</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie todos os usuários do sistema (Alunos e Equipe).</p>
          </div>
          <Link href="/ebd/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition whitespace-nowrap">
            Voltar ao Hub
          </Link>
        </div>

        {/* BARRA DE AÇÕES (FILTRO E NOVO CADASTRO) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-lg bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <input
              type="text"
              name="q"
              defaultValue={busca}
              placeholder="Buscar por nome, e-mail ou cargo..."
              className="flex-1 bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                Buscar
              </button>
              {busca && (
                <Link href="/ebd/admin/cadastro" className="flex items-center justify-center bg-gray-100 text-gray-500 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 hover:text-gray-700 transition">
                  Limpar
                </Link>
              )}
            </div>
          </form>
          
          <div className="w-full lg:w-auto flex justify-end">
            <CriadorUsuario />
          </div>
        </div>

        {/* TABELA DE USUÁRIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Nome Completo</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Cargos / Acesso</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">E-mail</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios && usuarios.length > 0 ? (
                  usuarios.map((user) => {
                    // Pega os cargos e transforma em um array para as etiquetas
                    const cargos = user.tipo_usuario ? user.tipo_usuario.split(',') : ['aluno']
                    
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-800">{user.nome_completo}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {cargos.map((cargo: string) => (
                              <span 
                                key={cargo} 
                                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase
                                  ${cargo.trim().toLowerCase() === 'administrador' ? 'bg-red-100 text-red-700' : 
                                    cargo.trim().toLowerCase() === 'professor' ? 'bg-orange-100 text-orange-700' : 
                                    'bg-blue-100 text-blue-700'}`}
                              >
                                {cargo.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={`/ebd/admin/cadastro/${user.id}`} 
                            className="text-[11px] bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold uppercase tracking-wider hover:bg-blue-100 transition shadow-sm inline-block"
                          >
                            Ver perfil
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-gray-600 font-bold text-lg">Nenhum usuário encontrado</p>
                      <p className="text-gray-400 text-sm mt-1">Tente pesquisar com outros termos ou limpe o filtro.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}