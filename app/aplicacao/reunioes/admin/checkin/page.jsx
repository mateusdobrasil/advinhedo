'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ── Utilitários ────────────────────────────────────────────────────────────────

function iniciais(nome) {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function normalizarTexto(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizarCPF(cpf) {
  return (cpf || '').replace(/\D/g, '')
}

function formatarCPF(cpf) {
  const d = normalizarCPF(cpf)
  if (d.length !== 11) return cpf
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

const COR_CARGO = {
  'Pastor':      { bg: '#FEF3C7', text: '#92400E' },
  'Evangelista': { bg: '#EDE9FE', text: '#5B21B6' },
  'Presbítero':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Diácono':     { bg: '#D1FAE5', text: '#065F46' },
  'Cooperador':  { bg: '#FCE7F3', text: '#9D174D' },
  'Membro':      { bg: '#F3F4F6', text: '#374151' },
}

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

// ── Hook: detecta se é tablet/notebook (largura >= 768px) ────────────────────
function useIsKiosk() {
  const [isKiosk, setIsKiosk] = useState(false)
  useEffect(() => {
    const check = () => setIsKiosk(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isKiosk
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CheckinPage() {
  const router  = useRouter()
  const isKiosk = useIsKiosk()
  useReuniaoAuth()

  // Estado de reunião
  const [reuniao, setReuniao]   = useState(null)
  const [reunioes, setReunioes] = useState([])

  // Estado de obreiros
  const [obreiros, setObreiros]   = useState([])
  const [presencas, setPresencas] = useState({})
  const [busca, setBusca]         = useState('')
  const [filtro, setFiltro]       = useState('todos')
  const [loading, setLoading]     = useState(true)
  const [loadingId, setLoadingId] = useState(null)

  // Estado do painel direito (kiosk)
  const [painelDir, setPainelDir] = useState('idle') // 'idle'|'sucesso'|'jaPresente'|'erro'|'scanner'|'facial'
  const [obreiroConfirmado, setObreiroConfirmado] = useState(null)
  const [feedback, setFeedback] = useState(null) // para mobile

  // Scanner QR
  const html5QrRef     = useRef(null)
  const processandoRef = useRef(false)

  // Facial
  const videoRef       = useRef(null)
  const streamRef      = useRef(null)
  const matcherRef     = useRef(null)
  const intervaloRef   = useRef(null)
  const faceapiRef     = useRef(null)
  const [videoReady, setVideoReady]   = useState(false)
  const [facialStatus, setFacialStatus] = useState('')

  const buscaRef = useRef(null)

  // ── Carrega reuniões ────────────────────────────────────────────────────────
  useEffect(() => {
    async function carregarReunioes() {
      const { data } = await supabase
        .from('obreiro_reunioes').select('id, titulo, data_reuniao')
        .eq('aberta', true).eq('ativa', true).order('data_reuniao', { ascending: false })
      setReunioes(data || [])
      if (data?.length === 1) setReuniao(data[0])
      setLoading(false)
    }
    carregarReunioes()
  }, [])

  // ── Carrega obreiros quando reunião selecionada ─────────────────────────────
  useEffect(() => {
    if (!reuniao) return
    setLoading(true)
    async function carregarDados() {
      const { data: obs } = await supabase
        .from('obreiro_cadastro')
        .select('id, nome, cpf, foto_url, obreiro_congregacoes(nome), obreiro_cargos(nome)')
        .eq('situacao', 'Ativo').order('nome')
      const { data: pres } = await supabase
        .from('obreiro_presencas').select('id, obreiro_id, presente').eq('reuniao_id', reuniao.id)
      const mapa = {}
      pres?.forEach(p => { if (p.presente) mapa[p.obreiro_id] = p })
      setObreiros(obs || [])
      setPresencas(mapa)
      setLoading(false)
    }
    carregarDados()
  }, [reuniao])

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reuniao) return
    const canal = supabase
      .channel(`presencas-kiosk-${reuniao.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'presencas', filter: `reuniao_id=eq.${reuniao.id}` },
        payload => {
          setPresencas(prev => {
            const novo = { ...prev }
            if (payload.eventType === 'DELETE' || payload.new?.presente === false) delete novo[payload.old?.obreiro_id ?? payload.new?.obreiro_id]
            else novo[payload.new.obreiro_id] = payload.new
            return novo
          })
        })
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [reuniao])

  // ── Check-in por lista (clique) ─────────────────────────────────────────────
  const fazerCheckin = useCallback(async (obreiro) => {
    if (loadingId) return
    setLoadingId(obreiro.id)
    const jaPresente = presencas[obreiro.id]

    if (jaPresente) {
      setPresencas(prev => { const n = { ...prev }; delete n[obreiro.id]; return n })
      const { error } = await supabase.from('obreiro_presencas').update({ presente: false }).eq('id', jaPresente.id)
      if (error) {
        console.error('Falha ao remover check-in em obreiro_presencas:', error.message)
        setPresencas(prev => ({ ...prev, [obreiro.id]: jaPresente }))
      }
      if (isKiosk) { setObreiroConfirmado({ ...obreiro, tipo: 'removido' }); setPainelDir('sucesso') }
      else setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'removido' })
    } else {
      const temp = { id: `temp-${obreiro.id}`, obreiro_id: obreiro.id, presente: true }
      setPresencas(prev => ({ ...prev, [obreiro.id]: temp }))
      // Reaproveita a linha (mesmo obreiro/reunião) desmarcada anteriormente, em vez de duplicar
      const { data: existente } = await supabase.from('obreiro_presencas').select('id')
        .eq('reuniao_id', reuniao.id).eq('obreiro_id', obreiro.id).maybeSingle()
      const { data, error } = existente
        ? await supabase.from('obreiro_presencas').update({ presente: true, metodo_checkin: 'lista' }).eq('id', existente.id).select().single()
        : await supabase.from('obreiro_presencas').insert({
            reuniao_id: reuniao.id, obreiro_id: obreiro.id,
            presente: true, metodo_checkin: 'lista',
          }).select().single()
      if (!error && data) {
        setPresencas(prev => ({ ...prev, [obreiro.id]: data }))
        if (isKiosk) { setObreiroConfirmado({ ...obreiro, tipo: 'sucesso' }); setPainelDir('sucesso') }
        else setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'sucesso' })
      } else {
        setPresencas(prev => { const n = { ...prev }; delete n[obreiro.id]; return n })
        if (isKiosk) setPainelDir('erro')
        else setFeedback({ nome: obreiro.nome.split(' ')[0], tipo: 'erro' })
      }
    }
    setLoadingId(null)
    if (!isKiosk) setTimeout(() => setFeedback(null), 2500)
  }, [loadingId, presencas, reuniao, isKiosk])

  // ── Scanner QR/Barcode (kiosk) ──────────────────────────────────────────────
  async function iniciarScanner() {
    setPainelDir('scanner')
    processandoRef.current = false
    setTimeout(async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (html5QrRef.current?.isScanning) await html5QrRef.current.stop().catch(() => {})
      const scanner = new Html5Qrcode('qr-kiosk')
      html5QrRef.current = scanner
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          texto => onScanQR(texto, scanner),
          () => {}
        )
      } catch {
        setPainelDir('idle')
      }
    }, 300)
  }

  async function pararScanner() {
    if (html5QrRef.current?.isScanning) await html5QrRef.current.stop().catch(() => {})
  }

  async function onScanQR(texto, scanner) {
    if (processandoRef.current) return
    processandoRef.current = true
    if (scanner?.isScanning) await scanner.stop().catch(() => {})

    const cpfLido = normalizarCPF(texto)
    const encontrado = obreiros.find(o => normalizarCPF(o.cpf) === cpfLido)

    if (!encontrado) {
      setObreiroConfirmado({ nome: `CPF ${formatarCPF(cpfLido)} não encontrado`, tipo: 'erro' })
      setPainelDir('erro')
      processandoRef.current = false
      return
    }

    const { data: existente } = await supabase.from('obreiro_presencas').select('id, presente')
      .eq('reuniao_id', reuniao.id).eq('obreiro_id', encontrado.id).maybeSingle()

    if (existente?.presente) {
      setObreiroConfirmado({ ...encontrado, tipo: 'jaPresente' })
      setPainelDir('jaPresente')
      processandoRef.current = false
      return
    }

    // Reaproveita a linha (mesmo obreiro/reunião) desmarcada anteriormente, em vez de duplicar
    const { error } = existente
      ? await supabase.from('obreiro_presencas').update({ presente: true, metodo_checkin: 'qrcode' }).eq('id', existente.id)
      : await supabase.from('obreiro_presencas').insert({
          reuniao_id: reuniao.id, obreiro_id: encontrado.id,
          presente: true, metodo_checkin: 'qrcode',
        })

    if (!error) {
      setPresencas(prev => ({ ...prev, [encontrado.id]: { id: Date.now(), obreiro_id: encontrado.id, presente: true } }))
      setObreiroConfirmado({ ...encontrado, tipo: 'sucesso' })
      setPainelDir('sucesso')
    } else {
      setPainelDir('erro')
    }
    processandoRef.current = false
  }

  // ── Reconhecimento facial (kiosk) ───────────────────────────────────────────
  function onVideoRef(el) {
    if (el && !videoRef.current) {
      videoRef.current = el
      setVideoReady(true)
    }
  }

  useEffect(() => {
    if (!videoReady || painelDir !== 'facial') return
    iniciarCameraFacial()
  }, [videoReady, painelDir])

  async function iniciarFacial() {
    setPainelDir('facial')
    setFacialStatus('Carregando modelos...')
    setVideoReady(false)
    videoRef.current = null

    const faceapi = await import('@vladmandic/face-api')
    faceapiRef.current = faceapi
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ])

    const { data: obs } = await supabase
      .from('obreiro_cadastro').select('id, nome, foto_url, face_descriptor, obreiro_congregacoes(nome), obreiro_cargos(nome)')
      .eq('situacao', 'Ativo').not('face_descriptor', 'is', null)

    if (!obs?.length) { setFacialStatus('Nenhuma foto cadastrada.'); return }

    const rotulos = obs.map(o => new faceapi.LabeledFaceDescriptors(o.id, [new Float32Array(o.face_descriptor)]))
    const mapa = {}; obs.forEach(o => { mapa[o.id] = o })
    matcherRef.current = { matcher: new faceapi.FaceMatcher(rotulos, 0.5), mapaObreiros: mapa }
    setFacialStatus('Aponte para a câmera')
  }

  async function iniciarCameraFacial() {
    pararCameraFacial()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } } })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      video.onloadedmetadata = () => video.play().catch(() => {})
      iniciarReconhecimento()
    } catch { setFacialStatus('Sem acesso à câmera.') }
  }

  function pararCameraFacial() {
    clearInterval(intervaloRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function iniciarReconhecimento() {
    clearInterval(intervaloRef.current)
    intervaloRef.current = setInterval(async () => {
      if (!videoRef.current || !matcherRef.current || videoRef.current.readyState < 2) return
      const faceapi = faceapiRef.current
      try {
        const det = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor()
        if (!det) { setFacialStatus('Aponte para a câmera'); return }
        const { matcher, mapaObreiros } = matcherRef.current
        const res = matcher.findBestMatch(det.descriptor)
        if (res.label === 'unknown') { setFacialStatus('Rosto não reconhecido'); return }

        clearInterval(intervaloRef.current)
        pararCameraFacial()

        const ob = mapaObreiros[res.label]
        const { data: existente } = await supabase.from('obreiro_presencas').select('id, presente')
          .eq('reuniao_id', reuniao.id).eq('obreiro_id', ob.id).maybeSingle()

        if (existente?.presente) { setObreiroConfirmado({ ...ob, tipo: 'jaPresente' }); setPainelDir('jaPresente'); return }

        // Reaproveita a linha (mesmo obreiro/reunião) desmarcada anteriormente, em vez de duplicar
        const { error } = existente
          ? await supabase.from('obreiro_presencas').update({ presente: true, metodo_checkin: 'facial' }).eq('id', existente.id)
          : await supabase.from('obreiro_presencas').insert({
              reuniao_id: reuniao.id, obreiro_id: ob.id, presente: true, metodo_checkin: 'facial',
            })
        if (!error) {
          setPresencas(prev => ({ ...prev, [ob.id]: { id: Date.now(), obreiro_id: ob.id, presente: true } }))
          setObreiroConfirmado({ ...ob, tipo: 'sucesso' })
          setPainelDir('sucesso')
        }
      } catch {}
    }, 1200)
  }

  function resetPainel() {
    pararScanner()
    pararCameraFacial()
    setPainelDir('idle')
    setObreiroConfirmado(null)
    setVideoReady(false)
    videoRef.current = null
  }

  // ── Filtro de obreiros ──────────────────────────────────────────────────────
  const filtrados = obreiros.filter(o => {
    const buscaNorm = normalizarTexto(busca)
    const corresponde = !busca || normalizarTexto(o.nome).includes(buscaNorm) || normalizarTexto(o.obreiro_congregacoes?.nome || '').includes(buscaNorm)
    if (!corresponde) return false
    if (filtro === 'presentes') return !!presencas[o.id]
    if (filtro === 'ausentes')  return !presencas[o.id]
    return true
  })

  const totalPresentes = Object.keys(presencas).length
  const totalObreiros  = obreiros.length

  // ── Tela de seleção de reunião ──────────────────────────────────────────────
  if (!reuniao) {
    return (
      <div style={m.selecaoContainer}>
        <div style={m.selecaoWrap}>
          <div style={m.logoMark}>AD</div>
          <h1 style={m.selecaoTitulo}>Reunião de Obreiros</h1>
          <p style={m.selecaoSub}>Selecione a reunião para iniciar o check-in</p>
          {loading ? <p style={{ color: '#9CA3AF' }}>Carregando...</p> : reunioes.length === 0 ? (
            <p style={{ color: '#6B7280', textAlign: 'center' }}>Nenhuma reunião aberta.<br />Crie uma no painel administrativo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
              {reunioes.map(r => (
                <button key={r.id} style={m.reuniaoBtn} onClick={() => setReuniao(r)}>
                  <span style={m.reuniaoBtnTitulo}>{r.titulo}</span>
                  <span style={m.reuniaoBtnData}>
                    {new Date(r.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button style={m.voltarSolto} onClick={() => router.push('/aplicacao/reunioes/admin')}>← Voltar</button>
        </div>
      </div>
    )
  }

  // ── MOBILE: layout vertical (igual ao atual) ────────────────────────────────
  if (!isKiosk) {
    return (
      <div style={m.container}>
        {feedback && (
          <div style={{ ...m.toast, background: feedback.tipo === 'sucesso' ? '#065F46' : feedback.tipo === 'removido' ? '#1E40AF' : '#991B1B' }}>
            {feedback.tipo === 'sucesso' ? '✓ ' : feedback.tipo === 'removido' ? '↩ ' : '✗ '}
            {feedback.tipo === 'sucesso' ? `${feedback.nome} presente!` : feedback.tipo === 'removido' ? `${feedback.nome} removido` : `Erro ao registrar ${feedback.nome}`}
          </div>
        )}
        <div style={m.header}>
          <button style={m.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin')}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={m.headerTitulo}>{reuniao.titulo}</div>
            <div style={m.headerData}>
              {new Date(reuniao.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={m.contador}><span style={m.contadorNum}>{totalPresentes}</span><span style={m.contadorDen}>/{totalObreiros}</span></div>
        </div>
        <div style={m.buscaWrap}>
          <span style={m.buscaIcone}>⌕</span>
          <input ref={buscaRef} style={m.buscaInput} type="search" placeholder="Buscar por nome ou congregação..."
            value={busca} onChange={e => setBusca(e.target.value)} autoComplete="off" />
          {busca && <button style={m.buscaLimpar} onClick={() => setBusca('')}>✕</button>}
        </div>
        <div style={m.filtros}>
          {[{ key: 'todos', label: `Todos (${totalObreiros})` }, { key: 'presentes', label: `Presentes (${totalPresentes})` }, { key: 'ausentes', label: `Ausentes (${totalObreiros - totalPresentes})` }].map(f => (
            <button key={f.key} style={{ ...m.filtroBtn, ...(filtro === f.key ? m.filtroBtnAtivo : {}) }} onClick={() => setFiltro(f.key)}>{f.label}</button>
          ))}
        </div>
        {loading ? <div style={m.loadingWrap}><div style={m.loadingSpinner} /></div> : (
          <div style={m.lista}>
            {filtrados.map(o => {
              const presente = !!presencas[o.id]
              const cor = COR_CARGO[o.obreiro_cargos?.nome] || COR_CARGO['Membro']
              return (
                <button key={o.id} style={{ ...m.card, ...(presente ? m.cardPresente : {}), opacity: loadingId === o.id ? 0.6 : 1 }}
                  onClick={() => fazerCheckin(o)} disabled={loadingId === o.id}>
                  <div style={{ ...m.avatar, background: presente ? '#065F46' : cor.bg, color: presente ? '#fff' : cor.text }}>
                    {loadingId === o.id ? '…' : presente ? '✓' : iniciais(o.nome)}
                  </div>
                  <div style={m.cardInfo}>
                    <div style={m.cardNome}>{o.nome}</div>
                    <div style={m.cardSub}>
                      <span>{o.obreiro_congregacoes?.nome || '—'}</span>
                      {o.obreiro_cargos?.nome && <span style={{ ...m.badgeCargo, background: cor.bg, color: cor.text }}>{o.obreiro_cargos.nome}</span>}
                    </div>
                  </div>
                  <div style={{ ...m.status, color: presente ? '#065F46' : '#D1D5DB' }}>{presente ? 'Presente' : 'Ausente'}</div>
                </button>
              )
            })}
          </div>
        )}
        <div style={m.rodape}>
          <button style={m.rodapeBtn} onClick={() => { setReuniao(null); setBusca('') }}>← Trocar reunião</button>
          <button style={m.rodapeBtnScanner} onClick={() => router.push(`/aplicacao/reunioes/admin/checkin/scanner?reuniao=${reuniao.id}&titulo=${encodeURIComponent(reuniao.titulo)}`)}>⬡ Cartão</button>
          <button style={{ ...m.rodapeBtnScanner, background: '#7C3AED' }} onClick={() => router.push(`/aplicacao/reunioes/admin/checkin/facial?reuniao=${reuniao.id}&titulo=${encodeURIComponent(reuniao.titulo)}`)}>◉ Facial</button>
        </div>
      </div>
    )
  }

  // ── KIOSK: layout tela dividida ─────────────────────────────────────────────
  const pctPresenca = totalObreiros ? Math.round(totalPresentes / totalObreiros * 100) : 0

  return (
    <div style={k.container}>

      {/* Coluna esquerda — lista */}
      <div style={k.esquerda}>

        {/* Header kiosk */}
        <div style={k.header}>
          <div style={k.headerInfo}>
            <div style={k.headerTitulo}>{reuniao.titulo}</div>
            <div style={k.headerData}>
              {new Date(reuniao.data_reuniao + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={k.headerStats}>
            <div style={k.statNum}>{totalPresentes}<span style={k.statDen}>/{totalObreiros}</span></div>
            <div style={k.statLabel}>{pctPresenca}% presença</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={k.progresso}>
          <div style={k.progressoBarra}><div style={{ ...k.progressoFill, width: `${pctPresenca}%` }} /></div>
        </div>

        {/* Busca e filtros */}
        <div style={k.buscaFiltros}>
          <div style={k.buscaWrap}>
            <span style={k.buscaIcone}>⌕</span>
            <input style={k.buscaInput} type="search" placeholder="Buscar nome ou congregação..."
              value={busca} onChange={e => setBusca(e.target.value)} autoComplete="off" />
            {busca && <button style={k.buscaLimpar} onClick={() => setBusca('')}>✕</button>}
          </div>
          <div style={k.filtros}>
            {[{ key: 'todos', label: `Todos` }, { key: 'presentes', label: `Presentes` }, { key: 'ausentes', label: `Ausentes` }].map(f => (
              <button key={f.key} style={{ ...k.filtroBtn, ...(filtro === f.key ? k.filtroBtnAtivo : {}) }} onClick={() => setFiltro(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Lista de obreiros */}
        <div style={k.lista}>
          {loading ? (
            <div style={k.loadingWrap}><div style={k.spinner} /></div>
          ) : filtrados.map(o => {
            const presente = !!presencas[o.id]
            const cor = COR_CARGO[o.obreiro_cargos?.nome] || COR_CARGO['Membro']
            return (
              <button key={o.id} style={{ ...k.card, ...(presente ? k.cardPresente : {}), opacity: loadingId === o.id ? 0.6 : 1 }}
                onClick={() => fazerCheckin(o)} disabled={loadingId === o.id}>
                <div style={{ ...k.avatar, background: presente ? '#065F46' : cor.bg, color: presente ? '#fff' : cor.text }}>
                  {o.foto_url ? <img src={o.foto_url} alt="" style={k.avatarFoto} /> : (loadingId === o.id ? '…' : presente ? '✓' : iniciais(o.nome))}
                </div>
                <div style={k.cardInfo}>
                  <div style={k.cardNome}>{o.nome}</div>
                  <div style={k.cardSub}>
                    {o.obreiro_congregacoes?.nome || '—'}
                    {o.obreiro_cargos?.nome && <span style={{ ...k.badgeCargo, background: cor.bg, color: cor.text }}>{o.obreiro_cargos.nome}</span>}
                  </div>
                </div>
                <div style={{ ...k.statusBadge, background: presente ? '#D1FAE5' : '#F3F4F6', color: presente ? '#065F46' : '#9CA3AF' }}>
                  {presente ? '✓ Presente' : 'Ausente'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Rodapé kiosk */}
        <div style={k.rodape}>
          <button style={k.btnRodape} onClick={() => { setReuniao(null); setBusca('') }}>← Trocar reunião</button>
          <button style={{ ...k.btnRodape, background: '#111827', color: '#fff', border: 'none' }} onClick={iniciarScanner}>⬡ Ler cartão</button>
          <button style={{ ...k.btnRodape, background: '#7C3AED', color: '#fff', border: 'none' }} onClick={iniciarFacial}>◉ Facial</button>
          <button style={{ ...k.btnRodape }} onClick={() => router.push('/aplicacao/reunioes/admin')}>Admin</button>
        </div>
      </div>

      {/* Coluna direita — painel de confirmação */}
      <div style={k.direita}>

        {/* Idle */}
        {painelDir === 'idle' && (
          <div style={k.painelCentro}>
            <div style={k.idleIcone}>✓</div>
            <p style={k.idleTitulo}>Pronto para check-in</p>
            <p style={k.idleSub}>Toque no seu nome na lista ao lado, aproxime seu cartão ou aguarde o reconhecimento facial</p>
            <div style={k.idleModos}>
              <div style={k.idleModo}><span style={k.idleModoIcone}>☰</span>Lista</div>
              <div style={k.idleModo}><span style={k.idleModoIcone}>⬡</span>Cartão</div>
              <div style={k.idleModo}><span style={k.idleModoIcone}>◉</span>Facial</div>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {painelDir === 'sucesso' && obreiroConfirmado && (
          <div style={k.painelCentro}>
            <div style={{ ...k.painelIcone, background: obreiroConfirmado.tipo === 'removido' ? '#1E3A5F' : '#065F46' }}>
              {obreiroConfirmado.tipo === 'removido' ? '↩' : '✓'}
            </div>
            <p style={k.painelTitulo}>{obreiroConfirmado.tipo === 'removido' ? 'Check-in removido' : 'Presença registrada!'}</p>
            {obreiroConfirmado.foto_url ? (
              <img src={obreiroConfirmado.foto_url} alt="" style={k.painelFoto} />
            ) : (
              <div style={{ ...k.painelAvatar, background: (COR_CARGO[obreiroConfirmado.obreiro_cargos?.nome] || COR_CARGO['Membro']).bg, color: (COR_CARGO[obreiroConfirmado.obreiro_cargos?.nome] || COR_CARGO['Membro']).text }}>
                {iniciais(obreiroConfirmado.nome)}
              </div>
            )}
            <p style={k.painelNome}>{obreiroConfirmado.nome}</p>
            <p style={k.painelCong}>{obreiroConfirmado.obreiro_congregacoes?.nome || '—'}</p>
            {obreiroConfirmado.obreiro_cargos?.nome && (
              <span style={{ ...k.painelBadge, background: (COR_CARGO[obreiroConfirmado.obreiro_cargos.nome] || COR_CARGO['Membro']).bg, color: (COR_CARGO[obreiroConfirmado.obreiro_cargos.nome] || COR_CARGO['Membro']).text }}>
                {obreiroConfirmado.obreiro_cargos.nome}
              </span>
            )}
            <button style={k.btnVoltar} onClick={resetPainel}>← Próximo</button>
          </div>
        )}

        {/* Já presente */}
        {painelDir === 'jaPresente' && obreiroConfirmado && (
          <div style={k.painelCentro}>
            <div style={{ ...k.painelIcone, background: '#1E3A5F' }}>!</div>
            <p style={k.painelTitulo}>Já registrado</p>
            <p style={k.painelNome}>{obreiroConfirmado.nome}</p>
            <p style={k.painelCong}>{obreiroConfirmado.obreiro_congregacoes?.nome}</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>Este obreiro já fez check-in nesta reunião.</p>
            <button style={k.btnVoltar} onClick={resetPainel}>← Próximo</button>
          </div>
        )}

        {/* Erro */}
        {painelDir === 'erro' && (
          <div style={k.painelCentro}>
            <div style={{ ...k.painelIcone, background: '#7F1D1D' }}>✕</div>
            <p style={k.painelTitulo}>Não encontrado</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>{obreiroConfirmado?.nome || 'Tente novamente.'}</p>
            <button style={k.btnVoltar} onClick={resetPainel}>← Tentar novamente</button>
          </div>
        )}

        {/* Scanner QR */}
        {painelDir === 'scanner' && (
          <div style={k.painelCentro}>
            <p style={k.painelTitulo}>Aproxime o cartão</p>
            <div id="qr-kiosk" style={k.qrBox} />
            <button style={{ ...k.btnVoltar, marginTop: 20 }} onClick={resetPainel}>← Cancelar</button>
          </div>
        )}

        {/* Facial */}
        {painelDir === 'facial' && (
          <div style={k.painelCentro}>
            <p style={k.painelTitulo}>Reconhecimento facial</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>{facialStatus}</p>
            <div style={k.facialBox}>
              <video ref={onVideoRef} style={k.facialVideo} playsInline muted autoPlay />
              <div style={k.facialGuia} />
            </div>
            <button style={{ ...k.btnVoltar, marginTop: 20 }} onClick={resetPainel}>← Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Estilos Mobile ─────────────────────────────────────────────────────────────
const m = {
  container:       { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 80 },
  selecaoContainer:{ minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selecaoWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', width: '100%' },
  logoMark:        { width: 56, height: 56, borderRadius: 16, background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, marginBottom: 20 },
  selecaoTitulo:   { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px', textAlign: 'center' },
  selecaoSub:      { fontSize: 14, color: '#6B7280', margin: '0 0 32px', textAlign: 'center' },
  reuniaoBtn:      { width: '100%', padding: '16px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 },
  reuniaoBtnTitulo:{ fontSize: 15, fontWeight: 600, color: '#111827' },
  reuniaoBtnData:  { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  voltarSolto:     { marginTop: 24, background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer', padding: 0 },
  toast:           { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  header:          { background: '#111827', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:       { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:    { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerData:      { fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' },
  contador:        { textAlign: 'right', lineHeight: 1, flexShrink: 0 },
  contadorNum:     { fontSize: 28, fontWeight: 700, color: '#34D399' },
  contadorDen:     { fontSize: 16, color: '#6B7280' },
  buscaWrap:       { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', margin: '12px 16px 0', borderRadius: 12, padding: '0 12px' },
  buscaIcone:      { fontSize: 18, color: '#9CA3AF', marginRight: 8 },
  buscaInput:      { flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '13px 0', background: 'transparent', color: '#111827' },
  buscaLimpar:     { background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14 },
  filtros:         { display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto' },
  filtroBtn:       { flexShrink: 0, padding: '6px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 13, color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroBtnAtivo:  { background: '#111827', border: '1px solid #111827', color: '#fff', fontWeight: 500 },
  lista:           { display: 'flex', flexDirection: 'column', padding: '12px 16px 0' },
  card:            { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', width: '100%' },
  cardPresente:    { background: '#F0FDF4', border: '1px solid #86EFAC' },
  avatar:          { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: 'hidden' },
  cardInfo:        { flex: 1, minWidth: 0 },
  cardNome:        { fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub:         { fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },
  badgeCargo:      { borderRadius: 20, padding: '1px 8px', fontSize: 11 },
  status:          { fontSize: 12, fontWeight: 500, flexShrink: 0 },
  loadingWrap:     { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  loadingSpinner:  { width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  rodape:          { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(249,250,251,0.95)', borderTop: '1px solid #E5E7EB', padding: '10px 16px', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rodapeBtn:       { background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', padding: 0 },
  rodapeBtnScanner:{ background: '#111827', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 16px', borderRadius: 20 },
}

// ── Estilos Kiosk ──────────────────────────────────────────────────────────────
const k = {
  container:    { display: 'flex', height: '100dvh', overflow: 'hidden', fontFamily: "'Geist','Inter',sans-serif", background: '#0F172A' },

  // Coluna esquerda
  esquerda:     { width: '55%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', borderRight: '1px solid #E2E8F0' },
  header:       { background: '#111827', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  headerInfo:   { minWidth: 0 },
  headerTitulo: { fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerData:   { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  headerStats:  { textAlign: 'right', flexShrink: 0 },
  statNum:      { fontSize: 32, fontWeight: 800, color: '#34D399', lineHeight: 1 },
  statDen:      { fontSize: 18, color: '#6B7280' },
  statLabel:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  progresso:    { padding: '0 24px', flexShrink: 0, marginTop: 12 },
  progressoBarra: { height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  progressoFill:  { height: '100%', background: '#34D399', borderRadius: 99, transition: 'width 0.5s' },
  buscaFiltros: { padding: '12px 24px', flexShrink: 0 },
  buscaWrap:    { display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '0 14px', marginBottom: 10 },
  buscaIcone:   { fontSize: 18, color: '#94A3B8', marginRight: 10 },
  buscaInput:   { flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '12px 0', background: 'transparent', color: '#111827' },
  buscaLimpar:  { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14 },
  filtros:      { display: 'flex', gap: 8 },
  filtroBtn:    { padding: '6px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, fontSize: 13, color: '#64748B', cursor: 'pointer' },
  filtroBtnAtivo: { background: '#111827', border: '1px solid #111827', color: '#fff', fontWeight: 500 },
  lista:        { flex: 1, overflowY: 'auto', padding: '0 24px 16px' },
  loadingWrap:  { display: 'flex', justifyContent: 'center', padding: '60px 0' },
  spinner:      { width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  card:         { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' },
  cardPresente: { background: '#F0FDF4', border: '1px solid #86EFAC' },
  avatar:       { width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0, overflow: 'hidden' },
  avatarFoto:   { width: '100%', height: '100%', objectFit: 'cover' },
  cardInfo:     { flex: 1, minWidth: 0 },
  cardNome:     { fontSize: 15, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub:      { fontSize: 13, color: '#64748B', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 },
  badgeCargo:   { borderRadius: 20, padding: '2px 10px', fontSize: 12 },
  statusBadge:  { borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  rodape:       { display: 'flex', gap: 8, padding: '12px 24px', borderTop: '1px solid #E2E8F0', background: '#fff', flexShrink: 0 },
  btnRodape:    { flex: 1, padding: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 },

  // Coluna direita
  direita:      { width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: '40px 32px' },
  painelCentro: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 380 },
  idleIcone:    { width: 100, height: 100, borderRadius: '50%', background: '#1E293B', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 700 },
  idleTitulo:   { fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center' },
  idleSub:      { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6, margin: 0 },
  idleModos:    { display: 'flex', gap: 20, marginTop: 8 },
  idleModo:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#475569', fontSize: 13 },
  idleModoIcone:{ fontSize: 24 },
  painelIcone:  { width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: '#fff' },
  painelTitulo: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center' },
  painelFoto:   { width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #334155' },
  painelAvatar: { width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  painelNome:   { fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center' },
  painelCong:   { fontSize: 15, color: '#94A3B8', margin: 0, textAlign: 'center' },
  painelBadge:  { borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 500 },
  btnVoltar:    { padding: '13px 32px', background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#94A3B8', fontSize: 14, cursor: 'pointer', marginTop: 8 },
  qrBox:        { width: 260, height: 260, borderRadius: 16, overflow: 'hidden', background: '#000' },
  facialBox:    { position: 'relative', width: 300, height: 300, borderRadius: 16, overflow: 'hidden' },
  facialVideo:  { width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' },
  facialGuia:   { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', height: '70%', borderRadius: '50%', border: '2px solid rgba(52,211,153,0.7)', pointerEvents: 'none' },
}