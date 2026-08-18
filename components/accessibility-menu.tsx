"use client"

import { useEffect, useState } from "react"
import {
  Eye,
  RotateCcw,
  Sun,
  X,
} from "lucide-react"
import { UniversalAccessIcon } from "@/components/icons/universal-access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FontSizeOption = "sm" | "md" | "lg" | "xl"

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<FontSizeOption>("md")

  // Aplica tamanho de fonte no <html>
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("font-size-sm", "font-size-md", "font-size-lg", "font-size-xl")
    root.classList.add(`font-size-${fontSize}`)
  }, [fontSize])

  // Aplica Alto Contraste no <html>
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }
  }, [highContrast])

  const resetAll = () => {
    setHighContrast(false)
    setFontSize("md")
  }

  return (
    <div className="no-print fixed right-3.5 top-[38%] z-40 -translate-y-1/2">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Menu de Acessibilidade Governamental"
          className="absolute right-0 top-full mt-2 w-76 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all animate-in fade-in slide-in-from-right-4 sm:w-80"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <UniversalAccessIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Acessibilidade
              </span>
              <Badge variant="outline" className="text-[9px] font-normal">
                e-MAG / CNJ
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="size-6 text-muted-foreground hover:text-foreground"
              aria-label="Fechar menu de acessibilidade"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Opções */}
          <div className="space-y-4 p-4 text-xs">
            {/* Alto Contraste */}
            <div className="space-y-1.5">
              <span className="font-medium text-foreground">Contraste de Cores:</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!highContrast ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setHighContrast(false)}
                  className="h-8 justify-start gap-1.5 text-xs font-normal"
                >
                  <Sun className="size-3.5" />
                  Padrão
                </Button>
                <Button
                  variant={highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHighContrast(true)}
                  className="h-8 justify-start gap-1.5 text-xs font-normal"
                >
                  <Eye className="size-3.5" />
                  Alto Contraste
                </Button>
              </div>
            </div>

            {/* Tamanho da Fonte */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Tamanho da Fonte:</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {fontSize === "sm" ? "Pequeno (90%)" : fontSize === "md" ? "Padrão (100%)" : fontSize === "lg" ? "Grande (115%)" : "Extra (130%)"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  variant={fontSize === "sm" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize("sm")}
                  className="h-8 text-xs font-medium"
                  title="Fonte pequena"
                >
                  A-
                </Button>
                <Button
                  variant={fontSize === "md" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize("md")}
                  className="h-8 text-xs font-bold"
                  title="Fonte normal"
                >
                  A
                </Button>
                <Button
                  variant={fontSize === "lg" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize("lg")}
                  className="h-8 text-sm font-bold"
                  title="Fonte grande"
                >
                  A+
                </Button>
                <Button
                  variant={fontSize === "xl" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize("xl")}
                  className="h-8 text-base font-extrabold"
                  title="Fonte extra grande"
                >
                  A++
                </Button>
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-end border-t border-border/70 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Restaurar padrões
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante de Acessibilidade */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fechar Menu de Acessibilidade" : "Abrir Menu de Acessibilidade (Alto Contraste, Tamanho da Fonte)"}
        className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all hover:scale-105 hover:border-primary hover:text-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        title="Menu de Acessibilidade (Alto Contraste, Fonte)"
      >
        <UniversalAccessIcon className="size-6" />
      </button>
    </div>
  )
}
