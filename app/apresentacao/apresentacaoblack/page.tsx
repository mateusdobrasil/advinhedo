import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { toggleStatusApresentacao } from '../actions/actions'
import logo from '../../imgs/logo_branco.png' 

export const dynamic = 'force-dynamic'

export default async function TelaApresentacaoBlack() {
  const cookieStore = cookies()
  const eventoAtivo = cookieStore.get('evento_ativo')?.value

  if (!eventoAtivo) {
    redirect('/apresentacao');
  }

  const supabase = createServerComponentClient({ cookies: () => cookieStore })

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
    .eq('evento_id', eventoAtivo)
    .eq('foi_apresentado', false)
    .order('created_at', { ascending: true })

  const { data: eventoInfo } = await supabase
    .from('eventos')
    .select('nome_evento')
    .eq('id', eventoAtivo)
    .single()

  const tituloEvento = eventoInfo?.nome_evento || "Culto AD Vinhedo";

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="p-6 bg-red-900/50 text-red-200 rounded-lg text-2xl border border-red-800">
          Erro ao carregar a fila de apresentação: {error.message}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Força o recarregamento nativo do navegador a cada 5 segundos */}
      <meta httpEquiv="refresh" content="5" />
      
      <div className="h-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100">
        
        {/* Cabeçalho Fixo Black */}
        <div className="p-4 md:px-8 flex items-center justify-between bg-gray-900 border-b border-gray-800 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <img src={logo.src} alt="Logo AD Vinhedo" className="h-10 w-auto object-contain" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">{tituloEvento}</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-base md:text-lg font-bold text-blue-300 bg-blue-900/40 border border-blue-800 px-4 py-2 rounded-full">
              Restam na fila: {visitantes?.length || 0}
            </div>
            
            <form action={async () => {
              "use server";
              revalidatePath('/apresentacao/apresentacaoblack');
            }}>
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors text-base md:text-lg flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </form>

            <Link href="/apresentacao" className="bg-gray-800 text-gray-300 border border-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-700 hover:text-white transition-colors text-base md:text-lg shadow-sm">
              Sair
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center p-4 md:pt-6 overflow-hidden">
          
          {!visitantes || visitantes.length === 0 ? (
            <div className="bg-gray-900 rounded-3xl shadow-sm border border-dashed border-gray-700 p-20 text-center max-w-3xl w-full mt-10">
              <h3 className="text-4xl text-gray-500 font-medium mb-6">Nenhum visitante na fila</h3>
              <p className="text-2xl text-gray-600 mb-10">Aguardando novos cadastros...</p>
              
              <form action={async () => {
                "use server";
                revalidatePath('/apresentacao/apresentacaoblack');
              }}>
                <button 
                  type="submit" 
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 px-8 py-4 rounded-2xl font-bold transition-colors text-xl flex items-center justify-center gap-3 mx-auto"
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

              const formatarLista = (lista: string[]) => {
                if (lista.length === 0) return "";
                if (lista.length === 1) return lista[0];
                const ultimos = lista[lista.length - 1];
                const primeiros = lista.slice(0, -1);
                return primeiros.join(', ') + ' e ' + ultimos;
              };

              const nomesFilhos = filhos.map((f: any) => f.nome);
              const nomesAcompanhantes = acompanhantes.map((a: any) => a.nome);

              return (
                <div key={visitante.id} className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-6 md:p-10 w-full max-w-[95%] 2xl:max-w-[1600px] max-h-full flex flex-col animate-fade-in">
                  
                  <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center text-center space-y-4 md:space-y-6 pb-4 custom-scrollbar">
                    
                    <h2 className="text-5xl md:text-7xl font-bold text-blue-300 uppercase leading-tight break-words w-full drop-shadow-md">
                      {visitante.nome_visitante}
                    </h2>
                    
                    {visitante.setor_trabalho && (
                      <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug">
                        Vindo de: <span className="text-gray-100 font-bold">{visitante.setor_trabalho}</span>
                      </p>
                    )}

                    {visitante.representado_por && (
                      <div className="pt-2">
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-300 px-6 py-3 md:px-8 md:py-4 rounded-2xl inline-flex flex-wrap items-center justify-center gap-2 shadow-sm">
                          <span className="font-bold text-yellow-400/80 uppercase text-xl md:text-3xl tracking-wide">
                            Representado por:
                          </span>
                          <span className="text-3xl md:text-5xl font-bold ml-2 text-yellow-200">
                            {visitante.representado_por}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="w-24 h-1 md:h-2 bg-gray-700 mx-auto my-2 md:my-4 rounded-full shrink-0"></div>

                    {visitante.nome_esposa && (
                      <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug">
                        Esposa: <span className="text-gray-100 font-bold"> {visitante.nome_esposa} </span>
                      </p>
                    )}

                    {nomesFilhos.length > 0 && (
                       <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug break-words">
                        Filhos: <span className="text-gray-100 font-bold"> {formatarLista(nomesFilhos)} </span>
                      </p>
                    )}

                    {nomesAcompanhantes.length > 0 && (
                      <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug break-words">
                        Acompanhantes: <span className="text-gray-100 font-bold"> {formatarLista(nomesAcompanhantes)} </span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 w-full pt-6 mt-4 border-t border-gray-800">
                    <form id="form-apresentar" action={async () => {
                      "use server";
                      await toggleStatusApresentacao(visitante.id, visitante.foi_apresentado);
                    }}>
                      <button 
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-5 md:py-6 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-4 text-2xl md:text-3xl uppercase tracking-wide"
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
        
        {/* Script para atalho do teclado garantido */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') {
              const form = document.getElementById('form-apresentar');
              if (form) {
                form.requestSubmit();
              }
            }
          });
        `}} />
      </div>
    </>
  )
}