'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cadastrarAluno } from '../actions/cadastro'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CadastroPage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Estados para os polos
  const [polos, setPolos] = useState<any[]>([])
  const [carregandoPolos, setCarregandoPolos] = useState(true)

  useEffect(() => {
    const fetchPolos = async () => {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('polos')
        .select('id, nome, cidade, tipo')
        .order('nome')
        
      if (data) setPolos(data)
      if (error) console.error("Erro ao buscar polos:", error)
      setCarregandoPolos(false)
    }
    fetchPolos()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    
    const formData = new FormData(e.currentTarget)

    try {
      await cadastrarAluno(formData)
      setSucesso(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      setErro(err.message)
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-green-100 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Cadastro Realizado!</h2>
          <p className="text-gray-600">Sua conta foi criada com sucesso. Você será redirecionado para o login em instantes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-indigo-900 py-8 px-8 text-center text-white">
          <h1 className="text-3xl font-black mb-2">Portal do Aluno</h1>
          <p className="text-indigo-200">Preencha o formulário completo abaixo para realizar sua matrícula.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-8 font-medium">
              {erro}
            </div>
          )}

          {/* ========================================================= */}
          {/* SESSÃO 1: DADOS DE ACESSO */}
          {/* ========================================================= */}
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6">Acesso ao Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail *</label>
              <input type="email" name="email" required placeholder="seu@email.com" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Polo de Vínculo *</label>
              <select name="polo_id" required defaultValue="" disabled={carregandoPolos} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed">
                <option value="" disabled>{carregandoPolos ? 'Carregando...' : 'Selecione a unidade...'}</option>
                {polos.map(polo => (
                  <option key={polo.id} value={polo.id}>
                    {polo.nome} {polo.tipo ? `- ${polo.tipo}` : ''} {polo.cidade ? `(${polo.cidade})` : ''}
                  </option> 
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Senha de Acesso *</label>
              <input type="password" name="senha" required minLength={6} placeholder="Crie uma senha forte" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SESSÃO 2: DADOS PESSOAIS */}
          {/* ========================================================= */}
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6 mt-10">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo *</label>
              <input type="text" name="nome" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" name="telefone" placeholder="(00) 00000-0000" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
              <input type="date" name="data_nascimento" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
              <input type="text" name="cpf" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">RG</label>
              <input type="text" name="rg" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nacionalidade</label>
              <input type="text" name="nacionalidade" defaultValue="Brasileira" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cidade Nasc.</label>
                <input type="text" name="cidade_nascimento" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado Nasc.</label>
                <input type="text" name="estado_nascimento" placeholder="SP, RJ..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Sexo</label>
              <select name="sexo" defaultValue="" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="" disabled>Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estado Civil</label>
              <select name="estado_civil" defaultValue="" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="" disabled>Selecione...</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Profissão</label>
              <input type="text" name="profissao" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SESSÃO 3: ENDEREÇO */}
          {/* ========================================================= */}
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6 mt-10">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Rua, Avenida, etc.</label>
              <input type="text" name="endereco" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Complemento / Número</label>
              <input type="text" name="complemento" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
              <input type="text" name="bairro" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cidade</label>
              <input type="text" name="cidade" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                <input type="text" name="estado" placeholder="SP" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
                <input type="text" name="cep" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SESSÃO 4: FORMAÇÃO SECULAR E TEOLÓGICA */}
          {/* ========================================================= */}
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6 mt-10">Formação Escolar e Teológica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Escolaridade Secular</label>
              <select name="escolaridade" defaultValue="" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="" disabled>Selecione...</option>
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Ensino Superior">Ensino Superior</option>
                <option value="Pós-graduação">Pós-graduação</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Qual o curso? (Se houver)</label>
              <input type="text" name="qual_curso" placeholder="Ex: Administração" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Possui formação Teológica?</label>
              <select name="possui_teologia" defaultValue="Não" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Qual Teologia?</label>
              <input type="text" name="qual_teologia" placeholder="Básico, Médio, Bacharel..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Onde cursou Teologia?</label>
              <input type="text" name="onde_teologia" placeholder="Instituição de ensino" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SESSÃO 5: HISTÓRICO ECLESIÁSTICO */}
          {/* ========================================================= */}
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-6 mt-10">Histórico Eclesiástico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Igreja Atual</label>
              <input type="text" name="igreja" placeholder="Nome da Igreja" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Local da Igreja (Cidade)</label>
              <input type="text" name="local_igreja" placeholder="Onde fica a igreja?" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Pastor</label>
              <input type="text" name="pastor" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Departamento (Ministério)</label>
              <input type="text" name="departamento" placeholder="Ex: Jovens, Louvor, Ensino..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Possui Cargo?</label>
              <select name="possui_cargo" defaultValue="Não" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Qual Cargo?</label>
              <input type="text" name="qual_cargo" placeholder="Membro, Obreiro, Diácono..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Conversão</label>
              <input type="date" name="data_conversao" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data de Batismo</label>
              <input type="date" name="data_batismo" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t pt-8">
            <Link href="/" className="text-indigo-600 font-bold hover:underline">
              Já tenho uma conta (Login)
            </Link>
            <button 
              type="submit" 
              disabled={carregando}
              className="w-full sm:w-auto bg-indigo-600 text-white font-bold text-lg px-10 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {carregando ? 'Processando...' : 'Finalizar Matrícula'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}