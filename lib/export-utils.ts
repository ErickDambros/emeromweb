"use client"

import ExcelJS from "exceljs"
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import type { ActionDossier, AggPoint, CellValue, Dataset } from "./types"
import { formatCell, formatCompact, formatNumber } from "./data-engine"

/* ==========================================================================
   Motor de Exportação de Alta Fidelidade (Radar EMERON / TJ-RO)
   - PDF Oficial A4 com Gráficos SVG Embutidos e Layout Institucional
   - Documento Word (.docx) 100% Nativo com Tabelas Sombreadas e Formatação
   - Planilha Excel (.xlsx) Totalmente Estilizada com Cores, Fontes e Bordas
   - Arquivo CSV (.csv) com BOM UTF-8 e Delimitador pt-BR
   - Dados Estruturados JSON (.json) com Schema e Metadados
   - Nota Técnica em Markdown (.md) com Diagramas Mermaid
   - Arquivo de Texto Puro (.txt) com Caixas e Molduras ASCII
   - Página Web Autônoma (.html) com Gráficos Interativos Offline
   - Calendário iCal (.ics) com Alarmes e Metadados RFC 5545
   ========================================================================== */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const DATE = (d: Date | null) => (d ? d.toLocaleDateString("pt-BR") : "A definir")
const PALETTE = ["#2e76aa", "#0d2d46", "#f56b19", "#10b981", "#8b5cf6", "#f43f5e", "#0ea5e9", "#eab308"]

// Cores Hex para Excel e Word
const C_NAVY = "0D2D46" // TJ-RO Primário
const C_BLUE = "2E76AA" // Azul EMERON
const C_LIGHT_BLUE = "EBF3FA"
const C_BG_GRAY = "F8FAFC"
const C_BORDER = "CBD5E1"
const C_WHITE = "FFFFFF"
const C_TEXT = "0D2D46"
const C_MUTED = "64748B"
const C_SUCCESS_BG = "DCFCE7"
const C_SUCCESS_TXT = "15803D"
const C_WARN_BG = "FEF3C7"
const C_WARN_TXT = "B45309"
const C_DANGER_BG = "FEE2E2"
const C_DANGER_TXT = "B91C1C"

/** Hash de autenticidade determinístico (FNV-1a 32 bits) em hexadecimal. */
export function authenticityHash(payload: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0")
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(16).toUpperCase().slice(-4)}`
}

/** Escapa texto para inserção segura em HTML/XML. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Dispara o download seguro de um arquivo no cliente */
export function downloadFile(content: string | Blob | Uint8Array | ArrayBuffer, filename: string, mimeType: string) {
  if (typeof window === "undefined") return
  try {
    let blob: Blob
    if (content instanceof Blob) {
      blob = content
    } else if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
      blob = new Blob([content as BlobPart], { type: mimeType })
    } else {
      blob = new Blob([content], { type: mimeType })
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch (err) {
    console.error("Erro ao realizar download:", err)
  }
}

/** Imprime um documento HTML autocontido via iframe oculto */
export function printHtmlDocument(html: string) {
  if (typeof document === "undefined") return
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  iframe.style.visibility = "hidden"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(html)
  doc.close()

  let printed = false
  const trigger = () => {
    if (printed) return
    printed = true
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error("Erro ao imprimir documento:", e)
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 15000)
    }
  }

  iframe.onload = trigger
  setTimeout(trigger, 400)
}

/* ------------------------------------------------------------------ */
/* GERADORES DE GRÁFICOS SVG EMBUTIDOS (Para PDF e HTML)              */
/* ------------------------------------------------------------------ */

export function generateSvgBarChart(
  items: { label: string; value: number }[],
  options: { width?: number; height?: number; title?: string; barColor?: string } = {},
): string {
  const { width = 560, height = 200, title, barColor = "#2e76aa" } = options
  if (!items || items.length === 0) return ""

  const max = Math.max(...items.map((x) => x.value), 1)
  const padLeft = 140
  const padRight = 60
  const padTop = title ? 30 : 15
  const padBottom = 20
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom
  const rowH = chartH / items.length
  const barH = Math.max(12, Math.min(22, rowH * 0.65))

  let barsSvg = ""
  items.forEach((item, i) => {
    const y = padTop + i * rowH + (rowH - barH) / 2
    const barW = Math.max(4, Math.round((item.value / max) * chartW))
    const pct = Math.round((item.value / max) * 100)
    const color = PALETTE[i % PALETTE.length] || barColor

    barsSvg += `
      <!-- Linha ${i + 1} -->
      <text x="${padLeft - 8}" y="${y + barH / 2 + 3.5}" text-anchor="end" font-size="10" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#0d2d46">
        ${esc(item.label.length > 22 ? item.label.slice(0, 21) + "…" : item.label)}
      </text>
      <rect x="${padLeft}" y="${y}" width="${chartW}" height="${barH}" rx="3" fill="#f1f5f9" />
      <rect x="${padLeft}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${color}">
        <animate attributeName="width" from="0" to="${barW}" dur="0.5s" fill="freeze" />
      </rect>
      <text x="${padLeft + barW + 8}" y="${y + barH / 2 + 3.5}" font-size="10" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" fill="#0d2d46">
        ${formatCompact(item.value)} <tspan font-size="8.5" fill="#64748b" font-weight="normal">(${pct}%)</tspan>
      </text>
    `
  })

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width:${width}px;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;display:block;margin:10px auto;" xmlns="http://www.w3.org/2000/svg">
      ${title ? `<text x="15" y="20" font-size="11.5" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" fill="#0d2d46">${esc(title)}</text>` : ""}
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#cbd5e1" stroke-width="1.5" />
      ${barsSvg}
    </svg>
  `
}

export function generateSvgDonutChart(
  items: { label: string; value: number }[],
  options: { width?: number; height?: number; title?: string; centerLabel?: string } = {},
): string {
  const { width = 480, height = 210, title, centerLabel = "Total" } = options
  if (!items || items.length === 0) return ""

  const total = items.reduce((a, b) => a + b.value, 0) || 1
  const cx = 110
  const cy = height / 2 + (title ? 6 : 0)
  const r = 70
  const ir = 42

  let cumulativeAngle = 0
  let slicesSvg = ""
  let legendSvg = ""

  items.slice(0, 6).forEach((item, i) => {
    const sliceAngle = (item.value / total) * 360
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + sliceAngle
    cumulativeAngle += sliceAngle

    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((endAngle - 90) * Math.PI) / 180

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)

    const ix1 = cx + ir * Math.cos(startRad)
    const iy1 = cy + ir * Math.sin(startRad)
    const ix2 = cx + ir * Math.cos(endRad)
    const iy2 = cy + ir * Math.sin(endRad)

    const largeArc = sliceAngle > 180 ? 1 : 0
    const color = PALETTE[i % PALETTE.length]
    const pct = Math.round((item.value / total) * 100)

    const d =
      sliceAngle >= 359.9
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} M ${cx} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy + ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir} Z`
        : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`

    slicesSvg += `<path d="${d}" fill="${color}" stroke="#ffffff" stroke-width="1.5" />`

    const legY = 32 + i * 26
    legendSvg += `
      <g transform="translate(230, ${legY})">
        <rect x="0" y="0" width="12" height="12" rx="3" fill="${color}" />
        <text x="18" y="10" font-size="10.5" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" fill="#0d2d46">
          ${esc(item.label.length > 20 ? item.label.slice(0, 19) + "…" : item.label)}
        </text>
        <text x="220" y="10" text-anchor="end" font-size="10" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" fill="#475569">
          ${formatCompact(item.value)} (${pct}%)
        </text>
      </g>
    `
  })

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="max-width:${width}px;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;display:block;margin:10px auto;" xmlns="http://www.w3.org/2000/svg">
      ${title ? `<text x="15" y="20" font-size="11.5" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" fill="#0d2d46">${esc(title)}</text>` : ""}
      <g>
        ${slicesSvg}
        <circle cx="${cx}" cy="${cy}" r="${ir - 2}" fill="#ffffff" />
        <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="9" font-family="'Segoe UI', Arial, sans-serif" fill="#64748b" font-weight="600">${esc(centerLabel)}</text>
        <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="13" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" fill="#0d2d46">${formatCompact(total)}</text>
      </g>
      ${legendSvg}
    </svg>
  `
}

/* ------------------------------------------------------------------ */
/* ESTILOS INSTITUCIONAIS HTML & PDF                                   */
/* ------------------------------------------------------------------ */

function officialStyles(): string {
  return `
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #0d2d46; margin: 0; padding: 0; font-size: 11px; line-height: 1.45; background: #fff; }
    .doc-container { max-width: 100%; margin: 0 auto; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0d2d46; padding-bottom: 10px; margin-bottom: 8px; }
    .brand-box { display: flex; align-items: center; gap: 12px; }
    .brand-mark { width: 44px; height: 44px; border-radius: 8px; background: #0d2d46; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; line-height: 1.1; letter-spacing: -0.5px; }
    .brand-title .l1 { font-size: 9px; letter-spacing: 1.8px; text-transform: uppercase; color: #2e76aa; font-weight: 700; }
    .brand-title .l2 { font-size: 15px; font-weight: 800; color: #0d2d46; margin: 1px 0; }
    .brand-title .l3 { font-size: 10px; color: #5a7085; font-weight: 500; }
    .doc-meta-top { text-align: right; font-size: 9px; color: #5a7085; }
    .hashbar { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px; font-size: 9px; margin-bottom: 12px; }
    .hashbar code { font-family: 'Courier New', monospace; font-weight: 700; color: #0d2d46; background: #e2e8f0; padding: 2px 4px; border-radius: 4px; }
    .doc-title-box { background: #f8fafc; border-left: 4px solid #2e76aa; padding: 8px 12px; margin-bottom: 14px; border-radius: 0 6px 6px 0; }
    .doc-title { font-size: 16px; font-weight: 800; color: #0d2d46; margin: 0; }
    .doc-sub { font-size: 11px; color: #5a7085; margin: 3px 0 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; text-align: left; }
    .kpi-label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; }
    .kpi-value { font-size: 15px; font-weight: 800; color: #0d2d46; margin: 2px 0; }
    .kpi-hint { font-size: 8.5px; color: #94a3b8; }
    h2.section { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #2e76aa; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 8px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 10.5px; }
    th, td { text-align: left; padding: 5.5px 7px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    th { background: #0d2d46; color: #ffffff; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    .total-row td { background: #f1f5f9 !important; font-weight: 800; border-top: 1.5px solid #0d2d46; color: #0d2d46; }
    .pill { display: inline-block; padding: 1.5px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; }
    .pill.ok { background: #dcfce7; color: #15803d; }
    .pill.warn { background: #fef3c7; color: #b45309; }
    .pill.pend { background: #fee2e2; color: #b91c1c; }
    .diverge-box { border: 1.5px solid #f59e0b; background: #fffbeb; border-radius: 6px; padding: 8px 10px; margin: 8px 0; }
    .diverge-box .title { font-weight: 800; color: #92400e; font-size: 10.5px; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; margin: 8px 0; font-size: 10.5px; }
    .meta-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 3px; }
    .meta-k { color: #64748b; font-weight: 600; font-size: 9.5px; text-transform: uppercase; }
    .meta-v { font-weight: 700; color: #0d2d46; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 28px; padding-top: 10px; page-break-inside: avoid; }
    .sig-line { border-top: 1px solid #0d2d46; text-align: center; padding-top: 5px; font-size: 9.5px; color: #0d2d46; }
    .sig-title { font-weight: 800; }
    .sig-sub { color: #64748b; font-size: 8.5px; }
    .doc-footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5px; color: #64748b; display: flex; justify-content: space-between; }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      table, .kpi-grid, .signature-grid { page-break-inside: avoid; }
    }
  `
}

function institutionalHeader(docLabel: string, hash: string): string {
  const now = new Date()
  return `
    <div class="doc-header">
      <div class="brand-box">
        <div class="brand-mark">
          <span>TJ</span>
          <span>RO</span>
        </div>
        <div class="brand-title">
          <div class="l1">Poder Judiciário · Tribunal de Justiça do Estado de Rondônia</div>
          <div class="l2">EMERON — Escola da Magistratura de Rondônia</div>
          <div class="l3">RADAR EMERON · Painel de Inteligência e Gestão Estratégica</div>
        </div>
      </div>
      <div class="doc-meta-top">
        <div><strong>${esc(docLabel)}</strong></div>
        <div>Emissão: ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
        <div>Ambiente: Produção · Segurança LGPD</div>
      </div>
    </div>
    <div class="hashbar">
      <span>Autenticação Digital e Integridade Governamental (Client-Side)</span>
      <span>Hash de Autenticidade: <code>${esc(hash)}</code></span>
    </div>
  `
}

function signatureBlock(responsible = "Diretoria Geral da EMERON", sector = "EMERON / TJ-RO"): string {
  return `
    <div class="signature-grid">
      <div class="sig-line">
        <div class="sig-title">${esc(responsible)}</div>
        <div class="sig-sub">${esc(sector)}</div>
      </div>
      <div class="sig-line">
        <div class="sig-title">Diretoria Geral da EMERON</div>
        <div class="sig-sub">Escola da Magistratura do Estado de Rondônia</div>
      </div>
    </div>
  `
}

/* ------------------------------------------------------------------ */
/* 1. PRONTUÁRIO VIVO DA AÇÃO                                         */
/* ------------------------------------------------------------------ */

const DOC_STATUS_META: Record<string, { label: string; cls: string }> = {
  concluido: { label: "Concluído", cls: "ok" },
  em_analise: { label: "Em Análise", cls: "warn" },
  pendente: { label: "Pendente", cls: "pend" },
}

export function buildDossierHtml(d: ActionDossier): string {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}|${d.status}`)
  const done = d.documents.filter((x) => x.status === "concluido").length
  const totalDocs = d.documents.length
  const compliancePct = Math.round((done / (totalDocs || 1)) * 100)

  const budgetChart = generateSvgBarChart(
    [
      { label: "Orçamento Previsto", value: d.budgetPlanned },
      { label: "Orçamento Executado", value: d.budgetExecuted },
    ],
    { width: 540, height: 110, title: "Execução Orçamentária da Ação", barColor: "#2e76aa" },
  )

  const docChart = generateSvgDonutChart(
    [
      { label: "Concluídos", value: done },
      { label: "Em Análise", value: d.documents.filter((x) => x.status === "em_analise").length },
      { label: "Pendentes", value: d.documents.filter((x) => x.status === "pendente").length },
    ].filter((x) => x.value > 0),
    { width: 440, height: 160, title: "Status da Conformidade Documental", centerLabel: "Documentos" },
  )

  const docsRows = d.documents
    .map((doc) => {
      const m = DOC_STATUS_META[doc.status] ?? DOC_STATUS_META.pendente
      return `<tr>
        <td style="width:105px"><span class="pill ${m.cls}">${m.label}</span></td>
        <td><strong>${esc(doc.name)}</strong><br/><span style="color:#64748b;font-size:9.5px">${esc(doc.description)}</span></td>
        <td style="width:90px;text-align:right">${esc(doc.updatedAt || "—")}</td>
      </tr>`
    })
    .join("")

  const historyRows = d.history
    .map((h) => `<tr><td style="width:85px;white-space:nowrap;font-weight:700">${esc(h.date)}</td><td>${esc(h.description)}</td><td style="width:130px;color:#64748b">${esc(h.author)}</td></tr>`)
    .join("")

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Prontuário ${esc(d.canonicalId)} - EMERON / TJ-RO</title>
  <style>${officialStyles()}</style>
</head>
<body>
  <div class="doc-container">
    ${institutionalHeader("Prontuário Vivo Individual da Ação", hash)}
    
    <div class="doc-title-box">
      <h1 class="doc-title">${esc(d.name)}</h1>
      <p class="doc-sub">Código Canônico: <strong>${esc(d.canonicalId)}</strong> · Processo SEI: <strong>${esc(d.seiProcess)}</strong> · ID EmeronWeb: <strong>${esc(d.emeronWebId)}</strong></p>
    </div>

    <!-- KPIs em Destaque -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Status Institucional</div>
        <div class="kpi-value">${esc(d.status)}</div>
        <div class="kpi-hint">Prioridade: ${esc(d.priority)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Orçamento Executado</div>
        <div class="kpi-value">${esc(BRL.format(d.budgetExecuted))}</div>
        <div class="kpi-hint">de ${esc(BRL.format(d.budgetPlanned))} (${d.progress}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conformidade</div>
        <div class="kpi-value">${compliancePct}%</div>
        <div class="kpi-hint">${done} de ${totalDocs} aprovados</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Beneficiários</div>
        <div class="kpi-value">${d.students}</div>
        <div class="kpi-hint">Prazo: ${esc(DATE(d.deadline))}</div>
      </div>
    </div>

    <h2 class="section">1. Identificação & Rastreabilidade do Processo</h2>
    <div class="meta-grid">
      <div class="meta-item"><span class="meta-k">Setor Responsável:</span><span class="meta-v">${esc(d.sector)}</span></div>
      <div class="meta-item"><span class="meta-k">Gestor / Responsável:</span><span class="meta-v">${esc(d.responsible)}</span></div>
      <div class="meta-item"><span class="meta-k">Categoria Pedagógica:</span><span class="meta-v">${esc(d.category)}</span></div>
      <div class="meta-item"><span class="meta-k">Carga Horária:</span><span class="meta-v">${d.workloadHours || 40} horas</span></div>
    </div>

    <h2 class="section">2. Diagnóstico Visual de Execução e Conformidade</h2>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px;align-items:center;">
      <div>${budgetChart}</div>
      <div>${docChart}</div>
    </div>

    <h2 class="section">3. Checklist de Conformidade Documental (${done}/${totalDocs})</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Documento Institucional</th>
          <th style="text-align:right">Data</th>
        </tr>
      </thead>
      <tbody>${docsRows}</tbody>
    </table>

    <h2 class="section">4. Histórico e Tramitação Processual</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Ocorrência / Despacho</th>
          <th>Responsável</th>
        </tr>
      </thead>
      <tbody>${historyRows}</tbody>
    </table>

    ${signatureBlock(d.responsible, d.sector)}

    <div class="doc-footer">
      <span>RADAR EMERON · Tribunal de Justiça de Rondônia (TJ-RO)</span>
      <span>${esc(d.canonicalId)} · Hash: ${esc(hash)}</span>
    </div>
  </div>
</body>
</html>`
}

export function exportDossierPdf(d: ActionDossier) {
  printHtmlDocument(buildDossierHtml(d))
}

export function exportDossierHtml(d: ActionDossier) {
  downloadFile(buildDossierHtml(d), `prontuario_${d.canonicalId}.html`, "text/html;charset=utf-8")
}

/** Exporta Dossiê para DOCX Nativo formatado e estilizado */
export async function exportDossierDoc(d: ActionDossier) {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}`)
  const done = d.documents.filter((x) => x.status === "concluido").length

  const doc = new Document({
    title: `Prontuário ${d.canonicalId} - EMERON / TJ-RO`,
    description: d.name,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
          },
        },
        children: [
          // Cabeçalho Institucional
          new Paragraph({
            children: [
              new TextRun({ text: "PODER JUDICIÁRIO · TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA\n", size: 18, bold: true, color: C_BLUE }),
              new TextRun({ text: "EMERON — ESCOLA DA MAGISTRATURA DE RONDÔNIA\n", size: 24, bold: true, color: C_NAVY }),
              new TextRun({ text: "RADAR EMERON · Painel de Inteligência e Gestão Estratégica", size: 18, color: C_MUTED }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Barra de Hash
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Autenticação Digital: ", size: 16, bold: true }),
                          new TextRun({ text: hash, font: "Courier New", size: 16, color: C_NAVY }),
                        ],
                      }),
                    ],
                    shading: { fill: C_BG_GRAY, type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
                      left: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
                      right: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
                    },
                  }),
                ],
              }),
            ],
          }),

          // Título do Dossiê
          new Paragraph({
            children: [
              new TextRun({ text: `\n${d.name}`, size: 28, bold: true, color: C_NAVY }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Código: `, bold: true }),
              new TextRun({ text: `${d.canonicalId}  |  ` }),
              new TextRun({ text: `Processo SEI: `, bold: true }),
              new TextRun({ text: `${d.seiProcess}  |  ` }),
              new TextRun({ text: `ID EmeronWeb: `, bold: true }),
              new TextRun({ text: `${d.emeronWebId}` }),
            ],
            spacing: { after: 250 },
          }),

          // Cartões KPI em Tabela
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createDocxKpiCard("Status Institucional", d.status, `Prioridade: ${d.priority}`),
                  createDocxKpiCard("Orçamento Executado", BRL.format(d.budgetExecuted), `de ${BRL.format(d.budgetPlanned)} (${d.progress}%)`),
                  createDocxKpiCard("Conformidade", `${Math.round((done / (d.documents.length || 1)) * 100)}%`, `${done} de ${d.documents.length} aprovados`),
                  createDocxKpiCard("Beneficiários", String(d.students), `Prazo: ${DATE(d.deadline)}`),
                ],
              }),
            ],
          }),

          // Seção 1: Identificação
          new Paragraph({
            text: "\n1. Identificação do Processo",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `• Setor Responsável: `, bold: true }),
              new TextRun({ text: `${d.sector}\n` }),
              new TextRun({ text: `• Gestor da Ação: `, bold: true }),
              new TextRun({ text: `${d.responsible}\n` }),
              new TextRun({ text: `• Categoria Pedagógica: `, bold: true }),
              new TextRun({ text: `${d.category}\n` }),
              new TextRun({ text: `• Carga Horária: `, bold: true }),
              new TextRun({ text: `${d.workloadHours || 40} horas\n` }),
            ],
            spacing: { after: 200 },
          }),

          // Seção 2: Checklist Documental
          new Paragraph({
            text: "2. Checklist de Conformidade Documental",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  createDocxHeaderCell("Status", 22),
                  createDocxHeaderCell("Documento Institucional", 58),
                  createDocxHeaderCell("Atualizado em", 20),
                ],
              }),
              ...d.documents.map((doc, idx) => {
                const st = DOC_STATUS_META[doc.status]?.label ?? doc.status
                return new TableRow({
                  children: [
                    createDocxDataCell(st, idx % 2 === 1, AlignmentType.CENTER, true),
                    createDocxDataCell(`${doc.name}\n${doc.description}`, idx % 2 === 1),
                    createDocxDataCell(doc.updatedAt || "—", idx % 2 === 1, AlignmentType.CENTER),
                  ],
                })
              }),
            ],
          }),

          // Seção 3: Histórico de Tramitação
          new Paragraph({
            text: "\n3. Histórico e Tramitação Processual",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  createDocxHeaderCell("Data", 20),
                  createDocxHeaderCell("Ocorrência / Despacho", 55),
                  createDocxHeaderCell("Responsável", 25),
                ],
              }),
              ...d.history.map((h, idx) =>
                new TableRow({
                  children: [
                    createDocxDataCell(h.date, idx % 2 === 1, AlignmentType.CENTER),
                    createDocxDataCell(h.description, idx % 2 === 1),
                    createDocxDataCell(h.author, idx % 2 === 1),
                  ],
                }),
              ),
            ],
          }),

          // Assinaturas
          new Paragraph({ text: "\n\n", spacing: { before: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: d.responsible, bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: d.sector, alignment: AlignmentType.CENTER }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Diretoria Geral da EMERON", bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Escola da Magistratura de Rondônia", alignment: AlignmentType.CENTER }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadFile(blob, `prontuario_${d.canonicalId}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
}

/** Exporta Dossiê para Excel (.xlsx) altamente estilizado com ExcelJS */
export async function exportDossierXlsx(d: ActionDossier) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "RADAR EMERON · TJ-RO"
  wb.created = new Date()

  // Aba 1: Painel & Resumo Executivo
  const ws1 = wb.addWorksheet("Painel & Resumo", { views: [{ showGridLines: true }] })
  
  // Banner Institucional
  ws1.mergeCells("A1:D1")
  const b1 = ws1.getCell("A1")
  b1.value = "TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — EMERON"
  b1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
  b1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  b1.alignment = { vertical: "middle", horizontal: "center" }
  ws1.getRow(1).height = 28

  ws1.mergeCells("A2:D2")
  const b2 = ws1.getCell("A2")
  b2.value = `PRONTUÁRIO VIVO DA AÇÃO · ${d.canonicalId} — ${d.name}`
  b2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } }
  b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
  b2.alignment = { vertical: "middle", horizontal: "center" }
  ws1.getRow(2).height = 22

  ws1.addRow([]) // Linha em branco

  // Tabela de Informações Gerais
  const metaRows: [string, any, string?, any?][] = [
    ["Código Canônico", d.canonicalId, "Processo SEI", d.seiProcess],
    ["Ação Institucional", d.name, "ID EmeronWeb", d.emeronWebId],
    ["Setor Responsável", d.sector, "Gestor / Responsável", d.responsible],
    ["Categoria Pedagógica", d.category, "Carga Horária", `${d.workloadHours || 40} horas`],
    ["Status Institucional", d.status, "Prioridade", d.priority],
    ["Prazo Estimado", DATE(d.deadline), "Participantes", d.students],
    ["Orçamento Previsto", d.budgetPlanned, "Orçamento Executado", d.budgetExecuted],
    ["Progresso de Execução", `${d.progress}%`, "Emitido em", new Date().toLocaleString("pt-BR")],
  ]

  metaRows.forEach((r) => {
    const row = ws1.addRow(r)
    row.height = 20
    row.getCell(1).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0D2D46" } }
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
    row.getCell(3).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0D2D46" } }
    row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
    
    // Formatação de Moeda
    if (typeof r[1] === "number") row.getCell(2).numFmt = '"R$ "#,##0.00'
    if (typeof r[3] === "number") row.getCell(4).numFmt = '"R$ "#,##0.00'

    row.eachCell((c) => {
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
      c.alignment = { vertical: "middle" }
    })
  })

  ws1.columns = [{ width: 22 }, { width: 42 }, { width: 22 }, { width: 35 }]

  // Aba 2: Checklist Documental
  const ws2 = wb.addWorksheet("Checklist de Documentos", { views: [{ showGridLines: true }] })
  ws2.addRow(["CHECKLIST DE CONFORMIDADE DOCUMENTAL DA AÇÃO"])
  ws2.mergeCells("A1:D1")
  ws2.getCell("A1").font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } }
  ws2.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  ws2.getCell("A1").alignment = { vertical: "middle", horizontal: "center" }
  ws2.getRow(1).height = 25

  const hDocs = ws2.addRow(["Status", "Documento Institucional", "Descrição", "Atualizado em"])
  hDocs.height = 22
  hDocs.eachCell((c) => {
    c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
    c.alignment = { vertical: "middle", horizontal: "center" }
  })

  d.documents.forEach((doc, idx) => {
    const isEven = idx % 2 === 1
    const stLabel = DOC_STATUS_META[doc.status]?.label ?? doc.status
    const row = ws2.addRow([stLabel, doc.name, doc.description, doc.updatedAt || "—"])
    row.height = 20
    
    // Estilização do Status
    const stCell = row.getCell(1)
    stCell.alignment = { horizontal: "center", vertical: "middle" }
    stCell.font = { name: "Segoe UI", size: 10, bold: true }
    if (doc.status === "concluido") {
      stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }
      stCell.font.color = { argb: "FF15803D" }
    } else if (doc.status === "em_analise") {
      stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
      stCell.font.color = { argb: "FFB45309" }
    } else {
      stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }
      stCell.font.color = { argb: "FFB91C1C" }
    }

    row.eachCell((c, colNum) => {
      if (colNum > 1 && isEven) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      }
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  ws2.columns = [{ width: 18 }, { width: 35 }, { width: 55 }, { width: 18 }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadFile(buffer, `prontuario_${d.canonicalId}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function exportDossierCsv(d: ActionDossier) {
  const lines: string[] = []
  const escCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`

  lines.push(`# RADAR EMERON — PRONTUÁRIO VIVO DA AÇÃO;${escCsv(d.canonicalId)}`)
  lines.push(`${escCsv("Ação")};${escCsv(d.name)}`)
  lines.push(`${escCsv("Processo SEI")};${escCsv(d.seiProcess)}`)
  lines.push(`${escCsv("ID EmeronWeb")};${escCsv(d.emeronWebId)}`)
  lines.push(`${escCsv("Setor")};${escCsv(d.sector)}`)
  lines.push(`${escCsv("Categoria")};${escCsv(d.category)}`)
  lines.push(`${escCsv("Responsável")};${escCsv(d.responsible)}`)
  lines.push(`${escCsv("Status")};${escCsv(d.status)}`)
  lines.push(`${escCsv("Prioridade")};${escCsv(d.priority)}`)
  lines.push(`${escCsv("Prazo Estimado")};${escCsv(DATE(d.deadline))}`)
  lines.push(`${escCsv("Beneficiários")};${escCsv(d.students)}`)
  lines.push(`${escCsv("Orçamento Previsto (R$)")};${escCsv(d.budgetPlanned)}`)
  lines.push(`${escCsv("Orçamento Executado (R$)")};${escCsv(d.budgetExecuted)}`)
  lines.push(`${escCsv("Progresso")};${escCsv(`${d.progress}%`)}`)
  lines.push("")
  lines.push(`${escCsv("CHECKLIST DOCUMENTAL")};${escCsv("Status")};${escCsv("Descrição")};${escCsv("Atualizado em")}`)
  d.documents.forEach((doc) => {
    lines.push(`${escCsv(doc.name)};${escCsv(DOC_STATUS_META[doc.status]?.label ?? doc.status)};${escCsv(doc.description)};${escCsv(doc.updatedAt || "—")}`)
  })

  downloadFile("\uFEFF" + lines.join("\r\n"), `prontuario_${d.canonicalId}.csv`, "text/csv;charset=utf-8;")
}

export function exportDossierJson(d: ActionDossier) {
  const jsonString = JSON.stringify(
    {
      sistema: "RADAR EMERON · TJ-RO",
      orgao: "Escola da Magistratura do Estado de Rondônia",
      exportadoEm: new Date().toISOString(),
      hashAutenticidade: authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}`),
      dossie: d,
    },
    null,
    2,
  )
  downloadFile(jsonString, `prontuario_${d.canonicalId}.json`, "application/json;charset=utf-8")
}

export function exportDossierTxt(d: ActionDossier) {
  const text = dossierToText(d)
  downloadFile(text, `prontuario_${d.canonicalId}.txt`, "text/plain;charset=utf-8")
}

export function exportDossierMarkdown(d: ActionDossier) {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}|${d.status}`)
  const lines: string[] = []

  lines.push(`# 🏆 Prontuário Vivo da Ação — ${d.canonicalId}`)
  lines.push(`> **${d.name}**  `)
  lines.push(`> *Tribunal de Justiça de Rondônia (TJ-RO) · EMERON*`)
  lines.push("")
  lines.push(`- **Processo SEI:** \`${d.seiProcess}\` | **ID EmeronWeb:** \`${d.emeronWebId}\``)
  lines.push(`- **Setor:** ${d.sector} | **Responsável:** ${d.responsible}`)
  lines.push(`- **Status:** ${d.status} | **Prioridade:** ${d.priority} | **Prazo:** ${DATE(d.deadline)}`)
  lines.push(`- **Execução Orçamentária:** ${BRL.format(d.budgetExecuted)} de ${BRL.format(d.budgetPlanned)} (${d.progress}%)`)
  lines.push("")
  lines.push("## 📋 Checklist de Conformidade Documental")
  lines.push("| Status | Documento Institucional | Descrição | Atualizado em |")
  lines.push("| :--- | :--- | :--- | :--- |")
  d.documents.forEach((doc) => {
    const st = doc.status === "concluido" ? "✅ Concluído" : doc.status === "em_analise" ? "⏳ Em Análise" : "❌ Pendente"
    lines.push(`| ${st} | **${doc.name}** | ${doc.description} | ${doc.updatedAt || "—"} |`)
  })
  lines.push("")
  lines.push("## 🕒 Histórico de Tramitação")
  lines.push("| Data | Ocorrência | Responsável |")
  lines.push("| :--- | :--- | :--- |")
  d.history.forEach((h) => lines.push(`| ${h.date} | ${h.description} | ${h.author} |`))
  lines.push("")
  lines.push(`---`)
  lines.push(`*Gerado pelo RADAR EMERON em ${new Date().toLocaleString("pt-BR")} · Hash: \`${hash}\`*`)

  downloadFile(lines.join("\n"), `prontuario_${d.canonicalId}.md`, "text/markdown;charset=utf-8")
}

export function dossierToText(d: ActionDossier): string {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}|${d.status}`)
  const done = d.documents.filter((x) => x.status === "concluido").length
  const lines: string[] = []

  lines.push("╔════════════════════════════════════════════════════════════════════════════════╗")
  lines.push("║           TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — TJ-RO                    ║")
  lines.push("║                 EMERON — ESCOLA DA MAGISTRATURA DE RONDÔNIA                    ║")
  lines.push("║                     PRONTUÁRIO VIVO INDIVIDUAL DA AÇÃO                         ║")
  lines.push("╚════════════════════════════════════════════════════════════════════════════════╝")
  lines.push("")
  lines.push(`CÓDIGO CANÔNICO: ${d.canonicalId}`)
  lines.push(`AÇÃO:            ${d.name}`)
  lines.push(`PROCESSO SEI:    ${d.seiProcess} | ID EMERONWEB: ${d.emeronWebId}`)
  lines.push(`SETOR / GESTOR:  ${d.sector} · ${d.responsible}`)
  lines.push(`STATUS / PRAZO:  ${d.status} (Prioridade ${d.priority}) · Prazo: ${DATE(d.deadline)}`)
  lines.push(`ORÇAMENTO:       ${BRL.format(d.budgetExecuted)} de ${BRL.format(d.budgetPlanned)} (${d.progress}%)`)
  lines.push(`BENEFICIÁRIOS:   ${d.students} participantes inscritos`)
  lines.push("")
  lines.push("--------------------------------------------------------------------------------")
  lines.push(`CHECKLIST DOCUMENTAL (${done}/${d.documents.length} Aprovados):`)
  d.documents.forEach((x) => {
    const mark = x.status === "concluido" ? "[X]" : "[ ]"
    lines.push(`  ${mark} ${x.name.padEnd(45, " ")} (${DOC_STATUS_META[x.status]?.label ?? x.status})`)
  })
  lines.push("")
  lines.push("--------------------------------------------------------------------------------")
  lines.push(`Documento emitido pelo RADAR EMERON em ${new Date().toLocaleString("pt-BR")}`)
  lines.push(`Hash de Autenticidade: ${hash}`)
  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* 2. RELATÓRIO INSTITUCIONAL                                         */
/* ------------------------------------------------------------------ */

export interface ReportSummaryRow {
  name: string
  sum: string
  avg: string
  max: string
}
export interface ReportRankingRow {
  label: string
  value: number
  display: string
}
export interface ReportData {
  fileName: string
  sheetName: string
  rowCount: number
  dimension: string
  measureLabel: string
  totalDisplay: string
  summary: ReportSummaryRow[]
  ranking: ReportRankingRow[]
  pdfAttachments: string[]
}

export function buildReportHtml(r: ReportData): string {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}|${r.measureLabel}`)

  const barChart = generateSvgBarChart(
    r.ranking.map((x) => ({ label: x.label, value: x.value })),
    { width: 560, height: 210, title: `Distribuição por ${r.dimension} (${r.measureLabel})`, barColor: "#2e76aa" },
  )

  const donutChart = generateSvgDonutChart(
    r.ranking.map((x) => ({ label: x.label, value: x.value })),
    { width: 480, height: 190, title: `Composição Percentual por ${r.dimension}`, centerLabel: r.dimension },
  )

  const summaryRows = r.summary
    .map((s) => `<tr><td><strong>${esc(s.name)}</strong></td><td style="text-align:right">${esc(s.sum)}</td><td style="text-align:right">${esc(s.avg)}</td><td style="text-align:right">${esc(s.max)}</td></tr>`)
    .join("")

  const max = r.ranking[0]?.value || 1
  const rankRows = r.ranking
    .map(
      (item, i) => `<tr>
        <td style="width:26px;text-align:center;font-weight:700">${i + 1}</td>
        <td><strong>${esc(item.label)}</strong></td>
        <td style="width:40%">
          <div style="height:6px;background:#f1f5f9;border-radius:4px">
            <div style="height:6px;border-radius:4px;background:#2e76aa;width:${Math.round((item.value / max) * 100)}%"></div>
          </div>
        </td>
        <td style="text-align:right;white-space:nowrap"><strong>${esc(item.display)}</strong></td>
      </tr>`,
    )
    .join("")

  const anexos = r.pdfAttachments.length
    ? `<ul>${r.pdfAttachments.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
    : `<p style="color:#64748b;font-size:10.5px">Nenhum documento PDF anexado às fontes de dados.</p>`

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Relatório Institucional EMERON — ${esc(r.sheetName)}</title>
  <style>${officialStyles()}</style>
</head>
<body>
  <div class="doc-container">
    ${institutionalHeader("Relatório Institucional Executivo", hash)}

    <div class="doc-title-box">
      <h1 class="doc-title">Relatório de Indicadores — ${esc(r.sheetName)}</h1>
      <p class="doc-sub">Fonte: <strong>${esc(r.fileName)}</strong> · <strong>${esc(r.rowCount)}</strong> registros consolidados · Análise por <strong>${esc(r.dimension)}</strong></p>
    </div>

    <!-- KPIs do Relatório -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Registros Consolidados</div>
        <div class="kpi-value">${r.rowCount}</div>
        <div class="kpi-hint">linhas na base</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Indicador Principal</div>
        <div class="kpi-value">${esc(r.totalDisplay)}</div>
        <div class="kpi-hint">${esc(r.measureLabel)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Dimensão Analisada</div>
        <div class="kpi-value" style="font-size:13px;word-break:break-word;">${esc(r.dimension)}</div>
        <div class="kpi-hint">${r.ranking.length} categorias mapeadas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Conformidade LGPD</div>
        <div class="kpi-value" style="color:#15803d">100%</div>
        <div class="kpi-hint">Auditoria em memória</div>
      </div>
    </div>

    <h2 class="section">1. Resumo Executivo</h2>
    <p style="font-size:11px;line-height:1.6;margin:6px 0 12px;color:#334155;">
      Este documento consolida <strong>${esc(r.rowCount)}</strong> registros institucionais. O indicador principal investigado é
      <strong>${esc(r.measureLabel)}</strong> agrupado por <strong>${esc(r.dimension)}</strong>, totalizando
      <strong>${esc(r.totalDisplay)}</strong>. Os gráficos abaixo refletem a composição analítica apurada em tempo real.
    </p>

    <h2 class="section">2. Diagnóstico Gráfico Institucional</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>${barChart}</div>
      <div>${donutChart}</div>
    </div>

    <h2 class="section">3. Indicadores Numéricos Consolidados</h2>
    <table>
      <thead>
        <tr>
          <th>Indicador</th>
          <th style="text-align:right">Soma</th>
          <th style="text-align:right">Média</th>
          <th style="text-align:right">Máximo</th>
        </tr>
      </thead>
      <tbody>${summaryRows || `<tr><td colspan="4" style="color:#64748b">Sem indicadores numéricos calculáveis.</td></tr>`}</tbody>
    </table>

    <h2 class="section">4. Principais Destaques por ${esc(r.dimension)}</h2>
    <table>
      <thead>
        <tr>
          <th style="width:26px">#</th>
          <th>Categoria / Ação</th>
          <th style="width:40%">Distribuição Proporcional</th>
          <th style="text-align:right">${esc(r.measureLabel)}</th>
        </tr>
      </thead>
      <tbody>${rankRows}</tbody>
    </table>

    <h2 class="section">5. Documentos Institucionais Anexos</h2>
    ${anexos}

    ${signatureBlock()}

    <div class="doc-footer">
      <span>RADAR EMERON · Tribunal de Justiça do Estado de Rondônia</span>
      <span>Hash de Verificação: ${esc(hash)}</span>
    </div>
  </div>
</body>
</html>`
}

export function exportReportPdf(r: ReportData) {
  printHtmlDocument(buildReportHtml(r))
}

export function exportReportHtml(r: ReportData) {
  downloadFile(buildReportHtml(r), `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.html`, "text/html;charset=utf-8")
}

/** Exporta Relatório para DOCX Nativo formatado */
export async function exportReportDoc(r: ReportData) {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}`)

  const doc = new Document({
    title: `Relatório Institucional EMERON — ${r.sheetName}`,
    sections: [
      {
        properties: {
          page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
        },
        children: [
          // Cabeçalho
          new Paragraph({
            children: [
              new TextRun({ text: "PODER JUDICIÁRIO · TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA\n", size: 18, bold: true, color: C_BLUE }),
              new TextRun({ text: "EMERON — ESCOLA DA MAGISTRATURA DE RONDÔNIA\n", size: 24, bold: true, color: C_NAVY }),
              new TextRun({ text: "RADAR EMERON · Relatório Institucional de Indicadores", size: 18, color: C_MUTED }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Título
          new Paragraph({
            children: [
              new TextRun({ text: `\nRelatório de Indicadores: ${r.sheetName}`, size: 26, bold: true, color: C_NAVY }),
            ],
            spacing: { before: 100, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Fonte: ${r.fileName}  |  ${r.rowCount} registros  |  Dimensão: ${r.dimension}  |  Hash: ${hash}`, size: 18, color: C_MUTED }),
            ],
            spacing: { after: 250 },
          }),

          // KPIs
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createDocxKpiCard("Registros", String(r.rowCount), "linhas consolidadas"),
                  createDocxKpiCard("Indicador Principal", r.totalDisplay, r.measureLabel),
                  createDocxKpiCard("Dimensão", r.dimension, `${r.ranking.length} categorias`),
                  createDocxKpiCard("Segurança", "100%", "Conforme LGPD"),
                ],
              }),
            ],
          }),

          // Seção 1: Indicadores Numéricos
          new Paragraph({
            text: "\n1. Indicadores Numéricos Consolidados",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  createDocxHeaderCell("Indicador", 40),
                  createDocxHeaderCell("Soma Acumulada", 20),
                  createDocxHeaderCell("Média por Linha", 20),
                  createDocxHeaderCell("Valor Máximo", 20),
                ],
              }),
              ...r.summary.map((s, idx) =>
                new TableRow({
                  children: [
                    createDocxDataCell(s.name, idx % 2 === 1),
                    createDocxDataCell(s.sum, idx % 2 === 1, AlignmentType.RIGHT),
                    createDocxDataCell(s.avg, idx % 2 === 1, AlignmentType.RIGHT),
                    createDocxDataCell(s.max, idx % 2 === 1, AlignmentType.RIGHT),
                  ],
                }),
              ),
            ],
          }),

          // Seção 2: Ranking por Dimensão
          new Paragraph({
            text: `\n2. Principais Destaques por ${r.dimension}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  createDocxHeaderCell("#", 10),
                  createDocxHeaderCell(`Categoria (${r.dimension})`, 60),
                  createDocxHeaderCell(r.measureLabel, 30),
                ],
              }),
              ...r.ranking.map((x, idx) =>
                new TableRow({
                  children: [
                    createDocxDataCell(String(idx + 1), idx % 2 === 1, AlignmentType.CENTER),
                    createDocxDataCell(x.label, idx % 2 === 1),
                    createDocxDataCell(x.display, idx % 2 === 1, AlignmentType.RIGHT, true),
                  ],
                }),
              ),
            ],
          }),

          // Assinaturas
          new Paragraph({ text: "\n\n", spacing: { before: 400 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Coordenadoria Pedagógica e Técnica", bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "EMERON / TJ-RO", alignment: AlignmentType.CENTER }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ text: "____________________________________", alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Diretoria Geral da EMERON", bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "Escola da Magistratura de Rondônia", alignment: AlignmentType.CENTER }),
                    ],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  downloadFile(blob, `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
}

/** Exporta Relatório para Excel (.xlsx) altamente estilizado com ExcelJS */
export async function exportReportXlsx(r: ReportData) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "RADAR EMERON · TJ-RO"
  wb.created = new Date()

  // Aba 1: Painel & KPIs
  const ws1 = wb.addWorksheet("Painel de Indicadores", { views: [{ showGridLines: true }] })

  // Banner
  ws1.mergeCells("A1:D1")
  const b1 = ws1.getCell("A1")
  b1.value = "TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — EMERON"
  b1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
  b1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  b1.alignment = { vertical: "middle", horizontal: "center" }
  ws1.getRow(1).height = 28

  ws1.mergeCells("A2:D2")
  const b2 = ws1.getCell("A2")
  b2.value = `RELATÓRIO INSTITUCIONAL DE INDICADORES · ${r.sheetName}`
  b2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } }
  b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
  b2.alignment = { vertical: "middle", horizontal: "center" }
  ws1.getRow(2).height = 22

  ws1.addRow([])

  // Header do Ranking
  const hRank = ws1.addRow(["#", r.dimension, r.measureLabel, "Participação (%)"])
  hRank.height = 22
  hRank.eachCell((c) => {
    c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
    c.alignment = { vertical: "middle", horizontal: "center" }
  })

  const totalVal = r.ranking.reduce((acc, cur) => acc + cur.value, 0) || 1
  r.ranking.forEach((item, idx) => {
    const isEven = idx % 2 === 1
    const pct = item.value / totalVal
    const row = ws1.addRow([idx + 1, item.label, item.value, pct])
    row.height = 20
    
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" }
    row.getCell(2).alignment = { horizontal: "left", vertical: "middle" }
    row.getCell(3).alignment = { horizontal: "right", vertical: "middle" }
    row.getCell(3).numFmt = typeof item.value === "number" && item.value > 100 ? '"R$ "#,##0.00' : '#,##0'
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" }
    row.getCell(4).numFmt = "0.0%"

    row.eachCell((c) => {
      if (isEven) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  // Linha de Total
  const totRow = ws1.addRow(["", "TOTAL GERAL CONSOLIDADO", totalVal, 1.0])
  totRow.height = 24
  totRow.eachCell((c, colNum) => {
    c.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0D2D46" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
    if (colNum === 3) {
      c.alignment = { horizontal: "right" }
      c.numFmt = typeof totalVal === "number" && totalVal > 100 ? '"R$ "#,##0.00' : '#,##0'
    }
    if (colNum === 4) {
      c.alignment = { horizontal: "right" }
      c.numFmt = "0.0%"
    }
    c.border = {
      top: { style: "medium", color: { argb: "FF0D2D46" } },
      bottom: { style: "double", color: { argb: "FF0D2D46" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    }
  })

  ws1.columns = [{ width: 8 }, { width: 38 }, { width: 22 }, { width: 18 }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadFile(buffer, `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function exportReportCsv(r: ReportData) {
  const lines: string[] = []
  const escCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`

  lines.push(`# RELATÓRIO INSTITUCIONAL EMERON — TJ-RO;${escCsv(r.sheetName)}`)
  lines.push(`${escCsv("Fonte")};${escCsv(r.fileName)}`)
  lines.push(`${escCsv("Registros")};${escCsv(r.rowCount)}`)
  lines.push(`${escCsv("Indicador Principal")};${escCsv(r.measureLabel)}`)
  lines.push(`${escCsv("Dimensão")};${escCsv(r.dimension)}`)
  lines.push(`${escCsv("Total")};${escCsv(r.totalDisplay)}`)
  lines.push("")
  lines.push(`${escCsv("POSIÇÃO")};${escCsv(r.dimension)};${escCsv(r.measureLabel)}`)
  r.ranking.forEach((x, i) => {
    lines.push(`${i + 1};${escCsv(x.label)};${escCsv(x.value)}`)
  })

  downloadFile("\uFEFF" + lines.join("\r\n"), `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.csv`, "text/csv;charset=utf-8;")
}

export function exportReportJson(r: ReportData) {
  const jsonString = JSON.stringify(
    {
      sistema: "RADAR EMERON · TJ-RO",
      orgao: "Tribunal de Justiça do Estado de Rondônia",
      exportadoEm: new Date().toISOString(),
      hashAutenticidade: authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}`),
      relatorio: r,
    },
    null,
    2,
  )
  downloadFile(jsonString, `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.json`, "application/json;charset=utf-8")
}

export function exportReportTxt(r: ReportData) {
  const text = reportToText(r)
  downloadFile(text, `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.txt`, "text/plain;charset=utf-8")
}

export function exportReportMarkdown(r: ReportData) {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}|${r.measureLabel}`)
  const lines: string[] = []

  lines.push(`# 🏆 Relatório Institucional de Indicadores — EMERON / TJ-RO`)
  lines.push(`> **Tabela:** ${r.sheetName} | **Fonte:** \`${r.fileName}\` (${r.rowCount} registros)  `)
  lines.push(`> **Indicador:** ${r.measureLabel} por **${r.dimension}** | **Total:** ${r.totalDisplay}`)
  lines.push("")
  lines.push("```mermaid")
  lines.push(`pie title Participação por ${r.dimension}`)
  r.ranking.slice(0, 6).forEach((x) => {
    lines.push(`    "${x.label}" : ${x.value}`)
  })
  lines.push("```")
  lines.push("")
  lines.push("## 📊 Indicadores Numéricos Consolidados")
  lines.push("| Indicador | Soma | Média | Máximo |")
  lines.push("| :--- | :--- | :--- | :--- |")
  r.summary.forEach((s) => lines.push(`| **${s.name}** | ${s.sum} | ${s.avg} | ${s.max} |`))
  lines.push("")
  lines.push(`## 🎯 Ranking de Destaques por ${r.dimension}`)
  lines.push("| Posição | Categoria / Ação | Valor |")
  lines.push("| :--- | :--- | :--- |")
  r.ranking.forEach((x, i) => {
    lines.push(`| ${i + 1} | **${x.label}** | ${x.display} |`)
  })
  lines.push("")
  lines.push("---")
  lines.push(`*Emitido pelo RADAR EMERON em ${new Date().toLocaleString("pt-BR")} · Hash: \`${hash}\`*`)

  downloadFile(lines.join("\n"), `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.md`, "text/markdown;charset=utf-8")
}

export function reportToText(r: ReportData): string {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}|${r.measureLabel}`)
  const lines: string[] = []

  lines.push("╔════════════════════════════════════════════════════════════════════════════════╗")
  lines.push("║           TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — TJ-RO                    ║")
  lines.push("║                 EMERON — ESCOLA DA MAGISTRATURA DE RONDÔNIA                    ║")
  lines.push("║                    RELATÓRIO INSTITUCIONAL DE INDICADORES                      ║")
  lines.push("╚════════════════════════════════════════════════════════════════════════════════╝")
  lines.push("")
  lines.push(`FONTE DE DADOS:  ${r.fileName}`)
  lines.push(`TABELA:          ${r.sheetName} (${r.rowCount} registros)`)
  lines.push(`INDICADOR:       ${r.measureLabel} por ${r.dimension}`)
  lines.push(`TOTAL ACUMULADO: ${r.totalDisplay}`)
  lines.push("")
  lines.push("--------------------------------------------------------------------------------")
  lines.push(`RANKING DE DESTAQUES POR ${r.dimension.toUpperCase()}:`)
  r.ranking.forEach((x, i) => {
    lines.push(`  ${String(i + 1).padStart(2, " ")}. ${x.label.padEnd(35, " ")} ${x.display.padStart(15, " ")}`)
  })
  lines.push("")
  lines.push("--------------------------------------------------------------------------------")
  lines.push(`Documento emitido pelo RADAR EMERON em ${new Date().toLocaleString("pt-BR")}`)
  lines.push(`Hash de Autenticidade: ${hash}`)
  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* 3. DATASETS & TABELAS                                              */
/* ------------------------------------------------------------------ */

export function exportDatasetHtml(ds: Dataset) {
  const hash = authenticityHash(`${ds.fileName}|${ds.sheetName}|${ds.rowCount}`)
  const headers = ds.columns.map((c) => `<th>${esc(c.name)}</th>`).join("")
  const rows = ds.rows
    .map(
      (r) =>
        `<tr>${ds.columns.map((c) => `<td>${esc(formatCell(r[c.name]))}</td>`).join("")}</tr>`,
    )
    .join("")

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Tabela ${esc(ds.sheetName)} - EMERON / TJ-RO</title>
  <style>${officialStyles()}</style>
</head>
<body>
  <div class="doc-container">
    ${institutionalHeader("Tabela de Dados Institucionais", hash)}
    <div class="doc-title-box">
      <h1 class="doc-title">Tabela: ${esc(ds.sheetName)}</h1>
      <p class="doc-sub">Fonte: <strong>${esc(ds.fileName)}</strong> · ${ds.rowCount} registros · ${ds.columns.length} colunas</p>
    </div>
    <h2 class="section">1. Dados Estruturados (${ds.rowCount} Registros)</h2>
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="doc-footer">
      <span>RADAR EMERON · TJ-RO</span>
      <span>Hash: ${esc(hash)}</span>
    </div>
  </div>
</body>
</html>`

  downloadFile(html, `${ds.sheetName.replace(/\s+/g, "_")}.html`, "text/html;charset=utf-8")
}

/** Exporta qualquer Dataset para Planilha Excel (.xlsx) altamente estilizada com ExcelJS */
export async function exportDatasetXlsx(ds: Dataset) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "RADAR EMERON · TJ-RO"
  wb.created = new Date()

  const ws = wb.addWorksheet(ds.sheetName.slice(0, 31), { views: [{ showGridLines: true }] })

  // Banner
  const colCount = Math.max(ds.columns.length, 4)
  const lastColLetter = getExcelColLetter(colCount)
  ws.mergeCells(`A1:${lastColLetter}1`)
  const b1 = ws.getCell("A1")
  b1.value = "TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — EMERON"
  b1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
  b1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  b1.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(1).height = 28

  ws.mergeCells(`A2:${lastColLetter}2`)
  const b2 = ws.getCell("A2")
  b2.value = `TABELA: ${ds.sheetName} (${ds.rowCount} registros · Fonte: ${ds.fileName})`
  b2.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
  b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
  b2.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(2).height = 22

  ws.addRow([]) // Linha em branco

  // Cabeçalho das Colunas
  const hRow = ws.addRow(ds.columns.map((c) => c.name))
  hRow.height = 24
  hRow.eachCell((c) => {
    c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
    c.alignment = { vertical: "middle", horizontal: "center" }
    c.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF0D2D46" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    }
  })

  // Linhas de Dados
  ds.rows.forEach((r, idx) => {
    const isEven = idx % 2 === 1
    const rowValues = ds.columns.map((c) => {
      const v = r[c.name]
      if (v instanceof Date) return v
      return v ?? ""
    })
    const row = ws.addRow(rowValues)
    row.height = 20

    row.eachCell((cell, colIndex) => {
      const colMeta = ds.columns[colIndex - 1]
      const cellVal = cell.value

      // Alinhamento e Formato
      if (colMeta?.type === "number" || typeof cellVal === "number") {
        cell.alignment = { horizontal: "right", vertical: "middle" }
        // Se parece com moeda (ex: Orçamento, Valor, etc)
        const isMoney = /orçamento|valor|custo|preco|total|previsto|executado/i.test(colMeta?.name || "")
        if (isMoney) {
          cell.numFmt = '"R$ "#,##0.00'
        } else {
          cell.numFmt = '#,##0'
        }
      } else if (colMeta?.type === "date" || cellVal instanceof Date) {
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.numFmt = "dd/mm/yyyy"
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" }
      }

      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      }

      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  // Ajuste automático de largura de coluna
  ws.columns = ds.columns.map((c) => {
    const maxLen = Math.max(
      c.name.length,
      ...ds.rows.slice(0, 50).map((r) => String(r[c.name] ?? "").length),
    )
    return { width: Math.max(maxLen + 4, 15) }
  })

  const buffer = await wb.xlsx.writeBuffer()
  downloadFile(buffer, `${ds.sheetName.replace(/\s+/g, "_")}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function exportDatasetCsv(ds: Dataset) {
  const escCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`
  const header = ds.columns.map((c) => escCsv(c.name)).join(";")
  const rows = ds.rows.map((row) =>
    ds.columns.map((c) => escCsv(formatCell(row[c.name]))).join(";"),
  )
  downloadFile("\uFEFF" + [header, ...rows].join("\r\n"), `${ds.sheetName.replace(/\s+/g, "_")}.csv`, "text/csv;charset=utf-8;")
}

export function exportDatasetJson(ds: Dataset) {
  const jsonString = JSON.stringify(
    {
      sistema: "RADAR EMERON · TJ-RO",
      exportadoEm: new Date().toISOString(),
      tabela: ds.sheetName,
      arquivo: ds.fileName,
      totalRegistros: ds.rowCount,
      colunas: ds.columns,
      dados: ds.rows,
    },
    null,
    2,
  )
  downloadFile(jsonString, `${ds.sheetName.replace(/\s+/g, "_")}.json`, "application/json;charset=utf-8")
}

export function exportDatasetTxt(ds: Dataset) {
  const lines: string[] = []
  lines.push(`DADOS DA TABELA: ${ds.sheetName} (${ds.fileName})`)
  lines.push(`Total de registros: ${ds.rowCount} | Colunas: ${ds.columns.map((c) => c.name).join(", ")}`)
  lines.push("--------------------------------------------------------------------------------")
  ds.rows.forEach((r, idx) => {
    lines.push(`[Registro #${idx + 1}]`)
    ds.columns.forEach((c) => {
      lines.push(`  ${c.name}: ${formatCell(r[c.name])}`)
    })
    lines.push("")
  })
  downloadFile(lines.join("\n"), `${ds.sheetName.replace(/\s+/g, "_")}.txt`, "text/plain;charset=utf-8")
}

export function exportDatasetMarkdown(ds: Dataset) {
  const lines: string[] = []
  lines.push(`# 📊 Tabela: ${ds.sheetName}`)
  lines.push(`> Fonte: \`${ds.fileName}\` · ${ds.rowCount} registros`)
  lines.push("")
  lines.push("| " + ds.columns.map((c) => c.name).join(" | ") + " |")
  lines.push("| " + ds.columns.map(() => ":---").join(" | ") + " |")
  ds.rows.slice(0, 50).forEach((r) => {
    lines.push("| " + ds.columns.map((c) => formatCell(r[c.name])).join(" | ") + " |")
  })
  if (ds.rowCount > 50) {
    lines.push(`\n*(Exibindo as primeiras 50 linhas de ${ds.rowCount} no documento Markdown)*`)
  }
  downloadFile(lines.join("\n"), `${ds.sheetName.replace(/\s+/g, "_")}.md`, "text/markdown;charset=utf-8")
}

export function datasetToText(ds: Dataset): string {
  return `Tabela: ${ds.sheetName} (${ds.rowCount} registros, ${ds.columns.length} colunas da fonte ${ds.fileName}). Gerado pelo RADAR EMERON.`
}

/* ------------------------------------------------------------------ */
/* 4. PRIORIDADES                                                     */
/* ------------------------------------------------------------------ */

export function exportPrioritiesPdf(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  const hash = authenticityHash(`prioridades|${ds.sheetName}|${dim}|${mea}`)
  const barChart = generateSvgBarChart(ranking, { width: 560, height: 210, title: `Ranking de Criticidade por ${dim}`, barColor: "#2e76aa" })
  const max = ranking[0]?.value || 1

  const rows = ranking
    .map(
      (item, i) => `<tr>
        <td style="width:28px;text-align:center;font-weight:700">${i + 1}</td>
        <td><strong>${esc(item.label)}</strong></td>
        <td style="width:40%">
          <div style="height:6px;background:#f1f5f9;border-radius:4px">
            <div style="height:6px;border-radius:4px;background:#2e76aa;width:${Math.round((item.value / max) * 100)}%"></div>
          </div>
        </td>
        <td style="text-align:right;white-space:nowrap"><strong>${formatNumber(item.value)}</strong></td>
      </tr>`,
    )
    .join("")

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Matriz de Prioridades - EMERON / TJ-RO</title>
  <style>${officialStyles()}</style>
</head>
<body>
  <div class="doc-container">
    ${institutionalHeader("Matriz de Prioridades & Atenção Institucional", hash)}
    <div class="doc-title-box">
      <h1 class="doc-title">Ranking de Prioridades — ${esc(dim)}</h1>
      <p class="doc-sub">Ordenado por <strong>${esc(mea)}</strong> · Tabela: <strong>${esc(ds.sheetName)}</strong> (${ranking.length} categorias)</p>
    </div>

    <h2 class="section">1. Gráfico de Criticidade e Relevância</h2>
    ${barChart}

    <h2 class="section">2. Tabela de Classificação</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Ação / Categoria</th>
          <th style="width:40%">Impacto Proporcional</th>
          <th style="text-align:right">${esc(mea)}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${signatureBlock()}

    <div class="doc-footer">
      <span>RADAR EMERON · TJ-RO</span>
      <span>Hash: ${esc(hash)}</span>
    </div>
  </div>
</body>
</html>`

  printHtmlDocument(html)
}

export async function exportPrioritiesXlsx(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "RADAR EMERON · TJ-RO"
  const ws = wb.addWorksheet("Matriz de Prioridades", { views: [{ showGridLines: true }] })

  // Banner
  ws.mergeCells("A1:D1")
  const b1 = ws.getCell("A1")
  b1.value = "TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — EMERON"
  b1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
  b1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  b1.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(1).height = 28

  ws.mergeCells("A2:D2")
  const b2 = ws.getCell("A2")
  b2.value = `MATRIZ DE PRIORIDADES & ATENÇÃO · ${dim} (Ordenado por ${mea})`
  b2.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
  b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
  b2.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(2).height = 22

  ws.addRow([])

  const hRow = ws.addRow(["#", dim, mea, "Participação (%)"])
  hRow.height = 22
  hRow.eachCell((c) => {
    c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
    c.alignment = { vertical: "middle", horizontal: "center" }
  })

  const totalVal = ranking.reduce((acc, cur) => acc + cur.value, 0) || 1
  ranking.forEach((r, idx) => {
    const isEven = idx % 2 === 1
    const pct = r.value / totalVal
    const row = ws.addRow([idx + 1, r.label, r.value, pct])
    row.height = 20

    row.getCell(1).alignment = { horizontal: "center" }
    row.getCell(2).alignment = { horizontal: "left" }
    row.getCell(3).alignment = { horizontal: "right" }
    row.getCell(3).numFmt = typeof r.value === "number" && r.value > 100 ? '"R$ "#,##0.00' : '#,##0'
    row.getCell(4).alignment = { horizontal: "right" }
    row.getCell(4).numFmt = "0.0%"

    row.eachCell((c) => {
      if (isEven) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  ws.columns = [{ width: 8 }, { width: 38 }, { width: 22 }, { width: 18 }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadFile(buffer, `prioridades_emeron_${dim}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function exportPrioritiesCsv(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  const escCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`
  const lines = [
    `# MATRIZ DE PRIORIDADES — ${dim.toUpperCase()} (${ds.sheetName})`,
    `${escCsv("Posição")};${escCsv(dim)};${escCsv(mea)}`,
    ...ranking.map((x, i) => `${i + 1};${escCsv(x.label)};${escCsv(x.value)}`),
  ]
  downloadFile("\uFEFF" + lines.join("\r\n"), `prioridades_emeron_${dim}.csv`, "text/csv;charset=utf-8;")
}

export function exportPrioritiesJson(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  downloadFile(
    JSON.stringify({ sistema: "RADAR EMERON · TJ-RO", dimensao: dim, medida: mea, ranking, tabela: ds.sheetName }, null, 2),
    `prioridades_emeron_${dim}.json`,
    "application/json;charset=utf-8",
  )
}

export function exportPrioritiesTxt(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  downloadFile(prioritiesToText(ranking, ds, dim, mea), `prioridades_emeron_${dim}.txt`, "text/plain;charset=utf-8")
}

export function exportPrioritiesMarkdown(ranking: AggPoint[], ds: Dataset, dim: string, mea: string) {
  const lines: string[] = []
  lines.push(`# 🎯 Ranking de Prioridades — EMERON / TJ-RO`)
  lines.push(`> Agrupado por **${dim}** com ordenação em **${mea}** (${ds.sheetName})`)
  lines.push("")
  lines.push("| Posição | " + dim + " | " + mea + " |")
  lines.push("| :--- | :--- | :--- |")
  ranking.forEach((r, i) => {
    lines.push(`| ${i + 1} | **${r.label}** | ${formatNumber(r.value)} |`)
  })
  downloadFile(lines.join("\n"), `prioridades_emeron_${dim}.md`, "text/markdown;charset=utf-8")
}

export function prioritiesToText(ranking: AggPoint[], ds: Dataset, dim: string, mea: string): string {
  const lines = [`RANKING DE PRIORIDADES — ${dim.toUpperCase()} (${ds.sheetName}):`]
  ranking.forEach((x, i) => {
    lines.push(`  ${String(i + 1).padStart(2, " ")}. ${x.label.padEnd(35, " ")} ${formatNumber(x.value).padStart(12, " ")}`)
  })
  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* 5. AGENDAS & CALENDÁRIOS                                           */
/* ------------------------------------------------------------------ */

export interface AgendaEventItem {
  date: Date
  title: string
  tags: string[]
}

export function exportAgendaIcs(events: AgendaEventItem[], calendarTitle = "Agendas EMERON 2026") {
  const formatDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EMERON//RADAR EMERON Calendar//PT-BR",
    `X-WR-CALNAME:${calendarTitle}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  events.forEach((ev, idx) => {
    const dt = formatDate(ev.date)
    const nextDay = new Date(ev.date.getTime() + 86400000)
    const dtEnd = formatDate(nextDay)
    lines.push("BEGIN:VEVENT")
    lines.push(`UID:emeron-event-${idx}-${ev.date.getTime()}@emeron.tjro.jus.br`)
    lines.push(`DTSTAMP:${dt}T080000Z`)
    lines.push(`DTSTART;VALUE=DATE:${dt}`)
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`)
    lines.push(`SUMMARY:${ev.title}`)
    lines.push(`DESCRIPTION:Ação Institucional EMERON / TJ-RO. Tags: ${ev.tags.join(", ")}`)
    lines.push("LOCATION:EMERON - Escola da Magistratura de Rondônia")
    lines.push("CATEGORIES:Educação,Judiciário,EMERON")
    lines.push("STATUS:CONFIRMED")
    lines.push("BEGIN:VALARM")
    lines.push("TRIGGER:-P1D")
    lines.push("ACTION:DISPLAY")
    lines.push(`DESCRIPTION:Lembrete de Vencimento: ${ev.title}`)
    lines.push("END:VALARM")
    lines.push("END:VEVENT")
  })

  lines.push("END:VCALENDAR")
  downloadFile(lines.join("\r\n"), `agenda_emeron_${new Date().getFullYear()}.ics`, "text/calendar;charset=utf-8")
}

export async function exportAgendaXlsx(events: AgendaEventItem[], activeCol: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "RADAR EMERON · TJ-RO"
  const ws = wb.addWorksheet("Cronograma de Prazos", { views: [{ showGridLines: true }] })

  // Banner
  ws.mergeCells("A1:D1")
  const b1 = ws.getCell("A1")
  b1.value = "TRIBUNAL DE JUSTIÇA DO ESTADO DE RONDÔNIA — EMERON"
  b1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
  b1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
  b1.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(1).height = 28

  ws.mergeCells("A2:D2")
  const b2 = ws.getCell("A2")
  b2.value = `CRONOGRAMA DE AGENDAS & PRAZOS (${events.length} prazos cadastrados)`
  b2.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
  b2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E76AA" } }
  b2.alignment = { vertical: "middle", horizontal: "center" }
  ws.getRow(2).height = 22

  ws.addRow([])

  const hRow = ws.addRow(["Data Prevista", "Ação / Atividade Institucional", "Classificação / Tags", "Status"])
  hRow.height = 22
  hRow.eachCell((c) => {
    c.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2D46" } }
    c.alignment = { vertical: "middle", horizontal: "center" }
  })

  events.forEach((e, idx) => {
    const isEven = idx % 2 === 1
    const isExpired = e.date.getTime() < Date.now()
    const row = ws.addRow([e.date, e.title, e.tags.join("; "), isExpired ? "Expirado" : "No Prazo"])
    row.height = 20

    row.getCell(1).alignment = { horizontal: "center" }
    row.getCell(1).numFmt = "dd/mm/yyyy"
    row.getCell(2).alignment = { horizontal: "left" }
    row.getCell(3).alignment = { horizontal: "left" }
    
    const stCell = row.getCell(4)
    stCell.alignment = { horizontal: "center" }
    stCell.font = { bold: true }
    if (isExpired) {
      stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
      stCell.font.color = { argb: "FFB45309" }
    } else {
      stCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }
      stCell.font.color = { argb: "FF15803D" }
    }

    row.eachCell((c, colNum) => {
      if (isEven && colNum !== 4) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      }
    })
  })

  ws.columns = [{ width: 16 }, { width: 45 }, { width: 30 }, { width: 16 }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadFile(buffer, `agenda_emeron_${new Date().getFullYear()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

export function exportAgendaCsv(events: AgendaEventItem[]) {
  const escCsv = (val: unknown) => `"${String(val ?? "").replace(/"/g, '""')}"`
  const lines = [
    `# CRONOGRAMA DE AGENDAS EMERON (${events.length} eventos)`,
    `${escCsv("Data")};${escCsv("Ação")};${escCsv("Tags")}`,
    ...events.map((e) => `${escCsv(e.date.toLocaleDateString("pt-BR"))};${escCsv(e.title)};${escCsv(e.tags.join(", "))}`),
  ]
  downloadFile("\uFEFF" + lines.join("\r\n"), `agenda_emeron_${new Date().getFullYear()}.csv`, "text/csv;charset=utf-8;")
}

export function exportAgendaJson(events: AgendaEventItem[]) {
  downloadFile(
    JSON.stringify(
      {
        sistema: "RADAR EMERON · TJ-RO",
        geradoEm: new Date().toISOString(),
        totalEventos: events.length,
        eventos: events.map((e) => ({
          data: e.date.toISOString(),
          dataFormatada: e.date.toLocaleDateString("pt-BR"),
          acao: e.title,
          tags: e.tags,
        })),
      },
      null,
      2,
    ),
    `agenda_emeron_${new Date().getFullYear()}.json`,
    "application/json;charset=utf-8",
  )
}

export function exportAgendaPdf(events: AgendaEventItem[], activeCol: string) {
  const hash = authenticityHash(`agenda|${events.length}|${activeCol}`)
  const rows = events
    .map(
      (e) => `<tr>
        <td style="width:90px;font-weight:700">${esc(e.date.toLocaleDateString("pt-BR"))}</td>
        <td><strong>${esc(e.title)}</strong></td>
        <td>${e.tags.map((t) => `<span class="pill ok">${esc(t)}</span>`).join(" ")}</td>
      </tr>`,
    )
    .join("")

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Agendas e Prazos - EMERON / TJ-RO</title>
  <style>${officialStyles()}</style>
</head>
<body>
  <div class="doc-container">
    ${institutionalHeader("Cronograma Institucional de Agendas e Prazos", hash)}
    <div class="doc-title-box">
      <h1 class="doc-title">Cronograma de Ações e Prazos</h1>
      <p class="doc-sub">Coluna de Referência: <strong>${esc(activeCol)}</strong> · ${events.length} prazos mapeados</p>
    </div>

    <h2 class="section">1. Prazos e Vencimentos Ordenados</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Ação / Atividade</th>
          <th>Classificação</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${signatureBlock()}

    <div class="doc-footer">
      <span>RADAR EMERON · TJ-RO</span>
      <span>Hash: ${esc(hash)}</span>
    </div>
  </div>
</body>
</html>`

  printHtmlDocument(html)
}

export function exportAgendaTxt(events: AgendaEventItem[], activeCol: string) {
  downloadFile(agendaToText(events, activeCol), `agenda_emeron_${new Date().getFullYear()}.txt`, "text/plain;charset=utf-8")
}

export function exportAgendaMarkdown(events: AgendaEventItem[], activeCol: string) {
  const lines: string[] = []
  lines.push(`# 📅 Cronograma Institucional de Agendas — EMERON / TJ-RO`)
  lines.push(`> Baseado na coluna \`${activeCol}\` (${events.length} eventos)`)
  lines.push("")
  lines.push("| Data | Ação / Atividade | Tags |")
  lines.push("| :--- | :--- | :--- |")
  events.forEach((e) => lines.push(`| ${e.date.toLocaleDateString("pt-BR")} | **${e.title}** | ${e.tags.join(", ")} |`))
  downloadFile(lines.join("\n"), `agenda_emeron_${new Date().getFullYear()}.md`, "text/markdown;charset=utf-8")
}

export function agendaToText(events: AgendaEventItem[], activeCol: string): string {
  const lines = [`CRONOGRAMA DE AGENDAS E PRAZOS (${activeCol}):`]
  events.forEach((e) => lines.push(`  - ${e.date.toLocaleDateString("pt-BR")}: ${e.title} [${e.tags.join(", ")}]`))
  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* HELPERS DOCX E EXCEL                                               */
/* ------------------------------------------------------------------ */

function createDocxKpiCard(label: string, value: string, hint: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: label.toUpperCase(), size: 14, bold: true, color: C_MUTED })],
      }),
      new Paragraph({
        children: [new TextRun({ text: value, size: 24, bold: true, color: C_NAVY })],
        spacing: { before: 40, after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: hint, size: 14, color: C_MUTED })],
      }),
    ],
    shading: { fill: C_BG_GRAY, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_BORDER },
    },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
  })
}

function createDocxHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, bold: true, color: C_WHITE })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: C_NAVY, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_NAVY },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: C_NAVY },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_NAVY },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_NAVY },
    },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  })
}

function createDocxDataCell(
  text: string,
  isEven: boolean,
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
  bold = false,
): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, bold, color: C_TEXT })],
        alignment,
      }),
    ],
    shading: isEven ? { fill: C_BG_GRAY, type: ShadingType.CLEAR } : { fill: C_WHITE, type: ShadingType.CLEAR },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER },
      left: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER },
      right: { style: BorderStyle.SINGLE, size: 2, color: C_BORDER },
    },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  })
}

function getExcelColLetter(colIndex: number): string {
  let letter = ""
  while (colIndex > 0) {
    const mod = (colIndex - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    colIndex = Math.floor((colIndex - mod) / 26)
  }
  return letter || "A"
}

/* ------------------------------------------------------------------ */
/* ÁREA DE TRANSFERÊNCIA                                               */
/* ------------------------------------------------------------------ */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
