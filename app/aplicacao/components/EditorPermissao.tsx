'use client'

import { useState } from 'react'
import { atualizarPermissao } from '../actions/permissoes'

export default function EditorPermissao({ usuario }: { usuario: any }) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // 1. Limpa os espaços ao redor de cada cargo e polo para a comparação funcionar
  const cargosAtuais = usuario.tipo_usuario 
    ? usuario.tipo_usuario.split(',').map((c: string) => c.trim()) 
    : ['Aluno']
  
  const polosAtuais = usuario.polo 
    ? usuario.polo.split(',').map((p: string) => p.trim()) 
    : ['IBV']

  // 2. Cargos atualizados para o NOVO PADRÃO
  const opcoesCargos = [
    { id: 'Aluno', label: 'Aluno' },
    { id: 'Professor', label: 'Professor' },
    { id: 'Administrativo', label: 'Administrativo' },
    { id: 'Administrador', label: 'Administrador' }
  ]

  const opcoesPolos = [
    { id: 'IBV', label: 'IBV' },
    { id: 'IBUC', label: 'IBUC' },
    { id: 'EBD', label: 'EBD' }
  ]

  if (!aberto) return (
    <button 
      onClick={() => setAberto(true)} 
      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold bg-indigo-50 px-3 py-1.5 rounded-md transition uppercase tracking-wider border border-indigo-100"
    >
      Alterar Acessos
    </button>
  )

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black text-gray-800 mb-1">Editar Permissões</h3>
        <p className="text-sm text-gray-500 mb-5 pb-4 border-b border-gray-100">
          Usuário: <strong className="text-indigo-700 font-bold">{usuario.nome_completo}</strong>
        </p>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-4">{erro}</div>}

        <form action={async (formData) => {
          setCarregando(true)
          setErro('') // Limpa o erro anterior, se houver
          try {
            await atualizarPermissao(formData)
            setAberto(false)
          } catch (e: any) { 
            setErro(e.message) 
          } finally { 
            setCarregando(false) 
          }
        }} className="space-y-6">
          
          <input type="hidden" name="id" value={usuario.id} />

          {/* CHECKBOXES DE CARGOS */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Níveis de Acesso</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {opcoesCargos.map((c) => (
                <label key={c.id} className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="tipo_usuario" 
                    value={c.id} 
                    defaultChecked={cargosAtuais.includes(c.id)} 
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-50 cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* CHECKBOXES DE POLOS */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Atuação nos Polos</label>
            <div className="flex flex-wrap gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              {opcoesPolos.map((p) => (
                <label key={p.id} className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="polo" 
                    value={p.id} 
                    defaultChecked={polosAtuais.includes(p.id)} 
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-600 cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700 transition">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={() => setAberto(false)} 
              className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-xl font-bold transition text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={carregando} 
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition text-sm flex items-center justify-center min-w-[140px]"
            >
              {carregando ? (
                <span className="animate-pulse">Salvando...</span>
              ) : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}