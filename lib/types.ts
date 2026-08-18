export type ColumnType = "number" | "date" | "category" | "text"

export type CellValue = string | number | Date | null

export interface Column {
  name: string
  type: ColumnType
  /** Número de valores não vazios */
  filled: number
  /** Valores distintos (apenas para category) */
  distinct: number
}

export interface Dataset {
  id: string
  fileName: string
  sheetName: string
  columns: Column[]
  rows: Record<string, CellValue>[]
  rowCount: number
}

export type SourceKind = "spreadsheet" | "pdf" | "unsupported"

export interface DataSource {
  id: string
  fileName: string
  kind: SourceKind
  sizeKb: number
  addedAt: number
  /** datasets extraídos (planilhas podem ter várias abas) */
  datasets: Dataset[]
  /** mensagem quando o arquivo não pôde ser analisado */
  note?: string
}

export type Aggregation = "sum" | "avg" | "count" | "min" | "max"

export interface AggPoint {
  label: string
  value: number
}

export type DocumentStatus = "concluido" | "pendente" | "em_analise"

export interface DossierDocument {
  id: string
  name: string
  required: boolean
  status: DocumentStatus
  description: string
  updatedAt?: string
}

export interface DataDivergence {
  id: string
  field: string
  sourceA: { name: string; value: string }
  sourceB: { name: string; value: string }
  severity: "alta" | "media" | "baixa"
  explanation: string
}

export interface ActionDossier {
  canonicalId: string // ex: EMERON-2026-001
  seiProcess: string // ex: 0012345.000048/2026-12
  emeronWebId: string // ex: EW-2026-8841
  name: string
  sector: string
  category: string
  responsible: string
  status: string
  priority: string
  deadline: Date | null
  budgetPlanned: number
  budgetExecuted: number
  students: number
  progress: number
  workloadHours?: number
  documents: DossierDocument[]
  divergences: DataDivergence[]
  history: { date: string; description: string; author: string }[]
}
