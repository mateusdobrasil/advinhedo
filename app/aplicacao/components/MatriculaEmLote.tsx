'use client'

import { useState, useEffect } from 'react'
import { matricularEmLote } from '../actions/matriculas'

interface MatriculaEmLoteProps {
  alunos: any[]
  turmaAtualId: string
  turmaAtualNome: string
  cursoAtual: string
  cursosRegras: any[]
}

export default function MatriculaEmLote({ alunos, turmaAtualId, turmaAtualNome, cursoAtual, cursosRegras = [] }: MatriculaEmLoteProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [valorMensalidade, setValorMensalidade] = useState<number>(0)
  
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [buscaAluno, setBuscaAluno] = useState('')

  useEffect(() => {
    const cursoEncontrado = cursosRegras.find(c => c.nome === cursoAtual)
    if (cursoEncontrado) {
      setValorMensalidade(cursoEncontrado.valor_mensalidade || 0)
    }
  }, [cursoAtual, cursosRegras])

  // 👇 AQUI ESTÁ A MUDANÇA: Quando o modal abre, a lista de selecionados inicia VAZIA
  useEffect(() => {
    if (aberto) {
      setSelecionados([]) // Antes estava: alunos.map(a => a.id)
      setBuscaAluno('')
      setErro('')
    }
  }, [aberto])

  const alunosFiltrados = alunos.filter(a => 
    a.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase())
  )

  const toggleAluno = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(selecionadoId => selecionadoId !== id))
    } else {
      setSelecionados([...selecionados, id])
    }
  }

  // Função prática para "Selecionar Todos" caso você precise
  const selecionarTodos = () => {
    if (selecionados.length === alunosFiltrados.length) {
      setSelecionados([]) // Desmarca tudo
    } else {
      setSelecionados(alunosFiltrados.map(a => a.id)) // Marca todos da busca atual
    }
  }

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)} 
        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex items-center justify-center sm:justify-start gap-2 w-full"
      >
        <span>➕</span> Nova Matrícula
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col text-left overflow-hidden border border-gray-100">
        
        <div className="p-6 bg-slate-900 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">➕ Nova Matrícula</h3>
          <p className="text-sm text-gray-400 mt-1">Adicionando alunos à classe: <span className="font-bold text-blue-400">{turmaAtualNome}</span></p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {erro && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6 border border-red-200 font-bold">
              {erro}
            </div>
          )}

          <form id="form-lote" action={async (formData) => {
            if (selecionados.length === 0) {
              setErro("Você precisa marcar pelo menos um aluno na lista.")
              return
            }
            setCarregando(true)
            setErro('')
            try {
              await matricularEmLote(formData)
              setAberto(false)
            } catch (e: any) {
              setErro(e.message)
            } finally {
              setCarregando(false)
            }
          }} className="space-y-6">
            
            <input type="hidden" name="turma_id" value={turmaAtualId} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* LADO ESQUERDO: FINANCEIRO */}
              <div className="space-y-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xs font-black uppercase text-blue-600 tracking-wider border-b pb-2">1. Dados da Matrícula</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Taxa Matrícula</label>
                    <input type="number" step="0.01" name="valor_matricula" defaultValue="0" className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Mensalidade</label>
                    <input type="number" name="valor_mensalidade" value={valorMensalidade} readOnly required className="w-full border border-gray-200 p-3 rounded-lg bg-gray-50 text-gray-500 font-bold outline-none cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Meses</label>
                    <input type="number" name="quantidade_parcelas" min="1" required className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">1º Vencimento</label>
                    <input type="date" name="data_primeiro_vencimento" required className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* LADO DIREITO: LISTA DE ALUNOS COM CHECKBOX */}
              <div className="space-y-4 flex flex-col h-full bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-black uppercase text-green-600 tracking-wider">2. Alunos Disponíveis</h4>
                  
                  <div className="flex items-center gap-3">
                    {/* Botão prático para marcar/desmarcar todos rapidamente */}
                    <button 
                      type="button" 
                      onClick={selecionarTodos}
                      className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                      {selecionados.length === alunosFiltrados.length && alunosFiltrados.length > 0 ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">{selecionados.length} Selecionados</span>
                  </div>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Pesquisar aluno..." 
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50 text-sm text-gray-900 outline-none"
                />

                <div className="border border-gray-200 rounded-lg bg-white overflow-y-auto max-h-[250px] flex-1">
                  {alunosFiltrados.length === 0 ? (
                    <p className="p-6 text-sm text-gray-400 text-center font-medium">Nenhum aluno livre encontrado no sistema.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {alunosFiltrados.map(aluno => (
                        <label key={aluno.id} className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer transition group">
                          {selecionados.includes(aluno.id) && (
                            <input type="hidden" name="alunos_selecionados" value={aluno.id} />
                          )}
                          <input 
                            type="checkbox" 
                            checked={selecionados.includes(aluno.id)} 
                            onChange={() => toggleAluno(aluno.id)}
                            className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                          />
                          {/* O efeito line-through foi removido para uma leitura mais agradável */}
                          <span className={`text-sm ${selecionados.includes(aluno.id) ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>
                            {aluno.nome_completo}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>

        <div className="p-5 border-t bg-white flex justify-end gap-3 rounded-b-2xl">
          <button type="button" onClick={() => setAberto(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition">
            Cancelar
          </button>
          <button form="form-lote" type="submit" disabled={carregando || selecionados.length === 0} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 transition shadow-md">
            {carregando ? 'Matriculando...' : `Salvar ${selecionados.length} Matrícula(s)`}
          </button>
        </div>

      </div>
    </div>
  )
}