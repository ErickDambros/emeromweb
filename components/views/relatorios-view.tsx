"use client"

import { useMemo, useState } from "react"
import { FileDown, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore } from "@/components/data-store"
import { EmptyState } from "@/components/empty-state"
import {
  aggregateOne,
  categoryColumns,
  dateColumns,
  formatCompact,
  formatNumber,
  groupBy,
  measureValues,
  numericColumns,
} from "@/lib/data-engine"

const COUNT = "__count__"

export function RelatoriosView() {
  const { activeDataset, sources } = useDataStore()
  const cats = activeDataset ? categoryColumns(activeDataset) : []
  const nums = activeDataset ? numericColumns(activeDataset) : []
  const dates = activeDataset ? dateColumns(activeDataset) : []

  const [dimension, setDimension] = useState("")
  const [measure, setMeasure] = useState("")

  const dim = dimension || cats[0]?.name || ""
  const mea = measure || (nums[0]?.name ?? COUNT)
  const isCount = mea === COUNT

  const topIndicators = useMemo(() => {
    if (!activeDataset || !dim) return []
    return groupBy(activeDataset, dim, isCount ? null : mea, "sum", 8)
  }, [activeDataset, dim, mea, isCount])

  const summary = useMemo(() => {
    if (!activeDataset) return null
    return nums.slice(0, 4).map((c) => {
      const vals = measureValues(activeDataset, c.name)
      return {
        name: c.name,
        sum: aggregateOne(vals, "sum"),
        avg: aggregateOne(vals, "avg"),
        max: aggregateOne(vals, "max"),
      }
    })
  }, [activeDataset, nums])

  const pdfSources = sources.filter((s) => s.kind === "pdf")

  if (!activeDataset) {
    return (
      <EmptyState
        title="Nenhum relatório para gerar"
        description="Envie planilhas institucionais para compor e exportar relatórios em PDF."
      />
    )
  }

  const now = new Date()
  const total = isCount
    ? activeDataset.rowCount
    : aggregateOne(measureValues(activeDataset, mea), "sum")

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Indicador principal:</span>
          <Select value={dim} onValueChange={(val) => val && setDimension(val)}>
            <SelectTrigger className="w-[150px] bg-background">
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
            <SelectTrigger className="w-[170px] bg-background">
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
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <FileDown className="size-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Documento */}
      <div className="print-area mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-8 shadow-sm md:p-12">
        {/* Cabeçalho institucional */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Governo do Estado de Rondônia
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">EMEROM — Escola de Governo</h2>
            <p className="text-sm text-muted-foreground">Relatório Institucional de Indicadores</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Emitido em</p>
            <p className="font-medium text-foreground">{now.toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* Metadados */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Meta label="Fonte de dados" value={activeDataset.fileName} />
          <Meta label="Tabela" value={activeDataset.sheetName} />
          <Meta label="Registros" value={formatNumber(activeDataset.rowCount)} />
        </div>

        {/* Resumo executivo */}
        <Section title="1. Resumo executivo">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Este relatório consolida {formatNumber(activeDataset.rowCount)} registros da tabela{" "}
            <strong className="text-foreground">{activeDataset.sheetName}</strong>. O indicador principal analisado é{" "}
            <strong className="text-foreground">{isCount ? "a contagem de registros" : mea}</strong> por{" "}
            <strong className="text-foreground">{dim}</strong>, totalizando{" "}
            <strong className="text-foreground">{formatNumber(total)}</strong>
            {dates.length > 0 && <> com prazos monitorados pela coluna {dates[0].name}</>}.
          </p>
        </Section>

        {/* Indicadores numéricos */}
        {summary && summary.length > 0 && (
          <Section title="2. Indicadores numéricos">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Indicador</th>
                  <th className="py-2 text-right font-medium">Soma</th>
                  <th className="py-2 text-right font-medium">Média</th>
                  <th className="py-2 text-right font-medium">Máximo</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.name} className="border-b border-border/60">
                    <td className="py-2 font-medium text-foreground">{s.name}</td>
                    <td className="py-2 text-right font-mono">{formatNumber(s.sum)}</td>
                    <td className="py-2 text-right font-mono">{formatNumber(s.avg)}</td>
                    <td className="py-2 text-right font-mono">{formatNumber(s.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Ranking */}
        <Section title={`3. Principais destaques por ${dim}`}>
          <div className="space-y-2">
            {topIndicators.map((item, i) => {
              const max = topIndicators[0]?.value ?? 1
              return (
                <div key={item.label} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground">
                      {i + 1}. {item.label}
                    </span>
                    <span className="shrink-0 font-mono text-muted-foreground">{formatCompact(item.value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Anexos */}
        {pdfSources.length > 0 && (
          <Section title="4. Documentos anexos">
            <ul className="space-y-1.5">
              {pdfSources.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span>{s.fileName}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="mt-8 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <Printer className="size-3.5" />
          <span>Documento gerado automaticamente pelo Painel EMEROMWEB Qlik Institucional.</span>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      {children}
    </section>
  )
}
