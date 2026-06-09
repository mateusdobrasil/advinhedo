'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // 👈 Importado o router
import { salvarMateria } from '../actions/materias'

interface CriadorMateriaProps {
  materia?: any // Se vier preenchido, o componente entra no modo de Edição
  cursos: any[] // Lista de cursos (apenas os ativos) para preencher a caixa de seleção
}

export default function CriadorMateria({ materia, cursos }: CriadorMateriaProps) {
  const router = useRouter() // 👈 Instanciado o router
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    try {
      await salvarMateria(formData)
      setAberto(false) // Fecha o modal se o salvamento for um sucesso
      router.refresh() // 👈 ESSENCIAL: Atualiza os dados da página sem piscar a tela
    } catch (err: any) {
      alert(err.message) // Exibe o erro caso algo falhe no banco ou na Action
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      {/* BOTÃO DE GATILHO PADRONIZADO */}
      <button 
        onClick={() => setAberto(true)} 
        className={materia 
          ? "text-[10px] uppercase bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition" 
          : "bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        }
      >
        {materia ? 'Editar' : '➕ Cadastrar Nova Matéria'}
      </button>

      {/* MODAL / JANELA FLUTUANTE */}
      {aberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            
            {/* Cabeçalho do Modal */}
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{materia ? 'Editar Matéria' : 'Nova Matéria'}</h2>
              <button onClick={() => setAberto(false)} className="text-blue-200 hover:text-white transition">✕</button>
            </div>
            
            {/* Formulário */}
            <form action={handleAcao} className="p-6 space-y-4">
              
              {/* O campo ID escondido garante que o sistema saiba qual matéria atualizar */}
              {materia?.id && <input type="hidden" name="id" value={materia.id} />}
              
              {/* NOME DA MATÉRIA */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Matéria</label>
                <input 
                  name="nome" 
                  defaultValue={materia?.nome} 
                  required 
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="Ex: Introdução ao Antigo Testamento" 
                />
              </div>

              {/* VÍNCULO COM O CURSO */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Curso Vinculado</label>
                <select 
                  name="curso_id" 
                  defaultValue={materia?.curso_id || ''} 
                  required 
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
                >
                  <option value="" disabled>Selecione um curso...</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* STATUS (ATIVA / INATIVA) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status da Matéria</label>
                <select 
                  name="status" 
                  defaultValue={materia?.status || 'Ativa'} 
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition"
                >
                  <option value="Ativa">✅ Ativa (Disponível)</option>
                  <option value="Inativa">❌ Inativa (Oculta)</option>
                </select>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setAberto(false)} 
                  disabled={carregando}
                  className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={carregando} 
                  className="flex-1 bg-blue-600 p-3 rounded-xl font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
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