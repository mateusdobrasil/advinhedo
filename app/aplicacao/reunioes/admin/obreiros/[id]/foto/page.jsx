'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { carregarObreiroFoto, gerarUploadFoto, salvarDadosFaciais } from '@/app/aplicacao/actions/obreiro-foto'

// Este cliente fica APENAS para o upload via URL assinada
// (uploadToSignedUrl). Quem autoriza a gravação é o token gerado
// pela server action — a anon key sozinha não consegue gravar nada.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
const BUCKET     = 'fotos-obreiros'
// No cadastro mantemos o ssdMobilenetv1 (mais preciso que o tiny):
// é uma operação única por obreiro e a qualidade do descritor aqui
// define a precisão de TODOS os check-ins futuros.

export default function FotoPage() {
  const router = useRouter()
  const { id } = useParams()
  useReuniaoAuth()

  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const montadoRef = useRef(true)

  const [obreiro, setObreiro]       = useState(null)
  const [etapa, setEtapa]           = useState('carregando') // 'carregando' | 'camera' | 'preview' | 'salvando' | 'sucesso' | 'erro'
  const [fotoBlob, setFotoBlob]     = useState(null)
  const [fotoUrl, setFotoUrl]       = useState(null)
  const [videoReady, setVideoReady] = useState(false)
  const [msg, setMsg]               = useState('')

  // Carrega obreiro (via action) e modelos
  useEffect(() => {
    montadoRef.current = true

    async function init() {
      const res = await carregarObreiroFoto(id)
      if (!montadoRef.current) return
      if (!res.ok) {
        setMsg(res.error || 'Erro ao carregar o obreiro.')
        setEtapa('erro')
        return
      }
      setObreiro(res.obreiro)

      const faceapi = await import('@vladmandic/face-api')
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ])
      if (!montadoRef.current) return
      // O useEffect [etapa, videoReady] liga a câmera quando o <video> montar
      setEtapa('camera')
    }
    init().catch(() => {
      if (!montadoRef.current) return
      setMsg('Erro ao carregar os modelos de reconhecimento facial.')
      setEtapa('erro')
    })

    return () => {
      montadoRef.current = false
      pararCamera()
    }
  }, [id])

  // CORREÇÃO: a câmera só liga quando o <video> está no DOM.
  // Antes, iniciarCamera() rodava logo após setEtapa('camera'), com
  // videoRef ainda null (o elemento só monta no re-render) — a câmera
  // ligava mas a tela ficava preta.
  useEffect(() => {
    if (etapa !== 'camera' || !videoReady) return
    iniciarCamera()
  }, [etapa, videoReady])

  function onVideoRef(el) {
    if (el && !videoRef.current) {
      videoRef.current = el
      setVideoReady(true)
    }
  }

  async function iniciarCamera() {
    try {
      pararCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      })
      if (!montadoRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      video.onloadedmetadata = () => video.play().catch(() => {})
    } catch (err) {
      if (!montadoRef.current) return
      const msgs = {
        NotAllowedError:  'Permissão da câmera negada. Toque no cadeado ao lado do endereço e permita a câmera.',
        NotFoundError:    'Nenhuma câmera encontrada neste aparelho.',
        NotReadableError: 'A câmera está em uso por outro aplicativo.',
      }
      setMsg(msgs[err.name] || 'Não foi possível acessar a câmera frontal.')
      setEtapa('erro')
    }
  }

  function pararCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  // Tira a foto
  async function tirarFoto() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      setFotoBlob(blob)
      setFotoUrl(URL.createObjectURL(blob))
      pararCamera()
      setEtapa('preview')
    }, 'image/jpeg', 0.9)
  }

  // Salva a foto e extrai o descritor facial
  async function salvarFoto() {
    if (!fotoBlob || !obreiro) return
    setEtapa('salvando')
    setMsg('')

    try {
      const faceapi = await import('@vladmandic/face-api')

      // 1. Detecta rosto e extrai descritor (no navegador)
      const img = new Image()
      img.src = fotoUrl
      await new Promise(res => { img.onload = res })

      const deteccao = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!deteccao) {
        setMsg('Nenhum rosto detectado. Certifique-se de que o rosto está centralizado e bem iluminado.')
        setEtapa('preview')
        return
      }

      // 2. Pede a URL assinada de upload à server action
      const auth = await gerarUploadFoto(obreiro.id)
      if (!auth.ok) throw new Error(auth.error)

      // 3. Envia o arquivo direto ao Storage com o token de uso único
      const { error: uploadErro } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(auth.path, auth.token, fotoBlob, { contentType: 'image/jpeg' })

      if (uploadErro) throw uploadErro

      // 4. Grava foto_url + descritor via server action (com validação)
      const res = await salvarDadosFaciais(obreiro.id, Array.from(deteccao.descriptor))
      if (!res.ok) throw new Error(res.error)

      setEtapa('sucesso')

    } catch (err) {
      setMsg(`Erro ao salvar: ${err.message || 'tente novamente.'}`)
      setEtapa('preview')
    }
  }

  function repetirFoto() {
    if (fotoUrl) URL.revokeObjectURL(fotoUrl)
    setFotoBlob(null)
    setFotoUrl(null)
    setMsg('')
    setEtapa('camera')
    // Se o <video> já montou antes, o useEffect não re-dispara — liga direto
    if (videoReady) iniciarCamera()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin/obreiros')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitulo}>{obreiro?.nome || 'Carregando...'}</div>
          <div style={s.headerSub}>{obreiro?.obreiro_congregacoes?.nome || ''}</div>
        </div>
      </div>

      {/* Carregando modelos */}
      {etapa === 'carregando' && (
        <div style={s.centrado}>
          <div style={s.spinner} />
          <p style={s.texto}>Carregando modelos de reconhecimento facial...</p>
          <p style={s.textoSub}>Isso pode levar alguns segundos na primeira vez</p>
        </div>
      )}

      {/* Câmera — o <video> fica sempre no DOM a partir daqui (display) */}
      <div style={{ display: etapa === 'camera' ? 'flex' : 'none', ...s.cameraWrap }}>
        <p style={s.instrucao}>Centralize o rosto no círculo e toque em "Tirar foto"</p>

        <div style={s.videoContainer}>
          <video ref={onVideoRef} style={s.video} playsInline muted autoPlay />
          <div style={s.guia} />
        </div>

        <button style={s.btnFoto} onClick={tirarFoto}>Tirar foto</button>
      </div>

      {/* Preview da foto */}
      {etapa === 'preview' && (
        <div style={s.previewWrap}>
          <p style={s.instrucao}>
            {msg ? '' : 'Confira a foto. O rosto deve estar bem visível e centralizado.'}
          </p>

          <div style={s.previewImgWrap}>
            <img src={fotoUrl} alt="Preview" style={s.previewImg} />
          </div>

          {msg && <p style={s.avisoErro}>{msg}</p>}

          <div style={s.previewBtns}>
            <button style={s.btnRepetir} onClick={repetirFoto}>Repetir</button>
            <button style={s.btnSalvar} onClick={salvarFoto}>Usar esta foto →</button>
          </div>
        </div>
      )}

      {/* Salvando */}
      {etapa === 'salvando' && (
        <div style={s.centrado}>
          <div style={s.spinner} />
          <p style={s.texto}>Analisando rosto e salvando...</p>
          <p style={s.textoSub}>Extraindo vetor facial — aguarde</p>
        </div>
      )}

      {/* Sucesso */}
      {etapa === 'sucesso' && (
        <div style={s.centrado}>
          <div style={s.sucessoIcone}>✓</div>
          <p style={s.texto}>Foto cadastrada com sucesso!</p>
          <p style={s.textoSub}>{obreiro?.nome} já pode usar o reconhecimento facial no check-in.</p>

          <div style={s.sucessoBtns}>
            <button style={s.btnVoltar} onClick={() => router.push('/aplicacao/reunioes/admin/obreiros')}>
              ← Voltar à lista
            </button>
            <button style={s.btnSalvar} onClick={repetirFoto}>
              Atualizar foto
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {etapa === 'erro' && (
        <div style={s.centrado}>
          <div style={s.erroIcone}>✕</div>
          <p style={s.texto}>Erro</p>
          <p style={s.textoSub}>{msg}</p>
          <button style={s.btnVoltar} onClick={() => router.push('/aplicacao/reunioes/admin/obreiros')}>
            ← Voltar à lista
          </button>
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#111827', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  header:         { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub:      { fontSize: 11, color: '#6B7280', marginTop: 2 },
  centrado:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 12 },
  spinner:        { width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  texto:          { fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, textAlign: 'center' },
  textoSub:       { fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  sucessoIcone:   { width: 72, height: 72, borderRadius: '50%', background: '#065F46', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  erroIcone:      { width: 72, height: 72, borderRadius: '50%', background: '#991B1B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  sucessoBtns:    { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 8 },
  // Câmera
  cameraWrap:     { flex: 1, flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  instrucao:      { fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 },
  videoContainer: { position: 'relative', width: '100%', maxWidth: 340 },
  video:          { width: '100%', borderRadius: 16, display: 'block', background: '#000' },
  guia:           { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', paddingBottom: '70%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' },
  btnFoto:        { marginTop: 24, padding: '14px 40px', background: '#fff', border: 'none', borderRadius: 50, color: '#111827', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  // Preview
  previewWrap:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  previewImgWrap: { width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  previewImg:     { width: '100%', display: 'block' },
  avisoErro:      { fontSize: 13, color: '#FCA5A5', textAlign: 'center', margin: '-10px 0 10px', lineHeight: 1.5 },
  previewBtns:    { display: 'flex', gap: 10, width: '100%', maxWidth: 340 },
  btnRepetir:     { flex: 1, padding: '13px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
  btnSalvar:      { flex: 2, padding: '13px', background: '#fff', border: 'none', borderRadius: 12, color: '#111827', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnVoltar:      { width: '100%', padding: '13px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
}