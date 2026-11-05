'use client'

interface Props {
  nomeArquivo: string
  cabecalho: string[]
  linhas: (string | number)[][]
  rotulo?: string
}

// Gera um CSV com separador ";" e BOM UTF-8 para abrir corretamente no Excel em pt-BR.
export default function BotaoExportarCSV({ nomeArquivo, cabecalho, linhas, rotulo = 'Baixar Planilha (CSV)' }: Props) {
  const baixar = () => {
    if (linhas.length === 0) {
      alert('Não há dados para exportar.')
      return
    }

    const escapar = (valor: string | number) => {
      const texto = String(valor ?? '')
      return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
    }

    const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\r\n')
    const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={baixar}
      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition flex items-center gap-2 print:hidden"
    >
      📥 {rotulo}
    </button>
  )
}
