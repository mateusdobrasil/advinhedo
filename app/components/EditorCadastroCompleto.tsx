'use client'

import { useState } from 'react'
import { atualizarUsuario } from '../actions/usuarios'

interface EditorCadastroCompletoProps {
  usuario: any
  polos: any[]
}

export default function EditorCadastroCompleto({ usuario, polos }: EditorCadastroCompletoProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function handleAcao(formData: FormData) {
    setCarregando(true)
    try {
      await atualizarUsuario(formData)
      setAberto(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setAberto(true)} 
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-sm"
      >
        ✏️ Editar Cadastro
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Header Fixo */}
            <div className="bg-blue-900 p-6 text-white sticky top-0 z-10 shadow-md flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Ficha de Edição Completa</h2>
                <p className="text-xs text-blue-200 mt-1">Alterando dados de: {usuario.nome_completo}</p>
              </div>
              <button onClick={() => setAberto(false)} className="text-white hover:text-red-300 font-bold text-xl">&times;</button>
            </div>
            
            <form action={handleAcao} className="p-8 space-y-8">
              <input type="hidden" name="id" value={usuario.id} />
              
              {/* 0. CONTROLES ADMINISTRATIVOS */}
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-red-800 border-b pb-2 mb-4">0. Controles Administrativos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Polo Vinculado</label>
                    {/* 👇 CORRIGIDO: name alterado para polo_id e value para p.id */}
                    <select name="polo_id" defaultValue={usuario.polo_id || ''} className="w-full border p-2 rounded-md bg-gray-50">
                      <option value="">Selecione um polo...</option>
                      {polos.map((p) => <option key={p.id} 
                        value={p.id}>{p.nome}{p.tipo ? ` - ${p.tipo}` : ''} {p.cidade ? `(${p.cidade})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nível de Acesso (Cargo)</label>
                    <select name="tipo_usuario" defaultValue={usuario.tipo_usuario || 'aluno'} className="w-full border p-2 rounded-md bg-gray-50">
                      <option value="aluno">🎓 Aluno</option>
                      <option value="professor">👨‍🏫 Administrativo</option>
                      <option value="administrador">⚙️ Administrador</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 1. DADOS PESSOAIS */}
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">1. Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm text-gray-700 mb-1">Nome Completo</label><input type="text" name="nome_completo" defaultValue={usuario.nome_completo} required className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Celular/WhatsApp</label><input type="text" name="telefone" defaultValue={usuario.telefone} required className="w-full border p-2 rounded-md" /></div>
                  
                  <div><label className="block text-sm text-gray-700 mb-1">Data Nasc.</label><input type="date" name="data_nascimento" defaultValue={usuario.data_nascimento} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Sexo</label>
                    <select name="sexo" defaultValue={usuario.sexo} className="w-full border p-2 rounded-md">
                      <option value="">Selecione...</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-gray-700 mb-1">Estado Civil</label>
                    <select name="estado_civil" defaultValue={usuario.estado_civil} className="w-full border p-2 rounded-md">
                      <option value="">Selecione...</option><option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>

                  <div><label className="block text-sm text-gray-700 mb-1">CPF</label><input type="text" name="cpf" defaultValue={usuario.cpf} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">RG</label><input type="text" name="rg" defaultValue={usuario.rg} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Nacionalidade</label><input type="text" name="nacionalidade" defaultValue={usuario.nacionalidade || 'Brasileira'} className="w-full border p-2 rounded-md" /></div>
                  
                  <div><label className="block text-sm text-gray-700 mb-1">Cidade de Nascimento</label><input type="text" name="cidade_nascimento" defaultValue={usuario.cidade_nascimento} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Estado (UF)</label><input type="text" name="estado_nascimento" defaultValue={usuario.estado_nascimento} maxLength={2} className="w-full border p-2 rounded-md uppercase" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Profissão</label><input type="text" name="profissao" defaultValue={usuario.profissao} className="w-full border p-2 rounded-md" /></div>
                </div>
              </section>

              {/* 2. ENDEREÇO */}
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">2. Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3"><label className="block text-sm text-gray-700 mb-1">Endereço (Rua, Número)</label><input type="text" name="endereco" defaultValue={usuario.endereco} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Complemento</label><input type="text" name="complemento" defaultValue={usuario.complemento} className="w-full border p-2 rounded-md" /></div>
                  
                  <div className="md:col-span-1"><label className="block text-sm text-gray-700 mb-1">Bairro</label><input type="text" name="bairro" defaultValue={usuario.bairro} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Cidade</label><input type="text" name="cidade" defaultValue={usuario.cidade} className="w-full border p-2 rounded-md" /></div>
                  {/* 👇 Campo de Estado (UF) incluído */}
                  <div><label className="block text-sm text-gray-700 mb-1">Estado (UF)</label><input type="text" name="estado" defaultValue={usuario.estado} maxLength={2} className="w-full border p-2 rounded-md uppercase" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">CEP</label><input type="text" name="cep" defaultValue={usuario.cep} className="w-full border p-2 rounded-md" /></div>
                </div>
              </section>

              {/* 3. ACADÊMICO */}
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">3. Perfil Acadêmico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-700 mb-1">Escolaridade Secular</label>
                    <select name="escolaridade" defaultValue={usuario.escolaridade} className="w-full border p-2 rounded-md bg-white">
                      <option value="">Selecione...</option><option value="Ensino Fundamental">Ensino Fundamental</option><option value="Ensino Médio">Ensino Médio</option><option value="Ensino Superior">Ensino Superior</option><option value="Pós-graduação">Pós-graduação</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-gray-700 mb-1">Qual Curso? (Se superior)</label><input type="text" name="qual_curso" defaultValue={usuario.qual_curso} className="w-full border p-2 rounded-md" /></div>
                  
                  <div><label className="block text-sm text-gray-700 mb-1">Já possui curso de Teologia?</label>
                    <select name="possui_teologia" defaultValue={usuario.possui_teologia || 'Não'} className="w-full border p-2 rounded-md bg-white"><option value="Não">Não</option><option value="Sim">Sim</option></select>
                  </div>
                  <div><label className="block text-sm text-gray-700 mb-1">Se sim, qual?</label><input type="text" name="qual_teologia" defaultValue={usuario.qual_teologia} className="w-full border p-2 rounded-md" /></div>
                  <div className="md:col-span-2"><label className="block text-sm text-gray-700 mb-1">Onde cursou?</label><input type="text" name="onde_teologia" defaultValue={usuario.onde_teologia} className="w-full border p-2 rounded-md" /></div>
                </div>
              </section>

              {/* 4. HISTÓRICO ECLESIÁSTICO */}
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">4. Histórico Eclesiástico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-700 mb-1">Igreja Atual</label><input type="text" name="igreja" defaultValue={usuario.igreja} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Local da Igreja</label><input type="text" name="local_igreja" defaultValue={usuario.local_igreja} className="w-full border p-2 rounded-md" /></div>
                  
                  <div><label className="block text-sm text-gray-700 mb-1">Nome do Pastor</label><input type="text" name="pastor" defaultValue={usuario.pastor} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Departamento de atuação</label><input type="text" name="departamento" defaultValue={usuario.departamento} className="w-full border p-2 rounded-md" /></div>

                  <div><label className="block text-sm text-gray-700 mb-1">Possui Cargo?</label>
                    <select name="possui_cargo" defaultValue={usuario.possui_cargo || 'Não'} className="w-full border p-2 rounded-md bg-white"><option value="Não">Não</option><option value="Sim">Sim</option></select>
                  </div>
                  <div><label className="block text-sm text-gray-700 mb-1">Qual Cargo?</label><input type="text" name="qual_cargo" defaultValue={usuario.qual_cargo} className="w-full border p-2 rounded-md" /></div>
                  
                  <div><label className="block text-sm text-gray-700 mb-1">Data de Conversão</label><input type="date" name="data_conversao" defaultValue={usuario.data_conversao} className="w-full border p-2 rounded-md" /></div>
                  <div><label className="block text-sm text-gray-700 mb-1">Data de Batismo</label><input type="date" name="data_batismo" defaultValue={usuario.data_batismo} className="w-full border p-2 rounded-md" /></div>
                </div>
              </section>

              {/* Botões Finais Sticky */}
              <div className="sticky bottom-0 bg-gray-50 pt-4 pb-4 border-t flex gap-4">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 bg-gray-200 p-4 rounded-xl font-bold text-gray-700 hover:bg-gray-300 transition">
                  Cancelar Edição
                </button>
                <button type="submit" disabled={carregando} className="flex-1 bg-blue-600 p-4 rounded-xl font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                  {carregando ? 'Salvando Dados...' : 'Salvar Ficha Completa'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}