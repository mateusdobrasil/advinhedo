'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginEBD() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

      if (error) {
        setErro('E-mail ou senha incorretos. Tente novamente.')
      } else {
        router.push('/aplicacao/ebd') // Redireciona para o Hub de Níveis de Acesso
        router.refresh()
      }
    } catch (err) {
      setErro('Ocorreu um erro inesperado.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      
      {/* Botão de Voltar ao Início */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 text-sm font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-2"
      >
        <span>←</span> Voltar ao site
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Cabeçalho do Login EBD */}
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
            📖
          </div>
          <h1 className="text-2xl font-black tracking-tight">Portal EBD</h1>
          <p className="text-indigo-200 text-sm mt-1 font-medium">Escola Bíblica Dominical</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100 text-center">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full border border-slate-200 p-3.5 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-slate-200 p-3.5 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md flex justify-center items-center gap-2"
            >
              {carregando ? 'Acessando...' : 'Entrar no Portal'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            Ainda não tem acesso?{' '}
            <Link href="/aplicacao/cadastro" className="text-indigo-600 font-bold hover:underline">
              Crie sua conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}