"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function EditarVisitante() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClientComponentClient();

  // Estados de Controle
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
 
  // Estados Base (Dinâmicos baseados no Tipo)
  const [tipo, setTipo] = useState("Visitas");
  const [nome, setNome] = useState("");
  const [representadoPor, setRepresentadoPor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  // Específicos de Visitas
  const [setor, setSetor] = useState("");
  const [esposa, setEsposa] = useState("");
  const [temFilhos, setTemFilhos] = useState(false);
  const [temAcompanhantes, setTemAcompanhantes] = useState(false);
  const [filhos, setFilhos] = useState<string[]>([""]);
  const [acompanhantes, setAcompanhantes] = useState<string[]>([""]);

  // Específicos de Aniversário
  const [dataAniversario, setDataAniversario] = useState("");

  // Busca inicial dos dados do visitante
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data, error } = await supabase
          .from('recepcao_visitantes')
          .select('*, recepcao_dependentes_acompanhantes(*)')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setTipo(data.tipo || "Visitas");
          setNome(data.nome_visitante || "");
          setRepresentadoPor(data.representado_por || "");
          setObservacoes(data.observacoes || "");
          setDataAniversario(data.data_aniversario || "");
          
          setSetor(data.setor_trabalho || "");
          setEsposa(data.nome_esposa || "");
          setTemFilhos(data.tem_filhos || false);
          setTemAcompanhantes(data.tem_acompanhantes || false);

          const dependentes = data.dependentes_acompanhantes || [];
          const listaFilhos = dependentes.filter((d: any) => d.tipo === 'FILHO').map((d: any) => d.nome);
          const listaAcompanhantes = dependentes.filter((d: any) => d.tipo === 'ACOMPANHANTE').map((d: any) => d.nome);

          setFilhos(listaFilhos.length > 0 ? listaFilhos : [""]);
          setAcompanhantes(listaAcompanhantes.length > 0 ? listaAcompanhantes : [""]);
        }
      } catch (err) {
        console.error("Erro ao carregar dados", err);
        setMensagem("Erro ao carregar os dados do registro.");
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      carregarDados();
    }
  }, [id, supabase]);

  const adicionarCampo = (setter: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => {
    setter([...state, ""]);
  };

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
    setSaving(true);
    setMensagem("");

    try {
      // 1. Atualizar tabela principal (Condicional baseada no Tipo)
      const { error: errorUpdate } = await supabase
        .from('recepcao_visitantes')
        .update({
          tipo: tipo,
          nome_visitante: nome,
          representado_por: (tipo === 'Visitas' || tipo === 'Pedido de Oraçao') ? representadoPor : null,
          observacoes: (tipo !== 'Visitas') ? observacoes : null,
          data_aniversario: (tipo === 'Aniversários') ? dataAniversario : null,
          // Campos exclusivos de visitas
          setor_trabalho: tipo === 'Visitas' ? setor : null,
          nome_esposa: tipo === 'Visitas' ? esposa : null,
          tem_filhos: tipo === 'Visitas' ? temFilhos : false,
          tem_acompanhantes: tipo === 'Visitas' ? temAcompanhantes : false
        })
        .eq('id', id);

      if (errorUpdate) throw errorUpdate;

      // 2. Limpar os dependentes antigos SEMPRE (para garantir que não sobrem lixos se o usuário mudar o tipo)
      const { error: errorDelete } = await supabase
        .from('recepcao_dependentes_acompanhantes')
        .delete()
        .eq('visitante_id', id);
      
      if (errorDelete) throw errorDelete;

      // 3. Inserir dependentes de volta SOMENTE se o tipo for Visitas
      if (tipo === 'Visitas') {
        const novosDependentes: { visitante_id: string; nome: string; tipo: string }[] = [];
        
        if (temFilhos) {
          filhos.filter(f => f.trim() !== "").forEach(f => {
            novosDependentes.push({ visitante_id: id, nome: f, tipo: 'FILHO' });
          });
        }

        if (temAcompanhantes) {
          acompanhantes.filter(a => a.trim() !== "").forEach(a => {
            novosDependentes.push({ visitante_id: id, nome: a, tipo: 'ACOMPANHANTE' });
          });
        }

        if (novosDependentes.length > 0) {
          const { error: errorInsert } = await supabase
            .from('recepcao_dependentes_acompanhantes')
            .insert(novosDependentes);
            
          if (errorInsert) throw errorInsert;
        }
      }

      setMensagem("Registro atualizado com sucesso! Redirecionando...");
      
      setTimeout(() => {
        router.push('/aplicacao/recepcao/edicao');
        router.refresh();
      }, 1500);
      
    } catch (error) {
      console.error("Erro na atualização:", error);
      setMensagem("Erro ao atualizar o registro. Verifique a conexão e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500 font-medium">Carregando dados do registro...</div>
      </div>
    );
  }

  // Lógica de rótulos dinâmicos
  let labelNome = "Nome Principal *";
  if (tipo === "Visitas") labelNome = "Nome do Visitante *";
  if (tipo === "Aniversários") labelNome = "Nome do Aniversariante *";
  if (tipo === "Pedido de Oraçao") labelNome = "Para quem é a oração? (Nome) *";
  if (tipo === "Aviso") labelNome = "Quem está dando o aviso? (Ou título) *";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Editar Registro</h1>
          <Link href="/aplicacao/recepcao/edicao" className="text-sm text-blue-600 hover:underline">
            ← Voltar para a Tabela
          </Link>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-md font-medium ${mensagem.includes("sucesso") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {mensagem}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SELEÇÃO DO TIPO */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-blue-700 mb-1">Tipo de Registro *</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="w-full p-3 border-2 border-blue-200 bg-blue-50 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              >
                <option value="Visitas">Visitas</option>
                <option value="Aniversários">Aniversários</option>
                <option value="Pedido de Oraçao">Pedido de Oração</option>
                <option value="Aviso">Aviso</option>
              </select>
              <p className="text-xs text-red-500 mt-1">Atenção: Mudar o tipo apagará os dados específicos do tipo anterior ao salvar.</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setor de Trabalho (Congregação)</label>
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
                          <button type="button" onClick={() => removerCampo(index, setFilhos, filhos)} className="text-red-500 hover:text-red-700 p-2 font-medium">
                            X
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => adicionarCampo(setFilhos, filhos)} className="text-sm text-blue-600 font-medium hover:underline mt-2">
                      + Adicionar outro filho
                    </button>
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
                          <button type="button" onClick={() => removerCampo(index, setAcompanhantes, acompanhantes)} className="text-red-500 hover:text-red-700 p-2 font-medium">
                            X
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => adicionarCampo(setAcompanhantes, acompanhantes)} className="text-sm text-green-600 font-medium hover:underline mt-2">
                      + Adicionar outro acompanhante
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Botões do Rodapé */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex gap-4">
            <button type="button" onClick={() => router.push('/aplicacao/recepcao/edicao')} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}