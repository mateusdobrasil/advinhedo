'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function iniciais(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const COR_CARGO = {
  'Pastor':      { bg: '#FEF3C7', text: '#92400E' },
  'Evangelista': { bg: '#EDE9FE', text: '#5B21B6' },
  'Presbítero':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Diácono':     { bg: '#D1FAE5', text: '#065F46' },
  'Cooperador':  { bg: '#FCE7F3', text: '#9D174D' },
  'Membro':      { bg: '#F3F4F6', text: '#374151' },
}

export default function CheckinPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [reuniao, setReuniao]     = useState(null)
  const [reunioes, setReunioes]   = useState([])
  const [obreiros, setObreiros]   = useState([])
  const [presencas, setPresencas] = useState({})
  const [busca, setBusca]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [loadingId, setLoadingId] = useState(null)
  const [feedback, setFeedback]   = useState(null)
  const [filtro, setFiltro]       = useState('todos')
  const buscaRef = useRef(null)

  useEffect(() => {
    async function carregarReunioes() {
      const { data } = await supabase
        .from('reunioes').select('id, titulo, data_reuniao')
        .eq('aberta', true).order('data_reuniao', { ascending: false })
      setReunioes(data || [])
      if (data?.length === 1) setReuniao(data[0])
      setLoading(false)
    }
    carregarReunioes()
  }, [])

  useEffect(() => {
    if (!reuniao) return
    setLoading(true)
    async function carregarDados() {
      const { data: obs } = await supabase
        .from('obreiros')
        .select('id, nome, cadastro, congregacoes (nome), cargos (nome)')
        .eq('situacao', 'Ativo').order('nome')
      const { data: pres } = await supabase
        .from('presencas').select('id, obreiro_id, presente').eq('reuniao_id', reuniao.id)
      const mapaPresencas = {}
      pres?.forEach(p => { mapaPresencas[p.obreiro_id] = p })
      setObreiros(obs || [])
      setPresencas(mapaPresencas)
      setLoading(false)
    }
    carregarDados()
  }, [reuniao])

  useEffect(() => {
    if (!reuniao) return
    const canal = supabase
      .channel(`presencas-${reuniao.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'presencas', filter: `reuniao_id=eq.${reuniao.id}` },
        (payload) => {
          setPresencas(prev => {
            const novo = { ...prev }
            if (payload.eventType === 'DELETE') delete novo[payload.old.obreiro_id]
            else novo[payload.new.obreiro_id] = payload.new
            return novo
          })
        })
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [reuniao])

  const fazerCheckin = useCallback(async (obreiro) => {
    if (loadingId) return
    setLoadingId(obreiro.id)
    const jaPresente = presencas[obreiro.id]

    if (jaPresente) {
      // Atualiza estado local imediatamente
      setPresencas(prev => {
        const novo = { ...prev }
        delete novo[obreiro.id]
        return novo
      })

      const { error } = await supabase.from('presencas').delete().eq('id', jaPresente.id)

      if (!error) {
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'removido' })
      } else {
        // Reverte se falhou
        setPresencas(prev => ({ ...prev, [obreiro.id]: jaPresente }))
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'erro' })
      }
    } else {
      // ID temporário para atualização otimista
      const tempPresenca = { id: `temp-${obreiro.id}`, obreiro_id: obreiro.id, presente: true }

      // Atualiza estado local imediatamente
      setPresencas(prev => ({ ...prev, [obreiro.id]: tempPresenca }))

      const { data, error } = await supabase.from('presencas').insert({
        reuniao_id: reuniao.id, obreiro_id: obreiro.id, presente: true, metodo_checkin: 'lista',
      }).select().single()

      if (!error && data) {
        // Substitui o ID temporário pelo ID real retornado
        setPresencas(prev => ({ ...prev, [obreiro.id]: data }))
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'sucesso' })
      } else {
        // Reverte se falhou
        setPresencas(prev => {
          const novo = { ...prev }
          delete novo[obreiro.id]
          return novo
        })
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'erro' })
      }
    }

    setLoadingId(null)
    setTimeout(() => setFeedback(null), 2500)
  }, [loadingId, presencas, reuniao])

  const obreirosFiltrados = obreiros.filter(o => {
    const buscaNorm = normalizarTexto(busca)
    const nomeNorm  = normalizarTexto(o.nome)
    const congNorm  = normalizarTexto(o.congregacoes?.nome || '')
    const corresponde = !busca || nomeNorm.includes(buscaNorm) || congNorm.includes(buscaNorm)
    if (!corresponde) return false
    if (filtro === 'presentes') return !!presencas[o.id]
    if (filtro === 'ausentes')  return !presencas[o.id]
    return true
  })

  const totalPresentes = Object.keys(presencas).length
  const totalObreiros  = obreiros.length

  // ── Tela de seleção de reunião ─────────────────────────────────────────────
  if (!reuniao) {
    return (
      <div style={st.container}>
        <div style={st.selecaoWrap}>
          <div style={st.logoMark}>AD</div>
          <h1 style={st.selecaoTitulo}>Reunião de Obreiros</h1>
          <p style={st.selecaoSub}>Selecione a reunião para iniciar o check-in</p>
          {loading ? (
            <p style={st.loadingText}>Carregando...</p>
          ) : reunioes.length === 0 ? (
            <div style={st.emptyBox}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Nenhuma reunião aberta no momento.</p>
              <p style={{ margin: '6px 0 0', color: '#9CA3AF', fontSize: 13 }}>Crie uma reunião no painel administrativo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {reunioes.map(r => (
                <button key={r.id} style={st.reuniaoBtn} onClick={() => setReuniao(r)}>
                  <span style={st.reuniaoBtnTitulo}>{r.titulo}</span>
                  <span style={st.reuniaoBtnData}>
                    {new Date(r.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long'
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
          {/* Botão voltar na tela de seleção */}
          <button style={st.voltarSolto} onClick={() => router.push('/reunioes/admin')}>
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  // ── Tela principal de check-in ─────────────────────────────────────────────
  return (
    <div style={st.container}>

      {feedback && (
        <div style={{
          ...st.toast,
          background: feedback.tipo === 'sucesso' ? '#065F46' :
                      feedback.tipo === 'removido' ? '#1E40AF' : '#991B1B',
        }}>
          {feedback.tipo === 'sucesso' && '✓ '}
          {feedback.tipo === 'removido' && '↩ '}
          {feedback.tipo === 'erro' && '✗ '}
          {feedback.tipo === 'sucesso'  ? `${feedback.nome} presente!` :
           feedback.tipo === 'removido' ? `${feedback.nome} removido` :
           `Erro ao registrar ${feedback.nome}`}
        </div>
      )}

      {/* Header com botão voltar */}
      <div style={st.header}>
        <button style={st.voltarBtn} onClick={() => router.push('/reunioes/admin')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={st.headerTitulo}>{reuniao.titulo}</div>
          <div style={st.headerData}>
            {new Date(reuniao.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
        <div style={st.contador}>
          <span style={st.contadorNum}>{totalPresentes}</span>
          <span style={st.contadorDen}>/{totalObreiros}</span>
        </div>
      </div>

      <div style={st.buscaWrap}>
        <span style={st.buscaIcone}>⌕</span>
        <input
          ref={buscaRef}
          style={st.buscaInput}
          type="search"
          placeholder="Buscar por nome ou congregação..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          autoComplete="off" autoCorrect="off" spellCheck="false"
        />
        {busca && (
          <button style={st.buscaLimpar} onClick={() => { setBusca(''); buscaRef.current?.focus() }}>✕</button>
        )}
      </div>

      <div style={st.filtros}>
        {[
          { key: 'todos',     label: `Todos (${totalObreiros})` },
          { key: 'presentes', label: `Presentes (${totalPresentes})` },
          { key: 'ausentes',  label: `Ausentes (${totalObreiros - totalPresentes})` },
        ].map(f => (
          <button key={f.key}
            style={{ ...st.filtroBtn, ...(filtro === f.key ? st.filtroBtnAtivo : {}) }}
            onClick={() => setFiltro(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={st.loadingWrap}>
          <div style={st.loadingSpinner} />
          <p style={st.loadingText}>Carregando obreiros...</p>
        </div>
      ) : obreirosFiltrados.length === 0 ? (
        <div style={st.emptyBox}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            {busca ? `Nenhum resultado para "${busca}"` : 'Nenhum obreiro neste filtro'}
          </p>
        </div>
      ) : (
        <div style={st.lista}>
          {obreirosFiltrados.map(o => {
            const presente   = !!presencas[o.id]
            const carregando = loadingId === o.id
            const cor        = COR_CARGO[o.cargos?.nome] || COR_CARGO['Membro']
            return (
              <button key={o.id}
                style={{ ...st.card, ...(presente ? st.cardPresente : {}), opacity: carregando ? 0.6 : 1 }}
                onClick={() => fazerCheckin(o)} disabled={carregando}>
                <div style={{ ...st.avatar, background: presente ? '#065F46' : cor.bg, color: presente ? '#fff' : cor.text }}>
                  {carregando ? '…' : presente ? '✓' : iniciais(o.nome)}
                </div>
                <div style={st.cardInfo}>
                  <div style={st.cardNome}>{o.nome}</div>
                  <div style={st.cardSub}>
                    <span>{o.congregacoes?.nome || '—'}</span>
                    {o.cargos?.nome && (
                      <span style={{
                        ...st.badgeCargo,
                        background: COR_CARGO[o.cargos.nome]?.bg || '#F3F4F6',
                        color:      COR_CARGO[o.cargos.nome]?.text || '#374151',
                      }}>
                        {o.cargos.nome}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ ...st.status, color: presente ? '#065F46' : '#D1D5DB' }}>
                  {presente ? 'Presente' : 'Ausente'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Rodapé */}
      <div style={st.rodape}>
        <button style={st.rodapeBtn} onClick={() => { setReuniao(null); setBusca('') }}>
          ← Trocar
        </button>
        <button
          style={st.rodapeBtnScanner}
          onClick={() => router.push(`/reunioes/admin/checkin/scanner?reuniao=${reuniao.id}&titulo=${encodeURIComponent(reuniao.titulo)}`)}>
          ⬡ Cartão
        </button>
        <button
          style={{ ...st.rodapeBtnScanner, background: '#7C3AED' }}
          onClick={() => router.push(`/reunioes/admin/checkin/facial?reuniao=${reuniao.id}&titulo=${encodeURIComponent(reuniao.titulo)}`)}>
          ◉ Facial
        </button>
      </div>
    </div>
  )
}

const st = {
  container:       { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 80 },
  selecaoWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 40px' },
  logoMark:        { width: 56, height: 56, borderRadius: 16, background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 20 },
  selecaoTitulo:   { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px', textAlign: 'center' },
  selecaoSub:      { fontSize: 14, color: '#6B7280', margin: '0 0 32px', textAlign: 'center' },
  reuniaoBtn:      { width: '100%', padding: '16px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 },
  reuniaoBtnTitulo:{ fontSize: 15, fontWeight: 600, color: '#111827' },
  reuniaoBtnData:  { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  voltarSolto:     { marginTop: 24, background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer', padding: 0 },
  toast:           { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  header:          { background: '#111827', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:       { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 },
  headerTitulo:    { fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerData:      { fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' },
  contador:        { textAlign: 'right', lineHeight: 1, flexShrink: 0 },
  contadorNum:     { fontSize: 28, fontWeight: 700, color: '#34D399' },
  contadorDen:     { fontSize: 16, color: '#6B7280' },
  buscaWrap:       { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', margin: '12px 16px 0', borderRadius: 12, padding: '0 12px' },
  buscaIcone:      { fontSize: 18, color: '#9CA3AF', marginRight: 8, userSelect: 'none' },
  buscaInput:      { flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '13px 0', background: 'transparent', color: '#111827' },
  buscaLimpar:     { background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '4px 0' },
  filtros:         { display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto' },
  filtroBtn:       { flexShrink: 0, padding: '6px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroBtnAtivo:  { background: '#111827', borderColor: '#111827', color: '#fff', fontWeight: 500 },
  lista:           { display: 'flex', flexDirection: 'column', gap: 0, padding: '12px 16px 0' },
  card:            { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' },
  cardPresente:    { background: '#F0FDF4', borderColor: '#86EFAC' },
  avatar:          { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  cardInfo:        { flex: 1, minWidth: 0 },
  cardNome:        { fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub:         { fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },
  badgeCargo:      { background: '#EDE9FE', color: '#5B21B6', borderRadius: 20, padding: '1px 8px', fontSize: 11 },
  status:          { fontSize: 12, fontWeight: 500, flexShrink: 0 },
  loadingWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
  loadingSpinner:  { width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText:     { color: '#9CA3AF', fontSize: 14, marginTop: 12 },
  emptyBox:        { margin: '40px 16px 0', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', textAlign: 'center' },
  rodape:          { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(249,250,251,0.95)', borderTop: '1px solid #E5E7EB', padding: '10px 16px', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rodapeBtn:       { background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', padding: 0 },
  rodapeBtnScanner: { background: '#111827', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 16px', borderRadius: 20 },
}