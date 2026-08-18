"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, CircleDollarSign, Database, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
  aggregateOne,
  categoryColumns,
  dateColumns,
  formatCell,
  formatCompact,
  formatNumber,
  groupBy,
  measureValues,
  numericColumns,
  timeSeries,
} from "@/lib/data-engine"
import type { Aggregation } from "@/lib/types"

const COUNT = "__count__"
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

const AGG_LABELS: Record<Aggregation, string> = {
  sum: "Soma",
  avg: "Média",
  count: "Contagem",
  min: "Mínimo",
  max: "Máximo",
}

export function IndicadoresView() {
  const { activeDataset } = useDataStore()

  const cats = activeDataset ? categoryColumns(activeDataset) : []
  const nums = activeDataset ? numericColumns(activeDataset) : []
  const dates = activeDataset ? dateColumns(activeDataset) : []

  const dimensionOptions = [...cats, ...dates]

  const [dimension, setDimension] = useState<string>("")
  const [measure, setMeasure] = useState<string>("")
  const [agg, setAgg] = useState<Aggregation>("sum")

  const dim = dimension || dimensionOptions[0]?.name || ""
  const mea = measure || (nums[0]?.name ?? COUNT)
  const isCount = mea === COUNT

  const chartData = useMemo(() => {
    if (!activeDataset || !dim) return []
    return groupBy(activeDataset, dim, isCount ? null : mea, agg)
  }, [activeDataset, dim, mea, agg, isCount])

  const series = useMemo(() => {
    if (!activeDataset || dates.length === 0) return []
    return timeSeries(activeDataset, dates[0].name, isCount ? null : mea, agg)
  }, [activeDataset, dates, mea, agg, isCount])

  const kpis = useMemo(() => {
    if (!activeDataset) return null
    const primaryNum = nums[0]
    const vals = primaryNum ? measureValues(activeDataset, primaryNum.name) : []
    const secondNum = nums[1]
    const vals2 = secondNum ? measureValues(activeDataset, secondNum.name) : []
    return {
      rows: activeDataset.rowCount,
      primaryLabel: primaryNum?.name ?? "Medida",
      primarySum: aggregateOne(vals, "sum"),
      secondLabel: secondNum?.name ?? primaryNum?.name ?? "Média",
      secondAvg: secondNum ? aggregateOne(vals2, "avg") : aggregateOne(vals, "avg"),
      dimensions: cats.length,
    }
  }, [activeDataset, nums, cats])

  if (!activeDataset) {
    return (
      <EmptyState
        title="Nenhum dado para analisar ainda"
        description="Envie planilhas de ações, orçamentos ou matrículas para gerar indicadores automáticos de decisão."
      />
    )
  }

  const measureLabel = isCount ? "Nº de registros" : `${AGG_LABELS[agg]} de ${mea}`

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Registros" value={formatNumber(kpis!.rows)} hint="linhas na tabela" icon={Database} />
        <KpiCard
          label={kpis!.primaryLabel}
          value={formatCompact(kpis!.primarySum)}
          hint="soma total"
          icon={CircleDollarSign}
          accent="chart-2"
        />
        <KpiCard
          label={`Média · ${kpis!.secondLabel}`}
          value={formatCompact(kpis!.secondAvg)}
          hint="por registro"
          icon={Activity}
          accent="chart-3"
        />
        <KpiCard
          label="Dimensões"
          value={formatNumber(kpis!.dimensions)}
          hint="categorias disponíveis"
          icon={Layers}
          accent="chart-4"
        />
      </div>

      {/* Controles de análise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Análise dinâmica</CardTitle>
          <CardDescription>Combine dimensão, medida e agregação para investigar os dados.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Control label="Dimensão">
            <Select value={dim} onValueChange={(val) => val && setDimension(val)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dimensionOptions.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Control>
          <Control label="Medida">
            <Select value={mea} onValueChange={(val) => val && setMeasure(val)}>
              <SelectTrigger className="bg-background">
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
          </Control>
          <Control label="Agregação">
            <Select value={agg} onValueChange={(v) => setAgg(v as Aggregation)} disabled={isCount}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Soma</SelectItem>
                <SelectItem value="avg">Média</SelectItem>
                <SelectItem value="max">Máximo</SelectItem>
                <SelectItem value="min">Mínimo</SelectItem>
              </SelectContent>
            </Select>
          </Control>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{measureLabel} por {dim}</CardTitle>
            <CardDescription>Top {chartData.length} categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={64}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))}
                  width={48}
                />
                <Tooltip content={<ChartTooltip suffix={measureLabel} />} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Composição</CardTitle>
            <CardDescription>Participação por {dim}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData.slice(0, 6)}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {chartData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip suffix={measureLabel} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {chartData.slice(0, 6).map((d, i) => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
                  <span className="font-mono font-medium text-foreground">{formatCompact(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Série temporal */}
      {series.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução temporal</CardTitle>
            <CardDescription>
              {measureLabel} por mês · {dates[0].name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))}
                  width={48}
                />
                <Tooltip content={<ChartTooltip suffix={measureLabel} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Preview dos dados */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Amostra dos dados</CardTitle>
          <CardDescription>Primeiras 8 linhas de {activeDataset.sheetName}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {activeDataset.columns.map((c) => (
                  <TableHead key={c.name} className="whitespace-nowrap">
                    {c.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeDataset.rows.slice(0, 8).map((row, i) => (
                <TableRow key={i}>
                  {activeDataset.columns.map((c) => (
                    <TableCell key={c.name} className="whitespace-nowrap">
                      {formatCell(row[c.name])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  suffix,
}: {
  active?: boolean
  payload?: { payload: { label: string; value: number } }[]
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{p.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        {suffix}: <span className="font-mono font-medium text-foreground">{formatNumber(p.value)}</span>
      </p>
    </div>
  )
}
