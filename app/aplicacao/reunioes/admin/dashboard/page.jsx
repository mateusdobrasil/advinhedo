'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

import { createClient } from '@supabase/supabase-js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const COR_CARGO = {
  'Pastor':      '#111827',
  'Evangelista': '#7C3AED',
  'Presbítero':  '#2563EB',
  'Diácono':     '#059669',
  'Cooperador':  '#DB2777',
  'Membro':      '#6B7280',
}

function fmtData(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMes(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function calcIdade(dataNasc) {
  if (!dataNasc) return null
  const hoje = new Date(), nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function faixaEtaria(idade) {
  if (idade === null) return null
  if (idade < 18) return '< 18'
  if (idade < 30) return '18–29'
  if (idade < 45) return '30–44'
  if (idade < 60) return '45–59'
  return '60+'
}

const ORDEM_FAIXA = ['< 18', '18–29', '30–44', '45–59', '60+']
const ORDEM_CARGO = ['Pastor', 'Evangelista', 'Presbítero', 'Diácono', 'Cooperador', 'Membro']

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color || '#111827' }}>
          {p.name}: <strong>{p.value}</strong>
          {p.payload?.pct !== undefined ? ` (${p.payload.pct}%)` : ''}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  useReuniaoAuth()

  const [reunioes, setReunioes]       = useState([])
  const [obreiros, setObreiros]       = useState([])
  const [presencaMap, setPresencaMap] = useState({})
  const [loading, setLoading]         = useState(true)
  const [modoFiltro, setModoFiltro]   = useState('ultima')
  const [reuniaoSel, setReuniaoSel]   = useState(null)
  const [reunioesSel, setReunioesSel] = useState([])

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const [{ data: reuns }, { data: obs }, { data: pres }] = await Promise.all([
        supabase.from('obreiro_reunioes').select('id, titulo, data_reuniao, aberta').eq('ativa', true).order('data_reuniao', { ascending: false }),
        supabase.from('obreiro_cadastro').select('id, nome, data_nascimento, obreiro_congregacoes(nome), obreiro_cargos(nome)').eq('situacao', 'Ativo'),
        supabase.from('obreiro_presencas').select('reuniao_id, obreiro_id, presente'),
      ])
      const mapa = {}
      pres?.forEach(p => {
        if (!p.presente) return
        if (!mapa[p.reuniao_id]) mapa[p.reuniao_id] = new Set()
        mapa[p.reuniao_id].add(p.obreiro_id)
      })
      setReunioes(reuns || [])
      setObreiros(obs || [])
      setPresencaMap(mapa)
      if (reuns?.length) setReuniaoSel(reuns[0])
      setLoading(false)
    }
    carregar()
  }, [])

  const reunioesFiltradas = useMemo(() => {
    if (modoFiltro === 'ultima')   return reunioes.slice(0, 1)
    if (modoFiltro === 'escolher') return reuniaoSel ? [reuniaoSel] : []
    if (modoFiltro === 'comparar') return reunioesSel.length ? reunioesSel : reunioes.slice(0, 3)
    return []
  }, [modoFiltro, reunioes, reuniaoSel, reunioesSel])

  const presentesSet = useMemo(() => {
    const s = new Set()
    reunioesFiltradas.forEach(r => { presencaMap[r.id]?.forEach(id => s.add(id)) })
    return s
  }, [reunioesFiltradas, presencaMap])

  const totalPresentes = presentesSet.size
  const totalObreiros  = obreiros.length
  const pctGeral       = totalObreiros ? Math.round(totalPresentes / totalObreiros * 100) : 0

  const dadosCongregacao = useMemo(() => {
    const mapa = {}
    obreiros.forEach(o => {
      const cong = o.congregacoes?.nome || 'Sem congregação'
      if (!mapa[cong]) mapa[cong] = { total: 0, presentes: 0 }
      mapa[cong].total++
      if (presentesSet.has(o.id)) mapa[cong].presentes++
    })
    return Object.entries(mapa).map(([nome, d]) => ({
      nome: nome.length > 12 ? nome.substring(0, 12) + '…' : nome,
      nomeCompleto: nome, presentes: d.presentes,
      ausentes: d.total - d.presentes, total: d.total,
      pct: Math.round(d.presentes / d.total * 100),
    })).sort((a, b) => b.presentes - a.presentes)
  }, [obreiros, presentesSet])

  const dadosCargo = useMemo(() => {
    const mapa = {}
    obreiros.forEach(o => {
      const cargo = o.obreiro_cargos?.nome || 'Sem cargo'
      if (!mapa[cargo]) mapa[cargo] = { total: 0, presentes: 0 }
      mapa[cargo].total++
      if (presentesSet.has(o.id)) mapa[cargo].presentes++
    })
    return ORDEM_CARGO.filter(c => mapa[c]).map(c => ({
      nome: c, value: mapa[c].presentes, total: mapa[c].total,
      ausentes: mapa[c].total - mapa[c].presentes,
      pct: Math.round(mapa[c].presentes / mapa[c].total * 100),
      fill: COR_CARGO[c] || '#9CA3AF',
    }))
  }, [obreiros, presentesSet])

  const dadosFaixa = useMemo(() => {
    const mapa = {}
    obreiros.forEach(o => {
      const faixa = faixaEtaria(calcIdade(o.data_nascimento))
      if (!faixa) return
      if (!mapa[faixa]) mapa[faixa] = { total: 0, presentes: 0 }
      mapa[faixa].total++
      if (presentesSet.has(o.id)) mapa[faixa].presentes++
    })
    return ORDEM_FAIXA.filter(f => mapa[f]).map(f => ({
      faixa: f, presentes: mapa[f].presentes,
      ausentes: mapa[f].total - mapa[f].presentes, total: mapa[f].total,
      pct: Math.round(mapa[f].presentes / mapa[f].total * 100),
    }))
  }, [obreiros, presentesSet])

  const dadosEvolucao = useMemo(() => {
    return [...reunioes].reverse().slice(-12).map(r => {
      const presentes = presencaMap[r.id]?.size || 0
      return { mes: fmtMes(r.data_reuniao), titulo: r.titulo, presentes,
        pct: totalObreiros ? Math.round(presentes / totalObreiros * 100) : 0 }
    })
  }, [reunioes, presencaMap, totalObreiros])

  function toggleReuniaoComparar(r) {
    setReunioesSel(prev =>
      prev.find(x => x.id === r.id) ? prev.filter(x => x.id !== r.id) : [...prev, r])
  }

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingTxt}>Carregando dados...</p>
      </div>
    )
  }

  return (
    <div style={s.container}>

      {/* Header com botão voltar */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin')}>←</button>
        <div>
          <div style={s.headerTitulo}>Dashboard</div>
          <div style={s.headerSub}>Análise de presenças — AD Vinhedo</div>
        </div>
      </div>

      <div style={s.body}>

        <div style={s.secao}>
          <div style={s.filtroTabs}>
            {[
              { key: 'ultima',   label: 'Última reunião' },
              { key: 'escolher', label: 'Escolher reunião' },
              { key: 'comparar', label: 'Comparar reuniões' },
            ].map(f => (
              <button key={f.key}
                style={{ ...s.filtroTab, ...(modoFiltro === f.key ? s.filtroTabAtivo : {}) }}
                onClick={() => setModoFiltro(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {modoFiltro === 'escolher' && (
            <select style={s.select} value={reuniaoSel?.id || ''}
              onChange={e => setReuniaoSel(reunioes.find(r => r.id === e.target.value))}>
              {reunioes.map(r => (
                <option key={r.id} value={r.id}>{fmtData(r.data_reuniao)} — {r.titulo}</option>
              ))}
            </select>
          )}

          {modoFiltro === 'comparar' && (
            <div style={s.compararLista}>
              {reunioes.map(r => {
                const sel = reunioesSel.find(x => x.id === r.id)
                return (
                  <button key={r.id}
                    style={{ ...s.compararItem, ...(sel ? s.compararItemAtivo : {}) }}
                    onClick={() => toggleReuniaoComparar(r)}>
                    <span style={s.compararData}>{fmtData(r.data_reuniao)}</span>
                    <span style={s.compararTitulo}>{r.titulo}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {reunioesFiltradas.length > 0 && (
          <div style={s.reuniaoInfo}>
            {reunioesFiltradas.map(r => (
              <span key={r.id} style={s.reuniaoTag}>
                {fmtData(r.data_reuniao)} — {r.titulo}
                {r.aberta && <span style={s.tagAberta}> Aberta</span>}
              </span>
            ))}
          </div>
        )}

        <div style={s.cards}>
          <div style={s.card}><div style={s.cardNum}>{totalPresentes}</div><div style={s.cardLabel}>Presentes</div></div>
          <div style={s.card}><div style={{ ...s.cardNum, color: '#6B7280' }}>{totalObreiros - totalPresentes}</div><div style={s.cardLabel}>Ausentes</div></div>
          <div style={{ ...s.card, ...s.cardDestaque }}><div style={{ ...s.cardNum, color: '#065F46' }}>{pctGeral}%</div><div style={s.cardLabel}>Presença geral</div></div>
          <div style={s.card}><div style={{ ...s.cardNum, color: '#6B7280' }}>{totalObreiros}</div><div style={s.cardLabel}>Total obreiros</div></div>
        </div>

        <div style={s.barraGeralWrap}>
          <div style={s.barraGeral}><div style={{ ...s.barraGeralFill, width: `${pctGeral}%` }} /></div>
          <span style={s.barraGeralTxt}>{pctGeral}% de presença geral</span>
        </div>

        <div style={s.graficoCard}>
          <h3 style={s.graficoTitulo}>Presença por congregação</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosCongregacao} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip content={<TooltipCustom />} />
              <Bar dataKey="presentes" name="Presentes" fill="#111827" radius={[4,4,0,0]} />
              <Bar dataKey="ausentes"  name="Ausentes"  fill="#E5E7EB" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={s.tabelinha}>
            {dadosCongregacao.map(d => (
              <div key={d.nomeCompleto} style={s.tabelinhaRow}>
                <span style={s.tabelinhaNome}>{d.nomeCompleto}</span>
                <div style={s.miniBarra}><div style={{ ...s.miniBarraFill, width: `${d.pct}%` }} /></div>
                <span style={s.tabelinhaPct}>{d.presentes}/{d.total} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.graficoCard}>
          <h3 style={s.graficoTitulo}>Presença por cargo eclesiástico</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosCargo} dataKey="value" nameKey="nome" cx="50%" cy="50%"
                outerRadius={80} label={({ nome, pct }) => `${nome} ${pct}%`} labelLine={false}>
                {dadosCargo.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [`${v} presentes (${p.payload.pct}%)`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={s.tabelinha}>
            {dadosCargo.map(d => (
              <div key={d.nome} style={s.tabelinhaRow}>
                <span style={{ ...s.dot, background: d.fill }} />
                <span style={s.tabelinhaNome}>{d.nome}</span>
                <div style={s.miniBarra}><div style={{ ...s.miniBarraFill, width: `${d.pct}%`, background: d.fill }} /></div>
                <span style={s.tabelinhaPct}>{d.value}/{d.total} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.graficoCard}>
          <h3 style={s.graficoTitulo}>Presença por faixa etária</h3>
          {dadosFaixa.length === 0 ? (
            <p style={s.semDados}>Poucos obreiros com data de nascimento cadastrada.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosFaixa} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar dataKey="presentes" name="Presentes" fill="#34D399" radius={[4,4,0,0]} />
                  <Bar dataKey="ausentes"  name="Ausentes"  fill="#E5E7EB" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={s.tabelinha}>
                {dadosFaixa.map(d => (
                  <div key={d.faixa} style={s.tabelinhaRow}>
                    <span style={s.tabelinhaNome}>{d.faixa} anos</span>
                    <div style={s.miniBarra}><div style={{ ...s.miniBarraFill, width: `${d.pct}%`, background: '#34D399' }} /></div>
                    <span style={s.tabelinhaPct}>{d.presentes}/{d.total} ({d.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={s.graficoCard}>
          <h3 style={s.graficoTitulo}>Evolução mensal de presença</h3>
          {dadosEvolucao.length < 2 ? (
            <p style={s.semDados}>Realize pelo menos 2 reuniões para ver a evolução.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosEvolucao} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v, n, p) => [`${p.payload.presentes} presentes (${v}%)`, 'Presença']}
                  labelFormatter={l => `Reunião: ${l}`} />
                <Line type="monotone" dataKey="pct" name="% presença" stroke="#111827"
                  strokeWidth={2} dot={{ fill: '#111827', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {modoFiltro !== 'comparar' && reunioesFiltradas.length === 1 && (
          <div style={s.graficoCard}>
            <h3 style={s.graficoTitulo}>
              Ausentes <span style={s.graficoSubTitulo}>— {totalObreiros - totalPresentes} obreiros</span>
            </h3>
            <div style={s.ausentesList}>
              {obreiros.filter(o => !presentesSet.has(o.id)).map(o => (
                <div key={o.id} style={s.ausenteItem}>
                  <div style={s.ausenteAvatar}>{o.nome.split(' ').slice(0,2).map(p => p[0]).join('')}</div>
                  <div>
                    <div style={s.ausenteNome}>{o.nome}</div>
                    <div style={s.ausenteSub}>
                      {o.obreiro_congregacoes?.nome || '—'}
                      {o.obreiro_cargos?.nome && o.obreiro_cargos.nome !== 'Membro' &&
                        <span style={{ ...s.badgeCargo, background: COR_CARGO[o.obreiro_cargos.nome] + '22', color: COR_CARGO[o.obreiro_cargos.nome] }}>
                          {o.obreiro_cargos.nome}
                        </span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  container:       { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 640, margin: '0 auto', paddingBottom: 48 },
  loadingWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' },
  spinner:         { width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingTxt:      { color: '#9CA3AF', fontSize: 14, marginTop: 12 },
  header:          { background: '#111827', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:       { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 },
  headerTitulo:    { fontSize: 17, fontWeight: 600 },
  headerSub:       { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  body:            { padding: '16px' },
  secao:           { marginBottom: 16 },
  filtroTabs:      { display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' },
  filtroTab:       { flexShrink: 0, padding: '7px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroTabAtivo:  { background: '#111827', border: '1px solid #111827', color: '#fff', fontWeight: 500 },
  select:          { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none' },
  compararLista:   { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' },
  compararItem:    { display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', textAlign: 'left' },
  compararItemAtivo: { border: '1px solid #111827', background: '#F9FAFB' },
  compararData:    { fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' },
  compararTitulo:  { fontSize: 13, color: '#111827', fontWeight: 500 },
  reuniaoInfo:     { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 },
  reuniaoTag:      { fontSize: 12, color: '#374151', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 10px' },
  tagAberta:       { color: '#065F46', fontWeight: 600 },
  cards:           { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 },
  card:            { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', textAlign: 'center' },
  cardDestaque:    { border: '1px solid #86EFAC', background: '#F0FDF4' },
  cardNum:         { fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 },
  cardLabel:       { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  barraGeralWrap:  { marginBottom: 20 },
  barraGeral:      { height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  barraGeralFill:  { height: '100%', background: '#111827', borderRadius: 99, transition: 'width 0.6s ease' },
  barraGeralTxt:   { fontSize: 12, color: '#6B7280' },
  graficoCard:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px', marginBottom: 14 },
  graficoTitulo:   { fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 14px' },
  graficoSubTitulo:{ fontWeight: 400, color: '#9CA3AF' },
  semDados:        { fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '20px 0' },
  tabelinha:       { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  tabelinhaRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  tabelinhaNome:   { fontSize: 12, color: '#374151', minWidth: 80, flexShrink: 0 },
  miniBarra:       { flex: 1, height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' },
  miniBarraFill:   { height: '100%', background: '#111827', borderRadius: 99, transition: 'width 0.5s ease' },
  tabelinhaPct:    { fontSize: 12, color: '#6B7280', minWidth: 90, textAlign: 'right', flexShrink: 0 },
  dot:             { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  ausentesList:    { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' },
  ausenteItem:     { display: 'flex', alignItems: 'center', gap: 10 },
  ausenteAvatar:   { width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  ausenteNome:     { fontSize: 13, fontWeight: 500, color: '#111827' },
  ausenteSub:      { fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 },
  badgeCargo:      { borderRadius: 20, padding: '1px 8px', fontSize: 11 },
}