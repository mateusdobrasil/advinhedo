'use client'

/**
 * /reunioes/admin/page.jsx
 * Hub admin — reuniões abertas, nova reunião, navegação
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { logoutReuniao } from '@/app/actions/reunioes-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

function stats(r) {
  const total     = r.presencas?.length || 0
  const presentes = r.presencas?.filter(p => p.presente).length || 0
  return { total, presentes, pct: total ? Math.round(presentes / total * 100) : 0 }
}

export default function AdminPage() {
  const router = useRouter()

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

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('reunioes')
      .select('id, titulo, data_reuniao, hora_inicio, local, aberta, presencas(id, presente)')
      .order('data_reuniao', { ascending: false })
    setReunioes(data || [])
    setLoading(false)
  }

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
      mostrarToast('Reunião criada!', 'sucesso')
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
    else mostrarToast('Erro ao encerrar.', 'erro')
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

  async function sair() {
    await logoutReuniao()
    router.push('/reunioes')
  }

  const reunioesAbertas    = reunioes.filter(r => r.aberta)
  const reunioesEncerradas = reunioes.filter(r => !r.aberta)

  return (
    <div style={s.container}>

      {toast && (
        <div style={{ ...s.toast, background: toast.tipo === 'sucesso' ? '#065F46' : toast.tipo === 'erro' ? '#991B1B' : '#1E3A5F' }}>
          {toast.tipo === 'sucesso' ? '✓ ' : toast.tipo === 'erro' ? '✗ ' : 'ℹ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <Image src="/imgs/logo_branco.png" alt="AD Vinhedo" width={80} height={36} style={{ objectFit: 'contain' }} priority />
        <div style={s.headerAcoes}>
          <button style={s.btnNova} onClick={() => setModal('nova')}>+ Nova</button>
          <button style={s.btnSair} onClick={sair}>Sair</button>
        </div>
      </div>

      <div style={s.body}>

        {/* Botões de navegação — 3 botões em grid 2+1 */}
        <div style={s.navBtns}>
          <button style={s.navBtn} onClick={() => router.push('/reunioes/admin/checkin')}>
            <div style={{ ...s.navIcone, background: '#D1FAE5', color: '#065F46' }}>✓</div>
            <div>
              <div style={s.navTitulo}>Check-in</div>
              <div style={s.navSub}>Registrar presenças</div>
            </div>
            <span style={s.navSeta}>›</span>
          </button>

          <button style={{ ...s.navBtn, borderColor: '#BFDBFE', background: '#EFF6FF' }} onClick={() => router.push('/reunioes/admin/dashboard')}>
            <div style={{ ...s.navIcone, background: '#DBEAFE', color: '#1E40AF' }}>◎</div>
            <div>
              <div style={s.navTitulo}>Dashboard</div>
              <div style={s.navSub}>Análises e gráficos</div>
            </div>
            <span style={s.navSeta}>›</span>
          </button>

          <button style={{ ...s.navBtn, ...s.navBtnFull, borderColor: '#EDE9FE', background: '#F5F3FF' }} onClick={() => router.push('/reunioes/admin/obreiros')}>
            <div style={{ ...s.navIcone, background: '#EDE9FE', color: '#7C3AED' }}>◉</div>
            <div>
              <div style={s.navTitulo}>Obreiros</div>
              <div style={s.navSub}>Cadastros e fotos</div>
            </div>
            <span style={s.navSeta}>›</span>
          </button>
        </div>

        {/* Reuniões abertas */}
        <div style={s.secaoTitulo}>Reuniões abertas</div>
        {loading ? (
          <div style={s.loadingWrap}><div style={s.spinner} /></div>
        ) : reunioesAbertas.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Nenhuma reunião aberta.</p>
            <button style={{ ...s.btnAcao, marginTop: 10, background: '#111827', color: '#fff' }} onClick={() => setModal('nova')}>
              Criar reunião
            </button>
          </div>
        ) : (
          reunioesAbertas.map(r => {
            const { presentes, total, pct } = stats(r)
            return (
              <div key={r.id} style={{ ...s.card, borderColor: '#86EFAC', background: '#F0FDF4' }}>
                <div style={s.cardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardTitulo}>{r.titulo}</div>
                    <div style={s.cardData}>{formatarData(r.data_reuniao)}{r.hora_inicio ? ` · ${r.hora_inicio}` : ''}</div>
                    {r.local && <div style={s.cardLocal}>{r.local}</div>}
                  </div>
                  <span style={{ ...s.badge, background: '#D1FAE5', color: '#065F46' }}>Aberta</span>
                </div>
                {total > 0 ? (
                  <div style={s.presencaWrap}>
                    <div style={s.presencaBar}><div style={{ ...s.presencaFill, width: `${pct}%` }} /></div>
                    <span style={s.presencaTxt}>{presentes}/{total} presentes ({pct}%)</span>
                  </div>
                ) : (
                  <p style={s.semCheckins}>Nenhum check-in ainda</p>
                )}
                <div style={s.acoes}>
                  <button style={s.btnAcao} onClick={() => router.push('/reunioes/admin/checkin')}>Ir para check-in</button>
                  <button style={{ ...s.btnAcao, background: '#FEE2E2', color: '#991B1B' }}
                    onClick={() => { setReuniaoAlvo(r); setModal('encerrar') }}>Encerrar</button>
                </div>
              </div>
            )
          })
        )}

        {/* Histórico */}
        {reunioesEncerradas.length > 0 && (
          <>
            <div style={{ ...s.secaoTitulo, marginTop: 20 }}>Histórico</div>
            {reunioesEncerradas.map(r => {
              const { presentes, total, pct } = stats(r)
              return (
                <div key={r.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.cardTitulo}>{r.titulo}</div>
                      <div style={s.cardData}>{formatarData(r.data_reuniao)}</div>
                    </div>
                    <span style={{ ...s.badge, background: '#F3F4F6', color: '#6B7280' }}>Encerrada</span>
                  </div>
                  {total > 0 && (
                    <div style={s.presencaWrap}>
                      <div style={s.presencaBar}><div style={{ ...s.presencaFill, width: `${pct}%`, background: '#9CA3AF' }} /></div>
                      <span style={s.presencaTxt}>{presentes}/{total} presentes ({pct}%)</span>
                    </div>
                  )}
                  <div style={s.acoes}>
                    <button style={s.btnAcao} onClick={() => reabrirReuniao(r.id)}>Reabrir</button>
                    <button style={{ ...s.btnAcao, color: '#DC2626' }}
                      onClick={() => { if (confirm('Excluir esta reunião e todos os check-ins?')) excluirReuniao(r.id) }}>
                      Excluir
                    </button>
                  </div>
                </div>
              )
            })}
          </>
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
              <input style={s.input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div style={s.campoRow}>
              <div style={{ ...s.campo, flex: 1 }}>
                <label style={s.label}>Data</label>
                <input style={s.input} type="date" value={form.data_reuniao} onChange={e => setForm({ ...form, data_reuniao: e.target.value })} />
              </div>
              <div style={{ ...s.campo, flex: 1 }}>
                <label style={s.label}>Hora início</label>
                <input style={s.input} type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
              </div>
            </div>
            <div style={s.campo}>
              <label style={s.label}>Local</label>
              <input style={s.input} value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Observação <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
              <textarea style={{ ...s.input, height: 72, resize: 'vertical' }} value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Tema, pauta, avisos..." />
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
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.6 }}>
              O check-in será bloqueado. Você pode reabrir depois se precisar.
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>{reuniaoAlvo.titulo}</p>
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
    </div>
  )
}

const s = {
  container:    { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  toast:        { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  header:       { background: '#111827', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerAcoes:  { display: 'flex', gap: 8, alignItems: 'center' },
  btnNova:      { background: '#fff', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSair:      { background: 'none', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer' },
  body:         { padding: '16px' },
  navBtns:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  navBtn:       { display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, cursor: 'pointer', textAlign: 'left' },
  navBtnFull:   { gridColumn: '1 / -1' },  // ocupa as 2 colunas
  navIcone:     { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  navTitulo:    { fontSize: 13, fontWeight: 600, color: '#111827' },
  navSub:       { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  navSeta:      { marginLeft: 'auto', fontSize: 20, color: '#D1D5DB', flexShrink: 0 },
  secaoTitulo:  { fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card:         { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px', marginBottom: 10 },
  cardTop:      { display: 'flex', gap: 10, marginBottom: 10 },
  cardTitulo:   { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 },
  cardData:     { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  cardLocal:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badge:        { display: 'inline-block', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500, flexShrink: 0 },
  presencaWrap: { marginBottom: 10 },
  presencaBar:  { height: 5, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  presencaFill: { height: '100%', background: '#34D399', borderRadius: 99 },
  presencaTxt:  { fontSize: 11, color: '#6B7280' },
  semCheckins:  { fontSize: 11, color: '#9CA3AF', margin: '0 0 10px' },
  acoes:        { display: 'flex', gap: 8 },
  btnAcao:      { background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  loadingWrap:  { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  spinner:      { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px', textAlign: 'center', marginBottom: 10 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 },
  modalCard:    { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 560, maxHeight: '92dvh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:  { fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 },
  btnFechar:    { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
  modalFooter:  { display: 'flex', gap: 10, marginTop: 20 },
  campo:        { marginBottom: 14 },
  campoRow:     { display: 'flex', gap: 12, marginBottom: 14 },
  label:        { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input:        { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnPrimario:  { background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 500, cursor: 'pointer', flex: 1 },
  btnSecundario:{ background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 22px', fontSize: 14, cursor: 'pointer' },
}