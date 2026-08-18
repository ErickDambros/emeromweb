"use client"

import { Compass, Sparkles, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export function Topbar({
  view,
  onStartTutorial,
}: {
  view: ViewKey
  onStartTutorial?: () => void
}) {
  const { datasets, activeDataset, setActiveDatasetId, loadSample } = useDataStore()
  const meta = TITLES[view] || TITLES.indicadores

  return (
    <header className="no-print flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="min-w-0">
        <h1 className="text-balance text-lg font-semibold text-foreground md:text-xl">{meta.title}</h1>
        <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
            <span>Tutorial</span>
          </Button>
        )}

        {datasets.length > 0 ? (
          <div className="flex items-center gap-2">
            <Table2 className="size-4 text-muted-foreground" />
            <Select value={activeDataset?.id ?? undefined} onValueChange={(val) => val && setActiveDatasetId(val)}>
              <SelectTrigger className="w-[220px] bg-background">
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
    </header>
  )
}
