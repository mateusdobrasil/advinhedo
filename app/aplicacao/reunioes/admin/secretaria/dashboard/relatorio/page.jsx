'use client'

/**
 * /reunioes/admin/secretaria/dashboard/relatorio/page.jsx
 * Relatório do pastor — presença por congregação, com cargo e função
 * de cada obreiro. Pensado para leitura e impressão.
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { carregarDashboard } from '@/app/aplicacao/actions/dashboard'

const COR_CARGO = {
  'Pastor':      '#111827',
  'Evangelista': '#7C3AED',
  'Presbítero':  '#2563EB',
  'Diácono':     '#059669',
  'Cooperador':  '#DB2777',
  'Membro':      '#6B7280',
}

const ORDEM_CARGO = ['Pastor', 'Evangelista', 'Presbítero', 'Diácono', 'Cooperador', 'Membro']

function fmtData(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

// Ordena obreiros por relevância do cargo, depois por nome
function ordenarObreiros(a, b) {
  const ia = ORDEM_CARGO.indexOf(a.obreiro_cargos?.nome ?? 'Membro')
  const ib = ORDEM_CARGO.indexOf(b.obreiro_cargos?.nome ?? 'Membro')
  const oa = ia === -1 ? 99 : ia
  const ob = ib === -1 ? 99 : ib
  if (oa !== ob) return oa - ob
  return (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
}

export default function RelatorioPastorPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [reunioes, setReunioes]       = useState([])
  const [obreiros, setObreiros]       = useState([])
  const [presencaMap, setPresencaMap] = useState({})
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState(null)

  const [reuniaoSel, setReuniaoSel]   = useState(null)
  const [expandidas, setExpandidas]   = useState({}) // congregações abertas
  const [mostrarAusentes, setMostrarAusentes] = useState(true)

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

  // Agrupa obreiros por congregação
  const congregacoes = useMemo(() => {
    const mapa = {}
    obreiros.forEach(o => {
      const cong = o.obreiro_congregacoes?.nome || 'Sem congregação'
      if (!mapa[cong]) mapa[cong] = []
      mapa[cong].push(o)
    })
    return Object.entries(mapa)
      .map(([nome, lista]) => {
        const ordenada = [...lista].sort(ordenarObreiros)
        const presentes = ordenada.filter(o => presentesSet.has(o.id)).length
        return {
          nome, obreiros: ordenada,
          total: ordenada.length, presentes,
          ausentes: ordenada.length - presentes,
          pct: ordenada.length ? Math.round(presentes / ordenada.length * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [obreiros, presentesSet])

  const totalGeral     = obreiros.length
  const presentesGeral = obreiros.filter(o => presentesSet.has(o.id)).length
  const pctGeral       = totalGeral ? Math.round(presentesGeral / totalGeral * 100) : 0

  function toggle(nome) {
    setExpandidas(prev => ({ ...prev, [nome]: !prev[nome] }))
  }

  function expandirTodas(valor) {
    const novo = {}
    congregacoes.forEach(c => { novo[c.nome] = valor })
    setExpandidas(novo)
  }

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingTxt}>Carregando relatório...</p>
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
          <div style={s.headerTitulo}>Relatório de presença</div>
          <div style={s.headerSub}>Por congregação — AD Vinhedo</div>
        </div>
        <button style={s.btnImprimir} onClick={() => window.print()}>Imprimir</button>
      </div>

      <div style={s.body}>

        {/* Seletor de reunião — não sai na impressão */}
        <div style={s.controles} className="no-print">
          <select style={s.select} value={reuniaoSel?.id || ''}
            onChange={e => setReuniaoSel(reunioes.find(r => r.id === e.target.value))}>
            {reunioes.map(r => (
              <option key={r.id} value={r.id}>{fmtData(r.data_reuniao)} — {r.titulo}</option>
            ))}
          </select>
          <div style={s.controlesRow}>
            <button style={s.btnControle} onClick={() => expandirTodas(true)}>Expandir tudo</button>
            <button style={s.btnControle} onClick={() => expandirTodas(false)}>Recolher tudo</button>
            <button
              style={{ ...s.btnControle, ...(mostrarAusentes ? s.btnControleAtivo : {}) }}
              onClick={() => setMostrarAusentes(v => !v)}>
              {mostrarAusentes ? '✓ ' : ''}Mostrar ausentes
            </button>
          </div>
        </div>

        {/* Cabeçalho do relatório — aparece na impressão */}
        <div style={s.relatorioHead}>
          <h1 style={s.relatorioTitulo}>Relatório de Presença de Obreiros</h1>
          <p style={s.relatorioSub}>
            {reuniaoSel ? `${reuniaoSel.titulo} — ${fmtData(reuniaoSel.data_reuniao)}` : '—'}
          </p>
          <div style={s.resumoGeral}>
            <div style={s.resumoItem}><strong>{presentesGeral}</strong> presentes</div>
            <div style={s.resumoDivisor} />
            <div style={s.resumoItem}><strong>{totalGeral - presentesGeral}</strong> ausentes</div>
            <div style={s.resumoDivisor} />
            <div style={s.resumoItem}><strong>{totalGeral}</strong> obreiros</div>
            <div style={s.resumoDivisor} />
            <div style={s.resumoItem}><strong style={{ color: '#065F46' }}>{pctGeral}%</strong> presença</div>
          </div>
        </div>

        {/* Congregações */}
        {congregacoes.map(cong => {
          const aberta = expandidas[cong.nome]
          const lista = mostrarAusentes ? cong.obreiros : cong.obreiros.filter(o => presentesSet.has(o.id))
          return (
            <div key={cong.nome} style={s.congCard}>
              <button style={s.congHead} onClick={() => toggle(cong.nome)}>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={s.congNome}>{cong.nome}</div>
                  <div style={s.congStats}>
                    {cong.presentes}/{cong.total} presentes · {cong.pct}%
                  </div>
                </div>
                <div style={s.congBarraWrap}>
                  <div style={s.congBarra}><div style={{ ...s.congBarraFill, width: `${cong.pct}%` }} /></div>
                </div>
                <span style={{ ...s.chevron, transform: aberta ? 'rotate(90deg)' : 'none' }} className="no-print">›</span>
              </button>

              {/* Lista de obreiros — sempre visível na impressão */}
              <div style={{ ...s.obreirosList, display: aberta ? 'block' : 'none' }} className="print-visible">
                {lista.map(o => {
                  const presente = presentesSet.has(o.id)
                  const cargo = o.obreiro_cargos?.nome
                  const funcao = o.obreiro_funcoes?.nome
                  const cor = COR_CARGO[cargo] || '#6B7280'
                  return (
                    <div key={o.id} style={{ ...s.obreiroRow, opacity: presente ? 1 : 0.55 }}>
                      <span style={{ ...s.statusDot, background: presente ? '#34D399' : '#E5E7EB' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.obreiroNome}>{o.nome}</div>
                        <div style={s.obreiroMeta}>
                          {cargo && <span style={{ ...s.cargoBadge, background: cor + '18', color: cor }}>{cargo}</span>}
                          {funcao && <span style={s.funcaoTxt}>{funcao}</span>}
                        </div>
                      </div>
                      <span style={{ ...s.statusTxt, color: presente ? '#065F46' : '#9CA3AF' }}>
                        {presente ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                  )
                })}
                {lista.length === 0 && (
                  <p style={s.vazio}>Nenhum obreiro {mostrarAusentes ? '' : 'presente '}nesta congregação.</p>
                )}
              </div>
            </div>
          )
        })}

        {congregacoes.length === 0 && (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Nenhum obreiro cadastrado.</p>
          </div>
        )}

        <p style={s.rodape} className="print-only">
          Gerado em {new Date().toLocaleString('pt-BR')} · Sistema de Reuniões AD Vinhedo
        </p>
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-visible { display: block !important; }
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
  controles:      { marginBottom: 16 },
  select:         { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', marginBottom: 10 },
  controlesRow:   { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btnControle:    { padding: '7px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer' },
  btnControleAtivo: { background: '#111827', borderColor: '#111827', color: '#fff' },
  relatorioHead:  { textAlign: 'center', padding: '8px 0 20px', borderBottom: '2px solid #111827', marginBottom: 16 },
  relatorioTitulo:{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  relatorioSub:   { fontSize: 14, color: '#6B7280', margin: '0 0 16px', textTransform: 'capitalize' },
  resumoGeral:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  resumoItem:     { fontSize: 14, color: '#374151' },
  resumoDivisor:  { width: 1, height: 16, background: '#E5E7EB' },
  congCard:       { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  congHead:       { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer' },
  congNome:       { fontSize: 15, fontWeight: 700, color: '#111827' },
  congStats:      { fontSize: 12, color: '#6B7280', marginTop: 2 },
  congBarraWrap:  { width: 80, flexShrink: 0 },
  congBarra:      { height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' },
  congBarraFill:  { height: '100%', background: '#34D399', borderRadius: 99 },
  chevron:        { fontSize: 20, color: '#D1D5DB', flexShrink: 0, transition: 'transform 0.2s' },
  obreirosList:   { borderTop: '1px solid #F3F4F6', padding: '4px 0' },
  obreiroRow:     { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #F9FAFB' },
  statusDot:      { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  obreiroNome:    { fontSize: 14, fontWeight: 500, color: '#111827' },
  obreiroMeta:    { display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  cargoBadge:     { borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600 },
  funcaoTxt:      { fontSize: 12, color: '#9CA3AF' },
  statusTxt:      { fontSize: 12, fontWeight: 600, flexShrink: 0 },
  vazio:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px' },
  emptyBox:       { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '32px', textAlign: 'center' },
  rodape:         { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
}