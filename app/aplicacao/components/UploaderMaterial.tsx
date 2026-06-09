'use client'

import { useState } from 'react'
import { enviarMaterial } from '../actions/materiais'

export default function UploaderMaterial() {
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
      >
        + Adicionar Material
      </button>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Novo Material Didático</h3>
      
      <form 
        onSubmit={async (e) => {
          e.preventDefault()
          setCarregando(true)
          const formData = new FormData(e.currentTarget)
          try {
            await enviarMaterial(formData)
            setAberto(false) // Fecha ao concluir
          } catch (error) {
            alert('Erro ao enviar arquivo. Tente novamente.')
          } finally {
            setCarregando(false)
          }
        }} 
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Título / Nome da Aula</label>
            <input 
              type="text" 
              name="titulo" 
              required 
              placeholder="Ex: Apostila Módulo 1"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Arquivo (PDF, Imagem, etc)</label>
            <input 
              type="file" 
              name="arquivo" 
              required 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
              className="w-full border border-gray-300 rounded-lg p-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Descrição Breve</label>
          <input 
            type="text" 
            name="descricao" 
            placeholder="Ex: Leitura obrigatória para a prova."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            onClick={() => setAberto(false)}
            disabled={carregando}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={carregando}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Enviando arquivo...' : 'Salvar e Publicar'}
          </button>
        </div>
      </form>
    </div>
  )
}