export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import EditorPermissao from '../../../components/EditorPermissao'

interface PageProps {
  searchParams: any
}

export default async function PermissoesPage({ searchParams }: PageProps) {
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

  // 3. TRAVA DE SEGURANÇA MÁXIMA: Apenas Administrador tem acesso.
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador')

  if (!temAcesso) {
    redirect('/dashboard/admin') // Se for Administrativo ou Professor, volta para o Hub
  }

  // =================================================================
  // 4. LÓGICA DO FILTRO DE BUSCA (Search Params)
  // =================================================================
  const resolvedSearch = await searchParams
  const busca = resolvedSearch?.q || ''

  let query = supabase.from('perfis').select('*').order('nome_completo')

  // Se o usuário digitou algo na busca, aplica o filtro do Supabase (ilike = ignora maiúsculas/minúsculas)
  // O .or() permite buscar o termo em qualquer uma dessas colunas simultaneamente
  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%,polo.ilike.%${busca}%,tipo_usuario.ilike.%${busca}%`)
  }

  const { data: usuarios } = await query

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🔐 Controle de Permissões</h1>
            <p className="text-gray-500 text-sm mt-1">Atribua múltiplos acessos e polos para os usuários do sistema.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition whitespace-nowrap">
            Voltar ao Hub
          </Link>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              defaultValue={busca}
              placeholder="Pesquisar por nome, e-mail, polo ou cargo..."
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="submit" className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                Buscar
              </button>
              {busca && (
                <Link href="/dashboard/admin/permissoes" className="flex items-center justify-center bg-gray-100 text-gray-500 px-4 py-3 rounded-lg text-sm font-bold hover:bg-gray-200 hover:text-gray-700 transition">
                  Limpar
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* TABELA DE USUÁRIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Nome do Usuário</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Email</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-center">Atuação (Polos)</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-center">Níveis de Acesso</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios && usuarios.length > 0 ? (
                  usuarios.map((usr) => {
                    // Separa os múltiplos polos em uma lista, limpa espaços vazios
                    const polos = usr.polo 
                      ? usr.polo.split(',').map((p: string) => p.trim()).filter(Boolean) 
                      : ['Geral']
                    
                    // Separa os múltiplos cargos em uma lista, limpa espaços vazios
                    const cargos = usr.tipo_usuario 
                      ? usr.tipo_usuario.split(',').map((c: string) => c.trim()).filter(Boolean) 
                      : ['Aluno']

                    return (
                      <tr key={usr.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">{usr.nome_completo}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{usr.email}</td>
                        
                        {/* COLUNA DE POLOS */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {polos.map((p: string) => (
                              <span key={p} className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* COLUNA DE CARGOS COM NOVAS CORES PADRONIZADAS */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {cargos.map((cargo: string) => {
                              const cargoLower = cargo.toLowerCase()
                              let cargoColor = "bg-gray-100 text-gray-700" // Cor de fallback
                              
                              if (cargoLower === 'administrador') cargoColor = "bg-purple-100 text-purple-800 border border-purple-200"
                              if (cargoLower === 'administrativo') cargoColor = "bg-blue-100 text-blue-800 border border-blue-200"
                              if (cargoLower === 'professor') cargoColor = "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              if (cargoLower === 'aluno') cargoColor = "bg-gray-100 text-gray-600 border border-gray-200"

                              return (
                                <span key={cargo} className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap ${cargoColor}`}>
                                  {cargo}
                                </span>
                              )
                            })}
                          </div>
                        </td>

                        {/* BOTÃO DE AÇÃO */}
                        <td className="px-6 py-4 text-right">
                          <EditorPermissao usuario={usr} />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
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