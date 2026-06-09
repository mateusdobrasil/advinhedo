'use client'

import { useState } from 'react'
import { criarAviso } from '../actions/avisos'

export default function CriadorAviso({ turmas }: { turmas: any[] }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-orange-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 transition shadow-sm">
        + Publicar Aviso
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">📢 Novo Comunicado</h3>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}

        <form action={async (formData) => {
          setCarregando(true)
          setErro('')
          try {
            await criarAviso(formData)
            setAberto(false)
          } catch (e: any) {
            setErro(e.message)
          } finally {
            setCarregando(false)
          }
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título do Aviso *</label>
            <input type="text" name="titulo" required placeholder="Ex: Feriado nesta Sexta-feira" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
            <textarea name="conteudo" required rows={4} placeholder="Escreva o comunicado aqui..." className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100 mt-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Público (Polo)</label>
              <select name="polo" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500">
                <option value="Todos">Todos os Polos</option>
                <option value="IBV">Apenas IBV</option>
                <option value="IBUC">Apenas IBUC</option>
                <option value="EBD">Apenas EBD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Turma Específica?</label>
              <select name="turma_id" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500">
                <option value="">Geral (Todas as Turmas)</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 transition">
              {carregando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}