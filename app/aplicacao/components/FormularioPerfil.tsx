'use client'

import { useState } from 'react'
import { atualizarPerfil } from '../actions/perfil'

export default function FormularioPerfil({ nomeAtual }: { nomeAtual: string }) {
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCarregando(true)
    setMensagem({ texto: '', tipo: '' })

    const formData = new FormData(e.currentTarget)
    
    try {
      await atualizarPerfil(formData)
      setMensagem({ texto: 'Perfil atualizado com sucesso!', tipo: 'sucesso' })
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000)
    } catch (error: any) {
      setMensagem({ texto: error.message || 'Ocorreu um erro.', tipo: 'erro' })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
          <input 
            type="text" 
            name="nome" 
            defaultValue={nomeAtual}
            required 
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Alterar Senha</label>
          <p className="text-xs text-gray-500 mb-3">Deixe em branco se não quiser alterar. (Mínimo 6 caracteres)</p>
          <input 
            type="password" 
            name="senha" 
            placeholder="Nova senha..."
            minLength={6}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {mensagem.texto && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensagem.texto}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={carregando}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 w-full md:w-auto"
          >
            {carregando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  )
}