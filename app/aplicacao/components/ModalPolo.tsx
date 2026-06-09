'use client'

import { useState } from 'react'
import { salvarPolo } from '../actions/polos'

interface ModalPoloProps {
  polo?: any
  botaoTexto?: string
  classeBotao?: string
}

export default function ModalPolo({ polo, botaoTexto, classeBotao }: ModalPoloProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    try {
      await salvarPolo(formData)
      setAberto(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <button onClick={() => setAberto(true)} className={classeBotao}>
        {botaoTexto || (polo ? 'Editar' : '+ Novo Polo')}
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-blue-900 p-6 text-white">
              <h2 className="text-xl font-bold">{polo ? 'Editar Unidade' : 'Nova Unidade'}</h2>
            </div>
            
            <form action={handleAcao} className="p-6 space-y-4">
              {polo?.id && <input type="hidden" name="id" value={polo.id} />}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Polo / Igreja</label>
                <input name="nome" defaultValue={polo?.nome} required className="w-full border p-2 rounded-lg" placeholder="Ex: EBD - Congregação X" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Localização</label>
                <input name="cidade" defaultValue={polo?.cidade} className="w-full border p-2 rounded-lg" placeholder="Ex: Vinhedo, SP" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Unidade</label>
                <select name="tipo" defaultValue={polo?.tipo || 'Filial'} className="w-full border p-2 rounded-lg">
                  <option value="Matriz">Sede / Matriz</option>
                  <option value="Filial">Congregação / Filial</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-600">Cancelar</button>
                <button type="submit" disabled={carregando} className="flex-1 bg-blue-600 p-3 rounded-xl font-bold text-white disabled:opacity-50">
                  {carregando ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}