export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotasAlunoPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/')
  }

  // 2. INNER JOIN com as tabelas de matérias e turmas
  const { data: boletim, error } = await supabase
    .from('diario_classe')
    .select(`
      *,
      materias!inner(nome),
      turmas!inner(nome)
    `)
    .eq('aluno_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("❌ Erro ao buscar boletim no diario_classe:", error)
  }

  // DEBUG: Confirme no seu terminal se agora o array traz materias.nome e turmas.nome
  console.log("🔎 DIÁRIO DE CLASSE DO ALUNO (COM INNER JOIN):", boletim)

  // 3. Lógica do Resumo de Desempenho (Média Geral)
  const notasLancadas = boletim?.filter(b => b.nota !== null && b.nota !== undefined) || []
  
  const mediaGeral = notasLancadas.length > 0 
    ? notasLancadas.reduce((acc, curr) => acc + Number(curr.nota), 0) / notasLancadas.length 
    : 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">📊 Meu Boletim</h1>
            <p className="text-gray-500 text-sm mt-1">Acompanhe suas notas e frequências por disciplina.</p>
          </div>
          <Link 
            href="/dashboard/aluno" 
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Resumo de Desempenho */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Média Geral Acumulada</span>
             <span className={`text-3xl font-black ${mediaGeral >= 7 ? 'text-emerald-600' : mediaGeral > 0 ? 'text-red-600' : 'text-gray-400'}`}>
               {mediaGeral > 0 ? mediaGeral.toFixed(1) : '-'}
             </span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Disciplinas Avaliadas</span>
             <span className="text-2xl font-black text-indigo-600">{notasLancadas.length} <span className="text-sm text-gray-400 font-medium tracking-normal">concluídas</span></span>
          </div>
        </div>

        {/* Tabela de Notas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Disciplina</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">Turma</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-center">Faltas</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-center">Nota Final</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px] text-right">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {boletim && boletim.length > 0 ? (
                  boletim.map((item) => {
                    const notaLancada = item.nota !== null && item.nota !== undefined
                    const aprovado = notaLancada && item.nota >= 7
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {item.materias?.nome || 'Não informada'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {item.turmas?.nome || '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-bold">
                          {item.faltas || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-lg">
                          {notaLancada ? (
                            <span className={aprovado ? 'text-emerald-600' : 'text-red-600'}>
                              {Number(item.nota).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!notaLancada ? (
                             <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                               Cursando
                             </span>
                          ) : aprovado ? (
                             <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                               Aprovado
                             </span>
                          ) : (
                             <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-red-100 text-red-800">
                               Reprovado
                             </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <span className="text-4xl mb-3 block">🎓</span>
                      <p className="text-gray-600 font-bold text-lg">Nenhum registro encontrado.</p>
                      <p className="text-gray-400 text-sm mt-1">Você ainda não possui histórico de notas neste curso.</p>
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