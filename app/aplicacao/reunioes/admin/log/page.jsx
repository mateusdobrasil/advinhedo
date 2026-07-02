'use client'

/**
 * /reunioes/admin/log/page.jsx
 * Log de acessos e ações do módulo Reuniões (quem, quando, o quê).
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ACOES = {
  login:    { label: 'Acesso',    cor: '#1E40AF', bg: '#DBEAFE' },
  criar:    { label: 'Criação',   cor: '#065F46', bg: '#D1FAE5' },
  editar:   { label: 'Edição',    cor: '#92400E', bg: '#FEF3C7' },
  inativar: { label: 'Inativação',cor: '#991B1B', bg: '#FEE2E2' },
  reativar: { label: 'Reativação',cor: '#065F46', bg: '#D1FAE5' },
}

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function LogReunioesPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroAcao, setFiltroAcao] = useState('todas')
  const [busca, setBusca]           = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('obreiro_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const logsFiltrados = useMemo(() => {
    return logs.filter(l => {
      if (filtroAcao !== 'todas' && l.acao !== filtroAcao) return false
      if (busca && !l.usuario_nome?.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [logs, filtroAcao, busca])

  return (
    <div style={s.container}>

      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin')}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitulo}>Log do sistema</div>
          <div style={s.headerSub}>Acessos e alterações em Reuniões</div>
        </div>
      </div>

      <div style={s.body}>

        <div style={s.filtros}>
          <select style={s.select} value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)}>
            <option value="todas">Todas as ações</option>
            {Object.entries(ACOES).map(([chave, { label }]) => (
              <option key={chave} value={chave}>{label}</option>
            ))}
          </select>
          <input
            style={s.input}
            placeholder="Buscar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={s.loadingWrap}><div style={s.spinner} /></div>
        ) : logsFiltrados.length === 0 ? (
          <div style={s.emptyBox}>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Nenhum registro encontrado.</p>
          </div>
        ) : (
          logsFiltrados.map(log => {
            const acaoInfo = ACOES[log.acao] || { label: log.acao, cor: '#374151', bg: '#F3F4F6' }
            return (
              <div key={log.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.cardUsuario}>{log.usuario_nome}</div>
                    <div style={s.cardData}>{formatarData(log.created_at)}</div>
                  </div>
                  <span style={{ ...s.badge, background: acaoInfo.bg, color: acaoInfo.cor }}>{acaoInfo.label}</span>
                </div>
                {log.detalhes && <p style={s.cardDetalhes}>{log.detalhes}</p>}
                {log.tabela_afetada && <div style={s.cardTabela}>{log.tabela_afetada}</div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const s = {
  container:    { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  header:       { background: '#111827', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:    { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo: { fontSize: 15, fontWeight: 600 },
  headerSub:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  body:         { padding: '16px' },
  filtros:      { display: 'flex', gap: 8, marginBottom: 16 },
  select:       { padding: '9px 10px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', fontFamily: 'inherit' },
  input:        { flex: 1, padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  loadingWrap:  { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  spinner:      { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px', textAlign: 'center' },
  card:         { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px', marginBottom: 10 },
  cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardUsuario:  { fontSize: 14, fontWeight: 600, color: '#111827' },
  cardData:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badge:        { display: 'inline-block', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' },
  cardDetalhes: { fontSize: 13, color: '#374151', margin: '10px 0 0' },
  cardTabela:   { fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 6 },
}
