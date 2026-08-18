"use client"

import { AlertTriangle, FileSpreadsheet, FileText, FileWarning, Table2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataStore } from "@/components/data-store"
import { UploadDropzone } from "@/components/upload-dropzone"
import type { DataSource } from "@/lib/types"

const kindIcon = {
  spreadsheet: FileSpreadsheet,
  pdf: FileText,
  unsupported: FileWarning,
}

export function FontesView() {
  const { sources, removeSource, setActiveDatasetId, clearAll } = useDataStore()

  return (
    <div className="space-y-6">
      <UploadDropzone />

      {sources.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sources.length} {sources.length === 1 ? "fonte carregada" : "fontes carregadas"}
          </p>
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
            <Trash2 className="size-4" />
            Limpar tudo
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onRemove={() => removeSource(source.id)}
            onOpen={(dsId) => setActiveDatasetId(dsId)}
          />
        ))}
      </div>
    </div>
  )
}

function SourceCard({
  source,
  onRemove,
  onOpen,
}: {
  source: DataSource
  onRemove: () => void
  onOpen: (datasetId: string) => void
}) {
  const Icon = kindIcon[source.kind]
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{source.fileName}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {source.sizeKb} KB · {source.datasets.length}{" "}
              {source.datasets.length === 1 ? "tabela" : "tabelas"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remover fonte">
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {source.note && (
          <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-chart-3" />
            <span className="text-pretty">{source.note}</span>
          </div>
        )}
        {source.datasets.map((ds) => (
          <button
            key={ds.id}
            onClick={() => onOpen(ds.id)}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Table2 className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{ds.sheetName}</p>
                <p className="text-xs text-muted-foreground">
                  {ds.rowCount} linhas · {ds.columns.length} colunas
                </p>
              </div>
            </div>
            <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
              {ds.columns.slice(0, 4).map((c) => (
                <Badge key={c.name} variant="secondary" className="font-normal">
                  {c.name}
                </Badge>
              ))}
              {ds.columns.length > 4 && (
                <Badge variant="outline" className="font-normal">
                  +{ds.columns.length - 4}
                </Badge>
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
