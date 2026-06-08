'use client'

/**
 * PÁGINA DE ADMIN — GERENCIAMENTO DE REUNIÕES
 * AD Vinhedo
 *
 * Coloque em: app/admin/reunioes/page.jsx
 *
 * Variáveis de ambiente (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
 *   NEXT_PUBLIC_ADMIN_PASSWORD=senha_de_acesso
 */

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'advinhedo2025'

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

function hojeISO() {
  return new Date().toISOString().split('T')[0]
}

function tituloSugerido() {
  const agora = new Date()
  const mes = agora.toLocaleDateString('pt-BR', { month: 'long' })
  const ano = agora.getFullYear()
  return `Reunião de Obreiros — ${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}`
}

export default function AdminReunioes() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha]             = useState('')
  const [erroSenha, setErroSenha]     = useState(false)
  const [reunioes, setReunioes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [salvando, setSalvando]       = useState(false)
  const [modal, setModal]             = useState(null)
  const [reuniaoAlvo, setReuniaoAlvo] = useState(null)
  const [toast, setToast]             = useState(null)
  const [form, setForm] = useState({
    titulo:       tituloSugerido(),
    data_reuniao: hojeISO(),
    hora_inicio:  '14:00',
    hora_fim:     '',
    local:        'Sede — AD Vinhedo',
    descricao:    '',
  })

  function logar() {
    if (senha === ADMIN_PASSWORD) { setAutenticado(true); setErroSenha(false) }
    else setErroSenha(true)
  }

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('reunioes')
      .select('id, titulo, data_reuniao, hora_inicio, hora_fim, local, descricao, aberta, created_at, presencas (id, presente)')
      .order('data_reuniao', { ascending: false })
    setReunioes(data || [])
    setLoading(false)
  }

  useEffect(() => { if (autenticado) carregar() }, [autenticado])

  async function criarReuniao() {
    setSalvando(true)
    const { error } = await supabase.from('reunioes').insert({
      titulo:       form.titulo,
      data_reuniao: form.data_reuniao,
      hora_inicio:  form.hora_inicio || null,
      hora_fim:     form.hora_fim    || null,
      local:        form.local       || null,
      descricao:    form.descricao   || null,
      aberta:       true,
    })
    setSalvando(false)
    if (!error) {
      setModal(null)
      setForm({ ...form, titulo: tituloSugerido(), data_reuniao: hojeISO(), descricao: '' })
      mostrarToast('Reunião criada com sucesso!', 'sucesso')
      carregar()
    } else {
      mostrarToast('Erro ao criar reunião.', 'erro')
    }
  }

  async function encerrarReuniao(id) {
    setSalvando(true)
    const { error } = await supabase.from('reunioes').update({ aberta: false }).eq('id', id)
    setSalvando(false)
    if (!error) { setModal(null); mostrarToast('Reunião encerrada.', 'info'); carregar() }
    else mostrarToast('Erro ao encerrar reunião.', 'erro')
  }

  async function reabrirReuniao(id) {
    const { error } = await supabase.from('reunioes').update({ aberta: true }).eq('id', id)
    if (!error) { mostrarToast('Reunião reaberta!', 'sucesso'); carregar() }
  }

  async function excluirReuniao(id) {
    const { error } = await supabase.from('reunioes').delete().eq('id', id)
    if (!error) { setModal(null); mostrarToast('Reunião excluída.', 'info'); carregar() }
  }

  function mostrarToast(msg, tipo) {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function stats(r) {
    const total     = r.presencas?.length || 0
    const presentes = r.presencas?.filter(p => p.presente).length || 0
    return { total, presentes, pct: total ? Math.round(presentes / total * 100) : 0 }
  }

  // ── Tela de login ────────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div style={s.loginWrap}>
        <div style={s.loginCard}>
          <div style={s.logoMark}>AD</div>
          <h1 style={s.loginTitulo}>Área administrativa</h1>
          <p style={s.loginSub}>AD Vinhedo — Gestão de reuniões</p>
          <input
            style={{ ...s.input, ...(erroSenha ? s.inputErro : {}) }}
            type="password"
            placeholder="Senha de acesso"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroSenha(false) }}
            onKeyDown={e => e.key === 'Enter' && logar()}
            autoFocus
          />
          {erroSenha && <p style={s.erroMsg}>Senha incorreta</p>}
          <button style={s.btnPrimario} onClick={logar}>Entrar</button>
        </div>
      </div>
    )
  }

  // ── Tela principal ───────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {toast && (
        <div style={{
          ...s.toast,
          background: toast.tipo === 'sucesso' ? '#065F46' : toast.tipo === 'erro' ? '#991B1B' : '#1E3A5F',
        }}>
          {toast.tipo === 'sucesso' ? '✓ ' : toast.tipo === 'erro' ? '✗ ' : 'ℹ '}{toast.msg}
        </div>
      )}

      <div style={s.header}>
        <div>
          <div style={s.headerTitulo}>Reuniões</div>
          <div style={s.headerSub}>Administração — AD Vinhedo</div>
        </div>
        <button style={s.btnNovaReuniao} onClick={() => setModal('nova')}>+ Nova reunião</button>
      </div>

      <div style={s.body}>
        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.spinner} />
            <p style={s.loadingTxt}>Carregando...</p>
          </div>
        ) : reunioes.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, color: '#6B7280' }}>Nenhuma reunião cadastrada ainda.</p>
            <button style={{ ...s.btnPrimario, marginTop: 16 }} onClick={() => setModal('nova')}>
              Criar primeira reunião
            </button>
          </div>
        ) : (
          reunioes.map(r => {
            const { presentes, total, pct } = stats(r)
            return (
              <div key={r.id} style={{ ...s.card, ...(r.aberta ? s.cardAberta : {}) }}>
                <div style={s.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardTitulo}>{r.titulo}</div>
                    <div style={s.cardData}>{formatarData(r.data_reuniao)}</div>
                    {r.local && <div style={s.cardLocal}>{r.local}</div>}
                  </div>
                  <span style={{ ...s.badge, ...(r.aberta ? s.badgeAberta : s.badgeEncerrada) }}>
                    {r.aberta ? 'Aberta' : 'Encerrada'}
                  </span>
                </div>

                {total > 0 ? (
                  <div style={s.presencaWrap}>
                    <div style={s.presencaBar}>
                      <div style={{ ...s.presencaFill, width: `${pct}%` }} />
                    </div>
                    <span style={s.presencaTxt}>{presentes}/{total} presentes ({pct}%)</span>
                  </div>
                ) : (
                  <p style={s.semCheckins}>Nenhum check-in registrado ainda</p>
                )}

                <div style={s.acoes}>
                  <button style={s.btnAcao} onClick={() => { setReuniaoAlvo(r); setModal('detalhes') }}>
                    Ver detalhes
                  </button>
                  {r.aberta ? (
                    <button style={{ ...s.btnAcao, ...s.btnEncerrar }}
                      onClick={() => { setReuniaoAlvo(r); setModal('encerrar') }}>
                      Encerrar
                    </button>
                  ) : (
                    <button style={{ ...s.btnAcao, ...s.btnReabrir }} onClick={() => reabrirReuniao(r.id)}>
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Nova reunião */}
      {modal === 'nova' && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Nova reunião</h2>
              <button style={s.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={s.campo}>
              <label style={s.label}>Título</label>
              <input style={s.input} value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Reunião de Obreiros — Julho/2025" />
            </div>
            <div style={s.campoRow}>
              <div style={{ ...s.campo, flex: 1 }}>
                <label style={s.label}>Data</label>
                <input style={s.input} type="date" value={form.data_reuniao}
                  onChange={e => setForm({ ...form, data_reuniao: e.target.value })} />
              </div>
              <div style={{ ...s.campo, flex: 1 }}>
                <label style={s.label}>Hora início</label>
                <input style={s.input} type="time" value={form.hora_inicio}
                  onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
              </div>
            </div>
            <div style={s.campo}>
              <label style={s.label}>Local</label>
              <input style={s.input} value={form.local}
                onChange={e => setForm({ ...form, local: e.target.value })} />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Observação <span style={s.opcional}>(opcional)</span></label>
              <textarea style={{ ...s.input, height: 72, resize: 'vertical' }}
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                placeholder="Tema, pauta, avisos..." />
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, opacity: salvando ? 0.6 : 1 }}
                onClick={criarReuniao} disabled={salvando || !form.titulo || !form.data_reuniao}>
                {salvando ? 'Criando...' : 'Criar reunião'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Encerrar */}
      {modal === 'encerrar' && reuniaoAlvo && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ ...s.modalCard, maxWidth: 380 }}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>Encerrar reunião</h2>
              <button style={s.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>
            <p style={s.modalTexto}>Ao encerrar, o check-in será bloqueado. Você pode reabrir depois se precisar.</p>
            <p style={{ ...s.modalTexto, fontWeight: 600, color: '#111827' }}>{reuniaoAlvo.titulo}</p>
            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btnPrimario, background: '#DC2626', opacity: salvando ? 0.6 : 1 }}
                onClick={() => encerrarReuniao(reuniaoAlvo.id)} disabled={salvando}>
                {salvando ? 'Encerrando...' : 'Encerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes */}
      {modal === 'detalhes' && reuniaoAlvo && (() => {
        const { presentes, total, pct } = stats(reuniaoAlvo)
        return (
          <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div style={{ ...s.modalCard, maxWidth: 420 }}>
              <div style={s.modalHeader}>
                <h2 style={s.modalTitulo}>Detalhes da reunião</h2>
                <button style={s.btnFechar} onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={s.detalheGrid}>
                <div style={s.detalheItem}>
                  <span style={s.detalheLabel}>Data</span>
                  <span style={s.detalheValor}>{formatarData(reuniaoAlvo.data_reuniao)}</span>
                </div>
                {reuniaoAlvo.hora_inicio && (
                  <div style={s.detalheItem}>
                    <span style={s.detalheLabel}>Horário</span>
                    <span style={s.detalheValor}>
                      {reuniaoAlvo.hora_inicio}{reuniaoAlvo.hora_fim && ` — ${reuniaoAlvo.hora_fim}`}
                    </span>
                  </div>
                )}
                {reuniaoAlvo.local && (
                  <div style={s.detalheItem}>
                    <span style={s.detalheLabel}>Local</span>
                    <span style={s.detalheValor}>{reuniaoAlvo.local}</span>
                  </div>
                )}
                <div style={s.detalheItem}>
                  <span style={s.detalheLabel}>Status</span>
                  <span style={{ ...s.badge, ...(reuniaoAlvo.aberta ? s.badgeAberta : s.badgeEncerrada) }}>
                    {reuniaoAlvo.aberta ? 'Aberta' : 'Encerrada'}
                  </span>
                </div>
              </div>
              <div style={s.resumoBox}>
                <div style={s.resumoNum}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{presentes}</span>
                  <span style={{ fontSize: 16, color: '#6B7280' }}>/{total} presentes</span>
                </div>
                {total > 0 && (
                  <>
                    <div style={s.presencaBar}>
                      <div style={{ ...s.presencaFill, width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      <span>{pct}% de presença</span>
                      <span>{total - presentes} ausentes</span>
                    </div>
                  </>
                )}
                {total === 0 && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9CA3AF' }}>Nenhum check-in registrado</p>}
              </div>
              {reuniaoAlvo.descricao && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
                  {reuniaoAlvo.descricao}
                </p>
              )}
              <div style={s.modalFooter}>
                <button style={{ ...s.btnSecundario, color: '#DC2626', borderColor: '#FECACA' }}
                  onClick={() => {
                    if (confirm('Excluir esta reunião e todos os check-ins? Esta ação não pode ser desfeita.'))
                      excluirReuniao(reuniaoAlvo.id)
                  }}>
                  Excluir
                </button>
                <button style={s.btnPrimario} onClick={() => setModal(null)}>Fechar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const s = {
  container:     { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist', 'Inter', sans-serif", maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  loginWrap:     { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 24 },
  loginCard:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoMark:      { width: 52, height: 52, borderRadius: 14, background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 1, marginBottom: 20 },
  loginTitulo:   { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px', textAlign: 'center' },
  loginSub:      { fontSize: 13, color: '#6B7280', margin: '0 0 28px', textAlign: 'center' },
  erroMsg:       { fontSize: 12, color: '#DC2626', margin: '-8px 0 12px', alignSelf: 'flex-start' },
  header:        { background: '#111827', color: '#fff', padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerTitulo:  { fontSize: 17, fontWeight: 600 },
  headerSub:     { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  btnNovaReuniao:{ background: '#fff', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnPrimario:   { background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' },
  btnSecundario: { background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 22px', fontSize: 14, cursor: 'pointer' },
  btnAcao:       { background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  btnEncerrar:   { background: '#FEE2E2', color: '#991B1B' },
  btnReabrir:    { background: '#D1FAE5', color: '#065F46' },
  btnFechar:     { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  body:          { padding: '16px 16px 0' },
  card:          { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px', marginBottom: 12 },
  cardAberta:    { borderColor: '#86EFAC', background: '#F0FDF4' },
  cardTop:       { display: 'flex', gap: 12, marginBottom: 12 },
  cardTitulo:    { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 },
  cardData:      { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  cardLocal:     { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badge:         { display: 'inline-block', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500 },
  badgeAberta:   { background: '#D1FAE5', color: '#065F46' },
  badgeEncerrada:{ background: '#F3F4F6', color: '#6B7280' },
  presencaWrap:  { marginBottom: 12 },
  presencaBar:   { height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  presencaFill:  { height: '100%', background: '#34D399', borderRadius: 99, transition: 'width 0.5s ease' },
  presencaTxt:   { fontSize: 12, color: '#6B7280' },
  semCheckins:   { fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' },
  acoes:         { display: 'flex', gap: 8 },
  loadingWrap:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
  spinner:       { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingTxt:    { color: '#9CA3AF', fontSize: 14, marginTop: 10 },
  emptyBox:      { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '32px', textAlign: 'center' },
  toast:         { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 },
  modalCard:     { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 560, maxHeight: '92dvh', overflowY: 'auto' },
  modalHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:   { fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 },
  modalTexto:    { fontSize: 14, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.6 },
  modalFooter:   { display: 'flex', gap: 10, marginTop: 20 },
  campo:         { marginBottom: 14 },
  campoRow:      { display: 'flex', gap: 12, marginBottom: 14 },
  label:         { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  opcional:      { fontWeight: 400, color: '#9CA3AF' },
  input:         { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  inputErro:     { borderColor: '#F87171', background: '#FFF5F5' },
  detalheGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  detalheItem:   { display: 'flex', flexDirection: 'column', gap: 3 },
  detalheLabel:  { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  detalheValor:  { fontSize: 14, color: '#111827', fontWeight: 500, textTransform: 'capitalize' },
  resumoBox:     { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px', marginBottom: 16 },
  resumoNum:     { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 },
}
