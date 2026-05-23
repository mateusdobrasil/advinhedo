import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { toggleStatusApresentacao } from '../actions/actions'
import logo from '../../imgs/logo.png' 

export const dynamic = 'force-dynamic'

export default async function TelaApresentacao() {
  const supabase = createServerComponentClient({ cookies })

  const { data: visitantes, error } = await supabase
    .from('visitantes')
    .select(`
      id, 
      nome_visitante, 
      setor_trabalho, 
      nome_esposa, 
      representado_por,
      foi_apresentado,
      dependentes_acompanhantes ( nome, tipo )
    `)
    .eq('foi_apresentado', false)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg text-2xl">
          Erro ao carregar a fila de apresentação: {error.message}
        </div>
      </div>
    )
  }

  return (
    // Transformamos a tela para h-screen e overflow-hidden (trava a tela inteira)
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      
      {/* Cabeçalho Fixo */}
      <div className="p-4 md:px-8 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <img src={logo.src} alt="Logo AD Vinhedo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Culto AD Vinhedo</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-base md:text-lg font-bold text-blue-700 bg-blue-100 px-4 py-2 rounded-full">
            Restam na fila: {visitantes?.length || 0}
          </div>
          
          <form action={async () => {
            "use server";
            revalidatePath('/apresentacao/apresentacao');
          }}>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors text-base md:text-lg flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </form>

          <Link href="/apresentacao" className="bg-gray-800 text-white px-5 py-2 rounded-xl font-bold hover:bg-gray-700 transition-colors text-base md:text-lg shadow-sm">
            Sair
          </Link>
        </div>
      </div>

      {/* Área Principal - Slide Superior e Responsivo */}
      {/* items-start puxa o card para cima, pt-6 dá um respiro do cabeçalho */}
      <div className="flex-1 flex items-start justify-center p-4 md:pt-6 overflow-hidden">
        
        {!visitantes || visitantes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 p-20 text-center max-w-3xl w-full mt-10">
            <h3 className="text-4xl text-gray-400 font-medium mb-6">Nenhum visitante na fila</h3>
            <p className="text-2xl text-gray-400 mb-10">Aguardando novos cadastros...</p>
            
            <form action={async () => {
              "use server";
              revalidatePath('/apresentacao/apresentacao');
            }}>
              <button 
                type="submit" 
                className="bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 px-8 py-4 rounded-2xl font-bold transition-colors text-xl flex items-center justify-center gap-3 mx-auto"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Verificar novos cadastros
              </button>
            </form>
          </div>
        ) : (
          (() => {
            const visitante = visitantes[0];
            const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO') || [];
            const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE') || [];

            // Função para formatar a lista com vírgulas e "e" no final
            const formatarLista = (lista: string[]) => {
              if (lista.length === 0) return "";
              if (lista.length === 1) return lista[0];
              const ultimos = lista[lista.length - 1];
              const primeiros = lista.slice(0, -1);
              return primeiros.join(', ') + ' e ' + ultimos;
            };

            // Extraindo apenas os nomes para os arrays de strings
            const nomesFilhos = filhos.map((f: any) => f.nome);
            const nomesAcompanhantes = acompanhantes.map((a: any) => a.nome);

            return (
              // O Card agora tem max-h-full e flex-col para controlar o transbordo interno
              <div key={visitante.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 max-w-6xl w-full max-h-full flex flex-col animate-fade-in">
                
                {/* Área de Texto - Rola internamente se for absurdamente grande, protegendo o botão */}
                <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center text-center space-y-4 md:space-y-6 pb-4">
                  
                  {/* 1. Nome do Visitante */}
                  <h2 className="text-5xl md:text-7xl font-black text-blue-900 uppercase tracking-tight leading-tight break-words w-full">
                    {visitante.nome_visitante}
                  </h2>
                  
                  {/* 2. Vindo de */}
                  {visitante.setor_trabalho && (
                    <p className="text-2xl md:text-5xl text-gray-500 font-medium leading-snug">
                      Vindo de: <span className="text-gray-800 font-bold">{visitante.setor_trabalho}</span>
                    </p>
                  )}

                  {/* 3. Representado Por */}
                  {visitante.representado_por && (
                    <div className="pt-2">
                      <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-900 px-6 py-3 md:px-8 md:py-4 rounded-2xl inline-flex flex-wrap items-center justify-center gap-2 shadow-sm">
                        <span className="font-bold text-yellow-700 uppercase text-xl md:text-3xl tracking-wider">
                          Representado por:
                        </span>
                        <span className="text-3xl md:text-5xl font-black ml-2">
                          {visitante.representado_por}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-24 h-1 md:h-2 bg-blue-100 mx-auto my-2 md:my-4 rounded-full shrink-0"></div>

                  {/* 4. Esposa */}
                  {visitante.nome_esposa && (
                    <p className="text-3xl md:text-5xl text-gray-700 leading-snug">
                      <span className="text-gray-800 font-bold">Esposa: </span> 
                      <span className="font-black text-gray-900" >{visitante.nome_esposa}</span>
                    </p>
                  )}

                  {/* 5. Filhos */}
                  {nomesFilhos.length > 0 && (
                    <p className="text-3xl md:text-5xl text-gray-700 leading-snug break-words">
                      <span className="font-black text-gray-900">Filhos:</span> {formatarLista(nomesFilhos)}
                    </p>
                  )}

                  {/* 6. Acompanhantes */}
                  {nomesAcompanhantes.length > 0 && (
                    <p className="text-3xl md:text-5xl text-gray-700 leading-snug break-words">
                      <span className="font-black text-gray-900">Acompanhantes:</span> {formatarLista(nomesAcompanhantes)}
                    </p>
                  )}
                </div>

                {/* Botão de Ação - Travado no fundo do card, NUNCA sai da tela */}
                <div className="shrink-0 w-full pt-6 mt-4 border-t border-gray-100">
                  <form action={async () => {
                    "use server";
                    await toggleStatusApresentacao(visitante.id, visitante.foi_apresentado);
                  }}>
                    <button 
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 md:py-6 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-4 text-2xl md:text-3xl uppercase tracking-widest"
                    >
                      <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      Marcar como Apresentado
                    </button>
                  </form>
                </div>

              </div>
            )
          })()
        )}

      </div>
    </div>
  )
}
