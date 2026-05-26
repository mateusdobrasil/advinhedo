export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function RelatoriosPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Segurança: Verifica sessão e perfil
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || tipo.includes('administrativo')

  if (!temAcesso) {
    redirect('/dashboard/admin') 
  }

  // =================================================================
  // DADOS GERAIS DO INSTITUTO
  // =================================================================
  const { count: totalAlunos } = await supabase.from('perfis').select('*', { count: 'exact', head: true }).ilike('tipo_usuario', '%aluno%')
  const { count: totalTurmas } = await supabase.from('turmas').select('*', { count: 'exact', head: true })
  const { count: totalMatriculas } = await supabase.from('matriculas').select('*', { count: 'exact', head: true })

  const { data: financeiro } = await supabase.from('financeiro').select('valor, status')
  let receitaRecebida = 0
  let receitaPendente = 0

  if (financeiro) {
    financeiro.forEach(f => {
      if (f.status === 'Pago' || f.status === 'pago') {
        receitaRecebida += Number(f.valor)
      } else {
        receitaPendente += Number(f.valor)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              📈 Relatório Institucional
            </h1>
            <p className="text-gray-500 text-sm mt-1">Visão geral e métricas de desempenho do Instituto.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/admin/relatoriosEBD" className="text-sm bg-indigo-50 border border-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition shadow-sm">
              Ver Relatório da EBD ➡️
            </Link>
            <Link href="/dashboard/admin" className="text-sm bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
              Voltar ao Hub
            </Link>
          </div>
        </div>

        {/* GRID DE MÉTRICAS GERAIS (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl text-2xl">👥</div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Total de Alunos</p>
              <p className="text-3xl font-black text-gray-800">{totalAlunos || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-50 text-purple-600 p-4 rounded-xl text-2xl">🏫</div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Turmas Ativas</p>
              <p className="text-3xl font-black text-gray-800">{totalTurmas || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-2xl">📝</div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Matrículas</p>
              <p className="text-3xl font-black text-gray-800">{totalMatriculas || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-2xl">💰</div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Receita Caixa</p>
              <p className="text-2xl font-black text-gray-800">R$ {receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* ÁREA DE DETALHES INFERIORES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Status Financeiro Geral</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-800 font-bold text-sm">✅ Mensalidades Pagas</span>
                <span className="font-black text-green-700 text-lg">R$ {receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-red-800 font-bold text-sm">⚠️ Valores Pendentes/Atrasados</span>
                <span className="font-black text-red-700 text-lg">R$ {receitaPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center border border-slate-800">
            <h3 className="font-black text-lg mb-2 text-indigo-300">Exportação de Dados</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Precisa de relatórios mais detalhados? Você pode gerar planilhas exportando os dados diretamente nas abas de <strong>Alunos</strong> ou <strong>Financeiro</strong>.
            </p>
            <button disabled className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed w-max flex items-center gap-2 border border-white/10">
              Baixar Relatório Completo PDF <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase">Em Breve</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}