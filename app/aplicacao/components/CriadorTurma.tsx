'use client'

import { useState } from 'react'
import { criarTurma } from '../actions/turmas'

interface CriadorTurmaProps {
  turma?: any 
  cursosDisponiveis?: any[] 
  ebdSalasConfig?: any[] // <-- Nova propriedade dinâmica
}

export default function CriadorTurma({ turma, cursosDisponiveis = [], ebdSalasConfig = [] }: CriadorTurmaProps) {
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [isEbd, setIsEbd] = useState(turma?.is_ebd || false)
  
  const isEdicao = !!turma 

  if (!aberto) {
    return (
      <button 
        onClick={() => setAberto(true)}
        className={isEdicao 
          ? "p-2 text-gray-500 hover:text-blue-600 bg-gray-50 rounded-lg border border-gray-200 transition" 
          : "bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"}
      >
        {isEdicao ? '✏️' : '+ Nova Turma'}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl text-left max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
          {isEdicao ? 'Editar Turma' : 'Cadastrar Nova Turma'}
        </h3>
        
        <form action={async (formData) => {
          setCarregando(true)
          await criarTurma(formData) 
          setCarregando(false)
          setAberto(false)
        }} className="space-y-4">
          
          {isEdicao && <input type="hidden" name="id" value={turma.id} />}

          {/* TOGGLE EBD */}
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="font-bold text-orange-800">Classe da EBD?</h4>
              <p className="text-xs text-orange-600">Ative se esta turma fizer parte da Escola Bíblica Dominical.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="is_ebd" 
                className="sr-only peer" 
                checked={isEbd}
                onChange={() => setIsEbd(!isEbd)}
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma / Classe</label>
              <input type="text" name="nome" defaultValue={turma?.nome} placeholder="Ex: Classe dos Jovens" required className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>
            
            {/* RENDERIZAÇÃO DINÂMICA DA FAIXA ETÁRIA COMPRADA DO BANCO */}
            {isEbd && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Classificação / Faixa Etária</label>
                <select name="faixa_etaria" defaultValue={turma?.faixa_etaria || ''} className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500">
                  <option value="" disabled>Selecione a classificação da sala...</option>
                  {ebdSalasConfig.map(sala => (
                    <option key={sala.id} value={`${sala.nome} (${sala.faixa_etaria})`}>
                      {sala.nome} — ({sala.faixa_etaria})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso Vinculado</label>
              <select name="curso" defaultValue={turma?.curso || ''} className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value="">Sem curso (Livre)</option>
                {cursosDisponiveis.map(c => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
              <select name="modalidade" defaultValue={turma?.modalidade || 'Presencial'} className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value="Presencial">Presencial</option>
                <option value="Virtual (100%)">Virtual (100%)</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
              <select name="dia_semana" defaultValue={turma?.dia_semana || (isEbd ? 'Domingo' : 'Segunda-feira')} className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                <option value="Domingo">Domingo</option>
                <option value="Segunda-feira">Segunda-feira</option>
                <option value="Terça-feira">Terça-feira</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Quinta-feira">Quinta-feira</option>
                <option value="Sexta-feira">Sexta-feira</option>
                <option value="Sábado">Sábado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <input type="text" name="horario" defaultValue={turma?.horario || (isEbd ? '09:00 às 11:00' : '19:30 às 22:00')} required className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" />
            </div>

            {isEdicao && (
              <div className="col-span-2 border-t pt-4 mt-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Status da Turma</label>
                <select name="status" defaultValue={turma?.status || 'Ativa'} className="w-full border p-2.5 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500">
                  <option value="Ativa">🟢 Ativa (Operacional)</option>
                  <option value="Inativa">🔴 Inativa (Encerrada)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
            <button type="submit" disabled={carregando} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
              {carregando ? 'Salvando...' : (isEdicao ? 'Salvar Alterações' : 'Salvar Turma')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}