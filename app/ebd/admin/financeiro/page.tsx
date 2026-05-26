export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorFinanceiro from '../../../components/CriadorFinanceiro'

export default async function FinanceiroPage() {
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

  // 3. TRAVA DE SEGURANÇA: Apenas Administrador e Administrativo
  // O Professor e o Aluno são bloqueados nesta tela
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || tipo.includes('administrativo')

  if (!temAcesso) {
    redirect('/dashboard/admin') // Redireciona o Professor de volta para o Hub
  }

  // 4. Busca todos os usuários do tipo "aluno" 
  const { data: alunos } = await supabase
    .from('perfis')
    .select('id, nome_completo, cpf')
    .ilike('tipo_usuario', '%aluno%')
    .order('nome_completo')

  // 5. Busca o financeiro puxando o nome do aluno
  const { data: cobrancas } = await supabase
    .from('financeiro')
    .select(`
      *,
      perfis ( nome_completo )
    `)
    .order('data_vencimento', { ascending: true }) // Ordena pelos vencimentos mais próximos

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💰 Controle Financeiro</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie mensalidades, taxas e pagamentos dos alunos.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
            Voltar ao Hub
          </Link>
        </div>

        <div className="mb-8 flex justify-end">
          <CriadorFinanceiro alunos={alunos || []} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Vencimento</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cobrancas && cobrancas.length > 0 ? (
                  cobrancas.map((cob) => {
                    // Lógica visual para as cores do status
                    let statusColor = "bg-yellow-100 text-yellow-700" // Pendente
                    if (cob.status === 'Pago') statusColor = "bg-green-100 text-green-700"
                    if (cob.status === 'Atrasado') statusColor = "bg-red-100 text-red-700"

                    // Formatar data ajustando o fuso horário (evita bugs de dia anterior)
                    const dataVenc = new Date(cob.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')

                    return (
                      <tr key={cob.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-600">{dataVenc}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {(cob.perfis as any)?.nome_completo || 'Aluno Excluído'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{cob.descricao}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">R$ {cob.valor.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                            {cob.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {cob.status === 'Pendente' && (
                            <button className="text-green-600 hover:text-green-800 text-sm font-bold bg-green-50 px-3 py-1 rounded-md transition">
                              Baixar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma cobrança registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}