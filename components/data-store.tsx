"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { parseFile } from "@/lib/data-engine"
import { buildSampleSource } from "@/lib/sample-data"
import type { CellValue, Dataset, DataSource } from "@/lib/types"

export interface GlobalFilters {
  search: string
  setor: string
  status: string
  prioridade: string
}

const EMPTY_FILTERS: GlobalFilters = { search: "", setor: "", status: "", prioridade: "" }

interface FilterOptions {
  setores: string[]
  status: string[]
  prioridades: string[]
}

interface DataStoreValue {
  sources: DataSource[]
  datasets: Dataset[]
  activeDatasetId: string | null
  /** Dataset ativo bruto (sem filtros aplicados) */
  activeDataset: Dataset | null
  /** Dataset ativo já com os filtros globais aplicados — use este nas views */
  filteredDataset: Dataset | null
  setActiveDatasetId: (id: string) => void
  addFiles: (files: File[]) => Promise<void>
  removeSource: (id: string) => void
  loadSample: () => void
  clearAll: () => void
  isLoading: boolean
  lastNotes: string[]
  /* Busca e filtros globais em tempo real */
  filters: GlobalFilters
  setFilters: (patch: Partial<GlobalFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  filterOptions: FilterOptions
  filteredCount: number
  totalCount: number
}

const DataStoreContext = createContext<DataStoreValue | null>(null)

function findColumn(ds: Dataset, re: RegExp): string | null {
  return ds.columns.find((c) => re.test(c.name))?.name ?? null
}

function distinctValues(ds: Dataset | null, colName: string | null): string[] {
  if (!ds || !colName) return []
  const set = new Set<string>()
  for (const row of ds.rows) {
    const v = row[colName]
    if (v !== null && v !== undefined && v !== "") set.add(String(v))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))
}

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<DataSource[]>([])
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastNotes, setLastNotes] = useState<string[]>([])
  const [filters, setFiltersState] = useState<GlobalFilters>(EMPTY_FILTERS)

  const datasets = useMemo(() => sources.flatMap((s) => s.datasets), [sources])
  const activeDataset = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? datasets[0] ?? null,
    [datasets, activeDatasetId],
  )

  const addFiles = useCallback(async (files: File[]) => {
    setIsLoading(true)
    setLastNotes([])
    try {
      const parsed = await Promise.all(files.map((f) => parseFile(f)))
      const notes = parsed.filter((p) => p.note).map((p) => `${p.fileName}: ${p.note}`)
      setLastNotes(notes)
      setSources((prev) => {
        const next = [...prev, ...parsed]
        const firstDataset = parsed.flatMap((p) => p.datasets)[0]
        if (firstDataset) {
          setActiveDatasetId((cur) => cur ?? firstDataset.id)
        }
        return next
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const loadSample = useCallback(() => {
    const sample = buildSampleSource()
    setSources((prev) => {
      const filtered = prev.filter((s) => s.id !== sample.id && s.fileName !== sample.fileName)
      return [...filtered, sample]
    })
    setActiveDatasetId(sample.datasets[0]?.id ?? null)
  }, [])

  const clearAll = useCallback(() => {
    setSources([])
    setActiveDatasetId(null)
    setLastNotes([])
  }, [])

  const setFilters = useCallback((patch: Partial<GlobalFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
  }, [])

  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), [])

  // Colunas relevantes para os filtros globais
  const setorCol = useMemo(() => (activeDataset ? findColumn(activeDataset, /setor|unidade|lota/i) : null), [activeDataset])
  const statusCol = useMemo(() => (activeDataset ? findColumn(activeDataset, /status|situa/i) : null), [activeDataset])
  const prioridadeCol = useMemo(() => (activeDataset ? findColumn(activeDataset, /priorid/i) : null), [activeDataset])

  const filterOptions = useMemo<FilterOptions>(
    () => ({
      setores: distinctValues(activeDataset, setorCol),
      status: distinctValues(activeDataset, statusCol),
      prioridades: distinctValues(activeDataset, prioridadeCol),
    }),
    [activeDataset, setorCol, statusCol, prioridadeCol],
  )

  const hasActiveFilters =
    filters.search.trim() !== "" || filters.setor !== "" || filters.status !== "" || filters.prioridade !== ""

  const filteredDataset = useMemo<Dataset | null>(() => {
    if (!activeDataset) return null
    if (!hasActiveFilters) return activeDataset

    const q = filters.search.trim().toLowerCase()
    const rows = activeDataset.rows.filter((row) => {
      if (filters.setor && setorCol && String(row[setorCol] ?? "") !== filters.setor) return false
      if (filters.status && statusCol && String(row[statusCol] ?? "") !== filters.status) return false
      if (filters.prioridade && prioridadeCol && String(row[prioridadeCol] ?? "") !== filters.prioridade) return false
      if (q) {
        const haystack = Object.values(row)
          .map((v: CellValue) => (v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v ?? "")))
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    return { ...activeDataset, rows, rowCount: rows.length }
  }, [activeDataset, hasActiveFilters, filters, setorCol, statusCol, prioridadeCol])

  const value: DataStoreValue = {
    sources,
    datasets,
    activeDatasetId: activeDataset?.id ?? null,
    activeDataset,
    filteredDataset,
    setActiveDatasetId,
    addFiles,
    removeSource,
    loadSample,
    clearAll,
    isLoading,
    lastNotes,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    filterOptions,
    filteredCount: filteredDataset?.rowCount ?? 0,
    totalCount: activeDataset?.rowCount ?? 0,
  }

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error("useDataStore deve ser usado dentro de DataStoreProvider")
  return ctx
}
