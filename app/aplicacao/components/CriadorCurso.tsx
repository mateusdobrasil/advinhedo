'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // 👈 Importado o router
import { salvarCurso } from '../actions/cursos'

interface CriadorCursoProps {
  curso?: any // Se receber o curso, é Edição. Se não receber, é Cadastro.
}

export default function CriadorCurso({ curso }: CriadorCursoProps) {
  const router = useRouter() // 👈 Instanciado o router
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    try {
      await salvarCurso(formData)
      setAberto(false)
      router.refresh() // 👈 ESSENCIAL: Atualiza os dados da página em tempo real sem piscar a tela
    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro ao salvar o curso.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setAberto(true)} 
        // Muda o estilo do botão dependendo se é editar ou criar
        className={curso 
          ? "text-[10px] uppercase bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition" 
          : "bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
        }
      >
        {curso ? 'Editar' : '➕ Cadastrar Novo Curso'}
      </button>

      {aberto && (
        /* 👇 Adicionado backdrop-blur-sm para um visual mais limpo */
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{curso ? 'Editar Curso' : 'Novo Curso'}</h2>
              <button onClick={() => setAberto(false)} className="text-blue-200 hover:text-white transition">✕</button>
            </div>
            
            <form action={handleAcao} className="p-6 space-y-4">
              {/* O campo ID escondido garante que o sistema saiba que é para editar */}
              {curso?.id && <input type="hidden" name="id" value={curso.id} />}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Curso</label>
                <input name="nome" defaultValue={curso?.nome} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ex: Teologia Básica" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea name="descricao" defaultValue={curso?.descricao} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" placeholder="Breve descrição do curso..." rows={3}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Duração</label>
                  <input name="duracao" defaultValue={curso?.duracao} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ex: 12 meses" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mensalidade (R$)</label>
                  <input name="valor_mensalidade" type="number" step="0.01" defaultValue={curso?.valor_mensalidade} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="150.00" />
                </div>
              </div>

              {/* O CAMPO DE STATUS PARA ATIVAR OU INATIVAR */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status do Curso</label>
                <select name="status" defaultValue={curso?.status || 'Ativo'} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition">
                  <option value="Ativo">✅ Ativo (Visível)</option>
                  <option value="Inativo">❌ Inativo (Oculto)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setAberto(false)} disabled={carregando} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={carregando} className="flex-1 bg-blue-600 p-3 rounded-xl font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
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