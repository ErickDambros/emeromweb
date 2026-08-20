import * as XLSX from "xlsx"
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

  if (ext === "pdf") {
    return {
      ...base,
      kind: "pdf",
      datasets: [],
      note: "Documento PDF anexado como fonte institucional. Usado nos relatórios; a extração de tabelas de PDF não é analisada nesta versão.",
    }
  }

  if (ext === "docx" || ext === "doc") {
    return {
      ...base,
      kind: "docx",
      datasets: [],
      note: "Documento Word anexado como fonte institucional. Usado nos relatórios; a extração de texto de Word não é analisada nesta versão.",
    }
  }

  if (!SPREADSHEET_EXT.includes(ext)) {
    return {
      ...base,
      kind: "unsupported",
      datasets: [],
      note: `Formato .${ext} não suportado para análise. Envie planilhas (.xlsx, .xls, .csv).`,
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
  } catch (err) {
    return {
      ...base,
      kind: "unsupported",
      datasets: [],
      note: "Não foi possível ler este arquivo. Verifique se é uma planilha válida.",
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
