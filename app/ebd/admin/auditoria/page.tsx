export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AuditoriaPage() {
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
    // Se for Administrativo ou Professor, volta para o Hub. (Aluno já cai na trava do layout)
    redirect('/dashboard/admin') 
  }

  // 4. Busca os logs mais recentes
  const { data: logs, error } = await supabase
    .from('auditoria')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              👁️ Painel de Auditoria
            </h1>
            <p className="text-gray-500 text-sm mt-1">Rastreamento completo de ações e alterações no sistema.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
            Voltar ao Hub
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Data/Hora</th>
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-6 py-3 font-medium">Ação Realizada</th>
                  <th className="px-6 py-3 font-medium">Tabela</th>
                  <th className="px-6 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {log.usuario_nome || 'Sistema'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black uppercase">
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-[10px]">
                        {log.tabela_afetada || '---'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate">
                        {log.detalhes || 'Sem detalhes técnicos.'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhuma atividade suspeita ou registro de log encontrado.
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