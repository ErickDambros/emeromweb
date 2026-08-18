"use client"

import { useEffect, useState } from "react"
import { Info, X } from "lucide-react"
import { useDataStore } from "./data-store"
import { Sidebar, type ViewKey } from "./sidebar"
import { Topbar } from "./topbar"
import { AgendasView } from "./views/agendas-view"
import { FontesView } from "./views/fontes-view"
import { IndicadoresView } from "./views/indicadores-view"
import { PrioridadesView } from "./views/prioridades-view"
import { ProntuarioView } from "./views/prontuario-view"
import { RelatoriosView } from "./views/relatorios-view"
import { AssistantDrawer } from "./assistant-drawer"
import { AccessibilityMenu } from "./accessibility-menu"
import { OnboardingTutorial } from "./onboarding-tutorial"
import { getActionDossier } from "@/lib/sample-data"
import type { ActionDossier, CellValue } from "@/lib/types"

export function AppShell() {
  const [view, setView] = useState<ViewKey>("indicadores")
  const [activeDossier, setActiveDossier] = useState<ActionDossier | null>(null)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  const { lastNotes, activeDataset } = useDataStore()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (lastNotes.length > 0) setDismissed(false)
  }, [lastNotes])

  const showNotes = lastNotes.length > 0 && !dismissed

  const handleSelectAction = (row: Record<string, CellValue>, index: number) => {
    const dossier = getActionDossier(row, index)
    setActiveDossier(dossier)
    setView("prontuario")
  }

  const handleBackToPrioridades = () => {
    setView("prioridades")
  }

  const handleNavigateStep = (stepKey: "fontes" | "indicadores" | "prioridades" | "agendas" | "relatorios") => {
    setView(stepKey)
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar active={view} onChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          view={view}
          onStartTutorial={() => setIsTutorialOpen(true)}
        />

        {showNotes && (
          <div className="no-print flex items-start gap-2 border-b border-border bg-accent/50 px-4 py-2.5 text-sm text-accent-foreground md:px-6">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <ul className="flex-1 space-y-0.5">
              {lastNotes.map((n, i) => (
                <li key={i} className="text-pretty">
                  {n}
                </li>
              ))}
            </ul>
            <button onClick={() => setDismissed(true)} aria-label="Fechar aviso" className="shrink-0">
              <X className="size-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {view === "indicadores" && <IndicadoresView />}
          {view === "prioridades" && <PrioridadesView onSelectAction={handleSelectAction} />}
          {view === "agendas" && <AgendasView />}
          {view === "relatorios" && <RelatoriosView />}
          {view === "fontes" && <FontesView />}
          {view === "prontuario" && (
            activeDossier ? (
              <ProntuarioView dossier={activeDossier} onBack={handleBackToPrioridades} />
            ) : activeDataset?.rows[0] ? (
              <ProntuarioView
                dossier={getActionDossier(activeDataset.rows[0], 0)}
                onBack={handleBackToPrioridades}
              />
            ) : (
              <PrioridadesView onSelectAction={handleSelectAction} />
            )
          )}
        </main>
      </div>

      {/* Assistente RADAR (Central de Ajuda) */}
      <AssistantDrawer />

      {/* Menu de Acessibilidade Governamental (Canto direito no meio) */}
      <AccessibilityMenu />

      {/* Tutorial de Onboarding com Spotlight Interativo */}
      <OnboardingTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigateStep={handleNavigateStep}
      />
    </div>
  )
}
