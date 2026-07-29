'use client'

import { useState } from 'react'
import { criarNivelAcesso } from '../actions/niveis-acesso'

export default function ModalNivelAcesso() {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    setErro('')
    try {
      await criarNivelAcesso(formData)
      setAberto(false)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition"
      >
        + Novo Nível de Acesso
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold">Novo Nível de Acesso</h2>
        </div>

        <form action={handleAcao} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{erro}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Nível</label>
            <input
              name="nome"
              required
              placeholder="Ex: Coordenador, Secretário..."
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={() => setAberto(false)} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="flex-1 bg-indigo-600 p-3 rounded-xl font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
              {carregando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
