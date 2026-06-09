'use client' 

import { useState } from 'react'
import Link from 'next/link'
import { Analytics } from "@vercel/analytics/next"
import { realizarLogin } from '../../aplicacao/actions/auth'
import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";

export default function LoginPage() {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  return (
    <>
    <Header/>
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        <Analytics />
        
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <Link href="/" className="block group">
            <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg group-hover:bg-indigo-700 transition">
              🎓
            </div>
            <h1 className="text-2xl font-black text-gray-800 group-hover:text-indigo-600 transition">Instituto Bíblico</h1>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Faça login para acessar o seu portal</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 font-medium text-center">
            {erro}
          </div>
        )}

        <form 
          action={async (formData) => {
            setCarregando(true)
            setErro('')
            
            const resposta = await realizarLogin(formData)
            
            // Se houver erro de credencial ou de acesso ao polo, exibe aqui
            if (resposta?.erro) {
              setErro(resposta.erro)
              setCarregando(false)
            }
          }} 
          className="space-y-5"
        >
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Polo de Acesso</label>
            <select 
              name="polo_destino" 
              required 
              defaultValue=""
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white cursor-pointer"
            >
              <option value="" disabled>Selecione por onde deseja entrar...</option>
              <option value="IBV">IBV (Sede)</option>
              <option value="EBD">Escola Bíblica Dominical (EBD)</option>
              <option value="IBUC">IBUC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              name="email" 
              required 
              placeholder="seu@email.com" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••" 
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
            />
          </div>

          <button 
            type="submit" 
            disabled={carregando} 
            className="w-full bg-indigo-600 text-white font-bold text-lg p-3 rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {carregando ? 'Validando acesso...' : 'Entrar no Sistema'}
          </button>

        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Esqueceu a senha? Procure a secretaria do seu polo.</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}