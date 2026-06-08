'use client'

/**
 * /reunioes/admin/obreiros/page.jsx
 * Lista de obreiros com status de foto cadastrada
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function normalizarTexto(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function iniciais(nome) {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

export default function ObreirosPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [obreiros, setObreiros]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [filtro, setFiltro]       = useState('todos') // 'todos' | 'com_foto' | 'sem_foto'

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('obreiros')
        .select('id, nome, foto_url, face_descriptor, congregacoes(nome), cargos(nome)')
        .eq('situacao', 'Ativo')
        .order('nome')
      setObreiros(data || [])
      setLoading(false)
    }
    carregar()
  }, [])

  const filtrados = obreiros.filter(o => {
    const buscaNorm = normalizarTexto(busca)
    const nomeNorm  = normalizarTexto(o.nome)
    const congNorm  = normalizarTexto(o.congregacoes?.nome || '')
    const corresponde = !busca || nomeNorm.includes(buscaNorm) || congNorm.includes(buscaNorm)
    if (!corresponde) return false
    if (filtro === 'com_foto') return !!o.face_descriptor
    if (filtro === 'sem_foto') return !o.face_descriptor
    return true
  })

  const comFoto   = obreiros.filter(o => !!o.face_descriptor).length
  const semFoto   = obreiros.length - comFoto
  const pctFoto   = obreiros.length ? Math.round(comFoto / obreiros.length * 100) : 0

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/reunioes/admin')}>←</button>
        <div>
          <div style={s.headerTitulo}>Cadastro de fotos</div>
          <div style={s.headerSub}>Reconhecimento facial</div>
        </div>
      </div>

      <div style={s.body}>

        {/* Progresso geral */}
        <div style={s.progressoCard}>
          <div style={s.progressoNums}>
            <span style={s.progressoNum}>{comFoto}</span>
            <span style={s.progressoDen}>/{obreiros.length} com foto</span>
          </div>
          <div style={s.progressoBarra}>
            <div style={{ ...s.progressoFill, width: `${pctFoto}%` }} />
          </div>
          <div style={s.progressoLegenda}>
            <span style={{ color: '#065F46' }}>{comFoto} cadastrados</span>
            <span style={{ color: '#9CA3AF' }}>{semFoto} sem foto</span>
          </div>
        </div>

        {/* Busca */}
        <div style={s.buscaWrap}>
          <span style={s.buscaIcone}>⌕</span>
          <input
            style={s.buscaInput}
            type="search"
            placeholder="Buscar por nome ou congregação..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          {[
            { key: 'todos',    label: `Todos (${obreiros.length})` },
            { key: 'com_foto', label: `Com foto (${comFoto})` },
            { key: 'sem_foto', label: `Sem foto (${semFoto})` },
          ].map(f => (
            <button key={f.key}
              style={{ ...s.filtroBtn, ...(filtro === f.key ? s.filtroBtnAtivo : {}) }}
              onClick={() => setFiltro(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={s.loadingWrap}><div style={s.spinner} /></div>
        ) : filtrados.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Nenhum obreiro encontrado.</p>
          </div>
        ) : (
          filtrados.map(o => {
            const temFoto = !!o.face_descriptor
            return (
              <button key={o.id} style={s.card}
                onClick={() => router.push(`/reunioes/admin/obreiros/${o.id}/foto`)}>

                {/* Avatar ou foto */}
                <div style={s.avatarWrap}>
                  {o.foto_url ? (
                    <img src={o.foto_url} alt={o.nome} style={s.fotoImg} />
                  ) : (
                    <div style={s.avatarSem}>{iniciais(o.nome)}</div>
                  )}
                  {temFoto && <div style={s.fotoBadge}>✓</div>}
                </div>

                {/* Info */}
                <div style={s.cardInfo}>
                  <div style={s.cardNome}>{o.nome}</div>
                  <div style={s.cardSub}>{o.congregacoes?.nome || '—'}</div>
                  <div style={{ ...s.cardStatus, color: temFoto ? '#065F46' : '#F59E0B' }}>
                    {temFoto ? 'Foto cadastrada' : 'Sem foto — toque para cadastrar'}
                  </div>
                </div>

                <span style={s.chevron}>›</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 40 },
  header:         { background: '#111827', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 15, fontWeight: 600 },
  headerSub:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  body:           { padding: '16px' },
  progressoCard:  { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px', marginBottom: 14 },
  progressoNums:  { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  progressoNum:   { fontSize: 28, fontWeight: 700, color: '#111827' },
  progressoDen:   { fontSize: 14, color: '#6B7280' },
  progressoBarra: { height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressoFill:  { height: '100%', background: '#34D399', borderRadius: 99, transition: 'width 0.5s' },
  progressoLegenda: { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  buscaWrap:      { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '0 12px', marginBottom: 10 },
  buscaIcone:     { fontSize: 18, color: '#9CA3AF', marginRight: 8 },
  buscaInput:     { flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '12px 0', background: 'transparent', color: '#111827' },
  filtros:        { display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' },
  filtroBtn:      { flexShrink: 0, padding: '6px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroBtnAtivo: { background: '#111827', borderColor: '#111827', color: '#fff', fontWeight: 500 },
  card:           { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', width: '100%' },
  avatarWrap:     { position: 'relative', flexShrink: 0 },
  fotoImg:        { width: 48, height: 48, borderRadius: 12, objectFit: 'cover' },
  avatarSem:      { width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 },
  fotoBadge:      { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#065F46', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  cardInfo:       { flex: 1, minWidth: 0 },
  cardNome:       { fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub:        { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardStatus:     { fontSize: 11, marginTop: 3, fontWeight: 500 },
  chevron:        { fontSize: 20, color: '#D1D5DB', flexShrink: 0 },
  loadingWrap:    { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner:        { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:       { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '32px', textAlign: 'center' },
}