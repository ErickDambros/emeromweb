"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { parseFile } from "@/lib/data-engine"
import { buildSampleSource } from "@/lib/sample-data"
import type { Dataset, DataSource } from "@/lib/types"

interface DataStoreValue {
  sources: DataSource[]
  datasets: Dataset[]
  activeDatasetId: string | null
  activeDataset: Dataset | null
  setActiveDatasetId: (id: string) => void
  addFiles: (files: File[]) => Promise<void>
  removeSource: (id: string) => void
  loadSample: () => void
  clearAll: () => void
  isLoading: boolean
  lastNotes: string[]
}

const DataStoreContext = createContext<DataStoreValue | null>(null)

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<DataSource[]>([])
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastNotes, setLastNotes] = useState<string[]>([])

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
    setSources((prev) => [...prev, sample])
    setActiveDatasetId(sample.datasets[0]?.id ?? null)
  }, [])

  const clearAll = useCallback(() => {
    setSources([])
    setActiveDatasetId(null)
    setLastNotes([])
  }, [])

  const value: DataStoreValue = {
    sources,
    datasets,
    activeDatasetId: activeDataset?.id ?? null,
    activeDataset,
    setActiveDatasetId,
    addFiles,
    removeSource,
    loadSample,
    clearAll,
    isLoading,
    lastNotes,
  }

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error("useDataStore deve ser usado dentro de DataStoreProvider")
  return ctx
}
