"use client"

import { BarChart3, CalendarDays, Database, FileText, ListChecks, School, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  mobileOpen = false,
  onMobileClose,
}: {
  active: ViewKey
  onChange: (v: ViewKey) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const { sources, datasets } = useDataStore()

  const handleSelect = (key: ViewKey) => {
    onChange(key)
    onMobileClose?.()
  }

  return (
    <>
      {/* Backdrop escurecido — apenas mobile quando o drawer está aberto */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out",
          "md:static md:z-auto md:w-60 md:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Navegação principal"
      >
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <School className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">RADAR EMERON</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Painel Institucional</p>
          </div>
          {/* Botão fechar — apenas mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="size-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key || (active === "prontuario" && item.key === "prioridades")
            return (
              <button
                id={item.id}
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={item.label}
              >
                <Icon className="size-5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    isActive ? "bg-sidebar-primary-foreground/20" : "bg-sidebar-accent text-sidebar-foreground/60",
                  )}
                >
                  {item.hint}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
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
    </>
  )
}
