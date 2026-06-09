'use client'

import { useState } from 'react'
import { criarCobranca } from '../actions/financeiro'

export default function CriadorFinanceiro({ alunos }: { alunos: any[] }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm">
        + Nova Cobrança
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Lançar Cobrança</h3>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}

        <form action={async (formData) => {
          setCarregando(true)
          setErro('')
          try {
            await criarCobranca(formData)
            setAberto(false)
          } catch (e: any) {
            setErro(e.message)
          } finally {
            setCarregando(false)
          }
        }} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Aluno *</label>
            <select name="aluno_id" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Escolha um aluno...</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome_completo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Cobrança *</label>
            <input type="text" name="descricao" required placeholder="Ex: Mensalidade - Módulo 1" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" name="valor" required placeholder="120.00" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
              <input type="date" name="data_vencimento" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition">
              {carregando ? 'Salvando...' : 'Gerar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}