'use client'

import { useState } from 'react'
import { lancarDiario } from '../actions/diario'

interface CriadorDiarioProps {
  alunos: any[]
  turmas: any[] // precisa incluir o campo "curso" (texto) de cada turma
  materias: any[] // precisa incluir o campo "curso_id" de cada matéria
  cursos: any[] // {id, nome} — usado para casar turma.curso (texto) com materia.curso_id
  modulo: 'ebd' | 'ibv' | 'ibuc'
  registro?: any // se vier preenchido, o componente entra em modo Edição
}

export default function CriadorDiario({ alunos, turmas, materias, cursos, modulo, registro }: CriadorDiarioProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [turmaId, setTurmaId] = useState(registro?.turma_id || '')

  const isEdicao = !!registro

  // Resolve o curso da turma selecionada (turma.curso é texto, casa com cursos.nome)
  // para filtrar as matérias que pertencem a esse curso.
  const turmaSelecionada = turmas.find(t => t.id === turmaId)
  const cursoIdDaTurma = turmaSelecionada
    ? cursos.find(c => c.nome === turmaSelecionada.curso)?.id
    : undefined
  const materiasFiltradas = cursoIdDaTurma
    ? materias.filter(m => m.curso_id === cursoIdDaTurma)
    : materias

  if (!aberto) {
    return isEdicao ? (
      <button onClick={() => setAberto(true)} className="text-gray-500 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 p-2 rounded-full transition" title="Editar lançamento">
        ✏️
      </button>
    ) : (
      <button onClick={() => setAberto(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm">
        + Lançar Nota/Falta
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{isEdicao ? 'Editar Lançamento' : 'Diário de Classe'}</h3>

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
          <input type="hidden" name="modulo" value={modulo} />
          {isEdicao && <input type="hidden" name="id" value={registro.id} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluno *</label>
            <select name="aluno_id" required defaultValue={registro?.aluno_id || ''} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome_completo}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
              <select
                name="turma_id"
                required
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Turma...</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matéria *</label>
              <select name="materia_id" required defaultValue={registro?.materia_id || ''} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="">Disciplina...</option>
                {materiasFiltradas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              {turmaSelecionada && cursoIdDaTurma && materiasFiltradas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Nenhuma matéria cadastrada para o curso desta turma.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nota Final</label>
              <input type="number" step="0.1" min="0" max="10" name="nota" defaultValue={registro?.nota ?? ''} placeholder="Ex: 8.5" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Total de Faltas</label>
              <input type="number" name="faltas" defaultValue={registro?.faltas ?? ''} placeholder="Ex: 2" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-red-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações do Professor</label>
            <textarea name="observacao" rows={2} defaultValue={registro?.observacao || ''} placeholder="Comportamento, participação, etc..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 transition">
              {carregando ? 'Salvando...' : (isEdicao ? 'Salvar Alterações' : 'Salvar Diário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}