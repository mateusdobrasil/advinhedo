'use client'

export default function BotaoImprimir() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-2 print:hidden"
    >
      🖨️ Gerar Relatório
    </button>
  )
}