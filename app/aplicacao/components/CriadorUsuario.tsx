'use client'

import { useState, useEffect } from 'react'
import { criarUsuario } from '../actions/usuarios'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CriadorUsuario() {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false) // 👇 Novo estado de sucesso

  // Estados para os polos
  const [polos, setPolos] = useState<any[]>([])
  const [carregandoPolos, setCarregandoPolos] = useState(true)

  // Busca os polos no banco apenas quando o modal é aberto
  useEffect(() => {
    if (!aberto) return;

    const fetchPolos = async () => {
      setCarregandoPolos(true)
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
  }, [aberto])

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm">
        + Novo Usuário
      </button>
    )
  }

  const handleSubmit = async (formData: FormData) => {
    setCarregando(true)
    setErro('')
    
    // Injetar o NOME do polo dinamicamente no formData antes de enviar
    const poloId = formData.get('polo_id')
    const poloSelecionado = polos.find(p => p.id === poloId)
    
    if (poloSelecionado) {
      formData.append('polo', poloSelecionado.nome)
    }

    // Injetar a senha padrão invisível
    formData.append('senha', 'ADvinhedo')
    formData.append('password', 'ADvinhedo')

    try {
      await criarUsuario(formData)
      
      // 👇 NOVA LÓGICA DE SUCESSO 👇
      setSucesso(true)
      setTimeout(() => {
        setSucesso(false) // Reseta o estado
        setAberto(false)  // Fecha o modal voltando para a tela atual
      }, 2000) // Aguarda 2 segundos
      
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  // 👇 TELA DE SUCESSO (Exibida durante os 2 segundos) 👇
  if (sucesso) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl text-center border border-green-100">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-black text-gray-800 mb-2">Usuário Criado!</h3>
          <p className="text-gray-500 font-medium">O cadastro foi concluído com sucesso.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Cadastrar no Sistema</h3>
        
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}

        <form action={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input type="text" name="nome_completo" required placeholder="Ex: João da Silva" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input type="email" name="email" required placeholder="joao@email.com" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input type="text" name="cpf" placeholder="000.000.000-00" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Polo de Estudo *</label>
            <select name="polo_id" required defaultValue="" disabled={carregandoPolos} className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed">
              <option value="" disabled>
                {carregandoPolos ? 'Carregando polos...' : 'Selecione o polo...'}
              </option>
              {polos.map(polo => (
                <option key={polo.id} value={polo.id}>
                  {polo.nome} {polo.tipo ? `- ${polo.tipo}` : ''} {polo.cidade ? `(${polo.cidade})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition">
              {carregando ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}