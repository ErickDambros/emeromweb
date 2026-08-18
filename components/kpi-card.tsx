import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "primary",
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  accent?: "primary" | "chart-2" | "chart-3" | "chart-4"
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    "chart-2": "bg-chart-2/10 text-chart-2",
    "chart-3": "bg-chart-3/10 text-chart-3",
    "chart-4": "bg-chart-4/10 text-chart-4",
  }[accent]

  return (
    <Card className="flex flex-row items-center gap-4 p-4">
      {Icon && (
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", accentClass)}>
          <Icon className="size-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}
