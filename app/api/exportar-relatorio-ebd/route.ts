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

    // Criar apresentação
    const pres = new pptxgen()

    // CONFIGURAÇÕES GERAIS (Widescreen 16:9)
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
      GREEN: '10B981',
      PURPLE: '8B5CF6',
      ORANGE: 'F59E0B'
    }

    // ==========================================
    // SLIDE 1: CAPA PROFISSIONAL
    // ==========================================
    const slide1 = pres.addSlide()
    slide1.background = { color: CORES.INDIGO_DARK }
    
    // Faixa dourada na base
    slide1.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: '100%', h: 0.5, fill: { color: CORES.GOLD } })
    
    slide1.addText("EBD - Escola Bíblica Dominical", {
      x: 0.5, y: 2.8, w: 12.33, fontSize: 48, color: CORES.GOLD, bold: true, align: "center", fontFace: "Arial Black"
    })
    
    slide1.addText(periodoLabel || "Relatório Geral", {
      x: 0.5, y: 3.8, w: 12.33, fontSize: 24, color: CORES.WHITE, align: "center", fontFace: "Arial"
    })

    slide1.addText("Polo: Instituto Bíblico de Vinhedo", {
      x: 0.5, y: 4.4, w: 12.33, fontSize: 18, color: 'CBD5E1', align: "center", italic: true, fontFace: "Arial"
    })

    // ==========================================
    // SLIDE 2: RELATÓRIO DE TODAS AS CLASSES
    // ==========================================
    const slide2 = pres.addSlide()
    
    // Cabeçalho Indigo
    slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: CORES.INDIGO_DARK } })
    slide2.addText("RELATÓRIO DE CLASSES", { x: 0.5, y: 0.2, w: 12, fontSize: 24, color: CORES.WHITE, bold: true })
    slide2.addText(periodoLabel || "", { x: 0.5, y: 0.6, w: 12, fontSize: 12, color: CORES.GOLD })

    const tableRows: any[][] = [
      [
        { text: "CLASSE", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true } },
        { text: "PRESENTES", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true, align: 'center' } },
        { text: "BÍBLIAS", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true, align: 'center' } },
        { text: "REVISTAS", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true, align: 'center' } },
        { text: "VISITANTES", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true, align: 'center' } },
        { text: "OFERTA", options: { fill: CORES.INDIGO_DARK, color: CORES.WHITE, bold: true, align: 'right' } }
      ]
    ]

    data.forEach((row: any) => {
      tableRows.push([
        { text: row.nome, options: { bold: true, color: CORES.TEXT_DARK } },
        { text: String(row.presentes), options: { align: 'center', color: CORES.TEXT_DARK } },
        { text: String(row.biblias), options: { align: 'center', color: CORES.TEXT_DARK } },
        { text: String(row.revistas), options: { align: 'center', color: CORES.TEXT_DARK } },
        { text: String(row.visitantes), options: { align: 'center', color: CORES.TEXT_DARK } },
        { text: `R$ ${row.oferta.toFixed(2)}`, options: { align: 'right', color: CORES.SUCCESS, bold: true } }
      ])
    })

    // Adiciona uma linha de Totais no final da tabela
    if (resumoGeral) {
      tableRows.push([
        { text: "TOTAIS", options: { fill: 'F1F5F9', bold: true, color: CORES.INDIGO_MAIN } },
        { text: String(resumoGeral.presentes), options: { fill: 'F1F5F9', align: 'center', bold: true, color: CORES.INDIGO_MAIN } },
        { text: String(resumoGeral.biblias), options: { fill: 'F1F5F9', align: 'center', bold: true, color: CORES.INDIGO_MAIN } },
        { text: String(resumoGeral.revistas), options: { fill: 'F1F5F9', align: 'center', bold: true, color: CORES.INDIGO_MAIN } },
        { text: String(resumoGeral.visitantes), options: { fill: 'F1F5F9', align: 'center', bold: true, color: CORES.INDIGO_MAIN } },
        { text: `R$ ${resumoGeral.oferta.toFixed(2)}`, options: { fill: 'F1F5F9', align: 'right', bold: true, color: CORES.INDIGO_MAIN } }
      ])
    }

    slide2.addTable(tableRows, {
      x: 0.5, y: 1.3, w: 12.33,
      fontSize: 12,
      border: { type: 'solid', color: 'E2E8F0', pt: 1 },
      autoPage: true,
      fill: { color: CORES.WHITE }
    })

    // ==========================================
    // SLIDE 3: RANKING DE DESTAQUES
    // ==========================================
    const slide3 = pres.addSlide()
    
    slide3.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.0, fill: { color: CORES.INDIGO_DARK } })
    slide3.addText("RANKING DE DESTAQUES", { x: 0.5, y: 0.2, w: 12, fontSize: 24, color: CORES.WHITE, bold: true })
    slide3.addText(periodoLabel || "", { x: 0.5, y: 0.6, w: 12, fontSize: 12, color: CORES.GOLD })

    // Cálculos rápidos do Ranking
    const rankPres = [...data].sort((a: any, b: any) => b.presentes - a.presentes)[0] || {}
    const rankBib = [...data].sort((a: any, b: any) => b.biblias - a.biblias)[0] || {}
    const rankRev = [...data].sort((a: any, b: any) => b.revistas - a.revistas)[0] || {}
    const rankVis = [...data].sort((a: any, b: any) => b.visitantes - a.visitantes)[0] || {}
    const rankOfe = [...data].sort((a: any, b: any) => b.oferta - a.oferta)[0] || {}

    const cards = [
      { title: "MAIS PRESENTES", name: rankPres.nome || "N/A", val: rankPres.presentes, x: 0.5, color: CORES.BLUE },
      { title: "MAIS BÍBLIAS", name: rankBib.nome || "N/A", val: rankBib.biblias, x: 3.0, color: CORES.GREEN },
      { title: "MAIS REVISTAS", name: rankRev.nome || "N/A", val: rankRev.revistas, x: 5.5, color: CORES.PURPLE },
      { title: "MAIS VISITANTES", name: rankVis.nome || "N/A", val: rankVis.visitantes, x: 8.0, color: CORES.ORANGE },
      { title: "MAIOR OFERTA", name: rankOfe.nome || "N/A", val: `R$ ${(rankOfe.oferta || 0).toFixed(2)}`, x: 10.5, color: CORES.SUCCESS }
    ]

    cards.forEach(card => {
      // Sombra/Fundo do card
      slide3.addShape(pres.ShapeType.rect, { 
        x: card.x, y: 2.5, w: 2.33, h: 3.5, 
        fill: { color: CORES.BG_LIGHT }, 
        line: { color: card.color, width: 3 } 
      })
      // Título da métrica
      slide3.addText(card.title, { 
        x: card.x, y: 2.8, w: 2.33, align: 'center', fontSize: 12, color: CORES.TEXT_LIGHT, bold: true 
      })
      // Nome da Turma Vencedora
      slide3.addText(card.name, { 
        x: card.x, y: 3.8, w: 2.33, align: 'center', fontSize: 18, color: CORES.TEXT_DARK, bold: true 
      })
      // Valor atingido
      slide3.addText(String(card.val || 0), { 
        x: card.x, y: 4.8, w: 2.33, align: 'center', fontSize: 26, color: card.color, bold: true 
      })
    })

    // Gerar arquivo como buffer
    const buffer = await (pres as any).write()

    // Retornar como resposta com headers apropriados
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="Relatorio_EBD_IBV_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pptx"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar PPTX:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar apresentação' },
      { status: 500 }
    )
  }
}
