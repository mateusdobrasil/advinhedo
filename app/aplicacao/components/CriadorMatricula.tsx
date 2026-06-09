'use client'

import { useState, useEffect } from 'react'
import { matricularAluno } from '../actions/matriculas'

interface CriadorMatriculaProps {
  alunos: any[]
  turmas: any[]
  cursosRegras: any[] // Lista com nome e preço dos cursos
  turmaIdPadrao?: string
}

export default function CriadorMatricula({ alunos, turmas, cursosRegras = [], turmaIdPadrao }: CriadorMatriculaProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  
  // Estado para controlar o valor automático da mensalidade na tela
  const [valorMensalidade, setValorMensalidade] = useState<number>(0)

  // Função inteligente que localiza o preço baseado na turma escolhida
  const atualizarValorAutomatico = (turmaId: string) => {
    const turmaSelecionada = turmas.find(t => t.id === turmaId)
    if (turmaSelecionada) {
      const cursoEncontrado = cursosRegras.find(c => c.nome === turmaSelecionada.curso)
      if (cursoEncontrado) {
        setValorMensalidade(cursoEncontrado.valor_mensalidade || 0)
        return
      }
    }
    setValorMensalidade(0) // Reseta se não encontrar por segurança
  }

  // Se a página já abrir com uma turma padrão (ex: página interna da turma), já calcula o valor inicial
  useEffect(() => {
    if (turmaIdPadrao) {
      atualizarValorAutomatico(turmaIdPadrao)
    }
  }, [turmaIdPadrao, turmas, cursosRegras])

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)} 
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
      >
        + Nova Matrícula
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto text-left">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Matricular Aluno</h3>
        
        {erro && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {erro}
          </div>
        )}

        <form 
          action={async (formData) => {
            setCarregando(true)
            setErro('')
            try {
              await matricularAluno(formData)
              setAberto(false)
            } catch (e: any) {
              setErro(e.message)
            } finally {
              setCarregando(false)
            }
          }} 
          className="space-y-6"
        >
          {/* SEÇÃO 1: ACADÊMICO */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-blue-600 tracking-wider">1. Vínculo Acadêmico</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Aluno</label>
              <select name="aluno_id" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                <option value="">Escolha um aluno...</option>
                {alunos?.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome_completo} {a.cpf ? `(${a.cpf})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Turma</label>
              <select 
                name="turma_id" 
                required 
                defaultValue={turmaIdPadrao || ''} 
                onChange={(e) => atualizarValorAutomatico(e.target.value)} // Atualiza o preço ao mudar a turma
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Escolha uma turma...</option>
                {turmas?.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} — {t.curso}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SEÇÃO 2: FINANCEIRO AUTOMAÇÃO */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase text-green-600 tracking-wider">2. Automação Financeira</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Matrícula (R$)</label>
                <input type="number" step="0.01" name="valor_matricula" placeholder="Ex: 50.00" defaultValue="0" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 bg-white" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Mensalidade (R$)</label>
                {/* Usamos value e readOnly para garantir segurança total e envio correto pelo formulário */}
                <input 
                  type="number" 
                  name="valor_mensalidade" 
                  value={valorMensalidade} 
                  readOnly 
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-500 font-bold cursor-not-allowed outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Meses</label>
                <input type="number" name="quantidade_parcelas" min="1" max="60" placeholder="Ex: 12" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1º Vencimento</label>
                <input type="date" name="data_primeiro_vencimento" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 bg-white" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition">
              {carregando ? 'Processando...' : 'Matricular e Gerar Financeiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}