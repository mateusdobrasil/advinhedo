'use client'

import { useState } from 'react'
import { lancarDiario } from '../actions/diario'

export default function CriadorDiario({ alunos, turmas, materias }: { alunos: any[], turmas: any[], materias: any[] }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm">
        + Lançar Nota/Falta
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Diário de Classe</h3>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}

        <form action={async (formData) => {
          setCarregando(true)
          setErro('')
          try {
            await lancarDiario(formData)
            setAberto(false)
          } catch (e: any) {
            setErro(e.message)
          } finally {
            setCarregando(false)
          }
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluno *</label>
            <select name="aluno_id" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome_completo}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
              <select name="turma_id" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="">Turma...</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matéria *</label>
              <select name="materia_id" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="">Disciplina...</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nota Final</label>
              <input type="number" step="0.1" max="100" name="nota" placeholder="Ex: 8.5" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Total de Faltas</label>
              <input type="number" name="faltas" placeholder="Ex: 2" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-red-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Professor</label>
            <textarea name="observacao" rows={2} placeholder="Comportamento, participação, etc..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 transition">
              {carregando ? 'Salvando...' : 'Salvar Diário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}