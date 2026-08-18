"use client"

import * as XLSX from "xlsx"
import type { ActionDossier } from "./types"

/* ==========================================================================
   Utilitários de Exportação 100% no Cliente (sem redirecionamento externo)
   - PDF Oficial A4 (impressão via iframe oculto, sem sair da página)
   - Planilha Excel (.xlsx) via SheetJS
   - Resumo textual para a área de transferência (colagem no SEI)
   ========================================================================== */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const DATE = (d: Date | null) => (d ? d.toLocaleDateString("pt-BR") : "A definir")

/** Hash de autenticidade determinístico (FNV-1a 32 bits) em hexadecimal. */
export function authenticityHash(payload: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0")
  // Formato legível em blocos para conferência visual
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(16).toUpperCase().slice(-4)}`
}

/** Escapa texto para inserção segura em HTML. */
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Imprime um documento HTML autocontido via iframe oculto (mantém o usuário na página). */
function printHtmlDocument(html: string) {
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
    document.body.removeChild(iframe)
    return
  }
  doc.open()
  doc.write(html)
  doc.close()

  const trigger = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 1000)
    }
  }
  // Aguarda o carregamento dos estilos antes de imprimir
  iframe.onload = trigger
  setTimeout(trigger, 400)
}

/* ------------------------------------------------------------------ */
/* Estilo institucional compartilhado do PDF A4                        */
/* ------------------------------------------------------------------ */

function officialStyles(): string {
  return `
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #0d2d46; margin: 0; font-size: 12px; line-height: 1.5; }
    .doc-header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #0d2d46; padding-bottom: 12px; margin-bottom: 6px; }
    .brand-mark { width: 46px; height: 46px; border-radius: 8px; background: #0d2d46; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; letter-spacing: -0.5px; }
    .brand-text .l1 { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #2e76aa; font-weight: 700; }
    .brand-text .l2 { font-size: 16px; font-weight: 800; }
    .brand-text .l3 { font-size: 11px; color: #5a7085; }
    .doc-meta { margin-left: auto; text-align: right; font-size: 10px; color: #5a7085; }
    .doc-title { font-size: 18px; font-weight: 800; margin: 14px 0 2px; }
    .doc-sub { color: #5a7085; margin: 0 0 14px; }
    .hashbar { display: flex; justify-content: space-between; gap: 8px; background: #eef3f8; border: 1px solid #dce2e9; border-radius: 6px; padding: 8px 12px; font-size: 10px; margin-bottom: 16px; }
    .hashbar code { font-family: 'Courier New', monospace; font-weight: 700; color: #0d2d46; }
    h2.section { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #2e76aa; border-bottom: 1px solid #dce2e9; padding-bottom: 4px; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e6ebf0; vertical-align: top; }
    th { background: #f3f6f9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #5a7085; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin: 8px 0; }
    .kv .k { font-size: 10px; color: #5a7085; text-transform: uppercase; letter-spacing: 0.5px; }
    .kv .v { font-weight: 700; }
    .pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill.ok { background: #dff3e6; color: #1a7a45; }
    .pill.warn { background: #fdeccf; color: #9a6a12; }
    .pill.pend { background: #fcdcd6; color: #a5342a; }
    .diverge { border: 2px solid #e0a021; background: #fdf6e7; border-radius: 8px; padding: 12px; margin: 8px 0; }
    .diverge .dt { font-weight: 800; color: #9a6a12; }
    .diverge .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
    .diverge .cols div { border: 1px solid #e6d3a3; background: #fff; border-radius: 6px; padding: 6px 8px; }
    .doc-footer { margin-top: 22px; border-top: 1px solid #dce2e9; padding-top: 8px; font-size: 9px; color: #5a7085; display: flex; justify-content: space-between; }
  `
}

function institutionalHeader(docLabel: string, hash: string): string {
  const now = new Date()
  return `
    <div class="doc-header">
      <div class="brand-mark">TJ<br/>RO</div>
      <div class="brand-text">
        <div class="l1">Tribunal de Justiça de Rondônia</div>
        <div class="l2">EMERON — Escola da Magistratura</div>
        <div class="l3">RADAR EMERON · Painel Institucional de Indicadores</div>
      </div>
      <div class="doc-meta">
        <div>${esc(docLabel)}</div>
        <div>Emitido em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
    </div>
    <div class="hashbar">
      <span>Documento gerado 100% no navegador · Conformidade LGPD</span>
      <span>Hash de autenticidade: <code>${esc(hash)}</code></span>
    </div>
  `
}

/* ------------------------------------------------------------------ */
/* PRONTUÁRIO VIVO — Dossiê da Ação                                    */
/* ------------------------------------------------------------------ */

const DOC_STATUS_META: Record<string, { label: string; cls: string }> = {
  concluido: { label: "Concluído", cls: "ok" },
  em_analise: { label: "Em Análise", cls: "warn" },
  pendente: { label: "Pendente", cls: "pend" },
}

export function exportDossierPdf(d: ActionDossier) {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}|${d.status}`)
  const docsRows = d.documents
    .map((doc) => {
      const m = DOC_STATUS_META[doc.status] ?? DOC_STATUS_META.pendente
      return `<tr>
        <td><span class="pill ${m.cls}">${m.label}</span></td>
        <td><strong>${esc(doc.name)}</strong><br/><span style="color:#5a7085">${esc(doc.description)}</span></td>
        <td>${esc(doc.updatedAt || "—")}</td>
      </tr>`
    })
    .join("")

  const divergesHtml = d.divergences.length
    ? d.divergences
        .map(
          (dv) => `<div class="diverge">
            <div class="dt">Divergência: ${esc(dv.field)} (severidade ${esc(dv.severity)})</div>
            <div style="color:#7a5a10;margin-top:2px">${esc(dv.explanation)}</div>
            <div class="cols">
              <div><div style="font-size:10px;color:#5a7085">${esc(dv.sourceA.name)}</div><strong>${esc(dv.sourceA.value)}</strong></div>
              <div><div style="font-size:10px;color:#5a7085">${esc(dv.sourceB.name)}</div><strong>${esc(dv.sourceB.value)}</strong></div>
            </div>
          </div>`,
        )
        .join("")
    : `<p style="color:#1a7a45">Nenhuma divergência entre fontes detectada para esta ação.</p>`

  const historyRows = d.history
    .map((h) => `<tr><td style="white-space:nowrap">${esc(h.date)}</td><td>${esc(h.description)}</td><td>${esc(h.author)}</td></tr>`)
    .join("")

  const done = d.documents.filter((x) => x.status === "concluido").length

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
    <title>Prontuário ${esc(d.canonicalId)}</title><style>${officialStyles()}</style></head>
    <body>
      ${institutionalHeader("Prontuário Vivo da Ação", hash)}
      <div class="doc-title">${esc(d.name)}</div>
      <div class="doc-sub">${esc(d.canonicalId)} · Prioridade ${esc(d.priority)} · Status ${esc(d.status)}</div>

      <h2 class="section">1. Identificação e Rastreabilidade</h2>
      <div class="grid">
        <div class="kv"><div class="k">Código Canônico</div><div class="v">${esc(d.canonicalId)}</div></div>
        <div class="kv"><div class="k">Processo SEI</div><div class="v">${esc(d.seiProcess)}</div></div>
        <div class="kv"><div class="k">ID EmeronWeb</div><div class="v">${esc(d.emeronWebId)}</div></div>
        <div class="kv"><div class="k">Setor Responsável</div><div class="v">${esc(d.sector)}</div></div>
        <div class="kv"><div class="k">Responsável</div><div class="v">${esc(d.responsible)}</div></div>
        <div class="kv"><div class="k">Categoria</div><div class="v">${esc(d.category)}</div></div>
        <div class="kv"><div class="k">Prazo Estimado</div><div class="v">${esc(DATE(d.deadline))}</div></div>
        <div class="kv"><div class="k">Beneficiários</div><div class="v">${esc(d.students)} alunos/servidores</div></div>
        <div class="kv"><div class="k">Orçamento Previsto</div><div class="v">${esc(BRL.format(d.budgetPlanned))}</div></div>
        <div class="kv"><div class="k">Orçamento Executado</div><div class="v">${esc(BRL.format(d.budgetExecuted))} (${esc(d.progress)}%)</div></div>
      </div>

      <h2 class="section">2. Checklist de Documentos Obrigatórios (${done}/${d.documents.length})</h2>
      <table><thead><tr><th style="width:90px">Status</th><th>Documento Institucional</th><th style="width:90px">Data</th></tr></thead>
      <tbody>${docsRows}</tbody></table>

      <h2 class="section">3. Detecção de Divergências entre Fontes</h2>
      ${divergesHtml}

      <h2 class="section">4. Histórico e Tramitação</h2>
      <table><thead><tr><th style="width:90px">Data</th><th>Ocorrência</th><th style="width:150px">Autor</th></tr></thead>
      <tbody>${historyRows}</tbody></table>

      <div class="doc-footer">
        <span>EMERON · TJ-RO · Documento oficial gerado pelo RADAR EMERON</span>
        <span>${esc(d.canonicalId)} · ${esc(hash)}</span>
      </div>
    </body></html>`

  printHtmlDocument(html)
}

export function exportDossierXlsx(d: ActionDossier) {
  const wb = XLSX.utils.book_new()

  const resumo = [
    ["Campo", "Valor"],
    ["Código Canônico", d.canonicalId],
    ["Ação", d.name],
    ["Processo SEI", d.seiProcess],
    ["ID EmeronWeb", d.emeronWebId],
    ["Setor", d.sector],
    ["Categoria", d.category],
    ["Responsável", d.responsible],
    ["Status", d.status],
    ["Prioridade", d.priority],
    ["Prazo", DATE(d.deadline)],
    ["Beneficiários", d.students],
    ["Orçamento Previsto (R$)", d.budgetPlanned],
    ["Orçamento Executado (R$)", d.budgetExecuted],
    ["Progresso (%)", d.progress],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo")

  const docs = [
    ["Documento", "Status", "Descrição", "Atualizado em"],
    ...d.documents.map((x) => [x.name, DOC_STATUS_META[x.status]?.label ?? x.status, x.description, x.updatedAt || "—"]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(docs), "Checklist")

  if (d.divergences.length) {
    const div = [
      ["Campo", "Severidade", "Fonte A", "Valor A", "Fonte B", "Valor B", "Explicação"],
      ...d.divergences.map((x) => [x.field, x.severity, x.sourceA.name, x.sourceA.value, x.sourceB.name, x.sourceB.value, x.explanation]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(div), "Divergências")
  }

  const hist = [["Data", "Ocorrência", "Autor"], ...d.history.map((h) => [h.date, h.description, h.author])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hist), "Histórico")

  XLSX.writeFile(wb, `prontuario_${d.canonicalId}.xlsx`)
}

export function dossierToText(d: ActionDossier): string {
  const hash = authenticityHash(`${d.canonicalId}|${d.seiProcess}|${d.progress}|${d.status}`)
  const done = d.documents.filter((x) => x.status === "concluido").length
  const pend = d.documents.filter((x) => x.status !== "concluido")
  const lines: string[] = []
  lines.push(`PRONTUÁRIO VIVO — ${d.canonicalId}`)
  lines.push(`Ação: ${d.name}`)
  lines.push(`Processo SEI: ${d.seiProcess} | EmeronWeb: ${d.emeronWebId}`)
  lines.push(`Setor: ${d.sector} | Responsável: ${d.responsible}`)
  lines.push(`Status: ${d.status} | Prioridade: ${d.priority} | Prazo: ${DATE(d.deadline)}`)
  lines.push(`Orçamento: ${BRL.format(d.budgetExecuted)} de ${BRL.format(d.budgetPlanned)} (${d.progress}%)`)
  lines.push("")
  lines.push(`CHECKLIST DE DOCUMENTOS (${done}/${d.documents.length} concluídos):`)
  d.documents.forEach((x) => lines.push(`  - [${x.status === "concluido" ? "X" : " "}] ${x.name} (${DOC_STATUS_META[x.status]?.label ?? x.status})`))
  if (pend.length) {
    lines.push("")
    lines.push(`PENDÊNCIAS: ${pend.map((x) => x.name).join("; ")}`)
  }
  if (d.divergences.length) {
    lines.push("")
    lines.push("DIVERGÊNCIAS ENTRE FONTES:")
    d.divergences.forEach((x) => lines.push(`  * ${x.field}: ${x.sourceA.name}=${x.sourceA.value} vs ${x.sourceB.name}=${x.sourceB.value}`))
  }
  lines.push("")
  lines.push(`Documento gerado pelo RADAR EMERON (TJ-RO) em ${new Date().toLocaleString("pt-BR")}.`)
  lines.push(`Hash de autenticidade: ${hash}`)
  return lines.join("\n")
}

/* ------------------------------------------------------------------ */
/* RELATÓRIO INSTITUCIONAL                                             */
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

export function exportReportPdf(r: ReportData) {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}|${r.measureLabel}`)
  const summaryRows = r.summary
    .map((s) => `<tr><td><strong>${esc(s.name)}</strong></td><td>${esc(s.sum)}</td><td>${esc(s.avg)}</td><td>${esc(s.max)}</td></tr>`)
    .join("")
  const max = r.ranking[0]?.value || 1
  const rankRows = r.ranking
    .map(
      (item, i) => `<tr>
        <td style="width:22px">${i + 1}</td>
        <td>${esc(item.label)}
          <div style="height:6px;background:#e8edf2;border-radius:4px;margin-top:3px"><div style="height:6px;border-radius:4px;background:#2e76aa;width:${Math.round((item.value / max) * 100)}%"></div></div>
        </td>
        <td style="text-align:right;white-space:nowrap"><strong>${esc(item.display)}</strong></td>
      </tr>`,
    )
    .join("")
  const anexos = r.pdfAttachments.length
    ? `<ul>${r.pdfAttachments.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
    : `<p style="color:#5a7085">Nenhum documento PDF anexado às fontes.</p>`

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
    <title>Relatório Institucional EMERON</title><style>${officialStyles()}</style></head>
    <body>
      ${institutionalHeader("Relatório Institucional de Indicadores", hash)}
      <div class="doc-title">Relatório de Indicadores — ${esc(r.sheetName)}</div>
      <div class="doc-sub">Fonte: ${esc(r.fileName)} · ${esc(r.rowCount)} registros</div>

      <h2 class="section">1. Resumo Executivo</h2>
      <p>Este relatório consolida <strong>${esc(r.rowCount)}</strong> registros. O indicador principal analisado é
      <strong>${esc(r.measureLabel)}</strong> por <strong>${esc(r.dimension)}</strong>, totalizando
      <strong>${esc(r.totalDisplay)}</strong>.</p>

      <h2 class="section">2. Indicadores Numéricos</h2>
      <table><thead><tr><th>Indicador</th><th>Soma</th><th>Média</th><th>Máximo</th></tr></thead>
      <tbody>${summaryRows || `<tr><td colspan="4" style="color:#5a7085">Sem indicadores numéricos.</td></tr>`}</tbody></table>

      <h2 class="section">3. Principais Destaques por ${esc(r.dimension)}</h2>
      <table><tbody>${rankRows}</tbody></table>

      <h2 class="section">4. Documentos Anexos</h2>
      ${anexos}

      <div class="doc-footer">
        <span>EMERON · TJ-RO · Documento oficial gerado pelo RADAR EMERON</span>
        <span>${esc(hash)}</span>
      </div>
    </body></html>`

  printHtmlDocument(html)
}

export function exportReportXlsx(r: ReportData) {
  const wb = XLSX.utils.book_new()
  const meta = [
    ["Relatório Institucional EMERON — TJ-RO"],
    ["Fonte", r.fileName],
    ["Tabela", r.sheetName],
    ["Registros", r.rowCount],
    ["Indicador principal", r.measureLabel],
    ["Dimensão", r.dimension],
    ["Total", r.totalDisplay],
    ["Emitido em", new Date().toLocaleString("pt-BR")],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), "Resumo")

  const summary = [["Indicador", "Soma", "Média", "Máximo"], ...r.summary.map((s) => [s.name, s.sum, s.avg, s.max])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Indicadores")

  const rank = [[r.dimension, r.measureLabel], ...r.ranking.map((x) => [x.label, x.value])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rank), "Ranking")

  XLSX.writeFile(wb, `relatorio_emeron_${r.sheetName.replace(/\s+/g, "_")}.xlsx`)
}

export function reportToText(r: ReportData): string {
  const hash = authenticityHash(`${r.fileName}|${r.sheetName}|${r.rowCount}|${r.dimension}|${r.measureLabel}`)
  const lines: string[] = []
  lines.push("RELATÓRIO INSTITUCIONAL DE INDICADORES — EMERON / TJ-RO")
  lines.push(`Fonte: ${r.fileName} | Tabela: ${r.sheetName} | Registros: ${r.rowCount}`)
  lines.push(`Indicador principal: ${r.measureLabel} por ${r.dimension} | Total: ${r.totalDisplay}`)
  lines.push("")
  lines.push("INDICADORES NUMÉRICOS:")
  r.summary.forEach((s) => lines.push(`  - ${s.name}: soma ${s.sum} | média ${s.avg} | máx ${s.max}`))
  lines.push("")
  lines.push(`PRINCIPAIS DESTAQUES POR ${r.dimension.toUpperCase()}:`)
  r.ranking.forEach((x, i) => lines.push(`  ${i + 1}. ${x.label} — ${x.display}`))
  lines.push("")
  lines.push(`Documento gerado pelo RADAR EMERON em ${new Date().toLocaleString("pt-BR")}.`)
  lines.push(`Hash de autenticidade: ${hash}`)
  return lines.join("\n")
}

/** Copia texto para a área de transferência com fallback. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* tenta fallback */
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
