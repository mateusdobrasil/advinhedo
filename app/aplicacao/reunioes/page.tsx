'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginReuniao, registrarNomeReuniao } from '@/app/aplicacao/actions/reunioes-auth'
import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";

export default function LoginReunioes() {
  const router = useRouter()
  const [etapa, setEtapa]           = useState('senha') // 'senha' | 'nome'
  const [senha, setSenha]           = useState('')
  const [nome, setNome]             = useState('')
  const [erro, setErro]             = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function logar() {
    if (!senha || carregando) return
    setCarregando(true)
    setErro(false)

    const { ok } = await loginReuniao(senha)

    if (ok) {
      setEtapa('nome')
      setCarregando(false)
    } else {
      setErro(true)
      setSenha('')
      setCarregando(false)
    }
  }

  async function confirmarNome() {
    if (!nome.trim() || carregando) return
    setCarregando(true)
    setErro(false)

    const { ok } = await registrarNomeReuniao(nome)

    if (ok) {
      router.push('/aplicacao/reunioes/admin')
    } else {
      setErro(true)
      setCarregando(false)
    }
  }

  return (
    <>
    <Header  />
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

        {etapa === 'senha' ? (
          <>
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
              disabled={carregando}
            />
            {erro && <p style={s.erroMsg}>Senha incorreta</p>}

            <button
              style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }}
              onClick={logar}
              disabled={carregando}>
              {carregando ? 'Verificando...' : 'Entrar'}
            </button>
          </>
        ) : (
          <>
            <h1 style={s.titulo}>Identifique-se</h1>
            <p style={s.sub}>Seu nome fica registrado no log do sistema</p>

            <input
              style={{ ...s.input, ...(erro ? s.inputErro : {}) }}
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={e => { setNome(e.target.value); setErro(false) }}
              onKeyDown={e => e.key === 'Enter' && confirmarNome()}
              autoFocus
              disabled={carregando}
            />
            {erro && <p style={s.erroMsg}>Informe seu nome para continuar</p>}

            <button
              style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }}
              onClick={confirmarNome}
              disabled={carregando}>
              {carregando ? 'Entrando...' : 'Continuar'}
            </button>
          </>
        )}
      </div>
    </div>
    <Footer />
  </>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap:     { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 24 },
  card:     { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logoWrap: { marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titulo:   { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px', textAlign: 'center' },
  sub:      { fontSize: 13, color: '#6B7280', margin: '0 0 28px', textAlign: 'center' },
  input:    { width: '100%', padding: '11px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' },
  inputErro:{ border: '1px solid #F87171', background: '#FFF5F5' },
  erroMsg:  { fontSize: 12, color: '#DC2626', alignSelf: 'flex-start', margin: '-4px 0 8px' },
  btn:      { width: '100%', padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
}