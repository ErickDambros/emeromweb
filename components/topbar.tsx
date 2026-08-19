"use client"

import { useState } from "react"
import { Compass, Filter, Menu, Search, Sparkles, Table2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThemeToggle } from "./theme-toggle"
import { useDataStore } from "./data-store"
import type { ViewKey } from "./sidebar"

const TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  indicadores: { title: "Indicadores para Decisões", subtitle: "KPIs e análises dinâmicas das ações institucionais" },
  prioridades: { title: "Prioridades & Atenção", subtitle: "Matriz de relevância e criticidade com acesso ao Prontuário Vivo" },
  agendas: { title: "Agendas & Prazos", subtitle: "Cronograma mensal e acompanhamento de vencimentos" },
  relatorios: { title: "Relatórios Institucionais", subtitle: "Geração e exportação oficial em PDF" },
  fontes: { title: "Fontes de Dados", subtitle: "Unifique planilhas e documentos institucionais" },
  prontuario: { title: "Prontuário Vivo da Ação", subtitle: "Dossiê individual, checklist de documentos e detecção de divergências" },
}

const ALL = "__all__"

export function Topbar({
  view,
  onStartTutorial,
  onOpenMenu,
}: {
  view: ViewKey
  onStartTutorial?: () => void
  onOpenMenu?: () => void
}) {
  const {
    datasets,
    activeDataset,
    setActiveDatasetId,
    loadSample,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    filterOptions,
    filteredCount,
    totalCount,
  } = useDataStore()
  const meta = TITLES[view] || TITLES.indicadores

  const [showFilters, setShowFilters] = useState(false)

  return (
    <header className="no-print border-b border-border bg-card">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Botão Hambúrguer — apenas mobile */}
          {onOpenMenu && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenMenu}
              aria-label="Abrir menu de navegação"
              className="size-9 shrink-0 md:hidden"
            >
              <Menu className="size-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-balance text-lg font-semibold text-foreground md:text-xl">{meta.title}</h1>
            <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />

          <Button
            variant={showFilters || hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-1.5"
            aria-expanded={showFilters}
            title="Busca e filtros globais"
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                {filteredCount}
              </Badge>
            )}
          </Button>

          {onStartTutorial && (
            <Button
              id="tutorial-btn-topbar"
              variant="outline"
              size="sm"
              onClick={onStartTutorial}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              title="Iniciar tutorial guiado"
            >
              <Compass className="size-4" />
              <span className="hidden sm:inline">Tutorial</span>
            </Button>
          )}

          {datasets.length > 0 ? (
            <div className="flex items-center gap-2">
              <Table2 className="hidden size-4 text-muted-foreground sm:block" />
              <Select value={activeDataset?.id ?? undefined} onValueChange={(val) => val && setActiveDatasetId(val)}>
                <SelectTrigger className="w-[160px] bg-background sm:w-[220px]">
                  <SelectValue placeholder="Selecione uma tabela" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.sheetName} · {d.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button
              id="tutorial-btn-sample"
              variant="default"
              size="sm"
              onClick={loadSample}
              className="gap-1.5"
            >
              <Sparkles className="size-4" />
              Ver dados de exemplo
            </Button>
          )}
        </div>
      </div>

      {/* Barra retrátil de Busca & Filtros Globais */}
      {showFilters && (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-3 md:flex-row md:flex-wrap md:items-end md:px-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 md:min-w-[240px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Busca livre</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Buscar por ação, código, responsável..."
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <FilterSelect
            label="Setor"
            value={filters.setor}
            options={filterOptions.setores}
            onChange={(v) => setFilters({ setor: v })}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={filterOptions.status}
            onChange={(v) => setFilters({ status: v })}
          />
          <FilterSelect
            label="Prioridade"
            value={filters.prioridade}
            options={filterOptions.prioridades}
            onChange={(v) => setFilters({ prioridade: v })}
          />

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Exibindo <strong className="font-mono text-foreground">{filteredCount}</strong> de{" "}
              <strong className="font-mono text-foreground">{totalCount}</strong>
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 px-2 text-xs">
                <X className="size-3.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="min-w-[150px]">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Select
        value={value || ALL}
        onValueChange={(v) => onChange(!v || v === ALL ? "" : v)}
        disabled={options.length === 0}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder={`Todos`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
