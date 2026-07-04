'use client'

/**
 * /reunioes/admin/page.jsx
 * Hub operacional — foco no check-in. A gestão administrativa
 * (relatórios, cadastros, log, reuniões) migrou para /secretaria,
 * protegida por senha.
 */

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { logoutReuniao } from '@/app/aplicacao/actions/reunioes-auth'

export default function AdminPage() {
  const router = useRouter()

  async function sair() {
    await logoutReuniao()
    router.push('/aplicacao/reunioes')
  }

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <Image src="/imgs/logo_branco.png" alt="AD Vinhedo" width={80} height={36} style={{ objectFit: 'contain' }} priority />
        <button style={s.btnSair} onClick={sair}>Sair</button>
      </div>

      <div style={s.body}>

        <div style={s.hero}>
          <div style={s.heroTitulo}>Reunião de Obreiros</div>
          <div style={s.heroSub}>AD Vinhedo</div>
        </div>

        {/* Ação principal: Check-in */}
        <button style={s.checkinBtn} onClick={() => router.push('/aplicacao/reunioes/admin/checkin')}>
          <div style={s.checkinIcone}>✓</div>
          <div style={s.checkinTexto}>
            <div style={s.checkinTitulo}>Check-in</div>
            <div style={s.checkinSub}>Registrar presenças na reunião</div>
          </div>
          <span style={s.checkinSeta}>›</span>
        </button>

        {/* Acesso à Secretaria (área restrita) */}
        <button style={s.secretariaBtn} onClick={() => router.push('/aplicacao/reunioes/admin/secretaria')}>
          <div style={s.secretariaIcone}>🔒</div>
          <div style={s.checkinTexto}>
            <div style={s.secretariaTitulo}>Secretaria</div>
            <div style={s.secretariaSub}>Relatórios, cadastros e gestão — acesso restrito</div>
          </div>
          <span style={s.secretariaSeta}>›</span>
        </button>

      </div>
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 560, margin: '0 auto' },
  header:         { background: '#111827', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  btnSair:        { background: 'none', border: '1px solid #374151', color: '#9CA3AF', borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer' },
  body:           { padding: '24px 16px' },
  hero:           { textAlign: 'center', margin: '20px 0 32px' },
  heroTitulo:     { fontSize: 24, fontWeight: 700, color: '#111827' },
  heroSub:        { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  checkinBtn:     { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '20px', background: '#fff', border: '1px solid #86EFAC', borderRadius: 16, cursor: 'pointer', textAlign: 'left', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  checkinIcone:   { width: 52, height: 52, borderRadius: 14, background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0 },
  checkinTexto:   { flex: 1, minWidth: 0 },
  checkinTitulo:  { fontSize: 17, fontWeight: 700, color: '#111827' },
  checkinSub:     { fontSize: 13, color: '#6B7280', marginTop: 2 },
  checkinSeta:    { fontSize: 24, color: '#D1D5DB', flexShrink: 0 },
  secretariaBtn:  { display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, cursor: 'pointer', textAlign: 'left' },
  secretariaIcone:{ width: 52, height: 52, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  secretariaTitulo:{ fontSize: 17, fontWeight: 700, color: '#111827' },
  secretariaSub:  { fontSize: 13, color: '#6B7280', marginTop: 2 },
  secretariaSeta: { fontSize: 24, color: '#D1D5DB', flexShrink: 0 },
}