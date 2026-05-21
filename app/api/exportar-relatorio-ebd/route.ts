import pptxgen from "pptxgenjs"
import { NextRequest, NextResponse } from 'next/server'

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

    // CONFIGURAÇÕES GERAIS (Widescreen 16:9 - 13.33 x 7.5 polegadas)
    pres.layout = 'LAYOUT_WIDE'
    pres.defineLayout({ name: 'IBV', width: 13.33, height: 7.5 })

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

    // ==========================================
    // SLIDE 1: CAPA PREMIUM
    // ==========================================
    const slide1 = pres.addSlide()
    slide1.background = { color: CORES.INDIGO_DARK }
    slide1.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.5, fill: { color: CORES.INDIGO_MAIN } })
    slide1.addShape(pres.ShapeType.rect, { x: 0, y: 1.5, w: '100%', h: 0.1, fill: { color: CORES.GOLD } })
    
    slide1.addText("📊 Relatório da Escola Bíblica Dominical", {
      x: 0.5, y: 2.5, w: 12.33, h: 1.5, fontSize: 44, color: CORES.WHITE, bold: true, align: "center", fontFace: "Arial Black"
    })
    slide1.addText("Assembleia de Deus - Vinhedo - Sede", {
      x: 0.5, y: 4.2, w: 12.33, h: 0.8, fontSize: 28, color: CORES.WHITE, align: "center", fontFace: "Arial"
    })
    slide1.addText(periodoLabel || "Relatório Geral", {
      x: 0.5, y: 5.2, w: 12.33, h: 0.6, fontSize: 20, color: CORES.CYAN, align: "center", italic: true, fontFace: "Arial"
    })
    slide1.addShape(pres.ShapeType.rect, { x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: CORES.GOLD } })

    // ==========================================
    // SLIDE 2: DETALHAMENTO POR TURMA
    // ==========================================
    const slide2 = pres.addSlide()
    slide2.background = { color: CORES.WHITE }
    slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: CORES.INDIGO_DARK } })
    slide2.addText("📋 DETALHAMENTO POR TURMA", { x: 0.5, y: 0.1, w: 12, h: 0.5, fontSize: 26, color: CORES.GOLD, bold: true })
    slide2.addText(periodoLabel || "", { x: 0.5, y: 0.6, w: 12, h: 0.3, fontSize: 14, color: CORES.WHITE })

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
      const bgColor = idx % 2 === 0 ? CORES.BG_LIGHT : CORES.WHITE
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
      x: 0.4, y: 1.4, w: 12.53,
      fontSize: 10,
      border: { type: 'solid', color: 'E2E8F0', pt: 1 },
      autoPage: true, 
      colW: [2.53, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.6]
    })

    // ==========================================
    // SLIDE 3: RESUMO GERAL DO PERÍODO
    // ==========================================
    const slide3 = pres.addSlide()
    slide3.background = { color: CORES.BG_LIGHT }
    slide3.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: CORES.INDIGO_DARK } })
    slide3.addText("📈 RESUMO GERAL DO PERÍODO", { x: 0.5, y: 0.1, w: 12, h: 0.5, fontSize: 26, color: CORES.GOLD, bold: true })
    slide3.addText(periodoLabel || "", { x: 0.5, y: 0.6, w: 12, h: 0.3, fontSize: 14, color: CORES.WHITE })

    const totalAusentesGeral = (resumoGeral?.totalMatriculados || 0) - (resumoGeral?.presentes || 0)

    // Distribuição para 6 cards
    const metricas = [
      { icon: "🎓", label: "MATRICULADOS", valor: resumoGeral?.totalMatriculados || 0, cor: CORES.INDIGO_MAIN, x: 0.4 },
      { icon: "👨‍👩‍👧‍👦", label: "PRESENTES", valor: resumoGeral?.presentes || 0, cor: CORES.SUCCESS, x: 2.5 },
      { icon: "❌", label: "AUSENTES", valor: totalAusentesGeral > 0 ? totalAusentesGeral : 0, cor: CORES.RED, x: 4.6 },
      { icon: "📖", label: "BÍBLIAS", valor: resumoGeral?.biblias || 0, cor: CORES.CYAN, x: 6.7 },
      { icon: "👋", label: "VISITANTES", valor: resumoGeral?.visitantes || 0, cor: CORES.ORANGE, x: 8.8 },
      { icon: "💰", label: "OFERTAS", valor: `R$ ${(resumoGeral?.oferta || 0).toFixed(2)}`, cor: CORES.SUCCESS, x: 10.9 }
    ]

    metricas.forEach(m => {
      const cardWidth = 2.0
      slide3.addShape(pres.ShapeType.roundRect, {
        x: m.x, y: 1.8, w: cardWidth, h: 4.5, fill: { color: CORES.WHITE }, line: { color: m.cor, width: 2 }
      })
      slide3.addText(m.icon, { x: m.x, y: 2.3, w: cardWidth, h: 1.0, fontSize: 44, align: 'center' })
      slide3.addText(m.label, { x: m.x, y: 3.6, w: cardWidth, h: 0.6, fontSize: 12, align: 'center', color: CORES.TEXT_LIGHT, bold: true })
      slide3.addText(String(m.valor), { x: m.x, y: 4.5, w: cardWidth, h: 1.0, fontSize: 22, align: 'center', color: m.cor, bold: true })
    })

    // ==========================================
    // SLIDE 4: RANKING DOS DESTAQUES
    // ==========================================
    const slide4 = pres.addSlide()
    slide4.background = { color: CORES.BG_LIGHT }
    slide4.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: CORES.INDIGO_DARK } })
    slide4.addText("🏆 RANKING DOS DESTAQUES", { x: 0.5, y: 0.1, w: 12, h: 0.5, fontSize: 26, color: CORES.GOLD, bold: true })
    slide4.addText("Salas com melhor desempenho no período", { x: 0.5, y: 0.6, w: 12, h: 0.3, fontSize: 14, color: CORES.WHITE })

    const rankPres = [...data].sort((a: any, b: any) => (b.presentes || 0) - (a.presentes || 0))[0] || {}
    const rankBib = [...data].sort((a: any, b: any) => (b.biblias || 0) - (a.biblias || 0))[0] || {}
    const rankRev = [...data].sort((a: any, b: any) => (b.revistas || 0) - (a.revistas || 0))[0] || {}
    const rankVis = [...data].sort((a: any, b: any) => (b.visitantes || 0) - (a.visitantes || 0))[0] || {}

    // Distribuição para 4 cards (foco total na performance)
    const topCards = [
      { emoji: "👨‍👩‍👧‍👦", titulo: "MAIS PRESENTES", turma: rankPres.nome, valor: rankPres.presentes, cor: CORES.INDIGO_MAIN, x: 0.5 },
      { emoji: "📖", titulo: "MAIS BÍBLIAS", turma: rankBib.nome, valor: rankBib.biblias, cor: CORES.INDIGO_MAIN, x: 3.7 },
      { emoji: "📚", titulo: "MAIS REVISTAS", turma: rankRev.nome, valor: rankRev.revistas, cor: CORES.INDIGO_MAIN, x: 6.9 },
      { emoji: "👋", titulo: "MAIS VISITANTES", turma: rankVis.nome, valor: rankVis.visitantes, cor: CORES.INDIGO_MAIN, x: 10.1 }
    ]

    topCards.forEach(card => {
      const cardW = 2.8
      slide4.addShape(pres.ShapeType.roundRect, {
        x: card.x, y: 1.8, w: cardW, h: 4.8, fill: { color: card.cor }, line: { color: card.cor, width: 0 }
      })
      slide4.addText(card.emoji, { x: card.x, y: 2.1, w: cardW, h: 0.8, fontSize: 48, align: 'center' })
      slide4.addText(card.titulo, { x: card.x, y: 3.2, w: cardW, h: 0.5, fontSize: 13, align: 'center', color: CORES.WHITE, bold: true })
      slide4.addText(card.turma || "N/A", { x: card.x, y: 3.8, w: cardW, h: 0.8, fontSize: 15, align: 'center', color: CORES.GOLD, bold: true })
      slide4.addText(String(card.valor || 0), { x: card.x, y: 4.8, w: cardW, h: 0.8, fontSize: 32, align: 'center', color: CORES.WHITE, bold: true })
    })

    const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer

    return new NextResponse(new Uint8Array(buffer), {
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