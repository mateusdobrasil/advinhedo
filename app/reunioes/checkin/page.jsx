'use client'

/**
 * PÁGINA DE CHECK-IN DE OBREIROS
 * AD Vinhedo — otimizada para celular
 *
 * Coloque este arquivo em: app/checkin/page.jsx  (Next.js App Router)
 * ou em:                   pages/checkin.jsx     (Next.js Pages Router)
 *
 * Dependências (já vêm com Next.js):
 *   npm install @supabase/supabase-js
 *
 * Variáveis de ambiente (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── Utilitários ────────────────────────────────────────────────────────────────

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Cores por cargo (para o avatar)
const COR_CARGO = {
  'Pastor':      { bg: '#FEF3C7', text: '#92400E' },
  'Evangelista': { bg: '#EDE9FE', text: '#5B21B6' },
  'Presbítero':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Diácono':     { bg: '#D1FAE5', text: '#065F46' },
  'Cooperador':  { bg: '#FCE7F3', text: '#9D174D' },
  'Membro':      { bg: '#F3F4F6', text: '#374151' },
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function CheckinPage() {
  const [reuniao, setReuniao]         = useState(null)
  const [reunioes, setReunioes]       = useState([])
  const [obreiros, setObreiros]       = useState([])
  const [presencas, setPresencas]     = useState({})   // { obreiro_id: presenca_id }
  const [busca, setBusca]             = useState('')
  const [loading, setLoading]         = useState(true)
  const [loadingId, setLoadingId]     = useState(null) // obreiro em processo de check-in
  const [feedback, setFeedback]       = useState(null) // { nome, tipo: 'sucesso'|'erro' }
  const [filtro, setFiltro]           = useState('todos') // 'todos' | 'presentes' | 'ausentes'
  const buscaRef = useRef(null)

  // ── Carrega reuniões abertas ─────────────────────────────────────────────────
  useEffect(() => {
    async function carregarReunioes() {
      const { data } = await supabase
        .from('reunioes')
        .select('id, titulo, data_reuniao')
        .eq('aberta', true)
        .order('data_reuniao', { ascending: false })
      setReunioes(data || [])
      if (data?.length === 1) setReuniao(data[0]) // seleciona automaticamente se só houver uma
      setLoading(false)
    }
    carregarReunioes()
  }, [])

  // ── Carrega obreiros e presenças quando reunião é selecionada ────────────────
  useEffect(() => {
    if (!reuniao) return
    setLoading(true)

    async function carregarDados() {
      // Obreiros ativos com congregação e cargo
      const { data: obs } = await supabase
        .from('obreiros')
        .select(`
          id, nome, cadastro,
          congregacoes (nome),
          cargos (nome)
        `)
        .eq('situacao', 'Ativo')
        .order('nome')

      // Presenças já registradas nesta reunião
      const { data: pres } = await supabase
        .from('presencas')
        .select('id, obreiro_id, presente')
        .eq('reuniao_id', reuniao.id)

      const mapaPresencas = {}
      pres?.forEach(p => { mapaPresencas[p.obreiro_id] = p })

      setObreiros(obs || [])
      setPresencas(mapaPresencas)
      setLoading(false)
    }

    carregarDados()
  }, [reuniao])

  // ── Realtime: atualiza presenças em tempo real (vários dispositivos) ─────────
  useEffect(() => {
    if (!reuniao) return

    const canal = supabase
      .channel(`presencas-${reuniao.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presencas', filter: `reuniao_id=eq.${reuniao.id}` },
        (payload) => {
          setPresencas(prev => {
            const novo = { ...prev }
            if (payload.eventType === 'DELETE') {
              delete novo[payload.old.obreiro_id]
            } else {
              novo[payload.new.obreiro_id] = payload.new
            }
            return novo
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [reuniao])

  // ── Check-in / desfazer check-in ────────────────────────────────────────────
  const fazerCheckin = useCallback(async (obreiro) => {
    if (loadingId) return
    setLoadingId(obreiro.id)

    const jaPresente = presencas[obreiro.id]

    if (jaPresente) {
      // Desfaz o check-in
      const { error } = await supabase
        .from('presencas')
        .delete()
        .eq('id', jaPresente.id)

      if (!error) {
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'removido' })
      }
    } else {
      // Faz o check-in
      const { error } = await supabase
        .from('presencas')
        .insert({
          reuniao_id:     reuniao.id,
          obreiro_id:     obreiro.id,
          presente:       true,
          metodo_checkin: 'lista',
        })

      if (!error) {
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'sucesso' })
      } else {
        setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'erro' })
      }
    }

    setLoadingId(null)
    setTimeout(() => setFeedback(null), 2500)
  }, [loadingId, presencas, reuniao])

  // ── Filtragem e busca ────────────────────────────────────────────────────────
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

  // ── Tela de seleção de reunião ───────────────────────────────────────────────
  if (!reuniao) {
    return (
      <div style={styles.container}>
        <div style={styles.selecaoWrap}>
          <div style={styles.logoMark}>AD</div>
          <h1 style={styles.selecaoTitulo}>Reunião de Obreiros</h1>
          <p style={styles.selecaoSub}>Selecione a reunião para iniciar o check-in</p>

          {loading ? (
            <p style={styles.loadingText}>Carregando...</p>
          ) : reunioes.length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Nenhuma reunião aberta no momento.
              </p>
              <p style={{ margin: '6px 0 0', color: '#9CA3AF', fontSize: 13 }}>
                Crie uma reunião no painel administrativo.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {reunioes.map(r => (
                <button key={r.id} style={styles.reuniaoBtn} onClick={() => setReuniao(r)}>
                  <span style={styles.reuniaoBtnTitulo}>{r.titulo}</span>
                  <span style={styles.reuniaoBtnData}>
                    {new Date(r.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long'
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Tela principal de check-in ───────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* Toast de feedback */}
      {feedback && (
        <div style={{
          ...styles.toast,
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

      {/* Cabeçalho */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitulo}>{reuniao.titulo}</div>
          <div style={styles.headerData}>
            {new Date(reuniao.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
        <div style={styles.contador}>
          <span style={styles.contadorNum}>{totalPresentes}</span>
          <span style={styles.contadorDen}>/{totalObreiros}</span>
        </div>
      </div>

      {/* Barra de busca */}
      <div style={styles.buscaWrap}>
        <span style={styles.buscaIcone}>⌕</span>
        <input
          ref={buscaRef}
          style={styles.buscaInput}
          type="search"
          placeholder="Buscar por nome ou congregação..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {busca && (
          <button style={styles.buscaLimpar} onClick={() => { setBusca(''); buscaRef.current?.focus() }}>
            ✕
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {[
          { key: 'todos',    label: `Todos (${totalObreiros})` },
          { key: 'presentes', label: `Presentes (${totalPresentes})` },
          { key: 'ausentes',  label: `Ausentes (${totalObreiros - totalPresentes})` },
        ].map(f => (
          <button
            key={f.key}
            style={{ ...styles.filtroBtn, ...(filtro === f.key ? styles.filtroBtnAtivo : {}) }}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de obreiros */}
      {loading ? (
        <div style={styles.loadingWrap}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Carregando obreiros...</p>
        </div>
      ) : obreirosFiltrados.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            {busca ? `Nenhum resultado para "${busca}"` : 'Nenhum obreiro neste filtro'}
          </p>
        </div>
      ) : (
        <div style={styles.lista}>
          {obreirosFiltrados.map(o => {
            const presente   = !!presencas[o.id]
            const carregando = loadingId === o.id
            const cor        = COR_CARGO[o.cargos?.nome] || COR_CARGO['Membro']

            return (
              <button
                key={o.id}
                style={{
                  ...styles.card,
                  ...(presente ? styles.cardPresente : {}),
                  opacity: carregando ? 0.6 : 1,
                }}
                onClick={() => fazerCheckin(o)}
                disabled={carregando}
              >
                {/* Avatar */}
                <div style={{
                  ...styles.avatar,
                  background: presente ? '#065F46' : cor.bg,
                  color:      presente ? '#fff'    : cor.text,
                }}>
                  {carregando ? '…' : presente ? '✓' : iniciais(o.nome)}
                </div>

                {/* Info */}
                <div style={styles.cardInfo}>
                  <div style={styles.cardNome}>{o.nome}</div>
                  <div style={styles.cardSub}>
                    {o.congregacoes?.nome || '—'}
                    {o.cargos?.nome && o.cargos.nome !== 'Membro' && (
                      <span style={styles.badgeCargo}>{o.cargos.nome}</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  ...styles.status,
                  color: presente ? '#065F46' : '#D1D5DB',
                }}>
                  {presente ? 'Presente' : 'Ausente'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Rodapé com atalho para trocar de reunião */}
      <div style={styles.rodape}>
        <button style={styles.rodapeBtn} onClick={() => { setReuniao(null); setBusca('') }}>
          ← Trocar reunião
        </button>
      </div>

    </div>
  )
}

// ── Estilos ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: '100dvh',
    background: '#F9FAFB',
    fontFamily: "'Geist', 'Inter', sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    paddingBottom: 80,
  },

  // Seleção de reunião
  selecaoWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 24px 40px',
  },
  logoMark: {
    width: 56, height: 56, borderRadius: 16,
    background: '#111827', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, letterSpacing: 1,
    marginBottom: 20,
  },
  selecaoTitulo: {
    fontSize: 22, fontWeight: 700, color: '#111827',
    margin: '0 0 6px', textAlign: 'center',
  },
  selecaoSub: {
    fontSize: 14, color: '#6B7280',
    margin: '0 0 32px', textAlign: 'center',
  },
  reuniaoBtn: {
    width: '100%', padding: '16px 20px',
    background: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 4,
    transition: 'border-color 0.15s',
  },
  reuniaoBtnTitulo: { fontSize: 15, fontWeight: 600, color: '#111827' },
  reuniaoBtnData:   { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },

  // Toast
  toast: {
    position: 'fixed', top: 16, left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff', fontSize: 14, fontWeight: 500,
    padding: '10px 20px', borderRadius: 24,
    zIndex: 999, whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },

  // Cabeçalho
  header: {
    background: '#111827', color: '#fff',
    padding: '20px 20px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    position: 'sticky', top: 0, zIndex: 10,
  },
  headerTitulo: { fontSize: 15, fontWeight: 600, marginBottom: 2 },
  headerData:   { fontSize: 12, color: '#9CA3AF', textTransform: 'capitalize' },
  contador: { textAlign: 'right', lineHeight: 1 },
  contadorNum: { fontSize: 28, fontWeight: 700, color: '#34D399' },
  contadorDen: { fontSize: 16, color: '#6B7280' },

  // Busca
  buscaWrap: {
    display: 'flex', alignItems: 'center',
    background: '#fff', border: '1px solid #E5E7EB',
    margin: '12px 16px 0',
    borderRadius: 12, padding: '0 12px',
  },
  buscaIcone: { fontSize: 18, color: '#9CA3AF', marginRight: 8, userSelect: 'none' },
  buscaInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 15, padding: '13px 0',
    background: 'transparent', color: '#111827',
  },
  buscaLimpar: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9CA3AF', fontSize: 14, padding: '4px 0',
  },

  // Filtros
  filtros: {
    display: 'flex', gap: 8,
    padding: '10px 16px 0',
    overflowX: 'auto',
  },
  filtroBtn: {
    flexShrink: 0, padding: '6px 14px',
    background: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 20, fontSize: 13, color: '#6B7280',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  filtroBtnAtivo: {
    background: '#111827', borderColor: '#111827',
    color: '#fff', fontWeight: 500,
  },

  // Lista
  lista: {
    display: 'flex', flexDirection: 'column', gap: 0,
    padding: '12px 16px 0',
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 12, padding: '12px 14px',
    marginBottom: 8, cursor: 'pointer', textAlign: 'left',
    width: '100%', transition: 'all 0.15s',
  },
  cardPresente: {
    background: '#F0FDF4', borderColor: '#86EFAC',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNome: {
    fontSize: 14, fontWeight: 600, color: '#111827',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardSub: {
    fontSize: 12, color: '#6B7280', marginTop: 2,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  badgeCargo: {
    background: '#EDE9FE', color: '#5B21B6',
    borderRadius: 20, padding: '1px 8px', fontSize: 11,
  },
  status: { fontSize: 12, fontWeight: 500, flexShrink: 0 },

  // Loading
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 20px',
  },
  loadingSpinner: {
    width: 32, height: 32,
    border: '3px solid #E5E7EB',
    borderTopColor: '#111827',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#9CA3AF', fontSize: 14, marginTop: 12 },

  // Empty
  emptyBox: {
    margin: '40px 16px 0',
    background: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 12, padding: '24px',
    textAlign: 'center',
  },

  // Rodapé
  rodape: {
    position: 'fixed', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'rgba(249,250,251,0.95)',
    borderTop: '1px solid #E5E7EB',
    padding: '12px 20px',
    backdropFilter: 'blur(8px)',
  },
  rodapeBtn: {
    background: 'none', border: 'none',
    color: '#6B7280', fontSize: 14, cursor: 'pointer',
    padding: 0,
  },
}
