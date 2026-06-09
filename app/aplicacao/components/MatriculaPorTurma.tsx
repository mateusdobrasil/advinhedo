'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface Turma {
  id: string
  nome: string
  curso: string
}

interface Aluno {
  aluno_id: string
  nome_completo: string
  jaMatriculado: boolean
}

export default function MatriculaPorTurma({ 
  turmas, 
  turmaDestinoPadrao = '' 
}: { 
  turmas: Turma[], 
  turmaDestinoPadrao?: string 
}) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [isOpen, setIsOpen] = useState(false)
  const [turmaDestinoId, setTurmaDestinoId] = useState(turmaDestinoPadrao)
  const [turmaOrigemId, setTurmaOrigemId] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [buscaNome, setBuscaNome] = useState('') 
  
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })

  const fecharModal = () => {
    setIsOpen(false)
    setTurmaDestinoId(turmaDestinoPadrao) 
    setTurmaOrigemId('')
    setAlunos([])
    setSelecionados([])
    setBuscaNome('')
    setMensagem({ texto: '', tipo: '' })
  }

  useEffect(() => {
    async function buscarAlunos() {
      if (!turmaOrigemId || !turmaDestinoId) {
        setAlunos([])
        return
      }

      setBuscando(true)
      setMensagem({ texto: '', tipo: '' })
      
      try {
        let listaCrua: any[] = []

        if (turmaOrigemId === 'todos') {
          // 🌟 1. Puxa TODOS os alunos do Instituto
          const { data: todosAlunos, error: erroTodos } = await supabase
            .from('perfis')
            .select('id, nome_completo')
            .ilike('tipo_usuario', '%aluno%')

          if (erroTodos) throw erroTodos
          listaCrua = todosAlunos?.map(a => ({ aluno_id: a.id, nome_completo: a.nome_completo })) || []
        
        } else if (turmaOrigemId === 'sem_matricula') {
          // 🟢 2. Puxa APENAS os alunos que não possuem nenhuma matrícula ativa no sistema
          const { data: todosAlunos, error: erroTodos } = await supabase
            .from('perfis')
            .select('id, nome_completo')
            .ilike('tipo_usuario', '%aluno%')

          const { data: matriculasAtivas, error: erroMatriculas } = await supabase
            .from('matriculas')
            .select('aluno_id')
            .eq('status', 'Ativo')

          if (erroTodos) throw erroTodos
          if (erroMatriculas) throw erroMatriculas

          const idsMatriculadosNoSistema = new Set(matriculasAtivas?.map((m: any) => m.aluno_id))
          const alunosLivres = todosAlunos?.filter(a => !idsMatriculadosNoSistema.has(a.id)) || []
          
          listaCrua = alunosLivres.map(a => ({ aluno_id: a.id, nome_completo: a.nome_completo }))
        }

        // Verifica quem JÁ ESTÁ na Turma de Destino selecionada para bloquear a duplicata visualmente
        const { data: matriculasDestino, error: erroDestino } = await supabase
          .from('matriculas')
          .select('aluno_id')
          .eq('turma_id', turmaDestinoId)
          .eq('status', 'Ativo')

        if (erroDestino) throw erroDestino

        const idsJaMatriculadosNoDestino = new Set(matriculasDestino?.map(m => m.aluno_id))

        // Formata e organiza alfabeticamente
        const listaFormatada = listaCrua.map((a: any) => ({
          aluno_id: a.aluno_id,
          nome_completo: a.nome_completo || 'Aluno Desconhecido',
          jaMatriculado: idsJaMatriculadosNoDestino.has(a.aluno_id)
        })).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo))

        setAlunos(listaFormatada)
        
        // Auto-seleção inteligente
        if (turmaOrigemId === 'todos') {
          setSelecionados([]) // Inicia desmarcado se puxou todos
        } else {
          // Se buscou só os livres, já deixa todos marcados para facilitar
          setSelecionados(listaFormatada.filter(a => !a.jaMatriculado).map(a => a.aluno_id))
        }

      } catch (error: any) {
        setMensagem({ texto: `Erro ao buscar alunos: ${error.message}`, tipo: 'erro' })
      } finally {
        setBuscando(false)
      }
    }

    buscarAlunos()
  }, [turmaOrigemId, turmaDestinoId, supabase]) 

  const alternarSelecao = (alunoId: string) => {
    setSelecionados(prev => 
      prev.includes(alunoId) 
        ? prev.filter(id => id !== alunoId) 
        : [...prev, alunoId]
    )
  }

  const salvarMatriculasLote = async () => {
    if (!turmaDestinoId) {
      setMensagem({ texto: 'Selecione uma turma de destino primeiro.', tipo: 'erro' })
      return
    }

    if (selecionados.length === 0) {
      setMensagem({ texto: 'Selecione pelo menos um aluno.', tipo: 'erro' })
      return
    }

    setSalvando(true)
    setMensagem({ texto: '', tipo: '' })

    try {
      const novasMatriculas = selecionados.map(alunoId => ({
        turma_id: turmaDestinoId,
        aluno_id: alunoId,
        status: 'Ativo',
        revista_entregue: false
      }))

      const { error } = await supabase.from('matriculas').insert(novasMatriculas)
      if (error) throw error

      setMensagem({ texto: `${selecionados.length} aluno(s) matriculado(s) com sucesso!`, tipo: 'sucesso' })
      
      setTimeout(() => {
        router.refresh()
        fecharModal()
      }, 1500)

    } catch (error: any) {
      setMensagem({ texto: `Erro ao matricular: ${error.message}`, tipo: 'erro' })
      setSalvando(false)
    }
  }

  const alunosFiltrados = alunos.filter(a => a.nome_completo.toLowerCase().includes(buscaNome.toLowerCase()))

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition shadow-sm flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto whitespace-nowrap"
      >
        <span>👥</span> Matrícula em Lote
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">👥 Matrícula em Lote</h2>
                <p className="text-sm text-gray-400 mt-1">Insira alunos em uma classe rapidamente.</p>
              </div>
              <button onClick={fecharModal} className="text-gray-400 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              
              {mensagem.texto && (
                <div className={`p-4 rounded-xl text-sm font-bold ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {mensagem.texto}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                
                {/* 1. SELEÇÃO DE DESTINO */}
                <div>
                  <label className="block text-xs font-black text-indigo-600 uppercase tracking-wider mb-2">1. Turma de Destino</label>
                  <select 
                    value={turmaDestinoId} 
                    onChange={(e) => setTurmaDestinoId(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 font-medium"
                  >
                    <option value="">-- Escolha a turma destino --</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* 2. SELEÇÃO DE ORIGEM */}
                <div className={!turmaDestinoId ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-xs font-black text-blue-600 uppercase tracking-wider mb-2">2. Origem dos Alunos</label>
                  <select 
                    value={turmaOrigemId} 
                    onChange={(e) => setTurmaOrigemId(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 font-medium"
                  >
                    <option value="">-- Escolha uma opção --</option>
                    <option value="todos" className="font-bold text-blue-700">🌟 Mostrar Todos os Alunos</option>
                    <option value="sem_matricula" className="font-bold text-green-700">🟢 Alunos sem matrícula em nenhuma sala</option>
                  </select>
                </div>

              </div>

              {/* 3. LISTA DE ALUNOS COM BARRA DE PESQUISA */}
              {turmaOrigemId && turmaDestinoId && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  
                  <div className="bg-white p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar aluno por nome..." 
                      value={buscaNome}
                      onChange={(e) => setBuscaNome(e.target.value)}
                      className="w-full sm:w-64 border border-gray-300 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    />
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg whitespace-nowrap">
                      {selecionados.length} aluno(s) sem matricula
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-3 space-y-1">
                    {buscando ? (
                      <div className="p-8 text-center text-gray-400 font-medium animate-pulse">Carregando alunos...</div>
                    ) : alunosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 font-medium">Nenhum aluno encontrado para exibir.</div>
                    ) : (
                      alunosFiltrados.map(aluno => (
                        <label 
                          key={aluno.aluno_id} 
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${aluno.jaMatriculado ? 'bg-gray-50 opacity-50' : 'hover:bg-indigo-50 border border-transparent hover:border-indigo-100'}`}
                        >
                          <input 
                            type="checkbox" 
                            onChange={() => alternarSelecao(aluno.aluno_id)}
                            disabled={aluno.jaMatriculado || salvando}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${aluno.jaMatriculado ? 'font-medium text-gray-500' : 'font-bold text-gray-800 block'}`}>{aluno.nome_completo}</span>
                            {aluno.jaMatriculado && (
                              <span className="text-[10px] font-bold text-orange-600 uppercase block mt-0.5">Já matriculado nesta turma</span>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={fecharModal} 
                disabled={salvando}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarMatriculasLote}
                disabled={salvando || selecionados.length === 0 || !turmaDestinoId}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black hover:bg-indigo-700 transition disabled:opacity-50 shadow-md flex items-center gap-2"
              >
                {salvando ? 'Processando...' : `Matricular Alunos`}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}