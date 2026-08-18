"use client"

import { useCallback, useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const STORAGE_KEY = "radar_theme"

/**
 * Alternância discreta e elegante entre Modo Claro e Escuro.
 * - Persiste a escolha em localStorage ('radar_theme').
 * - Atalho de teclado: Alt + D.
 * - A classe .dark é aplicada em <html> (também via script inline no layout
 *   para evitar flash de conteúdo incorreto no primeiro carregamento).
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const apply = useCallback((dark: boolean) => {
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
    try {
      window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light")
    } catch {
      /* ambiente sem localStorage — silencioso */
    }
  }, [])

  const toggle = useCallback(() => {
    apply(!document.documentElement.classList.contains("dark"))
  }, [apply])

  // Atalho de teclado Alt + D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [toggle])

  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro"

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={label}
              aria-pressed={isDark}
              className="size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {mounted && isDark ? (
                <Sun className="size-[18px]" />
              ) : (
                <Moon className="size-[18px]" />
              )}
            </Button>
          }
        />
        <TooltipContent side="bottom">
          <span>{label}</span>
          <kbd
            data-slot="kbd"
            className="ml-1 rounded bg-background/20 px-1 py-0.5 font-mono text-[10px]"
          >
            Alt+D
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
