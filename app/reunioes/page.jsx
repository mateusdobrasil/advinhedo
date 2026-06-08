'use client'

/**
 * /reunioes/page.jsx
 * Tela de login — redireciona para /reunioes/admin após autenticação
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'advinhedo2025'

export default function LoginReunioes() {
  const router = useRouter()
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState(false)
  const [carregando, setCarregando] = useState(true)

  // Se já autenticado, redireciona direto
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const autenticado = sessionStorage.getItem('reunioes_auth')
      if (autenticado === 'true') router.replace('/reunioes/admin')
      else setCarregando(false)
    }
  }, [router])

  function logar() {
    if (senha === ADMIN_PASSWORD) {
      sessionStorage.setItem('reunioes_auth', 'true')
      router.push('/reunioes/admin')
    } else {
      setErro(true)
      setSenha('')
    }
  }

  if (carregando) return null

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <Image
            src="/imgs/logo.png"
            alt="AD Vinhedo"
            width={140}
            height={90}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <h1 style={s.titulo}>Área administrativa</h1>
        <p style={s.sub}>Reuniões de obreiros — AD Vinhedo</p>

        <input
          style={{ ...s.input, ...(erro ? s.inputErro : {}) }}
          type="password"
          placeholder="Senha de acesso"
          value={senha}
          onChange={e => { setSenha(e.target.value); setErro(false) }}
          onKeyDown={e => e.key === 'Enter' && logar()}
          autoFocus
        />
        {erro && <p style={s.erroMsg}>Senha incorreta</p>}

        <button style={s.btn} onClick={logar}>Entrar</button>
      </div>
    </div>
  )
}

const s = {
  wrap:     { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 24 },
  card:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoWrap: { marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titulo:   { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px', textAlign: 'center' },
  sub:      { fontSize: 13, color: '#6B7280', margin: '0 0 28px', textAlign: 'center' },
  input:    { width: '100%', padding: '11px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' },
  inputErro:{ borderColor: '#F87171', background: '#FFF5F5' },
  erroMsg:  { fontSize: 12, color: '#DC2626', alignSelf: 'flex-start', margin: '-4px 0 8px' },
  btn:      { width: '100%', padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
}