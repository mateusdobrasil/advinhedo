'use client'

import { useState } from 'react'
import { lancarNota } from '../actions/notas'

export default function LancadorNota({ alunoId, nomeAluno }: { alunoId: string, nomeAluno: string }) {
  const [aberto, setAberto] = useState(false)

  if (!aberto) {
    return (
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setAberto(true)
        }}
        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-100 transition"
      >
        Lançar Nota
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
          Avaliação - {nomeAluno.split(' ')[0]}
        </h3>
        
        <form action={async (formData) => {
          await lancarNota(formData)
          setAberto(false) // Fecha o modal após o sucesso
        }} className="space-y-4">
          
          <input type="hidden" name="aluno_id" value={alunoId} />

          <div>
            <label className="block text-sm text-gray-600 mb-1">Disciplina</label>
            <input 
              type="text" 
              name="disciplina" 
              placeholder="Ex: Teologia Sistemática"
              required 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nota Final (0 a 10)</label>
              <input 
                type="number" 
                name="nota" 
                step="0.1"
                min="0"
                max="10"
                required 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Total de Faltas</label>
              <input 
                type="number" 
                name="faltas" 
                min="0"
                defaultValue="0"
                required 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Semestre/Período</label>
            <input 
              type="text" 
              name="semestre" 
              defaultValue="1º Semestre 2026"
              required 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setAberto(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Salvar Boletim
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}