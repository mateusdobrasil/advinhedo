export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/app/aplicacao/components/BotaoImprimir'
import BotaoExportarCSV from '@/app/aplicacao/components/BotaoExportarCSV'
import { usuarioTemAcessoPagina } from '@/lib/permissoes'

interface PageProps {
  searchParams: Promise<FiltrosBusca> | FiltrosBusca
}

interface FiltrosBusca {
  ano?: string
  turma?: string
  ordem?: string
}

const OPCOES_ORDEM = [
  { valor: 'classe', rotulo: 'Classe e nome (A-Z)' },
  { valor: 'nome', rotulo: 'Nome do aluno (A-Z)' },
  { valor: 'presencas', rotulo: 'Mais presenças' },
  { valor: 'frequencia', rotulo: 'Maior frequência (%)' },
] as const

type Ordem = (typeof OPCOES_ORDEM)[number]['valor']

interface LinhaRelatorio {
  aluno_id: string
  nome: string
  turma_id: string
  turma: string
  presencas: number
  aulas: number
  percentual: number | null
}

// O PostgREST devolve no máximo 1000 linhas por requisição; a frequência de um ano
// inteiro passa disso facilmente, então buscamos em páginas.
const TAMANHO_PAGINA = 1000

function dataHojeBrasil() {
  // 'en-CA' formata como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

function formatarData(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

function corPercentual(p: number | null) {
  if (p === null) return { texto: 'text-gray-400', barra: 'bg-gray-200' }
  if (p >= 75) return { texto: 'text-green-700', barra: 'bg-green-500' }
  if (p >= 50) return { texto: 'text-amber-700', barra: 'bg-amber-500' }
  return { texto: 'text-red-700', barra: 'bg-red-500' }
}

export default async function FrequenciaAlunosPage({ searchParams }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Segurança: mesma permissão dos Relatórios da EBD
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  const temAcesso = await usuarioTemAcessoPagina(supabase, perfil?.tipo_usuario, 'ebd', 'relatoriosEBD')
  if (!temAcesso) redirect('/aplicacao/ebd/admin')

  // 2. Filtros: ano (padrão = ano atual) e classe (opcional)
  const resolvedSearch = await searchParams
  const hoje = dataHojeBrasil()
  const anoAtual = Number(hoje.slice(0, 4))
  const anoParam = Number(resolvedSearch?.ano)
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= anoAtual ? anoParam : anoAtual
  const turmaFiltro: string = resolvedSearch?.turma || ''
  const ordem: Ordem = OPCOES_ORDEM.some((o) => o.valor === resolvedSearch?.ordem)
    ? (resolvedSearch?.ordem as Ordem)
    : 'classe'

  // Do início do ano até hoje (ou até 31/12 se for um ano já encerrado)
  const inicio = `${ano}-01-01`
  const fim = ano === anoAtual ? hoje : `${ano}-12-31`

  // 3. Classes da EBD
  const { data: turmasEBD } = await supabase
    .from('ebd_turmas')
    .select('id, nome')
    .eq('is_ebd', true)
    .order('nome')

  const turmas = turmasEBD || []
  const nomesTurmas = new Map(turmas.map((t) => [t.id as string, t.nome as string]))
  const idsTurmas = turmaFiltro && nomesTurmas.has(turmaFiltro) ? [turmaFiltro] : turmas.map((t) => t.id as string)

  let linhas: LinhaRelatorio[] = []
  let erroConsulta = ''

  if (idsTurmas.length > 0) {
    // 4. Alunos com matrícula ativa nas classes da EBD
    const { data: matriculas, error: erroMatriculas } = await supabase
      .from('ebd_matriculas')
      .select('aluno_id, turma_id, perfis ( nome_completo )')
      .in('turma_id', idsTurmas)
      .ilike('status', 'Ativo')

    if (erroMatriculas) erroConsulta = erroMatriculas.message

    // 5. Todas as chamadas do período (paginado)
    const frequencias: { turma_id: string; aluno_id: string; data_aula: string; presente: boolean }[] = []
    for (let pagina = 0; ; pagina++) {
      const { data, error } = await supabase
        .from('ebd_frequencia')
        .select('turma_id, aluno_id, data_aula, presente')
        .in('turma_id', idsTurmas)
        .gte('data_aula', inicio)
        .lte('data_aula', fim)
        .order('data_aula')
        .order('turma_id')
        .order('aluno_id')
        .range(pagina * TAMANHO_PAGINA, (pagina + 1) * TAMANHO_PAGINA - 1)

      if (error) {
        erroConsulta = error.message
        break
      }
      frequencias.push(...(data || []))
      if (!data || data.length < TAMANHO_PAGINA) break
    }

    // 6. Aulas realizadas por classe = dias distintos com chamada registrada
    const aulasPorTurma = new Map<string, Set<string>>()
    // Presenças por aluno dentro de cada classe
    const presencasPorAlunoTurma = new Map<string, number>()

    for (const f of frequencias) {
      if (!aulasPorTurma.has(f.turma_id)) aulasPorTurma.set(f.turma_id, new Set())
      aulasPorTurma.get(f.turma_id)!.add(f.data_aula)

      if (f.presente) {
        const chave = `${f.aluno_id}|${f.turma_id}`
        presencasPorAlunoTurma.set(chave, (presencasPorAlunoTurma.get(chave) || 0) + 1)
      }
    }

    // 7. Monta uma linha por aluno/classe (evita duplicar matrícula repetida)
    const vistos = new Set<string>()
    for (const m of matriculas || []) {
      const chave = `${m.aluno_id}|${m.turma_id}`
      if (vistos.has(chave)) continue
      vistos.add(chave)

      const p = (Array.isArray(m.perfis) ? m.perfis[0] : m.perfis) as { nome_completo?: string } | null
      const presencas = presencasPorAlunoTurma.get(chave) || 0
      const aulas = aulasPorTurma.get(m.turma_id)?.size || 0

      linhas.push({
        aluno_id: m.aluno_id,
        nome: p?.nome_completo || 'Aluno Desconhecido',
        turma_id: m.turma_id,
        turma: nomesTurmas.get(m.turma_id) || '—',
        presencas,
        aulas,
        percentual: aulas > 0 ? Math.min(100, (presencas / aulas) * 100) : null,
      })
    }

    // Empates sempre desempatam pelo nome do aluno. Quem não tem aula registrada
    // (frequência "—") vai para o fim na ordenação por frequência.
    const porNome = (a: LinhaRelatorio, b: LinhaRelatorio) => a.nome.localeCompare(b.nome, 'pt-BR')
    const comparadores: Record<Ordem, (a: LinhaRelatorio, b: LinhaRelatorio) => number> = {
      classe: (a, b) => a.turma.localeCompare(b.turma, 'pt-BR') || porNome(a, b),
      nome: (a, b) => porNome(a, b) || a.turma.localeCompare(b.turma, 'pt-BR'),
      presencas: (a, b) => b.presencas - a.presencas || porNome(a, b),
      frequencia: (a, b) => (b.percentual ?? -1) - (a.percentual ?? -1) || b.presencas - a.presencas || porNome(a, b),
    }
    linhas = linhas.sort(comparadores[ordem])
  }

  // 8. Resumo
  const comAulas = linhas.filter((l) => l.percentual !== null)
  const mediaGeral = comAulas.length > 0
    ? comAulas.reduce((soma, l) => soma + (l.percentual as number), 0) / comAulas.length
    : null
  const totalPresencas = linhas.reduce((soma, l) => soma + l.presencas, 0)
  const abaixoDe50 = comAulas.filter((l) => (l.percentual as number) < 50).length

  const fmtPct = (p: number | null) => (p === null ? '—' : `${p.toFixed(1).replace('.', ',')}%`)
  const nomeTurmaFiltro = turmaFiltro ? nomesTurmas.get(turmaFiltro) : ''
  const periodoLabel = `${formatarData(inicio)} a ${formatarData(fim)}`

  const anosDisponiveis = Array.from({ length: 6 }, (_, i) => anoAtual - i)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
              📋 Frequência Anual dos Alunos
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Período: <strong>{periodoLabel}</strong>
              {nomeTurmaFiltro && <> · Classe: <strong>{nomeTurmaFiltro}</strong></>}
              {' '}· Ordenado por: <strong>{OPCOES_ORDEM.find((o) => o.valor === ordem)?.rotulo}</strong>
            </p>
            <p className="hidden print:block text-xs text-gray-400 mt-1">Gerado em {formatarData(hoje)}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Link href="/aplicacao/ebd/admin/relatoriosEBD" className="text-sm bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
              Voltar aos Relatórios
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 print:border-0 print:shadow-none print:p-0">

          {/* FILTROS */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 mb-6 border-b border-gray-100 print:hidden">
            <form method="GET" className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <select name="ano" defaultValue={ano} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium outline-none cursor-pointer">
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select name="turma" defaultValue={turmaFiltro} className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-medium outline-none cursor-pointer">
                <option value="">Todas as classes</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                Ordenar por
                <select name="ordem" defaultValue={ordem} className="bg-white border border-gray-200 text-gray-700 text-sm normal-case tracking-normal rounded-lg px-3 py-2 font-medium outline-none cursor-pointer">
                  {OPCOES_ORDEM.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                Filtrar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <BotaoExportarCSV
                nomeArquivo={`Frequencia_EBD_${ano}${nomeTurmaFiltro ? '_' + nomeTurmaFiltro.replace(/\s+/g, '_') : ''}.csv`}
                cabecalho={['Aluno', 'Classe', 'Presenças', 'Aulas realizadas', 'Frequência (%)']}
                linhas={linhas.map((l) => [
                  l.nome,
                  l.turma,
                  l.presencas,
                  l.aulas,
                  l.percentual === null ? '' : l.percentual.toFixed(1).replace('.', ','),
                ])}
              />
              <BotaoImprimir />
            </div>
          </div>

          {erroConsulta && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              Erro ao consultar os dados: {erroConsulta}
            </div>
          )}

          {linhas.length > 0 ? (
            <>
              {/* RESUMO */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Alunos</p>
                  <p className="text-2xl font-black text-gray-800">{linhas.length}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total de Presenças</p>
                  <p className="text-2xl font-black text-gray-800">{totalPresencas}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Frequência Média</p>
                  <p className="text-2xl font-black text-indigo-800">{fmtPct(mediaGeral)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                  <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Abaixo de 50%</p>
                  <p className="text-2xl font-black text-red-700">{abaixoDe50}</p>
                </div>
              </div>

              {/* TABELA */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Aluno</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">Classe</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Presenças</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-center">Aulas Realizadas</th>
                      <th className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-right">Frequência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {linhas.map((l) => {
                      const cor = corPercentual(l.percentual)
                      return (
                        <tr key={`${l.aluno_id}|${l.turma_id}`} className="hover:bg-indigo-50/30 transition break-inside-avoid">
                          <td className="px-4 py-2.5 font-bold text-gray-800">{l.nome}</td>
                          <td className="px-4 py-2.5 text-gray-600">{l.turma}</td>
                          <td className="px-4 py-2.5 text-center font-black text-indigo-600">{l.presencas}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{l.aulas}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-3">
                              <div className="hidden sm:block w-24 h-2 bg-gray-100 rounded-full overflow-hidden print:block">
                                <div className={`h-full ${cor.barra}`} style={{ width: `${l.percentual ?? 0}%` }} />
                              </div>
                              <span className={`font-black w-14 text-right ${cor.texto}`}>{fmtPct(l.percentual)}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-gray-400 mt-4">
                &quot;Aulas realizadas&quot; = domingos com chamada registrada na classe entre {periodoLabel}.
                A frequência é presenças ÷ aulas realizadas. Considera apenas alunos com matrícula ativa.
              </p>
            </>
          ) : (
            !erroConsulta && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <span className="text-3xl mb-2 block">📅</span>
                <p className="text-gray-500 font-medium">Nenhum aluno matriculado nas classes da EBD.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
