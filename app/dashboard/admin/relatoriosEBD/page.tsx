export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import BotaoExportarEBD from '@/app/components/BotaoExportarEBD' // Ajuste o caminho se necessário

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
  
  // Define os valores padrão baseados no dia de hoje
  const hoje = new Date()
  const dataPadrao = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  const anoAtual = hoje.getFullYear().toString()
  const trimestreAtual = Math.ceil((hoje.getMonth() + 1) / 3).toString()

  // Captura os valores da URL
  const dataFiltro = resolvedSearch?.data || dataPadrao
  const anoFiltro = resolvedSearch?.ano || anoAtual
  const trimestreFiltro = resolvedSearch?.trimestre || trimestreAtual

  // Calcula o Range de Datas baseado no filtro selecionado
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
    // Diário
    start = dataFiltro
    end = dataFiltro
    labelPeriodo = `Data: ${new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')}`
  }

  // Busca todas as frequências no período selecionado
  const { data: frequencias } = await supabase
    .from('frequencia_ebd')
    .select(`
      turma_id, 
      data_aula, 
      presente, 
      trouxe_biblia, 
      trouxe_revista, 
      visitantes, 
      oferta, 
      turmas:turma_id (nome) 
    `)
    .gte('data_aula', start)
    .lte('data_aula', end)

  // Agrupa e calcula as métricas por Turma
  const turmasMap: Record<string, any> = {}

  if (frequencias) {
    frequencias.forEach((f: any) => {
      const tId = f.turma_id
      
      let nomeDaTurma = 'Turma Desconhecida'
      if (f.turmas) {
         if (Array.isArray(f.turmas) && f.turmas.length > 0) {
            nomeDaTurma = f.turmas[0].nome
         } else if (f.turmas.nome) {
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
          aulas: {} 
        }
      }
      
      // Soma contadores individuais
      if (f.presente) turmasMap[tId].presentes++
      if (f.trouxe_biblia) turmasMap[tId].biblias++
      if (f.trouxe_revista) turmasMap[tId].revistas++

      // Registra métricas de classe do dia
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

  // Formata a lista final para a tabela e calcula OS TOTAIS GERAIS
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

    // Soma para o resumo geral da escola
    totalGeralPresentes += t.presentes
    totalGeralBiblias += t.biblias
    totalGeralRevistas += t.revistas
    totalGeralVisitantes += totalVisitantes
    totalGeralOferta += totalOferta

    return {
      ...t,
      visitantes: totalVisitantes,
      oferta: totalOferta
    }
  }).sort((a, b) => a.nome.localeCompare(b.nome))

    
  // Função auxiliar para encontrar o vencedor do Ranking
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
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

        {/* CONTAINER PRINCIPAL DO RELATÓRIO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Filtros de Período</h2>
              <p className="text-xs text-gray-500">Selecione o espaço de tempo para analisar as classes.</p>
            </div>
            
            {/* BARRA DE FILTRO E EXPORTAÇÃO */}
            <div className="flex flex-wrap items-center gap-2">
              
              <form method="GET" className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                
                <select name="periodo" id="periodoSelect" defaultValue={periodo} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer">
                  <option value="diario">Diário (Dia Específico)</option>
                  <option value="trimestre">Trimestral (Trimestre/Ano)</option>
                  <option value="anual">Anual (Ano Fechado)</option>
                </select>

                {/* BLOCO: DIÁRIO */}
                <div id="blocoDiario" style={{ display: periodo === 'diario' ? 'block' : 'none' }}>
                  <input type="date" name="data" defaultValue={dataFiltro} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none" />
                </div>

                {/* BLOCO: TRIMESTRE */}
                <div id="blocoTrimestre" style={{ display: periodo === 'trimestre' ? 'block' : 'none' }}>
                  <select name="trimestre" defaultValue={trimestreFiltro} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none cursor-pointer">
                    <option value="1">1º Trimestre (Jan-Mar)</option>
                    <option value="2">2º Trimestre (Abr-Jun)</option>
                    <option value="3">3º Trimestre (Jul-Set)</option>
                    <option value="4">4º Trimestre (Out-Dez)</option>
                  </select>
                </div>

                {/* BLOCO: ANO (Aparece no Trimestre e no Anual) */}
                <div id="blocoAno" style={{ display: (periodo === 'trimestre' || periodo === 'anual') ? 'block' : 'none' }}>
                  <input type="number" name="ano" defaultValue={anoFiltro} min="2020" max="2100" className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium focus:ring-indigo-500 outline-none w-24" placeholder="Ex: 2024" />
                </div>

                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                  Filtrar
                </button>

                {/* Script nativo para alternar as caixinhas sem precisar recarregar a tela */}
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
              
              {/* COMPONENTE DE EXPORTAÇÃO PPTX */}
              <BotaoExportarEBD 
                data={listaEBD} 
                resumoGeral={{
                  presentes: totalGeralPresentes,
                  biblias: totalGeralBiblias,
                  revistas: totalGeralRevistas,
                  visitantes: totalGeralVisitantes,
                  oferta: totalGeralOferta
                }}
                periodoLabel={labelPeriodo}
              />
            </div>
          </div>

          {/* ... MANTÉM O RESTANTE DA TABELA E DOS CARDS INTACTOS ... */}

          {listaEBD.length > 0 ? (
            <>
              {/* RESUMO GERAL DA ESCOLA NO PERÍODO */}
              <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-4">📊 Resumo Geral do Período ({labelPeriodo})</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10 pb-8 border-b border-dashed border-gray-200">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Presentes</p>
                  <p className="text-2xl font-black text-gray-800">{totalGeralPresentes}</p>
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
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Nome da Turma</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Presentes</th>
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
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.presentes}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.biblias}</td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{t.revistas}</td>
                        <td className="px-4 py-3 text-center font-medium text-orange-600">{t.visitantes}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">R$ {t.oferta.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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