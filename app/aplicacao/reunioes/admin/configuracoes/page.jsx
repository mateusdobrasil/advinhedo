'use client'

/**
 * /reunioes/admin/configuracoes/page.jsx
 * Gestão de congregações, cargos e funções
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import {
  listarConfiguracoes,
  criarItemConfiguracao,
  editarItemConfiguracao,
  excluirItemConfiguracao,
} from '@/app/aplicacao/actions/configuracoes'

const ABAS = [
  { key: 'congregacao', label: 'Congregações', singular: 'congregação' },
  { key: 'cargo',       label: 'Cargos',       singular: 'cargo' },
  { key: 'funcao',      label: 'Funções',      singular: 'função' },
]

export default function ConfiguracoesPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast]       = useState(null)
  const [aba, setAba]           = useState('congregacao')

  const [dados, setDados] = useState({ congregacao: [], cargo: [], funcao: [] })

  // Modal de criar/editar: { modo: 'novo'|'editar', item? }
  const [modal, setModal]       = useState(null)
  const [formNome, setFormNome]   = useState('')
  const [formNivel, setFormNivel] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const res = await listarConfiguracoes()
    if (!res.ok) {
      mostrarToast(res.error || 'Erro ao carregar.', 'erro')
    } else {
      setDados({
        congregacao: res.congregacoes,
        cargo:       res.cargos,
        funcao:      res.funcoes,
      })
    }
    setLoading(false)
  }

  function abrirNovo() {
    setFormNome('')
    setFormNivel('')
    setModal({ modo: 'novo' })
  }

  function abrirEditar(item) {
    setFormNome(item.nome)
    setFormNivel(item.nivel != null ? String(item.nivel) : '')
    setModal({ modo: 'editar', item })
  }

  async function salvarModal() {
    if (salvando || !formNome.trim()) return
    setSalvando(true)

    const payload = { nome: formNome }
    if (aba === 'cargo') payload.nivel = formNivel

    const res = modal.modo === 'novo'
      ? await criarItemConfiguracao(aba, payload)
      : await editarItemConfiguracao(aba, modal.item.id, payload)

    setSalvando(false)

    if (res.ok) {
      setModal(null)
      mostrarToast(modal.modo === 'novo' ? 'Item criado!' : 'Item atualizado!', 'sucesso')
      carregar()
    } else {
      mostrarToast(res.error || 'Erro ao salvar.', 'erro')
    }
  }

  async function excluir(item) {
    const singular = ABAS.find(a => a.key === aba)?.singular
    if (!confirm(`Excluir a ${singular} "${item.nome}"?`)) return
    const res = await excluirItemConfiguracao(aba, item.id)
    if (res.ok) {
      mostrarToast('Item excluído.', 'info')
      carregar()
    } else {
      mostrarToast(res.error || 'Erro ao excluir.', 'erro')
    }
  }

  function mostrarToast(msg, tipo) {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const lista = dados[aba] || []
  const abaAtual = ABAS.find(a => a.key === aba)

  return (
    <div style={s.container}>

      {toast && (
        <div style={{ ...s.toast, background: toast.tipo === 'sucesso' ? '#065F46' : toast.tipo === 'erro' ? '#991B1B' : '#1E3A5F' }}>
          {toast.tipo === 'sucesso' ? '✓ ' : toast.tipo === 'erro' ? '✗ ' : 'ℹ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin')}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitulo}>Configurações</div>
          <div style={s.headerSub}>Congregações, cargos e funções</div>
        </div>
        <button style={s.btnNovo} onClick={abrirNovo}>+ Novo</button>
      </div>

      <div style={s.body}>

        {/* Abas */}
        <div style={s.abas}>
          {ABAS.map(a => (
            <button key={a.key}
              style={{ ...s.abaBtn, ...(aba === a.key ? s.abaBtnAtiva : {}) }}
              onClick={() => setAba(a.key)}>
              {a.label} ({(dados[a.key] || []).length})
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={s.loadingWrap}><div style={s.spinner} /></div>
        ) : lista.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
              Nenhuma {abaAtual.singular} cadastrada.
            </p>
            <button style={{ ...s.btnAcao, marginTop: 10, background: '#111827', color: '#fff' }} onClick={abrirNovo}>
              Criar {abaAtual.singular}
            </button>
          </div>
        ) : (
          lista.map(item => (
            <div key={item.id} style={s.card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardNome}>
                  {item.nome}
                  {aba === 'cargo' && item.nivel != null && (
                    <span style={s.badgeNivel}>nível {item.nivel}</span>
                  )}
                </div>
                <div style={s.cardUso}>
                  {item.emUso > 0
                    ? `${item.emUso} obreiro${item.emUso > 1 ? 's' : ''}`
                    : 'Sem obreiros vinculados'}
                </div>
              </div>
              <div style={s.cardAcoes}>
                <button style={s.btnAcao} onClick={() => abrirEditar(item)}>Editar</button>
                <button
                  style={{
                    ...s.btnAcao,
                    color: item.emUso > 0 ? '#D1D5DB' : '#DC2626',
                    cursor: item.emUso > 0 ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => item.emUso === 0 && excluir(item)}
                  title={item.emUso > 0 ? 'Transfira os obreiros antes de excluir' : 'Excluir'}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}

        {aba === 'cargo' && !loading && lista.length > 0 && (
          <p style={s.dica}>
            O nível define a ordem de exibição nas listas de cargo (maior primeiro).
          </p>
        )}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitulo}>
                {modal.modo === 'novo' ? `Nova ${abaAtual.singular}` : `Editar ${abaAtual.singular}`}
              </h2>
              <button style={s.btnFechar} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={s.campo}>
              <label style={s.label}>Nome</label>
              <input
                style={s.input}
                value={formNome}
                onChange={e => setFormNome(e.target.value)}
                placeholder={`Nome da ${abaAtual.singular}`}
                autoFocus
              />
            </div>

            {aba === 'cargo' && (
              <div style={s.campo}>
                <label style={s.label}>
                  Nível <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(ordem de exibição — maior aparece primeiro)</span>
                </label>
                <input
                  style={s.input}
                  type="number"
                  value={formNivel}
                  onChange={e => setFormNivel(e.target.value)}
                  placeholder="Ex.: 60"
                  inputMode="numeric"
                />
              </div>
            )}

            <div style={s.modalFooter}>
              <button style={s.btnSecundario} onClick={() => setModal(null)}>Cancelar</button>
              <button
                style={{ ...s.btnPrimario, opacity: salvando || !formNome.trim() ? 0.6 : 1 }}
                onClick={salvarModal}
                disabled={salvando || !formNome.trim()}>
                {salvando ? 'Salvando...' : 'Salvar'}
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
  header:       { background: '#111827', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:    { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo: { fontSize: 15, fontWeight: 600 },
  headerSub:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  btnNovo:      { background: '#fff', color: '#111827', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  body:         { padding: '16px' },
  abas:         { display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' },
  abaBtn:       { flexShrink: 0, padding: '7px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' },
  abaBtnAtiva:  { background: '#111827', borderColor: '#111827', color: '#fff', fontWeight: 500 },
  card:         { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', marginBottom: 8 },
  cardNome:     { fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 },
  badgeNivel:   { borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 600, background: '#DBEAFE', color: '#1E40AF' },
  cardUso:      { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardAcoes:    { display: 'flex', gap: 6, flexShrink: 0 },
  btnAcao:      { background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  dica:         { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
  loadingWrap:  { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner:      { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '32px', textAlign: 'center' },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 },
  modalCard:    { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 24px 40px', width: '100%', maxWidth: 560 },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:  { fontSize: 17, fontWeight: 700, color: '#111827', margin: 0, textTransform: 'capitalize' },
  btnFechar:    { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', padding: '0 4px' },
  modalFooter:  { display: 'flex', gap: 10, marginTop: 20 },
  campo:        { marginBottom: 14 },
  label:        { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input:        { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnPrimario:  { background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 500, cursor: 'pointer', flex: 1 },
  btnSecundario:{ background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 22px', fontSize: 14, cursor: 'pointer' },
}