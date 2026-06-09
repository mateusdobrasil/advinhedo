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

  // 3. TRAVA DE SEGURANÇA: Administrador, Administrativo e Professor têm acesso.
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/aplicacao/ebd') // Se for Aluno ou visitante, expulsa da página
  }

  // =================================================================
  // 4. LÓGICA DO FILTRO DE BUSCA (Search Params)
  // =================================================================
  const resolvedSearch = await searchParams
  const busca = resolvedSearch?.q || ''

  // Query base buscando apenas alunos
  let query = supabase
    .from('perfis')
    .select('*')
    .ilike('tipo_usuario', '%aluno%')
    .order('nome_completo')

  // Se houver busca, aplicamos um filtro OR (Nome, Email ou CPF)
  if (busca) {
    query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%,cpf.ilike.%${busca}%`)
  }

  const { data: alunos } = await query

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👥 Cadastro Central de Alunos</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie todos os estudantes matriculados no sistema.</p>
          </div>
          <Link href="/aplicacao/ebd/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition whitespace-nowrap">
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
              placeholder="Buscar por nome, e-mail ou CPF..."
              className="flex-1 bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
                Buscar
              </button>
              {busca && (
                <Link href="/aplicacao/ebd/admin/cadastro" className="flex items-center justify-center bg-gray-100 text-gray-500 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-200 hover:text-gray-700 transition">
                  Limpar
                </Link>
              )}
            </div>
          </form>
          
          <div className="w-full lg:w-auto flex justify-end">
            <CriadorUsuario />
          </div>
        </div>

        {/* TABELA DE ALUNOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Nome Completo</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">E-mail</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-center">CPF</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos && alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">{aluno.nome_completo}</td>
                      <td className="px-6 py-4 text-gray-500">{aluno.email}</td>
                      <td className="px-6 py-4 text-gray-400 text-center">{aluno.cpf || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/aplicacao/ebd/admin/alunos/${aluno.id}`} 
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition"
                        >
                          Ver Perfil
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-gray-600 font-bold text-lg">Nenhum aluno encontrado</p>
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