'use client'

/**
 * CHECK-IN POR QR CODE / CÓDIGO DE BARRAS
 * AD Vinhedo
 *
 * Coloque em: app/reunioes/checkin/scanner/page.jsx
 *
 * Dependências:
 *   npm install html5-qrcode
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

export default function ScannerPage() {
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
    if (!reuniaoId) { router.push('/reunioes/admin/checkin'); return }

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
      .from('obreiros')
      .select('id, nome, cpf, congregacoes(nome), cargos(nome)')
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
      .from('presencas')
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
    const { error } = await supabase.from('presencas').insert({
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

  // ── Desfaz check-in ────────────────────────────────────────────────────────
  async function desfazerCheckin() {
    if (!obreiro) return
    const { data } = await supabase
      .from('presencas')
      .select('id')
      .eq('reuniao_id', reuniaoId)
      .eq('obreiro_id', obreiro.id)
      .single()

    if (data) {
      await supabase.from('presencas').delete().eq('id', data.id)
    }
    reiniciarScanner()
  }

  const cor = COR_CARGO[obreiro?.cargos?.nome] || COR_CARGO['Membro']

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/reunioes/admin/checkin')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitulo}>Check-in por leitura</div>
          <div style={s.headerSub}>{reuniaoTitulo || 'Reunião de obreiros'}</div>
        </div>
      </div>

      {/* Área do scanner — sempre presente no DOM */}
      <div style={{
        ...s.scannerWrap,
        display: modo === 'scanner' ? 'flex' : 'none',
      }}>
        <p style={s.instrucao}>Aponte a câmera para o QR Code ou código de barras do cartão</p>
        <div id="qr-reader" ref={scannerRef} style={s.qrReader} />
        {scanAtivo && (
          <div style={s.scanStatus}>
            <span style={s.dot} /> Câmera ativa — aguardando leitura
          </div>
        )}
      </div>

      {/* Resultado: check-in realizado */}
      {modo === 'resultado' && obreiro && (
        <div style={s.resultadoWrap}>
          <div style={s.sucessoIcone}>✓</div>
          <h2 style={s.resultadoTitulo}>Presença registrada!</h2>

          <div style={s.obreiroCard}>
            <div style={{ ...s.avatar, background: cor.bg, color: cor.text }}>
              {iniciais(obreiro.nome)}
            </div>
            <div>
              <div style={s.obreiroNome}>{obreiro.nome}</div>
              <div style={s.obreiroSub}>
                {obreiro.congregacoes?.nome || '—'}
                {obreiro.cargos?.nome && (
                  <span style={{ ...s.badge, background: cor.bg, color: cor.text }}>
                    {obreiro.cargos.nome}
                  </span>
                )}
              </div>
              <div style={s.obreiroCpf}>{formatarCPF(obreiro.cpf)}</div>
            </div>
          </div>

          <div style={s.resultadoBtns}>
            <button style={s.btnDesfazer} onClick={desfazerCheckin}>Desfazer</button>
            <button style={s.btnProximo} onClick={reiniciarScanner}>Próximo →</button>
          </div>
        </div>
      )}

      {/* Resultado: já estava presente */}
      {modo === 'jaPresente' && obreiro && (
        <div style={s.resultadoWrap}>
          <div style={{ ...s.sucessoIcone, background: '#DBEAFE', color: '#1E40AF' }}>!</div>
          <h2 style={{ ...s.resultadoTitulo, color: '#1E40AF' }}>Já registrado</h2>
          <p style={s.resultadoDesc}>{obreiro.nome} já fez check-in nesta reunião.</p>

          <div style={s.obreiroCard}>
            <div style={{ ...s.avatar, background: cor.bg, color: cor.text }}>
              {iniciais(obreiro.nome)}
            </div>
            <div>
              <div style={s.obreiroNome}>{obreiro.nome}</div>
              <div style={s.obreiroSub}>{obreiro.congregacoes?.nome || '—'}</div>
            </div>
          </div>

          <button style={s.btnProximo} onClick={reiniciarScanner}>Escanear próximo →</button>
        </div>
      )}

      {/* Resultado: erro */}
      {modo === 'erro' && (
        <div style={s.resultadoWrap}>
          <div style={{ ...s.sucessoIcone, background: '#FEE2E2', color: '#991B1B' }}>✕</div>
          <h2 style={{ ...s.resultadoTitulo, color: '#991B1B' }}>Não encontrado</h2>
          <p style={s.resultadoDesc}>{mensagemErro}</p>

          <div style={s.resultadoBtns}>
            <button style={s.btnDesfazer} onClick={() => router.push('/reunioes/admin/checkin')}>
              Usar lista
            </button>
            <button style={s.btnProximo} onClick={reiniciarScanner}>Tentar novamente →</button>
          </div>
        </div>
      )}

    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#111827', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  header:         { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0, lineHeight: 1 },
  headerTitulo:   { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 },
  headerSub:      { fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Scanner
  scannerWrap:    { flex: 1, flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  instrucao:      { fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 },
  qrReader:       { width: '100%', maxWidth: 360, borderRadius: 16, overflow: 'hidden', border: '2px solid #374151' },
  scanStatus:     { display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: '#34D399' },
  dot:            { width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s ease-in-out infinite' },

  // Resultado
  resultadoWrap:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  sucessoIcone:   { width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, marginBottom: 20 },
  resultadoTitulo:{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px', textAlign: 'center' },
  resultadoDesc:  { fontSize: 14, color: '#9CA3AF', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6, whiteSpace: 'pre-line' },

  obreiroCard:    { background: '#1F2937', border: '1px solid #374151', borderRadius: 14, padding: '16px', width: '100%', maxWidth: 340, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 },
  avatar:         { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  obreiroNome:    { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 },
  obreiroSub:     { fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  obreiroCpf:     { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  badge:          { borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 500 },

  resultadoBtns:  { display: 'flex', gap: 10, width: '100%', maxWidth: 340 },
  btnDesfazer:    { flex: 1, padding: '12px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
  btnProximo:     { flex: 2, padding: '12px', background: '#fff', border: 'none', borderRadius: 12, color: '#111827', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}