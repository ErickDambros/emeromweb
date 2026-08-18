"use client"

import { BarChart3, CalendarDays, Database, FileText, ListChecks, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataStore } from "./data-store"

export type ViewKey = "indicadores" | "prioridades" | "agendas" | "relatorios" | "fontes" | "prontuario"

const NAV: { key: ViewKey; label: string; icon: typeof BarChart3; hint: string; id: string }[] = [
  { key: "indicadores", label: "Indicadores", icon: BarChart3, hint: "Decisões", id: "tutorial-nav-indicadores" },
  { key: "prioridades", label: "Prioridades", icon: ListChecks, hint: "Ranking", id: "tutorial-nav-prioridades" },
  { key: "agendas", label: "Agendas", icon: CalendarDays, hint: "Prazos", id: "tutorial-nav-agendas" },
  { key: "relatorios", label: "Relatórios", icon: FileText, hint: "PDF", id: "tutorial-nav-relatorios" },
  { key: "fontes", label: "Fontes de dados", icon: Database, hint: "Upload", id: "tutorial-nav-fontes" },
]

export function Sidebar({
  active,
  onChange,
}: {
  active: ViewKey
  onChange: (v: ViewKey) => void
}) {
  const { sources, datasets } = useDataStore()

  return (
    <aside className="no-print flex w-16 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:w-60">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-3 py-4 md:px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <School className="size-5" />
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold leading-tight">RADAR EMERON</p>
          <p className="truncate text-xs text-sidebar-foreground/60">Painel Institucional</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key || (active === "prontuario" && item.key === "prioridades")
          return (
            <button
              id={item.id}
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors md:px-3",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              title={item.label}
            >
              <Icon className="size-5 shrink-0" />
              <span className="hidden flex-1 text-left md:inline">{item.label}</span>
              <span
                className={cn(
                  "hidden rounded px-1.5 py-0.5 text-[10px] font-medium md:inline",
                  isActive ? "bg-sidebar-primary-foreground/20" : "bg-sidebar-accent text-sidebar-foreground/60",
                )}
              >
                {item.hint}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="hidden border-t border-sidebar-border p-4 md:block">
        <div className="rounded-md bg-sidebar-accent/60 p-3">
          <p className="text-xs font-medium text-sidebar-foreground/80">Fontes no Navegador</p>
          <p className="mt-1 font-mono text-lg font-semibold text-sidebar-foreground">
            {sources.length}
            <span className="ml-1 text-xs font-normal text-sidebar-foreground/50">
              · {datasets.length} {datasets.length === 1 ? "tabela" : "tabelas"}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-sidebar-foreground/60">Processamento 100% local</p>
        </div>
      </div>
    </aside>
  )
}
