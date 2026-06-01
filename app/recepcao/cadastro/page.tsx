"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import logo from "../../imgs/logo.png";

export default function CadastroVisitante() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [eventoAtivoId, setEventoAtivoId] = useState<string | null>(null);
  const [nomeEvento, setNomeEvento] = useState<string>(""); 

  useEffect(() => {
    const carregarEvento = async () => {
      const cookieEvento = document.cookie
        .split('; ')
        .find(row => row.startsWith('evento_ativo='))
        ?.split('=')[1];

      if (cookieEvento) {
        setEventoAtivoId(cookieEvento);
        const { data } = await supabase.from('eventos').select('nome_evento').eq('id', cookieEvento).single();
        if (data) setNomeEvento(data.nome_evento);
      } else {
        alert("Nenhum evento selecionado. Redirecionando para o painel principal...");
        router.push("/recepcao");
      }
    };
    carregarEvento();
  }, [router, supabase]);

  // Estados Base
  const [tipo, setTipo] = useState("Visitas");
  const [nome, setNome] = useState(""); // Usado para Visitante, Aniversariante, Para quem, Quem Agradece ou Quem Avisa
  const [representadoPor, setRepresentadoPor] = useState(""); // Usado para Representado, Quem Pediu (Oração) ou Quem Parabeniza (Aniversário)
  const [observacoes, setObservacoes] = useState(""); // Usado para Obs, Pedido, Agradecimento ou Aviso
  
  // Específicos de Visitas
  const [setor, setSetor] = useState("");
  const [esposa, setEsposa] = useState("");
  const [temFilhos, setTemFilhos] = useState(false);
  const [temAcompanhantes, setTemAcompanhantes] = useState(false);
  const [filhos, setFilhos] = useState<string[]>([""]);
  const [acompanhantes, setAcompanhantes] = useState<string[]>([""]);

  // Específicos de Aniversário
  const [dataAniversario, setDataAniversario] = useState("");

  const adicionarCampo = (setter: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => setter([...state, ""]);
  const atualizarArray = (index: number, valor: string, setter: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => {
    const novoArray = [...state];
    novoArray[index] = valor;
    setter(novoArray);
  };
  const removerCampo = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => {
    const novoArray = state.filter((_, i) => i !== index);
    setter(novoArray.length > 0 ? novoArray : [""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoAtivoId) return;

    setLoading(true);
    setMensagem("");

    try {
      // 1. Inserir no banco de dados com a lógica condicional
      const { data: visitante, error: errorVisitante } = await supabase
        .from('visitantes')
        .insert([{
          evento_id: eventoAtivoId, 
          tipo: tipo,
          nome_visitante: nome, 
          representado_por: (tipo === 'Visitas' || tipo === 'Pedido de Oraçao' || tipo === 'Aniversários') ? representadoPor : null,
          observacoes: (tipo !== 'Visitas') ? observacoes : null,
          data_aniversario: (tipo === 'Aniversários') ? dataAniversario : null,
          // Campos exclusivos de visitas
          setor_trabalho: tipo === 'Visitas' ? setor : null,
          nome_esposa: tipo === 'Visitas' ? esposa : null,
          tem_filhos: tipo === 'Visitas' ? temFilhos : false,
          tem_acompanhantes: tipo === 'Visitas' ? temAcompanhantes : false
        }])
        .select()
        .single();

      if (errorVisitante) throw errorVisitante;

      // 2. Salvar dependentes SOMENTE se for Visitas
      if (tipo === 'Visitas') {
        const dependentes: any[] = [];
        if (temFilhos) {
          filhos.filter(f => f.trim() !== "").forEach(f => {
            dependentes.push({ visitante_id: visitante.id, evento_id: eventoAtivoId, nome: f, tipo: 'FILHO' });
          });
        }
        if (temAcompanhantes) {
          acompanhantes.filter(a => a.trim() !== "").forEach(a => {
            dependentes.push({ visitante_id: visitante.id, evento_id: eventoAtivoId, nome: a, tipo: 'ACOMPANHANTE' });
          });
        }
        if (dependentes.length > 0) {
          const { error: errorDependentes } = await supabase.from('dependentes_acompanhantes').insert(dependentes);
          if (errorDependentes) throw errorDependentes;
        }
      }

      setMensagem(`${tipo} registrado com sucesso!`);
      
      // Resetar todos os estados
      setTipo("Visitas");
      setNome(""); setRepresentadoPor(""); setObservacoes(""); setDataAniversario("");
      setSetor(""); setEsposa(""); setTemFilhos(false); setTemAcompanhantes(false);
      setFilhos([""]); setAcompanhantes([""]);
      
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setMensagem("Erro ao cadastrar. Verifique a conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Lógica para mudar os rótulos dependendo do tipo selecionado
  let labelNome = "Nome Principal *";
  if (tipo === "Visitas") labelNome = "Nome do Visitante *";
  if (tipo === "Aniversários") labelNome = "Nome do Aniversariante *";
  if (tipo === "Pedido de Oraçao") labelNome = "Para quem é a oração? *";
  if (tipo === "Agradecimento") labelNome = "Quem está agradecendo? *";
  if (tipo === "Aviso") labelNome = "Quem está dando o aviso? (Ou título) *";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <img src={logo.src} alt="Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Novo Registro</h1>
              <p className="text-sm font-bold text-blue-600 mt-1">Evento: {nomeEvento || "Carregando..."}</p>
            </div>
          </div>
          <Link href="/recepcao" className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
            ← Voltar ao Painel
          </Link>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-md font-medium ${mensagem.includes("sucesso") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {mensagem}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SELEÇÃO DO TIPO */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-blue-700 mb-1">O que deseja cadastrar? *</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="w-full p-3 border-2 border-blue-200 bg-blue-50 text-blue-900 
                rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold">
                <option value="Visitas">Visitas</option>
                <option value="Aniversários">Aniversários</option>
                <option value="Pedido de Oraçao">Pedido de Oração</option>
                <option value="Agradecimento">Agradecimento</option>
                <option value="Aviso">Aviso</option>
              </select>
            </div>

            {/* --- ORDENAÇÃO EXCLUSIVA: QUEM PEDIU ANTES DE QUEM VAI RECEBER A ORAÇÃO --- */}
            {tipo === "Pedido de Oraçao" && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quem pediu? (Opcional)</label>
                <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nome de quem está fazendo o pedido..." />
              </div>
            )}

            {/* CAMPO PRINCIPAL (DINÂMICO) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{labelNome}</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            {/* --- CAMPOS EXCLUSIVOS: VISITAS --- */}
            {tipo === "Visitas" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vindo de: (Local, Igreja)</label>
                  <input type="text" value={setor} onChange={(e) => setSetor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Representado por (Se houver)</label>
                  <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Esposa</label>
                  <input type="text" value={esposa} onChange={(e) => setEsposa(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </>
            )}

            {/* --- CAMPOS EXCLUSIVOS: ANIVERSÁRIOS --- */}
            {tipo === "Aniversários" && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quem parabeniza? (Opcional)</label>
                  <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Família, amigos, departamento..." />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Aniversário *</label>
                  <input type="date" required value={dataAniversario} onChange={(e) => setDataAniversario(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Detalhes</label>
                  <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Está completando 15 anos..."></textarea>
                </div>
              </>
            )}

            {/* --- CAMPOS EXCLUSIVOS: PEDIDO DE ORAÇÃO --- */}
            {tipo === "Pedido de Oraçao" && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qual é o pedido? *</label>
                  <textarea value={observacoes} required onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Motivo da oração (saúde, família, porta de emprego...)"></textarea>
                </div>
              </>
            )}

            {/* --- CAMPOS EXCLUSIVOS: AGRADECIMENTO --- */}
            {tipo === "Agradecimento" && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Agradecimento *</label>
                <textarea 
                  value={observacoes} 
                  required 
                  onChange={(e) => setObservacoes(e.target.value)} 
                  rows={4} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Escreva os detalhes e o motivo do agradecimento aqui..."
                ></textarea>
              </div>
            )}

            {/* --- CAMPOS EXCLUSIVOS: AVISO --- */}
            {tipo === "Aviso" && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aviso / Recado *</label>
                  <textarea value={observacoes} required onChange={(e) => setObservacoes(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Escreva o aviso completo aqui..."></textarea>
                </div>
              </>
            )}

          </div>

          {/* RENDERIZA FILHOS/ACOMPANHANTES APENAS SE FOR VISITAS */}
          {tipo === "Visitas" && (
            <>
              <hr className="border-gray-100 mt-6" />
              
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer mb-4">
                  <input type="checkbox" checked={temFilhos} onChange={(e) => setTemFilhos(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-800 font-medium">Possui filhos acompanhando?</span>
                </label>
                {temFilhos && (
                  <div className="pl-6 space-y-3 border-l-2 border-blue-100">
                    {filhos.map((filho, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Nome do Filho {index + 1}</label>
                          <input type="text" value={filho} onChange={(e) => atualizarArray(index, e.target.value, setFilhos, filhos)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        {filhos.length > 1 && (
                          <button type="button" onClick={() => removerCampo(index, setFilhos, filhos)} className="text-red-500 hover:text-red-700 p-2 font-medium">X</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => adicionarCampo(setFilhos, filhos)} className="text-sm text-blue-600 font-medium hover:underline mt-2">+ Adicionar outro filho</button>
                  </div>
                )}
              </div>

              <hr className="border-gray-100 mt-4" />

              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer mb-4">
                  <input type="checkbox" checked={temAcompanhantes} onChange={(e) => setTemAcompanhantes(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-gray-800 font-medium">Possui outros acompanhantes?</span>
                </label>
                {temAcompanhantes && (
                  <div className="pl-6 space-y-3 border-l-2 border-green-100">
                    {acompanhantes.map((acompanhante, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Nome do Acompanhante {index + 1}</label>
                          <input type="text" value={acompanhante} onChange={(e) => atualizarArray(index, e.target.value, setAcompanhantes, acompanhantes)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
                        </div>
                        {acompanhantes.length > 1 && (
                          <button type="button" onClick={() => removerCampo(index, setAcompanhantes, acompanhantes)} className="text-red-500 hover:text-red-700 p-2 font-medium">X</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => adicionarCampo(setAcompanhantes, acompanhantes)} className="text-sm text-green-600 font-medium hover:underline mt-2">+ Adicionar outro acompanhante</button>
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" disabled={loading || !eventoAtivoId} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 mt-8 text-lg">
            {loading ? "Salvando..." : "Salvar Registro"}
          </button>
        </form>
      </div>
    </div>
  );
}