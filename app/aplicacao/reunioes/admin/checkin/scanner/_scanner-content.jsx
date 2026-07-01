'use client'

/**
 * Conteúdo do Scanner - Envolvido em Suspense Boundary
 * Separa o uso de useSearchParams do page.jsx
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Normaliza CPF removendo tudo que não é dígito
function normalizarCPF(cpf) {
  return (cpf || '').replace(/\D/g, '')
}

// Formata CPF para exibição
function formatarCPF(cpf) {
  const d = normalizarCPF(cpf)
  if (d.length !== 11) return cpf
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function iniciais(nome) {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

const COR_CARGO = {
  'Pastor':      { bg: '#FEF3C7', text: '#92400E' },
  'Evangelista': { bg: '#EDE9FE', text: '#5B21B6' },
  'Presbítero':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Diácono':     { bg: '#D1FAE5', text: '#065F46' },
  'Cooperador':  { bg: '#FCE7F3', text: '#9D174D' },
  'Membro':      { bg: '#F3F4F6', text: '#374151' },
}

export function ScannerContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  useReuniaoAuth()
  const reuniaoId    = searchParams.get('reuniao')
  const reuniaoTitulo = searchParams.get('titulo')

  const scannerRef   = useRef(null)
  const html5QrRef   = useRef(null)
  const processandoRef = useRef(false)

  const [modo, setModo]           = useState('scanner')  // 'scanner' | 'resultado' | 'erro' | 'jaPresente'
  const [obreiro, setObreiro]     = useState(null)
  const [mensagemErro, setMensagemErro] = useState('')
  const [scanAtivo, setScanAtivo] = useState(false)

  // ── Inicia o scanner ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!reuniaoId) { router.push('/aplicacao/reunioes/admin/checkin'); return }

    let scanner = null

    async function iniciarScanner() {
      const { Html5Qrcode } = await import('html5-qrcode')

      scanner = new Html5Qrcode('qr-reader')
      html5QrRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },  // câmera traseira
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (texto) => onScanSucesso(texto, scanner),
          () => {}  // silencia erros de frame sem código
        )
        setScanAtivo(true)
      } catch (err) {
        setMensagemErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
        setModo('erro')
      }
    }

    iniciarScanner()

    return () => {
      if (html5QrRef.current?.isScanning) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [reuniaoId])

  // ── Processa o código lido ─────────────────────────────────────────────────
  async function onScanSucesso(texto, scanner) {
    // Evita processar múltiplas leituras simultâneas
    if (processandoRef.current) return
    processandoRef.current = true

    // Para o scanner enquanto processa
    if (scanner?.isScanning) await scanner.stop().catch(() => {})
    setScanAtivo(false)

    const cpfLido = normalizarCPF(texto)

    if (!cpfLido || cpfLido.length < 11) {
      setMensagemErro(`Código lido: "${texto}"\n\nNão parece um CPF válido. O cartão deve conter apenas o número do CPF.`)
      setModo('erro')
      processandoRef.current = false
      return
    }

    // Busca obreiro pelo CPF (tenta todas as variações de formatação)
    const { data: obreiros } = await supabase
      .from('obreiro_cadastro')
      .select('id, nome, cpf, obreiro_congregacoes(nome), obreiro_cargos(nome)')
      .eq('situacao', 'Ativo')

    // Compara CPFs normalizados (remove pontos, traços, etc.)
    const encontrado = obreiros?.find(o => normalizarCPF(o.cpf) === cpfLido)

    if (!encontrado) {
      setMensagemErro(`CPF ${formatarCPF(cpfLido)} não encontrado.\n\nVerifique se o obreiro está cadastrado e se o CPF está registrado no sistema.`)
      setModo('erro')
      processandoRef.current = false
      return
    }

    // Verifica se já fez check-in
    const { data: presencaExistente } = await supabase
      .from('obreiro_presencas')
      .select('id')
      .eq('reuniao_id', reuniaoId)
      .eq('obreiro_id', encontrado.id)
      .single()

    if (presencaExistente) {
      setObreiro(encontrado)
      setModo('jaPresente')
      processandoRef.current = false
      return
    }

    // Registra a presença
    const { error } = await supabase.from('obreiro_presencas').insert({
      reuniao_id:     reuniaoId,
      obreiro_id:     encontrado.id,
      presente:       true,
      metodo_checkin: 'qrcode',
    })

    if (error) {
      setMensagemErro('Erro ao registrar presença. Tente novamente.')
      setModo('erro')
    } else {
      setObreiro(encontrado)
      setModo('resultado')
    }

    processandoRef.current = false
  }

  // ── Reinicia o scanner após resultado ─────────────────────────────────────
  async function reiniciarScanner() {
    setModo('scanner')
    setObreiro(null)
    setMensagemErro('')
    processandoRef.current = false

    if (html5QrRef.current && !html5QrRef.current.isScanning) {
      try {
        await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
          (texto) => onScanSucesso(texto, html5QrRef.current),
          () => {}
        )
        setScanAtivo(true)
      } catch {}
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-gray-800">{reuniaoTitulo || 'Reunião'}</h1>
        <div className="w-24"></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center">
        {modo === 'scanner' && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" ref={scannerRef}></div>
              <p className="text-center text-gray-500 mt-4 text-sm">
                {scanAtivo ? '📱 Aponte para o código de barras' : '⏳ Iniciando câmera...'}
              </p>
            </div>
          </div>
        )}

        {modo === 'resultado' && obreiro && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{obreiro.nome}</h2>
              <p className="text-gray-500 mb-6">Presença registrada com sucesso!</p>
              <button
                onClick={reiniciarScanner}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Escanear próximo
              </button>
            </div>
          </div>
        )}

        {modo === 'jaPresente' && obreiro && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{obreiro.nome}</h2>
              <p className="text-gray-500 mb-6">Este obreiro já registrou presença nesta reunião.</p>
              <button
                onClick={reiniciarScanner}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Volta ao scanner
              </button>
            </div>
          </div>
        )}

        {modo === 'erro' && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">❌</div>
              <p className="text-gray-500 mb-6 whitespace-pre-line">{mensagemErro}</p>
              <button
                onClick={reiniciarScanner}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
