import pptxgen from "pptxgenjs"
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

// Função auxiliar para formatar a data do período para o padrão brasileiro (DD/MM/YYYY)
const formatarPeriodoBrasil = (label: string) => {
  if (!label) return "Relatório Geral"
  
  // Verifica se o label é uma data no formato YYYY-MM-DD
  const regexData = /^\d{4}-\d{2}-\d{2}$/
  if (regexData.test(label)) {
    const [ano, mes, dia] = label.split('-')
    return `${dia}/${mes}/${ano}`
  }
  
  // Se for um texto como "Data: 2026-05-26"
  if (label.includes('Data: ')) {
    const dataPura = label.replace('Data: ', '').trim()
    if (regexData.test(dataPura)) {
      const [ano, mes, dia] = dataPura.split('-')
      return `${dia}/${mes}/${ano}`
    }
  }

  return label
}

export async function POST(request: NextRequest) {
  try {
    const { data, resumoGeral, periodoLabel } = await request.json()

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado para exportar' },
        { status: 400 }
      )
    }

    const pres = new pptxgen()

    // Tratamento da data para o padrão BR
    const periodoFormatadoBR = formatarPeriodoBrasil(periodoLabel)

    // ==========================================
    // 1. CONFIGURAÇÕES GERAIS E CORES
    // ==========================================
    pres.layout = 'LAYOUT_WIDE' // 16:9 (13.33 x 7.5 polegadas)
    
    const CORES = {
      INDIGO_DARK: '1E1B4B',
      INDIGO_MAIN: '312E81',
      GOLD: 'FACC15',
      TEXT_DARK: '1E293B',
      TEXT_LIGHT: '64748B',
      BG_LIGHT: 'F8FAFC',
      WHITE: 'FFFFFF',
      SUCCESS: '10B981',
      BLUE: '3B82F6',
      CYAN: '06B6D4',
      PURPLE: '8B5CF6',
      ORANGE: 'F59E0B',
      RED: 'EF4444'
    }

    // Mapeamento dinâmico para garantir que encontre a imagem no backend do Next.js
    const LOGO_IGREJA = path.join(process.cwd(), 'app', 'imgs', 'logo_branco.png')

    // ==========================================
    // 2. GABARITO MESTRE (CABEÇALHO E RODAPÉ)
    // ==========================================
    pres.defineSlideMaster({
      title: 'MASTER_EBD',
      background: { color: CORES.BG_LIGHT },
      objects: [
        // CABEÇALHO: Barra Superior Azul Escura
        { rect: { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: CORES.INDIGO_DARK } } },
        // CABEÇALHO: Linha Fina Dourada
        { rect: { x: 0, y: 0.9, w: '100%', h: 0.05, fill: { color: CORES.GOLD } } },
        // CABEÇALHO: Ícone/Logo Local
        { image: { path: LOGO_IGREJA, x: 0.3, y: 0.15, w: 0.6, h: 0.6 } },
        // CABEÇALHO: Texto Padrão (Fixo em todos os slides)
        { text: { 
            text: `AD Vinhedo - EBD - ${periodoFormatadoBR}`, 
            options: { x: 1.1, y: 0, w: 11.5, h: 0.9, fontSize: 18, color: CORES.WHITE, bold: true, valign: "middle" } 
        }},
        
        // RODAPÉ: Linha Divisória
        { rect: { x: 0.5, y: 7.0, w: 12.33, h: 0.01, fill: { color: 'CBD5E1' } } },
        // RODAPÉ: Texto
        { text: { 
            text: "Assembleia de Deus em Vinhedo/SP - Escola Bíblica Dominical", 
            options: { x: 0, y: 7.1, w: '100%', h: 0.3, align: "center", fontSize: 10, color: CORES.TEXT_LIGHT } 
        }}
      ]
    })

    // ==========================================
    // SLIDE 1: CAPA
    // ==========================================
    const slide1 = pres.addSlide({ masterName: 'MASTER_EBD' })
    
    slide1.addShape(pres.ShapeType.roundRect, { x: 1.5, y: 2.5, w: 10.33, h: 2.5, fill: { color: CORES.INDIGO_DARK }, rectRadius: 0.05 })
    
    slide1.addText("📊 Relatório da Escola Bíblica Dominical", {
      x: 1.5, y: 2.8, w: 10.33, h: 1.0, fontSize: 40, color: CORES.WHITE, bold: true, align: "center", fontFace: "Arial Black"
    })
    slide1.addText("Assembleia de Deus - Vinhedo - Sede", {
      x: 1.5, y: 3.9, w: 10.33, h: 0.5, fontSize: 24, color: CORES.GOLD, align: "center", fontFace: "Arial"
    })

    // ==========================================
    // SLIDE 2: DETALHAMENTO POR TURMA
    // ==========================================
    const slide2 = pres.addSlide({ masterName: 'MASTER_EBD' })
    
    slide2.addText("📋 DETALHAMENTO POR TURMA", { x: 0.4, y: 1.2, w: 12, h: 0.5, fontSize: 22, color: CORES.INDIGO_MAIN, bold: true })

    const tableRows: any[][] = [
      [
        { text: "TURMA", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, fontSize: 11, align: 'left' } },
        { text: "MATRIC.", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "PRES.", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "AUSENT.", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "BÍBLIA", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "REVIST.", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "VISIT.", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'center', fontSize: 10 } },
        { text: "OFERTA", options: { fill: CORES.INDIGO_MAIN, color: CORES.WHITE, bold: true, align: 'right', fontSize: 10 } }
      ]
    ]

    data.forEach((row: any, idx: number) => {
      const bgColor = idx % 2 === 0 ? CORES.WHITE : CORES.BG_LIGHT
      const matriculados = row.total_alunos || 0
      const presentes = row.presentes || 0
      const ausentes = matriculados - presentes

      tableRows.push([
        { text: row.nome, options: { fill: bgColor, bold: true, color: CORES.TEXT_DARK, fontSize: 11, align: 'left' } },
        { text: String(matriculados), options: { fill: bgColor, align: 'center', color: CORES.INDIGO_MAIN, fontSize: 10, bold: true } },
        { text: String(presentes), options: { fill: bgColor, align: 'center', color: CORES.SUCCESS, fontSize: 10, bold: true } },
        { text: String(ausentes > 0 ? ausentes : 0), options: { fill: bgColor, align: 'center', color: CORES.RED, fontSize: 10, bold: true } },
        { text: String(row.biblias), options: { fill: bgColor, align: 'center', color: CORES.TEXT_DARK, fontSize: 10 } },
        { text: String(row.revistas), options: { fill: bgColor, align: 'center', color: CORES.TEXT_DARK, fontSize: 10 } },
        { text: String(row.visitantes), options: { fill: bgColor, align: 'center', color: CORES.TEXT_DARK, fontSize: 10 } },
        { text: `R$ ${row.oferta.toFixed(2)}`, options: { fill: bgColor, align: 'right', color: CORES.SUCCESS, bold: true, fontSize: 10 } }
      ])
    })

    slide2.addTable(tableRows, {
      x: 0.4, y: 1.8, w: 12.53,
      fontSize: 10,
      border: { type: 'solid', color: 'E2E8F0', pt: 1 },
      autoPage: true, 
      autoPageRepeatHeader: true,
      colW: [2.53, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.6]
    })

    // ==========================================
    // SLIDE 3: RESUMO GERAL DO PERÍODO
    // ==========================================
    const slide3 = pres.addSlide({ masterName: 'MASTER_EBD' })
    
    slide3.addText("📈 RESUMO GERAL DO PERÍODO", { x: 0.4, y: 1.2, w: 12, h: 0.5, fontSize: 22, color: CORES.INDIGO_MAIN, bold: true })

    const totalAusentesGeral = (resumoGeral?.totalMatriculados || 0) - (resumoGeral?.presentes || 0)

    const metricas = [
      { icon: "🎓", label: "MATRICULADOS", valor: resumoGeral?.totalMatriculados || 0, cor: CORES.INDIGO_MAIN, x: 0.5 },
      { icon: "👨‍👩‍👧‍👦", label: "PRESENTES", valor: resumoGeral?.presentes || 0, cor: CORES.SUCCESS, x: 2.6 },
      { icon: "❌", label: "AUSENTES", valor: totalAusentesGeral > 0 ? totalAusentesGeral : 0, cor: CORES.RED, x: 4.7 },
      { icon: "📖", label: "BÍBLIAS", valor: resumoGeral?.biblias || 0, cor: CORES.CYAN, x: 6.8 },
      { icon: "👋", label: "VISITANTES", valor: resumoGeral?.visitantes || 0, cor: CORES.ORANGE, x: 8.9 },
      { icon: "💰", label: "OFERTAS", valor: `R$ ${(resumoGeral?.oferta || 0).toFixed(2)}`, cor: CORES.SUCCESS, x: 11.0 }
    ]

    metricas.forEach(m => {
      const cardWidth = 1.9
      slide3.addShape(pres.ShapeType.roundRect, {
        x: m.x, y: 2.3, w: cardWidth, h: 3.5, fill: { color: CORES.WHITE }, line: { color: m.cor, width: 2 }, shadow: { type: "outer", opacity: 0.1 }
      })
      slide3.addText(m.icon, { x: m.x, y: 2.7, w: cardWidth, h: 0.8, fontSize: 38, align: 'center' })
      slide3.addText(m.label, { x: m.x, y: 3.7, w: cardWidth, h: 0.4, fontSize: 11, align: 'center', color: CORES.TEXT_LIGHT, bold: true })
      slide3.addText(String(m.valor), { x: m.x, y: 4.3, w: cardWidth, h: 0.8, fontSize: 20, align: 'center', color: m.cor, bold: true })
    })

    // ==========================================
    // SLIDE 4: RANKING DOS DESTAQUES
    // ==========================================
    const slide4 = pres.addSlide({ masterName: 'MASTER_EBD' })
    
    slide4.addText("🏆 RANKING DOS DESTAQUES", { x: 0.4, y: 1.2, w: 12, h: 0.5, fontSize: 22, color: CORES.INDIGO_MAIN, bold: true })
    slide4.addText("Salas com melhor desempenho no período", { x: 0.4, y: 1.7, w: 12, h: 0.3, fontSize: 14, color: CORES.TEXT_LIGHT })

    const rankPres = [...data].sort((a: any, b: any) => (b.presentes || 0) - (a.presentes || 0))[0] || {}
    const rankBib = [...data].sort((a: any, b: any) => (b.biblias || 0) - (a.biblias || 0))[0] || {}
    const rankRev = [...data].sort((a: any, b: any) => (b.revistas || 0) - (a.revistas || 0))[0] || {}
    const rankVis = [...data].sort((a: any, b: any) => (b.visitantes || 0) - (a.visitantes || 0))[0] || {}

    const topCards = [
      { emoji: "👨‍👩‍👧‍👦", titulo: "MAIS PRESENTES", turma: rankPres.nome, valor: rankPres.presentes, cor: CORES.INDIGO_MAIN, x: 0.5 },
      { emoji: "📖", titulo: "MAIS BÍBLIAS", turma: rankBib.nome, valor: rankBib.biblias, cor: CORES.INDIGO_MAIN, x: 3.7 },
      { emoji: "📚", titulo: "MAIS REVISTAS", turma: rankRev.nome, valor: rankRev.revistas, cor: CORES.INDIGO_MAIN, x: 6.9 },
      { emoji: "👋", titulo: "MAIS VISITANTES", turma: rankVis.nome, valor: rankVis.visitantes, cor: CORES.INDIGO_MAIN, x: 10.1 }
    ]

    topCards.forEach(card => {
      const cardW = 2.8
      slide4.addShape(pres.ShapeType.roundRect, {
        x: card.x, y: 2.3, w: cardW, h: 4.0, fill: { color: card.cor }, shadow: { type: "outer", opacity: 0.2 }
      })
      slide4.addText(card.emoji, { x: card.x, y: 2.6, w: cardW, h: 0.8, fontSize: 42, align: 'center' })
      slide4.addText(card.titulo, { x: card.x, y: 3.6, w: cardW, h: 0.4, fontSize: 12, align: 'center', color: CORES.WHITE, bold: true })
      slide4.addText(card.turma || "N/A", { x: card.x, y: 4.1, w: cardW, h: 0.6, fontSize: 14, align: 'center', color: CORES.GOLD, bold: true })
      slide4.addText(String(card.valor || 0), { x: card.x, y: 4.9, w: cardW, h: 0.8, fontSize: 32, align: 'center', color: CORES.WHITE, bold: true })
    })

    // ==========================================
    // EXPORTAÇÃO SEGURA (USANDO ARRAYBUFFER PARA NEXT.JS)
    // ==========================================
    const arrayBuffer = await pres.write({ outputType: 'arraybuffer' }) as ArrayBuffer

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Relatorio_EBD_Vinhedo_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pptx"`
      }
    }) 
  } catch (error) {
    console.error('Erro ao gerar PPTX:', error)
    return NextResponse.json({ error: 'Erro interno ao compilar os slides.' }, { status: 500 })
  }
}