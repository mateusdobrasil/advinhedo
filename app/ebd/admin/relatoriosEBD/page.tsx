export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import BotaoExportarEBD from '@/app/components/BotaoExportarEBD'

interface PageProps {
  searchParams: any
}

export default async function RelatoriosEBDPage({ searchParams }: PageProps) {
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
  // 2. LÓGICA DO RELATÓRIO DA EBD (Filtros e Rankings)
  // =================================================================
  const resolvedSearch = await searchParams
  const periodo = resolvedSearch?.periodo || 'diario'
  
  const hoje = new Date()
  const dataPadrao = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  const anoAtual = hoje.getFullYear().toString()
  const trimestreAtual = Math.ceil((hoje.getMonth() + 1) / 3).toString()

  const dataFiltro = resolvedSearch?.data || dataPadrao
  const anoFiltro = resolvedSearch?.ano || anoAtual
  const trimestreFiltro = resolvedSearch?.trimestre || trimestreAtual

  let start = ''
  let end = ''
  let labelPeriodo = ''

  if (periodo === 'anual') {
    start = `${anoFiltro}-01-01`
    end = `${anoFiltro}-12-31`
    labelPeriodo = `Ano Base: ${anoFiltro}`
  } else if (periodo === 'trimestre') {
    if (trimestreFiltro === '1') { start = `${anoFiltro}-01-01`; end = `${anoFiltro}-03-31` }
    else if (trimestreFiltro === '2') { start = `${anoFiltro}-04-01`; end = `${anoFiltro}-06-30` }
    else if (trimestreFiltro === '3') { start = `${anoFiltro}-07-01`; end = `${anoFiltro}-09-30` }
    else if (trimestreFiltro === '4') { start = `${anoFiltro}-10-01`; end = `${anoFiltro}-12-31` }
    labelPeriodo = `${trimestreFiltro}º Trimestre de ${anoFiltro}`
  } else {
    start = dataFiltro
    end = dataFiltro
    labelPeriodo = `Data: ${new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')}`
  }

  // =================================================================
  // CONSULTAS AO BANCO
  // =================================================================
  
  // Total de Alunos Matriculados Ativos Geral
  const { count: totalAlunosAtivos } = await supabase
    .from('perfis')
    .select('id', { count: 'exact', head: true })
    .ilike('tipo_usuario', '%aluno%')
    .eq('status', 'Ativo')

  // Presenças de Alunos para o Ranking Individual
  const { data: frequenciasAlunos } = await supabase
    .from('frequencia_ebd')
    .select(`
      aluno_id,
      presente,
      perfis:aluno_id (nome_completo)
    `)
    .gte('data_aula', start)
    .lte('data_aula', end)
    .eq('presente', true)

  // Frequências Agregadas (Para as turmas)
  const { data: frequencias } = await supabase
    .from('frequencia_ebd')
    .select('turma_id, aluno_id, data_aula, presente, trouxe_biblia, trouxe_revista, visitantes, oferta, turmas (nome)')
    .gte('data_aula', start)
    .lte('data_aula', end)

  // =================================================================
  // PROCESSAMENTO DE DADOS
  // =================================================================
  const turmasMap: Record<string, any> = {}

  if (frequencias) {
    frequencias.forEach((f: any) => {
      const tId = f.turma_id
      
      let nomeDaTurma = 'Turma Desconhecida'
      if (f.turmas) {
         if (Array.isArray(f.turmas) && f.turmas.length > 0) {
            nomeDaTurma = f.turmas[0].nome
         } else if (!Array.isArray(f.turmas) && f.turmas.nome) {
            nomeDaTurma = f.turmas.nome
         }
      }

      if (!turmasMap[tId]) {
        turmasMap[tId] = { 
          id: tId, 
          nome: nomeDaTurma,
          presentes: 0, 
          biblias: 0, 
          revistas: 0, 
          aulas: {},
          alunos_matriculados: new Set() // Set para contar alunos distintos na turma
        }
      }
      
      // Armazena o ID do aluno para contar quantos matriculados existem na turma
      if (f.aluno_id) {
        turmasMap[tId].alunos_matriculados.add(f.aluno_id)
      }

      if (f.presente) turmasMap[tId].presentes++
      if (f.trouxe_biblia) turmasMap[tId].biblias++
      if (f.trouxe_revista) turmasMap[tId].revistas++

      if (!turmasMap[tId].aulas[f.data_aula]) {
        turmasMap[tId].aulas[f.data_aula] = { visitantes: 0, oferta: 0 }
      }
      if (f.visitantes > turmasMap[tId].aulas[f.data_aula].visitantes) {
        turmasMap[tId].aulas[f.data_aula].visitantes = f.visitantes
      }
      if (f.oferta > turmasMap[tId].aulas[f.data_aula].oferta) {
        turmasMap[tId].aulas[f.data_aula].oferta = Number(f.oferta)
      }
    })
  }

  // Formata a lista final e calcula TOTAIS
  let totalGeralPresentes = 0
  let totalGeralBiblias = 0
  let totalGeralRevistas = 0
  let totalGeralVisitantes = 0
  let totalGeralOferta = 0

  const listaEBD = Object.values(turmasMap).map((t: any) => {
    let totalVisitantes = 0
    let totalOferta = 0
    
    Object.values(t.aulas).forEach((a: any) => {
      totalVisitantes += a.visitantes
      totalOferta += a.oferta
    })

    totalGeralPresentes += t.presentes
    totalGeralBiblias += t.biblias
    totalGeralRevistas += t.revistas
    totalGeralVisitantes += totalVisitantes
    totalGeralOferta += totalOferta

    return {
      ...t,
      total_alunos: t.alunos_matriculados ? t.alunos_matriculados.size : 0, // Envia o total de matriculados da turma
      visitantes: totalVisitantes,
      oferta: totalOferta
    }
  }).sort((a, b) => a.nome.localeCompare(b.nome))

    
  const getTop = (arr: any[], field: string) => {
    if (arr.length === 0) return null
    const sorted = [...arr].sort((a, b) => b[field] - a[field])
    return sorted[0][field] > 0 ? sorted[0] : null
  }

  const rankPresentes = getTop(listaEBD, 'presentes')
  const rankBiblias = getTop(listaEBD, 'biblias')
  const rankRevistas = getTop(listaEBD, 'revistas')
  const rankVisitantes = getTop(listaEBD, 'visitantes')
  const rankOfertas = getTop(listaEBD, 'oferta')

  // Processamento do Ranking de Alunos
  const alunosMap: Record<string, { nome: string, presencas: number }> = {}
  
  if (frequenciasAlunos) {
    frequenciasAlunos.forEach((f: any) => {
      if (f.aluno_id) {
        const aId = f.aluno_id
        
        let nomeAluno = 'Aluno Desconhecido'
        if (f.perfis) {
          if (Array.isArray(f.perfis) && f.perfis.length > 0) {
            nomeAluno = f.perfis[0].nome_completo
          } else if (!Array.isArray(f.perfis) && f.perfis.nome_completo) {
            nomeAluno = f.perfis.nome_completo
          }
        }
        
        if (!alunosMap[aId]) {
          alunosMap[aId] = { nome: nomeAluno, presencas: 0 }
        }
        alunosMap[aId].presencas++
      }
    })
  }

  const rankingAlunos = Object.values(alunosMap)
    .sort((a, b) => b.presencas - a.presencas)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
              📖 Relatório EBD
            </h1>
            <p className="text-gray-500 text-sm mt-1">Desempenho e frequência das turmas da Escola Bíblica.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
            Voltar ao Hub
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Filtros de Período</h2>
              <p className="text-xs text-gray-500">Selecione o espaço de tempo para analisar as classes.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <form method="GET" className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <select name="periodo" id="periodoSelect" defaultValue={periodo} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer">
                  <option value="diario">Diário (Dia Específico)</option>
                  <option value="trimestre">Trimestral (Trimestre/Ano)</option>
                  <option value="anual">Anual (Ano Fechado)</option>
                </select>

                <div id="blocoDiario" style={{ display: periodo === 'diario' ? 'block' : 'none' }}>
                  <input type="date" name="data" defaultValue={dataFiltro} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none" />
                </div>

                <div id="blocoTrimestre" style={{ display: periodo === 'trimestre' ? 'block' : 'none' }}>
                  <select name="trimestre" defaultValue={trimestreFiltro} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none cursor-pointer">
                    <option value="1">1º Trimestre (Jan-Mar)</option>
                    <option value="2">2º Trimestre (Abr-Jun)</option>
                    <option value="3">3º Trimestre (Jul-Set)</option>
                    <option value="4">4º Trimestre (Out-Dez)</option>
                  </select>
                </div>

                <div id="blocoAno" style={{ display: (periodo === 'trimestre' || periodo === 'anual') ? 'block' : 'none' }}>
                  <input type="number" name="ano" defaultValue={anoFiltro} min="2020" max="2100" className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none w-24" placeholder="Ex: 2024" />
                </div>

                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                  Filtrar Dados
                </button>

                <script dangerouslySetInnerHTML={{__html: `
                  const select = document.getElementById('periodoSelect');
                  if(select) {
                    select.addEventListener('change', function() {
                      const val = this.value;
                      document.getElementById('blocoDiario').style.display = val === 'diario' ? 'block' : 'none';
                      document.getElementById('blocoTrimestre').style.display = val === 'trimestre' ? 'block' : 'none';
                      document.getElementById('blocoAno').style.display = (val === 'trimestre' || val === 'anual') ? 'block' : 'none';
                    });
                  }
                `}} />
              </form>
              
              <BotaoExportarEBD 
                data={listaEBD} 
                resumoGeral={{
                  // 🔥 Correção: Garantimos que será sempre um número, nunca null
                  totalMatriculados: totalAlunosAtivos || 0, 
                  presentes: totalGeralPresentes,
                  biblias: totalGeralBiblias,
                  revistas: totalGeralRevistas,
                  visitantes: totalGeralVisitantes,
                  oferta: totalGeralOferta
                }}
                periodoLabel={periodo === 'diario' ? `Data: ${dataFiltro}` : labelPeriodo}
              />
            </div>
          </div>

          {listaEBD.length > 0 ? (
            <>
              {/* RESUMO GERAL DA ESCOLA NO PERÍODO */}
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-4">📊 Resumo Geral da EBD (Todas as Salas)</h3>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-10 pb-8 border-b border-dashed border-gray-200">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Matriculados</p>
                  <p className="text-2xl font-black text-gray-800">{totalAlunosAtivos}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Presentes</p>
                  <p className="text-2xl font-black text-gray-800">{totalGeralPresentes}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Ausentes</p>
                  <p className="text-2xl font-black text-gray-800">{(totalAlunosAtivos || 0) - (totalGeralPresentes || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Bíblias</p>
                  <p className="text-2xl font-black text-gray-800">{totalGeralBiblias}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Revistas</p>
                  <p className="text-2xl font-black text-gray-800">{totalGeralRevistas}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Total Visitantes</p>
                  <p className="text-2xl font-black text-orange-700">{totalGeralVisitantes}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                  <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Oferta Total</p>
                  <p className="text-2xl font-black text-green-700">R$ {totalGeralOferta.toFixed(2)}</p>
                </div>
              </div>

              {/* RANKING (DESTAQUES INDIVIDUAIS POR TURMA) */}
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-4">🏆 Salas Destaque do Período</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-100 text-center relative overflow-hidden">
                  <span className="text-2xl absolute -right-2 -bottom-2 opacity-20">👥</span>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Mais Presentes</p>
                  <p className="font-black text-blue-900 text-sm truncate">{rankPresentes?.nome || 'N/A'}</p>
                  <p className="text-xl font-black text-blue-700 mt-1">{rankPresentes?.presentes || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-100 text-center relative overflow-hidden">
                  <span className="text-2xl absolute -right-2 -bottom-2 opacity-20">📖</span>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Mais Bíblias</p>
                  <p className="font-black text-emerald-900 text-sm truncate">{rankBiblias?.nome || 'N/A'}</p>
                  <p className="text-xl font-black text-emerald-700 mt-1">{rankBiblias?.biblias || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-100 text-center relative overflow-hidden">
                  <span className="text-2xl absolute -right-2 -bottom-2 opacity-20">📚</span>
                  <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Mais Revistas</p>
                  <p className="font-black text-purple-900 text-sm truncate">{rankRevistas?.nome || 'N/A'}</p>
                  <p className="text-xl font-black text-purple-700 mt-1">{rankRevistas?.revistas || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-100 text-center relative overflow-hidden">
                  <span className="text-2xl absolute -right-2 -bottom-2 opacity-20">👋</span>
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Mais Visitantes</p>
                  <p className="font-black text-orange-900 text-sm truncate">{rankVisitantes?.nome || 'N/A'}</p>
                  <p className="text-xl font-black text-orange-700 mt-1">{rankVisitantes?.visitantes || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200 text-center relative overflow-hidden">
                  <span className="text-2xl absolute -right-2 -bottom-2 opacity-20">💰</span>
                  <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Maior Oferta</p>
                  <p className="font-black text-green-900 text-sm truncate">{rankOfertas?.nome || 'N/A'}</p>
                  <p className="text-xl font-black text-green-700 mt-1">R$ {rankOfertas?.oferta?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* TABELA DE DADOS EBD */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl mb-12">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Nome da Turma</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Matric.</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Presentes</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Ausentes</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Bíblias</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Revistas</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Visitantes</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">Ofertas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listaEBD.map(t => (
                      <tr key={t.id} className="hover:bg-indigo-50/30 transition">
                        <td className="px-4 py-3 font-bold text-gray-800">{t.nome}</td>
                        <td className="px-4 py-3 text-center font-black text-indigo-600">{t.total_alunos}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.presentes}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.total_alunos - t.presentes}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.biblias}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.revistas}</td>
                        <td className="px-4 py-3 text-center font-medium text-orange-600">{t.visitantes}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">R$ {t.oferta.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* NOVOS RELATÓRIOS: ALUNOS E RANKING INDIVIDUAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                
                {/*<div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white flex flex-col justify-center items-center text-center shadow-sm">
                  <span className="text-4xl mb-3">🎓</span>
                  <h3 className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider">Alunos Matriculados Ativos</h3>
                  <p className="text-5xl font-black text-white mt-2">{totalAlunosAtivos || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-3 max-w-[200px]">Alunos regulares com status ativo no sistema.</p>
                </div>*/}

                <div className="md:col-span- bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-gray-100 px-5 py-3.5">
                    <h3 className="text-xs uppercase font-extrabold text-slate-700 tracking-wider">🌟 Ranking de Frequência (Top Alunos)</h3>
                    <p className="text-[11px] text-gray-500">Alunos com maior número de presenças no período selecionado</p>
                  </div>

                  {rankingAlunos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-400 border-b border-gray-100">
                          <tr>
                            <th className="px-5 py-2 font-bold uppercase text-[10px] tracking-wider w-16 text-center">Rank</th>
                            <th className="px-5 py-2 font-bold uppercase text-[10px] tracking-wider">Nome do Aluno</th>
                            <th className="px-5 py-2 font-bold uppercase text-[10px] tracking-wider text-right">Aulas Presente</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rankingAlunos.map((aluno, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="px-5 py-2.5 text-center font-bold">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                              </td>
                              <td className="px-5 py-2.5 font-bold text-gray-700">{aluno.nome}</td>
                              <td className="px-5 py-2.5 text-right font-black text-indigo-600">{aluno.presencas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      <p>Nenhum registro de chamada individual encontrado para este período.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl mb-2 block">📅</span>
              <p className="text-gray-500 font-medium">Nenhum dado de EBD registrado para este período.</p>
              <p className="text-xs text-gray-400 mt-1">Verifique as datas ou confirme se as chamadas foram salvas pela liderança.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}