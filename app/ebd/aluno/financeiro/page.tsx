export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FinanceiroAlunoPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Segurança e Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/') // Padronizado para a raiz/login
  }

  // 2. Busca as faturas do aluno
  const { data: faturas, error } = await supabase
    .from('financeiro')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('data_vencimento', { ascending: true })

  if (error) {
    console.error("Erro ao buscar faturas:", error)
  }

  // 3. Funções de Formatação Mais Seguras
  const formatarMoeda = (valor: any) => {
    if (valor === null || valor === undefined) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor))
  }

  const formatarData = (dataString: any) => {
    if (!dataString) return 'Sem data'
    try {
      // Usar T12:00:00 evita o bug de fuso horário (-3h no Brasil caindo pro dia anterior)
      return new Date(dataString + 'T12:00:00').toLocaleDateString('pt-BR')
    } catch (e) {
      return 'Data inválida'
    }
  }

  // 4. Lógica de Resumo Financeiro (Totalizadores)
  const totalPendente = faturas
    ?.filter(f => f.status?.toUpperCase() !== 'PAGO')
    .reduce((acc, curr) => acc + Number(curr.valor), 0) || 0

  const totalPago = faturas
    ?.filter(f => f.status?.toUpperCase() === 'PAGO')
    .reduce((acc, curr) => acc + Number(curr.valor), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">💰 Meu Financeiro</h1>
            <p className="text-gray-500 text-sm mt-1">Consulte o histórico de suas mensalidades.</p>
          </div>
          <Link 
            href="/dashboard/aluno" 
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* MELHORIA UX: Resumo Financeiro (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pendente</span>
             <span className="text-2xl font-black text-red-600">{formatarMoeda(totalPendente)}</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pago</span>
             <span className="text-2xl font-black text-emerald-600">{formatarMoeda(totalPago)}</span>
          </div>
        </div>

        {/* Lista de Faturas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {faturas && faturas.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {faturas.map((fatura) => {
                // Normaliza o status para maiúsculas para não falhar na comparação
                const status = fatura.status?.toUpperCase() || 'PENDENTE'
                
                return (
                  <li key={fatura.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{fatura.descricao || 'Mensalidade'}</h3>
                      <p className="text-gray-500 text-sm font-medium">Vencimento: {formatarData(fatura.data_vencimento)}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-black text-gray-800 text-xl">
                        {formatarMoeda(fatura.valor)}
                      </span>
                      
                      {/* Status da Fatura Robusto */}
                      {status === 'PENDENTE' ? (
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          Pendente
                        </span>
                      ) : status === 'PAGO' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          Pago
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          {status} {/* Exibe "VENCIDO" ou qualquer outro status */}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
             <div className="p-12 text-center flex flex-col items-center">
              <span className="text-5xl mb-4">🙌</span>
              <p className="text-gray-600 font-bold text-lg">Nenhuma fatura encontrada.</p>
              <p className="text-gray-400 text-sm mt-1">Você está em dia com as suas obrigações!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}