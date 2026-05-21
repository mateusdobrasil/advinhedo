'use client'

import { useState, useTransition } from 'react' // 👈 Importado o useTransition
import { useRouter } from 'next/navigation' 
import { salvarChamadaUnificada } from '../actions/ebd' 

export default function FormChamadaEBD({ 
  turmaId, 
  alunos, 
  dataSelecionada, 
  frequenciasExistentes 
}: { 
  turmaId: string, 
  alunos: any[], 
  dataSelecionada: string, 
  frequenciasExistentes: any[] 
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition() // 👈 Gerenciador de carregamento automático
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })

  // 👇 LÓGICA CORRIGIDA: Soma todos os visitantes e ofertas da data
  let visitantesAtuais = 0
  let ofertaAtual = 0

  frequenciasExistentes.forEach(registro => {
    if (registro.visitantes) {
      visitantesAtuais += Number(registro.visitantes)
    }
    if (registro.oferta) {
      ofertaAtual += Number(registro.oferta)
    }
  })

  // ⚡ MUDANÇA DE DATA SEGURA: O startTransition avisa o React quando o Next.js terminar de buscar os dados
  const lidarComMudancaDeData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = e.target.value
    if (novaData) {
      startTransition(() => {
        router.push(`?data=${novaData}`)
      })
    }
  }

  // ⚡ SUBMISSÃO DO FORMULÁRIO COM TRANSICÃO
  const manipularSubmissao = (formData: FormData) => {
    startTransition(async () => {
      setMensagem({ texto: '', tipo: '' })
      try {
        await salvarChamadaUnificada(formData)
        setMensagem({ texto: 'Chamada e relatório salvos com sucesso!', tipo: 'sucesso' })
      } catch (error: any) {
        setMensagem({ texto: error.message, tipo: 'erro' })
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 bg-slate-900 text-white">
        <h2 className="text-lg font-bold">📝 Realizar Chamada da EBD</h2>
        <p className="text-sm text-gray-400 mt-1">Preencha a data para carregar ou salvar as informações do dia.</p>
      </div>

      <form action={manipularSubmissao}>
        
        <input type="hidden" name="turma_id" value={turmaId} />

        <div className="p-6 space-y-8">
          
          {/* MENSAGEM DE FEEDBACK */}
          {mensagem.texto && (
            <div className={`p-4 rounded-lg text-sm font-bold ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {mensagem.texto}
            </div>
          )}

          {/* DADOS GERAIS DA CLASSE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-inner">
            
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Data da Aula</label>
              <input 
                type="date" 
                name="data_aula"
                value={dataSelecionada} 
                onChange={lidarComMudancaDeData}
                required
                disabled={isPending} // Desabilita durante transições para evitar cliques duplos
                className="bg-white border border-gray-300 text-gray-900 text-lg font-black rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 cursor-pointer disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Visitantes (Qtd)</label>
              <input 
                type="number" 
                name="visitantes"
                key={`vis-${dataSelecionada}`} 
                defaultValue={visitantesAtuais}
                min="0"
                disabled={isPending}
                className="bg-white border border-gray-300 text-gray-900 text-lg font-bold rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 disabled:opacity-50"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Oferta do Dia (R$)</label>
              <input 
                type="number" 
                name="oferta"
                key={`ofe-${dataSelecionada}`} 
                defaultValue={ofertaAtual.toFixed(2)} // Formata para 2 casas decimais no input
                step="0.01"
                min="0"
                disabled={isPending}
                className="bg-white border border-gray-300 text-gray-900 text-lg font-bold rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-3 disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* LISTA INDIVIDUAL DE ALUNOS */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Lista de Alunos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome do Aluno</th>
                    <th className="px-4 py-3 font-medium text-center text-blue-700">Presente?</th>
                    <th className="px-4 py-3 font-medium text-center text-emerald-700">Bíblia?</th>
                    <th className="px-4 py-3 font-medium text-center text-indigo-700">Revista?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alunos.map((aluno) => {
                    const reg = frequenciasExistentes.find(f => f.aluno_id === aluno.aluno_id)
                    
                    const presente = reg ? reg.presente : false 
                    const biblia = reg ? reg.trouxe_biblia : false
                    const revista = reg ? reg.trouxe_revista : false

                    return (
                      <tr key={aluno.aluno_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-bold text-gray-800">
                          {aluno.nome_completo}
                          <input type="hidden" name="aluno_ids" value={aluno.aluno_id} />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            name={`presente_${aluno.aluno_id}`} 
                            key={`pres-${aluno.aluno_id}-${dataSelecionada}`} 
                            defaultChecked={presente}
                            disabled={isPending}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer disabled:opacity-50" 
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            name={`biblia_${aluno.aluno_id}`} 
                            key={`bib-${aluno.aluno_id}-${dataSelecionada}`} 
                            defaultChecked={biblia}
                            disabled={isPending}
                            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer disabled:opacity-50" 
                          />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            name={`revista_${aluno.aluno_id}`} 
                            key={`rev-${aluno.aluno_id}-${dataSelecionada}`} 
                            defaultChecked={revista}
                            disabled={isPending}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-50" 
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RODAPÉ */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending} // Usa a flag automática do useTransition
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              '💾 Salvar Relatório e Chamada'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}