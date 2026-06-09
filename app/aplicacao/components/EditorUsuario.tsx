'use client'

import { useState } from 'react'
import { atualizarUsuario } from '../actions/usuarios'

interface EditorUsuarioProps {
  usuario: any
  polos: any[] // Recebemos a lista de polos para o Select
}

export default function EditorUsuario({ usuario, polos }: EditorUsuarioProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    try {
      await atualizarUsuario(formData)
      setAberto(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setAberto(true)} 
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm border border-blue-700"
      >
        ✏️ Editar Perfil
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 text-left">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-blue-900 p-6 text-white">
              <h2 className="text-xl font-bold">Editar Usuário</h2>
              <p className="text-xs text-blue-200 mt-1">Alterando dados de {usuario.nome_completo}</p>
            </div>
            
            <form action={handleAcao} className="p-6 space-y-4">
              <input type="hidden" name="id" value={usuario.id} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input name="nome_completo" defaultValue={usuario.nome_completo} required className="w-full border p-2 rounded-lg text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input name="telefone" defaultValue={usuario.telefone} className="w-full border p-2 rounded-lg text-gray-900" placeholder="(11) 99999-9999" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Polo Vinculado</label>
                <select name="polo" defaultValue={usuario.polo || ''} required className="w-full border p-2 rounded-lg bg-white text-gray-900">
                  <option value="" disabled>Selecione um polo...</option>
                  {polos.map((p) => (
                    <option key={p.id} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso (Cargo)</label>
                <select name="tipo_usuario" defaultValue={usuario.tipo_usuario || 'aluno'} className="w-full border p-2 rounded-lg bg-white text-gray-900">
                  <option value="aluno">🎓 Aluno</option>
                  <option value="professor">👨‍🏫 Professor</option>
                  <option value="administrador">⚙️ Administrador (Acesso Total)</option>
                </select>
              </div>

              {/* Aviso para o administrador */}
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-2">
                <p className="text-[10px] text-orange-800 leading-tight">
                  <strong>Nota:</strong> O e-mail ({usuario.email}) não pode ser alterado por aqui por questões de segurança da autenticação do Supabase.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-600">Cancelar</button>
                <button type="submit" disabled={carregando} className="flex-1 bg-blue-600 p-3 rounded-xl font-bold text-white disabled:opacity-50">
                  {carregando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}