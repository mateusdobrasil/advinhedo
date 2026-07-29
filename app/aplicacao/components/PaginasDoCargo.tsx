'use client'

import { useState } from 'react'
import { salvarPaginasDoCargo } from '../actions/permissoes-paginas'
import { PaginaDef } from '@/lib/permissoes'

export default function PaginasDoCargo({
  modulo,
  nivelAcesso,
  paginasDisponiveis,
  paginasAtuais
}: {
  modulo: string
  nivelAcesso: string
  paginasDisponiveis: PaginaDef[]
  paginasAtuais: string[]
}) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    setErro('')
    try {
      const chaves = formData.getAll('pagina') as string[]
      await salvarPaginasDoCargo(modulo, nivelAcesso, chaves)
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
        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition"
      >
        Gerenciar Páginas
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold">Páginas de &quot;{nivelAcesso}&quot;</h2>
          <p className="text-slate-300 text-sm mt-1">Marque as páginas que este cargo pode acessar.</p>
        </div>

        <form action={handleAcao} className="p-6 space-y-4 overflow-y-auto">
          {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{erro}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            {paginasDisponiveis.map((p) => (
              <label key={p.chave} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="pagina"
                  value={p.chave}
                  defaultChecked={paginasAtuais.includes(p.chave)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition">{p.nome}</span>
              </label>
            ))}
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
