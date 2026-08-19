"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, ArrowDownWideNarrow, ChevronRight, FileText, ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore } from "@/components/data-store"
import { EmptyState } from "@/components/empty-state"
import { ExportMenu } from "@/components/export-menu"
import {
  authenticityHash,
  exportPrioritiesCsv,
  exportPrioritiesJson,
  exportPrioritiesMarkdown,
  exportPrioritiesPdf,
  exportPrioritiesTxt,
  exportPrioritiesXlsx,
  prioritiesToText,
} from "@/lib/export-utils"
import { categoryColumns, formatCell, formatCompact, groupBy, numericColumns } from "@/lib/data-engine"
import type { CellValue } from "@/lib/types"

const COUNT = "__count__"

interface PrioridadesViewProps {
  onSelectAction?: (row: Record<string, CellValue>, index: number) => void
}

export function PrioridadesView({ onSelectAction }: PrioridadesViewProps) {
  const { filteredDataset: activeDataset } = useDataStore()
  const cats = activeDataset ? categoryColumns(activeDataset) : []
  const nums = activeDataset ? numericColumns(activeDataset) : []

  const [dimension, setDimension] = useState("")
  const [measure, setMeasure] = useState("")

  const dim = dimension || cats[0]?.name || ""
  const mea = measure || (nums[0]?.name ?? COUNT)
  const isCount = mea === COUNT

  const ranking = useMemo(() => {
    if (!activeDataset || !dim) return []
    return groupBy(activeDataset, dim, isCount ? null : mea, "sum", 20).filter((p) => p.label !== "Outros")
  }, [activeDataset, dim, mea, isCount])

  // distribuição de coluna de prioridade, se existir
  const priorityCol = cats.find((c) => /priorid/i.test(c.name))
  const priorityDist = useMemo(() => {
    if (!activeDataset || !priorityCol) return []
    return groupBy(activeDataset, priorityCol.name, null, "count", 6)
  }, [activeDataset, priorityCol])

  if (!activeDataset) {
    return (
      <EmptyState
        title="Sem dados para priorizar"
        description="Envie uma planilha de ações para gerar o ranking de prioridades institucionais."
      />
    )
  }

  const max = ranking[0]?.value ?? 1
  const measureLabel = isCount ? "registros" : mea

  return (
    <div className="space-y-6">
      {/* Distribuição de Prioridade */}
      {priorityCol && priorityDist.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {priorityDist.map((p, i) => (
            <Card key={p.label} className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{priorityCol.name}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{p.label}</p>
              <p className="mt-2 font-mono text-2xl font-semibold" style={{ color: chip(i) }}>
                {p.value}
              </p>
              <p className="text-xs text-muted-foreground">ações</p>
            </Card>
          ))}
        </div>
      )}

      {/* Ranking Agregado por Dimensão */}
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownWideNarrow className="size-4 text-primary" />
              Ranking de Prioridades e Atenção
            </CardTitle>
            <CardDescription>
              Ordenado por {isCount ? "número de registros" : `soma de ${mea}`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dim} onValueChange={(val) => val && setDimension(val)}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mea} onValueChange={(val) => val && setMeasure(val)}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COUNT}>Contagem de registros</SelectItem>
                {nums.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportMenu
              label="Exportar Prioridades"
              variant="outline"
              documentTitle={`Matriz de Prioridades — ${dim}`}
              documentSubtitle={`Ordenado por ${isCount ? "contagem" : mea} · ${activeDataset.sheetName} (${ranking.length} categorias)`}
              documentHash={authenticityHash(`prioridades|${activeDataset.sheetName}|${dim}|${mea}`)}
              itemCount={ranking.length}
              category="Prioridades & Atenção"
              onPdf={() => exportPrioritiesPdf(ranking, activeDataset, dim, mea)}
              onExcel={() => exportPrioritiesXlsx(ranking, activeDataset, dim, mea)}
              onCsv={() => exportPrioritiesCsv(ranking, activeDataset, dim, mea)}
              onJson={() => exportPrioritiesJson(ranking, activeDataset, dim, mea)}
              onTxt={() => exportPrioritiesTxt(ranking, activeDataset, dim, mea)}
              onMarkdown={() => exportPrioritiesMarkdown(ranking, activeDataset, dim, mea)}
              buildText={() => prioritiesToText(ranking, activeDataset, dim, mea)}
              buildJsonData={() => ({
                dimensao: dim,
                medida: mea,
                tabela: activeDataset.sheetName,
                ranking,
              })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {ranking.map((item, i) => {
            const critical = i < 3
            // Procura o registro correspondente para possibilitar o drill-down
            const matchingIdx = activeDataset.rows.findIndex((r) => String(r[dim] || "") === item.label)
            const matchingRow = matchingIdx >= 0 ? activeDataset.rows[matchingIdx] : activeDataset.rows[i]

            return (
              <div
                key={item.label}
                onClick={() => matchingRow && onSelectAction?.(matchingRow, matchingIdx >= 0 ? matchingIdx : i)}
                className={`group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all ${
                  onSelectAction ? "cursor-pointer hover:border-primary/40 hover:bg-accent/30" : ""
                }`}
                title={onSelectAction ? "Clique para abrir o Prontuário Vivo desta ação" : undefined}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold"
                  style={
                    critical
                      ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                      : { background: "var(--muted)", color: "var(--muted-foreground)" }
                  }
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="shrink-0 font-mono text-sm text-muted-foreground">
                      {formatCompact(item.value)}
                      <span className="ml-1 text-xs">{measureLabel}</span>
                    </span>
                  </div>
                  <Progress value={(item.value / max) * 100} className="mt-1.5 h-1.5" />
                </div>
                {critical && (
                  <Badge className="hidden shrink-0 gap-1 bg-primary/10 text-primary hover:bg-primary/10 sm:inline-flex">
                    <AlertTriangle className="size-3" />
                    Crítica
                  </Badge>
                )}
                {onSelectAction && (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Fila de Ações Individuais (Drilldown para o Prontuário Vivo - Camada 1) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="size-4 text-primary" />
                Fila de Ações Estratégicas (Prontuário Vivo)
              </CardTitle>
              <CardDescription>
                Clique em qualquer ação individual para abrir seu dossiê, checklist e divergências
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeDataset.rowCount} Ações Mapeadas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeDataset.rows.slice(0, 10).map((row, idx) => {
            const canonicalId = String(row["Código"] || `EMERON-2026-${String(idx + 1).padStart(3, "0")}`)
            const title = String(row["Ação"] || row["Nome"] || `Ação ${idx + 1}`)
            const sector = String(row["Setor"] || "Educação")
            const prio = String(row["Prioridade"] || "Média")
            const stat = String(row["Status"] || "Em andamento")
            const progress = Number(row["Progresso (%)"] || 50)

            return (
              <div
                key={idx}
                onClick={() => onSelectAction?.(row, idx)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-accent/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {canonicalId}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground hover:text-primary">{title}</p>
                    <p className="text-xs text-muted-foreground">{sector}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant={prio === "Alta" ? "destructive" : "secondary"}
                    className="hidden text-[11px] sm:inline-flex"
                  >
                    {prio}
                  </Badge>
                  <Badge variant="outline" className="hidden text-[11px] sm:inline-flex">
                    {stat}
                  </Badge>
                  <div className="hidden w-20 text-right sm:block">
                    <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                    <Progress value={progress} className="mt-1 h-1.5" />
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                    <FileText className="size-3.5" />
                    <span className="hidden sm:inline">Ver Dossiê</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function chip(i: number) {
  return ["var(--chart-3)", "var(--chart-2)", "var(--primary)", "var(--chart-4)", "var(--chart-5)"][i % 5]
}
