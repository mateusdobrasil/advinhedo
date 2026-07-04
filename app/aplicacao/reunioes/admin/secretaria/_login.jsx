'use client'

/**
 * app/aplicacao/reunioes/admin/secretaria/_login.jsx
 * Tela de senha da Secretaria (exibida pelo layout quando não há sessão).
 * Ao autenticar, recarrega a rota — o layout de servidor então libera o conteúdo.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { entrarSecretaria } from '@/app/aplicacao/actions/secretaria-auth'

export default function SecretariaLogin() {
  const router = useRouter()
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar() {
    if (entrando || !senha) return
    setEntrando(true)
    setErro('')

    const res = await entrarSecretaria(senha)

    if (res.ok) {
      // Recarrega a rota atual: o layout de servidor revalida o cookie
      // e passa a renderizar o conteúdo protegido
      router.refresh()
    } else {
      setErro(res.error || 'Senha incorreta.')
      setSenha('')
      setEntrando(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.icone}>🔒</div>
        <h1 style={s.titulo}>Secretaria</h1>
        <p style={s.sub}>Área restrita — informe a senha de acesso</p>

        <input
          style={{ ...s.input, ...(erro ? s.inputErro : {}) }}
          type="password"
          value={senha}
          onChange={e => { setSenha(e.target.value); setErro('') }}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          placeholder="Senha"
          autoFocus
          autoComplete="current-password"
        />

        {erro && <p style={s.erroMsg}>{erro}</p>}

        <button
          style={{ ...s.btn, opacity: entrando || !senha ? 0.6 : 1 }}
          onClick={entrar}
          disabled={entrando || !senha}>
          {entrando ? 'Verificando...' : 'Entrar'}
        </button>

        <button style={s.btnVoltar} onClick={() => router.push('/aplicacao/reunioes/admin')}>
          ← Voltar ao check-in
        </button>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100dvh', background: '#111827', fontFamily: "'Geist','Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:      { background: '#1F2937', border: '1px solid #374151', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  icone:     { fontSize: 40, marginBottom: 12 },
  titulo:    { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  sub:       { fontSize: 13, color: '#9CA3AF', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 },
  input:     { width: '100%', padding: '13px 14px', border: '1px solid #374151', borderRadius: 12, fontSize: 15, color: '#fff', background: '#111827', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: 2 },
  inputErro: { border: '1px solid #F87171' },
  erroMsg:   { fontSize: 13, color: '#FCA5A5', margin: '10px 0 0', textAlign: 'center' },
  btn:       { width: '100%', padding: '13px', background: '#fff', color: '#111827', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 16 },
  btnVoltar: { background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', marginTop: 16, padding: 0 },
}