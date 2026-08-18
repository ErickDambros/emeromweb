"use client"

import { useMemo, useState } from "react"
import { CalendarClock, CalendarDays, CalendarRange } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore } from "@/components/data-store"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { categoryColumns, dateColumns } from "@/lib/data-engine"
import type { CellValue } from "@/lib/types"

interface AgendaEvent {
  date: Date
  title: string
  tags: string[]
}

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })

function toDate(v: CellValue): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === "string") {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function AgendasView() {
  const { filteredDataset: activeDataset } = useDataStore()
  const dates = activeDataset ? dateColumns(activeDataset) : []
  const cats = activeDataset ? categoryColumns(activeDataset) : []

  const [dateCol, setDateCol] = useState("")
  const active = dateCol || dates[0]?.name || ""

  const titleCol = cats.find((c) => /a[çc][ãa]o|atividade|evento|nome|t[íi]tulo|descri/i.test(c.name)) ?? cats[0]
  const statusCol = cats.find((c) => /status|situa/i.test(c.name))
  const priorityCol = cats.find((c) => /priorid/i.test(c.name))

  const events = useMemo<AgendaEvent[]>(() => {
    if (!activeDataset || !active) return []
    return activeDataset.rows
      .map((row) => {
        const d = toDate(row[active])
        if (!d) return null
        const tags: string[] = []
        if (statusCol && row[statusCol.name]) tags.push(String(row[statusCol.name]))
        if (priorityCol && row[priorityCol.name]) tags.push(String(row[priorityCol.name]))
        return {
          date: d,
          title: titleCol ? String(row[titleCol.name] ?? "Sem título") : "Ação",
          tags,
        }
      })
      .filter((e): e is AgendaEvent => e !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [activeDataset, active, titleCol, statusCol, priorityCol])

  const grouped = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>()
    for (const ev of events) {
      const key = `${ev.date.getFullYear()}-${String(ev.date.getMonth() + 1).padStart(2, "0")}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [events])

  if (!activeDataset) {
    return (
      <EmptyState
        title="Nenhuma agenda disponível"
        description="Envie planilhas com colunas de datas (prazos, cronogramas) para montar a agenda das ações."
      />
    )
  }

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Nenhuma coluna de data encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A tabela &quot;{activeDataset.sheetName}&quot; não tem colunas de data reconhecíveis para montar a agenda.
          </p>
        </CardContent>
      </Card>
    )
  }

  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 864e5)
  const upcoming = events.filter((e) => e.date >= now && e.date <= in30).length
  const thisMonth = events.filter(
    (e) => e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear(),
  ).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Prazos mapeados" value={String(events.length)} hint={active} icon={CalendarRange} />
        <KpiCard
          label="Próximos 30 dias"
          value={String(upcoming)}
          hint="a partir de hoje"
          icon={CalendarClock}
          accent="chart-3"
        />
        <KpiCard label="Neste mês" value={String(thisMonth)} hint={monthFmt.format(now)} icon={CalendarDays} accent="chart-2" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Cronograma agrupado por mês</p>
        {dates.length > 1 && (
          <Select value={active} onValueChange={(val) => val && setDateCol(val)}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d) => (
                <SelectItem key={d.name} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-5">
        {grouped.map(([key, evs]) => {
          const label = monthFmt.format(evs[0].date)
          return (
            <Card key={key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{label}</CardTitle>
                <CardDescription>
                  {evs.length} {evs.length === 1 ? "ação" : "ações"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {evs.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-md bg-accent py-1.5 text-accent-foreground">
                      <span className="font-mono text-sm font-semibold leading-none">{ev.date.getDate()}</span>
                      <span className="mt-0.5 text-[10px] uppercase">{dayFmt.format(ev.date).split(" ")[1]}</span>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{ev.title}</span>
                    <div className="hidden shrink-0 gap-1 sm:flex">
                      {ev.tags.map((t, j) => (
                        <Badge key={j} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
