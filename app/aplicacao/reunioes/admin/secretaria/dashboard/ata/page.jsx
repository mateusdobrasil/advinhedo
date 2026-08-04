'use client'

/**
 * /reunioes/admin/secretaria/dashboard/ata/page.jsx
 * Ata de reunião para registro em cartório — texto formal com
 * quórum, pauta e lista de presença dos obreiros para assinatura.
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { carregarDashboard } from '@/app/aplicacao/actions/dashboard'
import { igreja } from '@/data/site'

const CNPJ_IGREJA = '00.120.201/0001-22'

const ORDEM_CARGO = ['Pastor', 'Evangelista', 'Presbítero', 'Diácono', 'Cooperador', 'Membro']

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function partesData(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T12:00:00')
  return { dia: String(d.getDate()).padStart(2, '0'), mes: MESES[d.getMonth()], ano: d.getFullYear() }
}

function fmtDataCurta(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtHora(hhmmss) {
  if (!hhmmss) return null
  return hhmmss.slice(0, 5).replace(':', 'h')
}

function ordenarObreiros(a, b) {
  const ia = ORDEM_CARGO.indexOf(a.obreiro_cargos?.nome ?? 'Membro')
  const ib = ORDEM_CARGO.indexOf(b.obreiro_cargos?.nome ?? 'Membro')
  const oa = ia === -1 ? 99 : ia
  const ob = ib === -1 ? 99 : ib
  if (oa !== ob) return oa - ob
  return (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
}

export default function AtaCartorioPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [reunioes, setReunioes]       = useState([])
  const [obreiros, setObreiros]       = useState([])
  const [presencaMap, setPresencaMap] = useState({})
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)

  const [reuniaoSel, setReuniaoSel]   = useState(null)
  const [presidente, setPresidente]   = useState('')
  const [secretario, setSecretario]   = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setLoading(true)
      setErro(null)
      const res = await carregarDashboard()
      if (!ativo) return
      if (!res.ok) { setErro(res.error || 'Erro ao carregar os dados.'); setLoading(false); return }

      const mapa = {}
      res.presencas.forEach(p => {
        if (!p.presente) return
        if (!mapa[p.reuniao_id]) mapa[p.reuniao_id] = new Set()
        mapa[p.reuniao_id].add(p.obreiro_id)
      })
      setReunioes(res.reunioes)
      setObreiros(res.obreiros)
      setPresencaMap(mapa)
      if (res.reunioes.length) setReuniaoSel(res.reunioes[0])
      setLoading(false)
    }
    carregar()
    return () => { ativo = false }
  }, [])

  const presentesSet = reuniaoSel ? (presencaMap[reuniaoSel.id] || new Set()) : new Set()

  const presentes = useMemo(
    () => obreiros.filter(o => presentesSet.has(o.id)).sort(ordenarObreiros),
    [obreiros, presentesSet]
  )

  const totalGeral     = obreiros.length
  const presentesGeral = presentes.length
  const pctGeral       = totalGeral ? Math.round(presentesGeral / totalGeral * 100) : 0

  const dp = reuniaoSel ? partesData(reuniaoSel.data_reuniao) : null
  const horaInicio = reuniaoSel ? fmtHora(reuniaoSel.hora_inicio) : null
  const horaFim     = reuniaoSel ? fmtHora(reuniaoSel.hora_fim) : null
  const local       = reuniaoSel?.local || 'sede da igreja'
  const pauta       = (reuniaoSel?.descricao || '').trim()

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingTxt}>Carregando ata...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div style={s.loadingWrap}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Erro ao carregar</p>
        <p style={{ ...s.loadingTxt, textAlign: 'center', maxWidth: 320 }}>{erro}</p>
        <button style={s.btnErro} onClick={() => router.back()}>← Voltar</button>
      </div>
    )
  }

  return (
    <div style={s.container}>

      {/* Header — não sai na impressão */}
      <div style={s.header} className="no-print">
        <Image src="/imgs/logo_branco.png" alt="AD Vinhedo" width={80} height={36} style={{ objectFit: 'contain' }} priority />
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin/secretaria/dashboard')}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitulo}>Ata para cartório</div>
          <div style={s.headerSub}>Participação e aprovação de pauta</div>
        </div>
        <button style={s.btnImprimir} onClick={() => window.print()}>Imprimir</button>
      </div>

      <div style={s.body}>

        {/* Controles — não saem na impressão */}
        <div style={s.controles} className="no-print">
          <select style={s.select} value={reuniaoSel?.id || ''}
            onChange={e => setReuniaoSel(reunioes.find(r => r.id === e.target.value))}>
            {reunioes.map(r => (
              <option key={r.id} value={r.id}>{fmtDataCurta(r.data_reuniao)} — {r.titulo}</option>
            ))}
          </select>
          <div style={s.camposRow}>
            <div style={s.campo}>
              <label style={s.label}>Presidente da reunião</label>
              <input style={s.input} value={presidente} onChange={e => setPresidente(e.target.value)}
                placeholder="Nome de quem presidiu" />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Secretário(a)</label>
              <input style={s.input} value={secretario} onChange={e => setSecretario(e.target.value)}
                placeholder="Nome de quem secretariou" />
            </div>
          </div>
          <p style={s.dica}>Preencha os nomes acima antes de imprimir — eles aparecem nas linhas de assinatura ao final da ata.</p>
        </div>

        {!reuniaoSel ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Nenhuma reunião cadastrada.</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho institucional */}
            <div style={s.instHead}>
              <p style={s.instNome}>{igreja.nomeCompleto}</p>
              <p style={s.instLinha}>CNPJ {CNPJ_IGREJA}</p>
              <p style={s.instLinha}>
                {igreja.endereco.linha1}, {igreja.endereco.bairro} — {igreja.endereco.cidade} — CEP {igreja.endereco.cep}
              </p>
            </div>

            <h1 style={s.titulo}>Ata de Reunião de Obreiros</h1>
            <p style={s.subtitulo}>Participação e aprovação de pauta</p>

            {/* Corpo da ata — texto corrido formal */}
            <div style={s.corpo}>
              <p style={s.paragrafo}>
                Aos {dp?.dia} dias do mês de {dp?.mes} de {dp?.ano}
                {horaInicio ? `, às ${horaInicio}${horaFim ? ` horas, encerrando-se às ${horaFim}` : ' horas'}` : ''},
                reuniram-se os obreiros da {igreja.nomeCompleto}, CNPJ {CNPJ_IGREJA}, em {local}, por
                ocasião da reunião "{reuniaoSel.titulo}", registrada em sistema próprio de controle de
                presença por check-in individual.
              </p>

              <p style={s.paragrafo}>
                Verificado o quórum, foi constatada a presença de {presentesGeral} ({presentesGeral === 1 ? 'um obreiro' : `${presentesGeral} obreiros`}) de um total de {totalGeral} obreiros ativos ({pctGeral}% de presença),
                conforme lista nominal de presença que integra esta ata.
                {presidente ? ` A reunião foi presidida por ${presidente}` : ''}
                {presidente && secretario ? ', com secretariado de ' : (secretario ? ' Secretariou a reunião ' : '')}
                {secretario ? `${secretario}.` : (presidente ? '.' : '')}
              </p>

              <p style={s.paragrafo}>
                {pauta
                  ? <>Foi apresentada e colocada em discussão a seguinte pauta: <em>"{pauta}"</em>.</>
                  : <>Foi apresentada e colocada em discussão a pauta do dia.</>
                }{' '}
                Após as considerações cabíveis, a pauta foi submetida à apreciação dos presentes e
                aprovada por unanimidade pelos obreiros relacionados nesta ata, que firmam sua
                participação e anuência mediante assinatura na lista abaixo.
              </p>

              <p style={s.paragrafo}>
                Nada mais havendo a tratar, foi encerrada a reunião, da qual se lavrou a presente ata,
                que vai assinada pelo presidente, pelo secretário e pelos obreiros presentes.
              </p>
            </div>

            {/* Lista nominal de presença — para assinatura */}
            <h2 style={s.secaoTitulo}>Lista de presença e assinaturas</h2>
            <table style={s.tabela}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: 28 }}>#</th>
                  <th style={s.th}>Nome</th>
                  <th style={{ ...s.th, width: 100 }}>Cargo</th>
                  <th style={{ ...s.th, width: 140 }}>Assinatura</th>
                </tr>
              </thead>
              <tbody>
                {presentes.map((o, i) => (
                  <tr key={o.id}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}>{o.nome}</td>
                    <td style={s.td}>{o.obreiro_cargos?.nome || 'Membro'}</td>
                    <td style={{ ...s.td, ...s.tdAssinatura }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {presentes.length === 0 && (
              <p style={s.vazio}>Nenhum obreiro presente registrado nesta reunião.</p>
            )}

            {/* Assinaturas da mesa */}
            <div style={s.mesaWrap}>
              <div style={s.mesaAssinatura}>
                <div style={s.mesaLinha} />
                <p style={s.mesaNome}>{presidente || 'Presidente'}</p>
                <p style={s.mesaCargo}>Presidente da reunião</p>
              </div>
              <div style={s.mesaAssinatura}>
                <div style={s.mesaLinha} />
                <p style={s.mesaNome}>{secretario || 'Secretário(a)'}</p>
                <p style={s.mesaCargo}>Secretário(a)</p>
              </div>
            </div>

            <p style={s.localData}>
              {igreja.endereco.cidade.split(' - ')[0]}, {dp?.dia} de {dp?.mes} de {dp?.ano}.
            </p>

            <p style={s.rodape} className="print-only">
              Documento gerado em {new Date().toLocaleString('pt-BR')} pelo sistema de reuniões {igreja.nome} — para conferência, ver check-ins da reunião "{reuniaoSel.titulo}".
            </p>
          </>
        )}
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 720, margin: '0 auto', paddingBottom: 48 },
  loadingWrap:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 8 },
  spinner:        { width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingTxt:     { color: '#9CA3AF', fontSize: 14, marginTop: 12 },
  btnErro:        { marginTop: 12, padding: '10px 24px', background: '#111827', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, cursor: 'pointer' },
  header:         { background: '#111827', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 15, fontWeight: 600 },
  headerSub:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  btnImprimir:    { background: '#fff', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  body:           { padding: '16px' },
  controles:      { marginBottom: 20 },
  select:         { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', marginBottom: 10 },
  camposRow:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  campo:          { display: 'flex', flexDirection: 'column', gap: 4 },
  label:          { fontSize: 12, color: '#6B7280' },
  input:          { padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' },
  dica:           { fontSize: 11, color: '#9CA3AF', margin: '8px 0 0' },
  emptyBox:       { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '32px', textAlign: 'center' },
  instHead:       { textAlign: 'center', marginBottom: 20 },
  instNome:       { fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  instLinha:      { fontSize: 12, color: '#6B7280', margin: '2px 0' },
  titulo:         { fontSize: 19, fontWeight: 700, color: '#111827', textAlign: 'center', margin: '0 0 4px' },
  subtitulo:      { fontSize: 13, color: '#6B7280', textAlign: 'center', margin: '0 0 20px' },
  corpo:          { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px', marginBottom: 20 },
  paragrafo:      { fontSize: 13.5, lineHeight: 1.8, color: '#1F2937', textAlign: 'justify', margin: '0 0 14px' },
  secaoTitulo:    { fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 10px' },
  tabela:         { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 24 },
  th:             { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6B7280', padding: '8px 10px', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' },
  td:             { fontSize: 12.5, color: '#111827', padding: '9px 10px', borderBottom: '1px solid #F3F4F6' },
  tdAssinatura:   { borderLeft: '1px solid #F3F4F6' },
  vazio:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px', marginBottom: 24 },
  mesaWrap:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 40, marginBottom: 24 },
  mesaAssinatura: { textAlign: 'center' },
  mesaLinha:      { borderTop: '1px solid #111827', marginBottom: 6 },
  mesaNome:       { fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 },
  mesaCargo:      { fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' },
  localData:      { fontSize: 13, color: '#374151', textAlign: 'right', margin: '0 0 8px' },
  rodape:         { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
}
