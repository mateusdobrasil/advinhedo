export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AlunoEBDPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  // 1. TRAVA DE SEGURANÇA
  if (!session) {
    redirect('/')
  }

  // 2. Busca TODAS as matrículas do aluno e traz as turmas junto
  const { data: todasMatriculas, error: erroMatriculas } = await supabase
    .from('matriculas')
    .select('*, turmas(*)')
    .eq('aluno_id', session.user.id)

  if (erroMatriculas) {
    console.error("❌ Erro ao buscar matrículas:", erroMatriculas)
  }

  // DEBUG: Veja no terminal o que o banco está retornando
  console.log("🔎 MATRÍCULAS ENCONTRADAS PARA O ALUNO:", todasMatriculas)

  // 3. Filtra a matrícula da EBD no código (muito mais seguro)
  // Ele procura a primeira matrícula onde a turma tem is_ebd == true
  const matriculaEbd = todasMatriculas?.find((m: any) => m.turmas?.is_ebd === true)

  console.log("📖 MATRÍCULA EBD IDENTIFICADA:", matriculaEbd)

  // 4. Busca a Frequência APENAS SE encontrou a classe
  let frequencia: any[] = []
  if (matriculaEbd && matriculaEbd.turmas?.id) {
    const { data: dataFreq, error: erroFreq } = await supabase
      .from('frequencia_ebd')
      .select('*')
      .eq('aluno_id', session.user.id)
      .eq('turma_id', matriculaEbd.turmas.id)
      .order('created_at', { ascending: false })
    
    if (erroFreq) {
      console.error("❌ Erro ao buscar frequência da EBD:", erroFreq)
    }
    frequencia = dataFreq || []
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABEÇALHO E VOLTAR */}
        <div className="mb-8">
          <Link href="/dashboard/aluno" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4 inline-block transition">
            ← Voltar ao Início
          </Link>
          <h1 className="text-2xl font-black text-gray-800">📖 Escola Bíblica Dominical</h1>
          <p className="text-gray-500">Acompanhe seu progresso e materiais da classe.</p>
        </div>

        {/* MENSAGEM SE NÃO ESTIVER MATRICULADO */}
        {!matriculaEbd ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
            <span className="text-4xl mb-3 block">🚫</span>
            <h2 className="text-lg font-bold text-gray-800">Você não está matriculado na EBD</h2>
            <p className="text-gray-500 mt-1">Procure a secretaria da sua congregação para realizar sua matrícula.</p>
          </div>
        ) : (
          <>
            {/* INFO DA CLASSE */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 hover:shadow-md transition">
               <div>
                 <p className="text-[10px] uppercase font-bold text-gray-400">Classe</p>
                 <p className="font-bold text-gray-800">{matriculaEbd.turmas?.nome}</p>
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-gray-400">Professor</p>
                 <p className="font-bold text-gray-800">{matriculaEbd.turmas?.professor || 'A definir'}</p>
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-gray-400">Horário</p>
                 <p className="font-bold text-gray-800">{matriculaEbd.turmas?.horario || '--:--'}</p>
               </div>
               <div>
                 <p className="text-[10px] uppercase font-bold text-gray-400">Local</p>
                 <p className="font-bold text-gray-800">{matriculaEbd.turmas?.local || 'Sala Principal'}</p>
               </div>
            </section>

            {/* RECURSOS E MATERIAIS */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">📚 Revista e Apoio</h3>
                <div className="space-y-3">
                  <a href="https://www.escoladominical.com.br/" target="_blank" rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition text-sm font-bold text-gray-700">
                    Revista Digital
                  </a>
                  <a href="https://www.escoladominical.com.br/category/licoes-biblicas/" target="_blank" rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition text-sm font-bold text-gray-700">
                    Subsídio de Leitura
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🔗 Bíblia e Ferramentas</h3>
                <div className="space-y-3">
                  <a href="https://www.bibliaonline.com.br" target="_blank" rel="noopener noreferrer" 
                    className="block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition text-sm font-bold text-gray-700">
                    Acessar Bíblia Online
                  </a>
                  <a href="https://biblia.com.br/dicionario-biblico/" target="_blank" rel="noopener noreferrer" 
                    className="block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition text-sm font-bold text-gray-700">
                    Dicionário Bíblico
                  </a>
                </div>
              </div>
            </section>

            {/* FREQUÊNCIA EBD */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 mb-4">✅ Histórico de Presença</h3>
               
               {frequencia.length > 0 ? (
                 <div className="overflow-hidden border border-gray-100 rounded-xl">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-500">
                       <tr>
                         <th className="px-4 py-3 font-medium">Data do Registro</th>
                         <th className="px-4 py-3 font-medium text-center">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {frequencia.map((registro: any) => {
                         const faltou = registro.presente === false || registro.faltas > 0;
                         
                         return (
                           <tr key={registro.id} className="hover:bg-gray-50 transition">
                             <td className="px-4 py-3 font-medium text-gray-800">
                                {registro.data_aula 
                                  ? new Date(registro.data_aula + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                                  : new Date(registro.created_at).toLocaleDateString('pt-BR')
                                }
                             </td>
                             <td className="px-4 py-3 text-center">
                                {faltou 
                                  ? <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-red-50 text-red-600">Ausente</span>
                                  : <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">Presente</span>
                                }
                             </td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                   <p className="text-gray-400 text-sm font-medium">Nenhum registro de chamada até o momento.</p>
                 </div>
               )}
            </section>
          </>
        )}

      </div>
    </div>
  )
}