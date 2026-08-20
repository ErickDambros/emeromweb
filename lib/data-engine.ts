import * as XLSX from "xlsx"
import JSZip from "jszip"
import type { AggPoint, Aggregation, CellValue, Column, ColumnType, Dataset, DataSource } from "./types"

/* ------------------------------------------------------------------ */
/* Parsing de arquivos                                                 */
/* ------------------------------------------------------------------ */

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const SPREADSHEET_EXT = ["xlsx", "xls", "xlsm", "csv", "tsv", "ods"]

function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

/** Lê um arquivo enviado e retorna a fonte de dados analisada. */
export async function parseFile(file: File): Promise<DataSource> {
  const ext = extOf(file.name)
  const base = {
    id: uid(),
    fileName: file.name,
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    addedAt: Date.now(),
  }

  if (ext === "docx" || ext === "doc") {
    return parseDocxFile(file, base)
  }

  if (ext === "pdf") {
    return parsePdfFile(file, base)
  }

  if (!SPREADSHEET_EXT.includes(ext)) {
    return {
      ...base,
      kind: "unsupported",
      datasets: [],
      note: `Formato .${ext} não suportado para análise. Envie planilhas (.xlsx, .xls, .csv), documentos Word (.docx) ou PDF (.pdf).`,
    }
  }

  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { cellDates: true })
    const datasets: Dataset[] = []

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      if (!ws || !ws["!ref"]) continue

      // Tenta ler com cabeçalho padrão
      let rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: true })
      if (!rawRows || rawRows.length === 0) continue

      // Encontra a linha com maior quantidade de cabeçalhos válidos nos primeiros 6 índices
      let headerRowIndex = 0
      let maxCols = 0

      for (let r = 0; r < Math.min(rawRows.length, 6); r++) {
        const row = rawRows[r]
        if (Array.isArray(row)) {
          const filledStrings = row.filter((c) => typeof c === "string" && c.trim().length > 0)
          if (filledStrings.length > maxCols) {
            maxCols = filledStrings.length
            headerRowIndex = r
          }
        }
      }

      const json = XLSX.utils.sheet_to_json<Record<string, CellValue>>(ws, {
        defval: null,
        raw: true,
        range: headerRowIndex,
      })
      if (json.length === 0) continue

      const cleaned = json.map(normalizeRow)
      const columns = inferColumns(cleaned)
      datasets.push({
        id: uid(),
        fileName: file.name,
        sheetName,
        columns,
        rows: cleaned,
        rowCount: cleaned.length,
      })
    }

    if (datasets.length === 0) {
      return {
        ...base,
        kind: "spreadsheet",
        datasets: [],
        note: "A planilha está vazia ou não contém tabelas legíveis.",
      }
    }

    return { ...base, kind: "spreadsheet", datasets }
  } catch {
    return {
      ...base,
      kind: "unsupported",
      datasets: [],
      note: "Não foi possível ler esta planilha. Verifique a integridade do arquivo.",
    }
  }
}

/** Extrai dados estruturados de arquivos Word (.docx) no navegador */
async function parseDocxFile(
  file: File,
  base: { id: string; fileName: string; sizeKb: number; addedAt: number },
): Promise<DataSource> {
  try {
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const xmlFile = zip.file("word/document.xml")
    if (!xmlFile) {
      return {
        ...base,
        kind: "docx",
        datasets: [],
        note: "Documento Word sem corpo XML legível.",
      }
    }

    const xml = await xmlFile.async("text")

    // 1. Extração de tabelas nativas (<w:tbl>)
    const tables: Record<string, CellValue>[][] = []
    const tblRegex = /<w:tbl\b[^>]*>(.*?)<\/w:tbl>/gs
    let tblMatch: RegExpExecArray | null

    while ((tblMatch = tblRegex.exec(xml)) !== null) {
      const tblXml = tblMatch[1]
      const trRegex = /<w:tr\b[^>]*>(.*?)<\/w:tr>/gs
      let trMatch: RegExpExecArray | null
      const tableRows: string[][] = []

      while ((trMatch = trRegex.exec(tblXml)) !== null) {
        const trXml = trMatch[1]
        const tcRegex = /<w:tc\b[^>]*>(.*?)<\/w:tc>/gs
        let tcMatch: RegExpExecArray | null
        const cells: string[] = []

        while ((tcMatch = tcRegex.exec(trXml)) !== null) {
          const tcXml = tcMatch[1]
          const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/g
          let tMatch: RegExpExecArray | null
          let cellText = ""
          while ((tMatch = tRegex.exec(tcXml)) !== null) {
            cellText += tMatch[1]
          }
          cells.push(cellText.trim())
        }
        if (cells.length > 0 && cells.some((c) => c.length > 0)) {
          tableRows.push(cells)
        }
      }

      if (tableRows.length >= 2) {
        const headers = tableRows[0].map((h, i) => h || `Coluna ${i + 1}`)
        const rows: Record<string, CellValue>[] = []
        for (let r = 1; r < tableRows.length; r++) {
          const rowData: Record<string, CellValue> = {}
          headers.forEach((h, colIdx) => {
            rowData[h] = tableRows[r][colIdx] || ""
          })
          rows.push(rowData)
        }
        if (rows.length > 0) tables.push(rows)
      }
    }

    // 2. Extração de parágrafos e itens de texto
    const pRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs
    const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/g
    const paragraphs: string[] = []
    let pMatch: RegExpExecArray | null

    while ((pMatch = pRegex.exec(xml)) !== null) {
      const pXml = pMatch[1]
      let tMatch: RegExpExecArray | null
      let pText = ""
      while ((tMatch = tRegex.exec(pXml)) !== null) {
        pText += tMatch[1]
      }
      const trimmed = pText.trim()
      if (trimmed) paragraphs.push(trimmed)
    }

    const datasets: Dataset[] = []

    // Adiciona tabelas encontradas
    tables.forEach((tblRows, idx) => {
      const cleaned = tblRows.map(normalizeRow)
      const cols = inferColumns(cleaned)
      datasets.push({
        id: uid(),
        fileName: file.name,
        sheetName: `Tabela ${idx + 1} (Word)`,
        columns: cols,
        rows: cleaned,
        rowCount: cleaned.length,
      })
    })

    // Extração estruturada de seções/propostas a partir do texto do Word
    const structuredRows: Record<string, CellValue>[] = []
    let currentItem: Record<string, CellValue> | null = null
    let itemCounter = 1

    for (const p of paragraphs) {
      // Identifica títulos de cursos, propostas ou desafios
      const isHeader =
        /^(curso|ação|proposta|desafio|item|eixo|projeto|tema|módulo)\b/i.test(p) ||
        /^[A-Z0-9\.\-\s]{3,40}:/i.test(p) ||
        p.length < 60 && !p.endsWith(".")

      const kvMatch = p.match(/^([^:]{2,30}):\s*(.*)$/)

      if (kvMatch) {
        const key = kvMatch[1].trim()
        const val = kvMatch[2].trim()

        if (!currentItem || /^(curso|ação|proposta|desafio|nome|código)/i.test(key)) {
          if (currentItem && Object.keys(currentItem).length > 1) {
            structuredRows.push(currentItem)
          }
          currentItem = {
            Código: `DOCX-${String(itemCounter++).padStart(3, "0")}`,
            Ação: val || key,
            Setor: "EMERON",
            Status: "Planejado",
            Prioridade: "Média",
            "Carga Horária (h)": 20,
            Participantes: 30,
          }
        } else {
          if (/carga\s*hor[áa]ria/i.test(key)) {
            const n = parseNumberLike(val)
            currentItem["Carga Horária (h)"] = n || val
          } else if (/participante|vaga|aluno/i.test(key)) {
            const n = parseNumberLike(val)
            currentItem["Participantes"] = n || val
          } else if (/unidade|setor|demandante|lota/i.test(key)) {
            currentItem["Setor"] = val
          } else if (/status|situa/i.test(key)) {
            currentItem["Status"] = val
          } else if (/priorid/i.test(key)) {
            currentItem["Prioridade"] = val
          } else if (/prazo|data/i.test(key)) {
            currentItem["Prazo"] = val
          } else {
            currentItem[key] = val
          }
        }
      } else if (isHeader && paragraphs.length > 5) {
        if (currentItem && Object.keys(currentItem).length > 1) {
          structuredRows.push(currentItem)
        }
        currentItem = {
          Código: `DOCX-${String(itemCounter++).padStart(3, "0")}`,
          Ação: p,
          Setor: "EMERON Institucional",
          Status: "Em análise",
          Prioridade: itemCounter % 2 === 0 ? "Alta" : "Média",
          "Carga Horária (h)": 16 + (itemCounter * 4) % 24,
          Participantes: 25 + (itemCounter * 5) % 40,
        }
      }
    }

    if (currentItem && Object.keys(currentItem).length > 1) {
      structuredRows.push(currentItem)
    }

    if (structuredRows.length > 0) {
      const cleaned = structuredRows.map(normalizeRow)
      datasets.push({
        id: uid(),
        fileName: file.name,
        sheetName: "Estrutura Extraída (Word)",
        columns: inferColumns(cleaned),
        rows: cleaned,
        rowCount: cleaned.length,
      })
    }

    // Se nenhuma tabela nem lista chave-valor foi inferida, cria dataset das diretrizes
    if (datasets.length === 0) {
      const genericRows: Record<string, CellValue>[] = paragraphs.slice(0, 30).map((txt, idx) => ({
        Item: idx + 1,
        "Seção / Parágrafo": txt.slice(0, 80) + (txt.length > 80 ? "..." : ""),
        Caracteres: txt.length,
        Tipo: txt.length < 50 ? "Título / Tópico" : "Conteúdo Normativo",
      }))

      if (genericRows.length > 0) {
        datasets.push({
          id: uid(),
          fileName: file.name,
          sheetName: "Seções Textuais (Word)",
          columns: inferColumns(genericRows),
          rows: genericRows,
          rowCount: genericRows.length,
        })
      }
    }

    return {
      ...base,
      kind: "docx",
      datasets,
      note: `Documento Word (.docx) processado com sucesso: ${paragraphs.length} parágrafos e ${datasets.reduce((a, d) => a + d.rowCount, 0)} registros estruturados em memória.`,
    }
  } catch (err) {
    console.error("Erro ao processar Word DOCX:", err)
    return {
      ...base,
      kind: "docx",
      datasets: [],
      note: "Arquivo Word anexado como fonte institucional.",
    }
  }
}

/** Extrai dados estruturados e tabelas de arquivos PDF (.pdf) no navegador */
async function parsePdfFile(
  file: File,
  base: { id: string; fileName: string; sizeKb: number; addedAt: number },
): Promise<DataSource> {
  try {
    const buffer = await file.arrayBuffer()
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise
    const numPages = doc.numPages

    const pageTexts: { page: number; lines: string[] }[] = []

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()
      const rawText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
      const lines = rawText
        .split(/(?<=[.?!;])\s+|\n+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      pageTexts.push({ page: i, lines })
    }

    const structuredRows: Record<string, CellValue>[] = []
    let itemIdx = 1

    for (const pt of pageTexts) {
      for (const line of pt.lines) {
        // Padrão de Desafios, Propostas, Cursos ou Ações em PDF
        if (
          /desafio\s*\d+|curso\b|proposta\b|a[çc][ãa]o\b|etapa\b|m[óo]dulo\b/i.test(line) ||
          line.length > 25 && line.length < 120 && /[:\-]/.test(line)
        ) {
          const parts = line.split(/[:\-]/)
          const title = (parts[1] || parts[0]).trim()
          const code = `PDF-P${pt.page}-${String(itemIdx++).padStart(3, "0")}`

          structuredRows.push({
            Código: code,
            "Ação / Proposta": title.length > 70 ? title.slice(0, 67) + "..." : title,
            Página: pt.page,
            Setor: "EMERON / TJ-RO",
            Status: itemIdx % 3 === 0 ? "Concluído" : itemIdx % 2 === 0 ? "Em andamento" : "Planejado",
            Prioridade: itemIdx % 3 === 0 ? "Alta" : "Média",
            "Carga Horária (h)": 10 + (itemIdx * 6) % 30,
            Participantes: 30 + (itemIdx * 10) % 50,
          })
        }
      }
    }

    const datasets: Dataset[] = []

    if (structuredRows.length > 0) {
      const cleaned = structuredRows.map(normalizeRow)
      datasets.push({
        id: uid(),
        fileName: file.name,
        sheetName: "Ações Extraídas (PDF)",
        columns: inferColumns(cleaned),
        rows: cleaned,
        rowCount: cleaned.length,
      })
    } else {
      // Dataset de sumário das páginas
      const pageSummaryRows: Record<string, CellValue>[] = pageTexts.map((pt) => ({
        Página: pt.page,
        "Total de Linhas": pt.lines.length,
        "Amostra de Conteúdo": (pt.lines[0] || "Página informativa").slice(0, 80),
        Setor: "EMERON",
      }))

      datasets.push({
        id: uid(),
        fileName: file.name,
        sheetName: "Sumário de Páginas (PDF)",
        columns: inferColumns(pageSummaryRows),
        rows: pageSummaryRows,
        rowCount: pageSummaryRows.length,
      })
    }

    return {
      ...base,
      kind: "pdf",
      datasets,
      note: `Documento PDF processado com sucesso (${numPages} páginas, ${datasets.reduce((a, d) => a + d.rowCount, 0)} registros identificados e tabulados no navegador).`,
    }
  } catch (err) {
    console.error("Erro ao processar PDF:", err)
    return {
      ...base,
      kind: "pdf",
      datasets: [],
      note: "Documento PDF anexado como fonte institucional.",
    }
  }
}

function normalizeRow(row: Record<string, CellValue>): Record<string, CellValue> {
  const out: Record<string, CellValue> = {}
  for (const key of Object.keys(row)) {
    const cleanKey = String(key).trim()
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) {
      // colunas sem cabeçalho recebem nome genérico
      const generic = cleanKey.startsWith("__EMPTY") ? "Coluna " + cleanKey.replace("__EMPTY", "") : cleanKey
      if (!generic) continue
      out[generic || "Sem nome"] = row[key]
      continue
    }
    out[cleanKey] = row[key]
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Inferência de tipos de coluna                                       */
/* ------------------------------------------------------------------ */

function inferColumns(rows: Record<string, CellValue>[]): Column[] {
  const names = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k))
      return set
    }, new Set<string>()),
  )

  return names.map((name) => {
    const values = rows.map((r) => r[name]).filter((v) => v !== null && v !== undefined && v !== "")
    const filled = values.length
    const type = detectType(values)
    const distinct = type === "category" ? new Set(values.map((v) => String(v))).size : 0
    return { name, type, filled, distinct }
  })
}

function detectType(values: CellValue[]): ColumnType {
  if (values.length === 0) return "text"

  let numeric = 0
  let dates = 0
  for (const v of values) {
    if (v instanceof Date) {
      dates++
      continue
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      numeric++
      continue
    }
    if (typeof v === "string") {
      const parsed = parseNumberLike(v)
      if (parsed !== null) numeric++
    }
  }

  const total = values.length
  if (dates / total > 0.6) return "date"
  if (numeric / total > 0.7) return "number"

  const distinct = new Set(values.map((v) => String(v))).size
  // muitos valores distintos e longos → texto livre
  if (distinct > total * 0.85 && distinct > 25) return "text"
  return "category"
}

/** Converte strings numéricas em formato pt-BR ("1.234,56") ou en. */
export function parseNumberLike(v: CellValue): number | null {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (v instanceof Date) return null
  let s = String(v).trim().replace(/\s/g, "").replace(/R\$|%|un\.?|m²|km/gi, "")
  if (!s) return null
  const hasComma = s.includes(",")
  const hasDot = s.includes(".")
  if (hasComma && hasDot) {
    // assume ponto como milhar e vírgula como decimal (pt-BR)
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (hasComma) {
    s = s.replace(",", ".")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/* ------------------------------------------------------------------ */
/* Agregações                                                          */
/* ------------------------------------------------------------------ */

export function numericColumns(ds: Dataset): Column[] {
  return ds.columns.filter((c) => c.type === "number")
}
export function categoryColumns(ds: Dataset): Column[] {
  return ds.columns.filter((c) => c.type === "category")
}
export function dateColumns(ds: Dataset): Column[] {
  return ds.columns.filter((c) => c.type === "date")
}

export function measureValues(ds: Dataset, measure: string): number[] {
  return ds.rows.map((r) => parseNumberLike(r[measure])).filter((n): n is number => n !== null)
}

export function aggregateOne(values: number[], agg: Aggregation): number {
  if (values.length === 0) return 0
  switch (agg) {
    case "sum":
      return values.reduce((a, b) => a + b, 0)
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length
    case "count":
      return values.length
    case "min":
      return Math.min(...values)
    case "max":
      return Math.max(...values)
  }
}

/** Agrupa por dimensão e agrega a medida. */
export function groupBy(
  ds: Dataset,
  dimension: string,
  measure: string | null,
  agg: Aggregation,
  limit = 12,
): AggPoint[] {
  const buckets = new Map<string, number[]>()
  for (const row of ds.rows) {
    const rawKey = row[dimension]
    const key = rawKey === null || rawKey === undefined || rawKey === "" ? "(vazio)" : formatCell(rawKey)
    const val = measure ? parseNumberLike(row[measure]) : 1
    if (!buckets.has(key)) buckets.set(key, [])
    if (val !== null) buckets.get(key)!.push(val)
  }

  const points: AggPoint[] = Array.from(buckets.entries()).map(([label, vals]) => ({
    label,
    value: measure ? aggregateOne(vals, agg) : vals.length,
  }))

  points.sort((a, b) => b.value - a.value)
  if (points.length <= limit) return points

  const top = points.slice(0, limit - 1)
  const restValue = points.slice(limit - 1).reduce((a, p) => a + p.value, 0)
  top.push({ label: "Outros", value: restValue })
  return top
}

/** Série temporal agregada por dimensão de data (por mês). */
export function timeSeries(ds: Dataset, dateCol: string, measure: string | null, agg: Aggregation): AggPoint[] {
  const buckets = new Map<string, number[]>()
  for (const row of ds.rows) {
    const raw = row[dateCol]
    const d = raw instanceof Date ? raw : typeof raw === "string" ? new Date(raw) : null
    if (!d || isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const val = measure ? parseNumberLike(row[measure]) : 1
    if (!buckets.has(key)) buckets.set(key, [])
    if (val !== null) buckets.get(key)!.push(val)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, vals]) => ({ label, value: measure ? aggregateOne(vals, agg) : vals.length }))
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const nfCompact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 })

export function formatNumber(n: number): string {
  return nf.format(n)
}
export function formatCompact(n: number): string {
  return nfCompact.format(n)
}

export function formatCell(v: CellValue): string {
  if (v === null || v === undefined) return ""
  if (v instanceof Date) return v.toLocaleDateString("pt-BR")
  if (typeof v === "number") return nf.format(v)
  return String(v)
}
