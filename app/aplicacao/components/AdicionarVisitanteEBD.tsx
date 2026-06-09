'use client'

import { useState } from 'react'
import { cadastrarVisitanteEBD } from '../actions/visitantes'

interface AdicionarVisitanteProps {
  turmaId: string
}

export default function AdicionarVisitanteEBD({ turmaId }: AdicionarVisitanteProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)} 
        className="bg-orange-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 transition shadow-sm flex items-center gap-2"
      >
        <span>👋</span> Novo Visitante
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-left">
        <h3 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2 flex items-center gap-2">
          👋 Receber Visitante
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Registo rápido para a equipa de integração entrar em contacto mais tarde.
        </p>
        
        {erro && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {erro}
          </div>
        )}

        <form 
          action={async (formData) => {
            setCarregando(true)
            setErro('')
            try {
              await cadastrarVisitanteEBD(formData)
              setAberto(false)
            } catch (e: any) {
              setErro(e.message)
            } finally {
              setCarregando(false)
            }
          }} 
          className="space-y-4"
        >
          {/* Campo Oculto para enviar o ID da Turma automaticamente */}
          <input type="hidden" name="turma_id" value={turmaId} />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              name="nome_completo" 
              placeholder="Ex: João Silva" 
              required 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-gray-900" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp / Telemóvel</label>
            <input 
              type="text" 
              name="telefone" 
              placeholder="(11) 99999-9999" 
              required 
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-gray-900" 
            />
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setAberto(false)} 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={carregando} 
              className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {carregando ? 'A registar...' : 'Guardar Visitante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}