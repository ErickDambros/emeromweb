"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  HelpCircle,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface OnboardingTutorialProps {
  isOpen: boolean
  onClose: () => void
  onNavigateStep?: (stepKey: "fontes" | "indicadores" | "prioridades" | "agendas" | "relatorios") => void
}

interface SpotlightStep {
  targetId: string
  title: string
  instruction: string
  hint: string
  icon: typeof Database
  viewKey?: "fontes" | "indicadores" | "prioridades" | "agendas" | "relatorios"
  preferredPlacement?: "right" | "bottom" | "top" | "left"
  /** Passos cujo alvo deve permanecer 100% livre para uso real (upload de arquivo, chatbot) */
  freeInteraction?: boolean
}

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    targetId: "tutorial-nav-fontes",
    title: "1. Fontes de Dados (Upload Universal)",
    instruction:
      "Comece por aqui: clique em Fontes de Dados para unificar planilhas Excel (.xlsx, .csv), documentos PDF e Word (.docx). O processamento acontece 100% no seu navegador.",
    hint: "Dica: clique diretamente no botão iluminado ou em 'Próximo'.",
    icon: Database,
    viewKey: "fontes",
    preferredPlacement: "right",
  },
  {
    targetId: "tutorial-upload-zone",
    title: "2. Ingestão & Amostra Oficial",
    instruction:
      "Arraste seus arquivos para esta área ou utilize o botão 'Ver dados de exemplo' no topo para carregar a base de demonstração da EMERON. Você pode testar o envio de um arquivo livremente agora.",
    hint: "Planilhas, PDFs e documentos Word são anexados e estruturados instantaneamente.",
    icon: Sparkles,
    viewKey: "fontes",
    preferredPlacement: "bottom",
    freeInteraction: true,
  },
  {
    targetId: "tutorial-nav-indicadores",
    title: "3. Indicadores para Decisões",
    instruction:
      "Acesse o painel analítico com KPIs consolidados, gráficos dinâmicos de barras, rosca e séries temporais com filtros configuráveis.",
    hint: "Transforme dados dispersos em visões estratégicas para os gestores.",
    icon: BarChart3,
    viewKey: "indicadores",
    preferredPlacement: "right",
  },
  {
    targetId: "tutorial-nav-prioridades",
    title: "4. Prioridades & Prontuário Vivo",
    instruction:
      "Acompanhe o ranking de criticidade das ações institucionais e clique em qualquer item da fila para abrir o Dossiê/Prontuário individual com checklist e divergências.",
    hint: "Gerencie o caso individual com código canônico unificado e exportação em PDF.",
    icon: ListChecks,
    viewKey: "prioridades",
    preferredPlacement: "right",
  },
  {
    targetId: "tutorial-assistant-trigger",
    title: "5. Assistente RADAR (Central de Ajuda)",
    instruction:
      "Ficou com alguma dúvida? Clique neste botão no canto inferior direito para tirar dúvidas sobre o sistema e consultar métricas em tempo real. Funciona 100% offline! Você pode abrir e usar o chat livremente agora.",
    hint: "Central de Ajuda determinística e instantânea, sem menção a IA.",
    icon: HelpCircle,
    preferredPlacement: "left",
    freeInteraction: true,
  },
]

export function OnboardingTutorial({ isOpen, onClose, onNavigateStep }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = SPOTLIGHT_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === SPOTLIGHT_STEPS.length - 1

  // Ref para o listener de bloqueio ler o alvo ativo sem recriar listeners desnecessariamente
  const activeTargetIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeTargetIdRef.current = step?.targetId ?? null
  }, [step])

  // Atualiza posição do elemento alvo e rola a tela se necessário
  useEffect(() => {
    if (!isOpen || !step) return

    // Se o passo requer navegação de tela prévia, realiza a transição
    if (step.viewKey && onNavigateStep) {
      onNavigateStep(step.viewKey)
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId)
      if (el) {
        // Rola suavemente o elemento para a área visível se estiver fora da tela
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
        setTargetRect(el.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    const timer1 = setTimeout(updateRect, 80)
    const timer2 = setTimeout(updateRect, 240)
    window.addEventListener("resize", updateRect)
    window.addEventListener("scroll", updateRect, true)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener("resize", updateRect)
      window.removeEventListener("scroll", updateRect, true)
    }
  }, [isOpen, currentStep, step, onNavigateStep])

  // Avança automaticamente quando o usuário clica no elemento real destacado (exceto nos passos livres)
  useEffect(() => {
    if (!isOpen || !step || step.freeInteraction) return
    const timer = setTimeout(() => {
      const el = document.getElementById(step.targetId)
      if (!el) return
      const onTargetClick = () => setCurrentStep((s) => Math.min(s + 1, SPOTLIGHT_STEPS.length - 1))
      el.addEventListener("click", onTargetClick)
      ;(el as HTMLElement & { __tutorialCleanup?: () => void }).__tutorialCleanup = () =>
        el.removeEventListener("click", onTargetClick)
    }, 220)

    return () => {
      clearTimeout(timer)
      const el = document.getElementById(step.targetId) as (HTMLElement & { __tutorialCleanup?: () => void }) | null
      el?.__tutorialCleanup?.()
    }
  }, [isOpen, currentStep, step])

  // Bloqueia rigorosamente a interação com o resto do site enquanto o tutorial está aberto.
  // Permite interação APENAS com o card do tutorial, o alvo iluminado e as áreas livres (upload e chat).
  useEffect(() => {
    if (!isOpen) return

    const FREE_SELECTORS = ["#tutorial-upload-zone", "#assistant-drawer-root"]

    const guard = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest("[data-tutorial-card]")) return
      if (FREE_SELECTORS.some((sel) => target.closest(sel))) return
      const activeId = activeTargetIdRef.current
      if (activeId && target.closest(`#${CSS.escape(activeId)}`)) return

      // Bloqueia e impede propagação de qualquer outro clique ou tecla fora do tutorial
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener("click", guard, true)
    document.addEventListener("pointerdown", guard, true)
    document.addEventListener("mousedown", guard, true)
    document.addEventListener("touchstart", guard, true)
    document.addEventListener("keydown", guard, true)

    return () => {
      document.removeEventListener("click", guard, true)
      document.removeEventListener("pointerdown", guard, true)
      document.removeEventListener("mousedown", guard, true)
      document.removeEventListener("touchstart", guard, true)
      document.removeEventListener("keydown", guard, true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNext = () => {
    if (isLast) {
      onClose()
      setCurrentStep(0)
    } else {
      const next = currentStep + 1
      setCurrentStep(next)
      if (SPOTLIGHT_STEPS[next].viewKey && onNavigateStep) {
        onNavigateStep(SPOTLIGHT_STEPS[next].viewKey!)
      }
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      const prev = currentStep - 1
      setCurrentStep(prev)
      if (SPOTLIGHT_STEPS[prev].viewKey && onNavigateStep) {
        onNavigateStep(SPOTLIGHT_STEPS[prev].viewKey!)
      }
    }
  }

  const Icon = step.icon

  // Dimensões do recorte iluminado
  const padding = 8
  const cutTop = targetRect ? Math.max(0, targetRect.top - padding) : 0
  const cutLeft = targetRect ? Math.max(0, targetRect.left - padding) : 0
  const cutWidth = targetRect ? targetRect.width + padding * 2 : 0
  const cutHeight = targetRect ? targetRect.height + padding * 2 : 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-step-title"
      className="pointer-events-none fixed inset-0 z-60 overflow-hidden font-sans"
    >
      {/* Fundo escuro com recorte iluminado */}
      {targetRect ? (
        <div
          style={{
            top: `${cutTop}px`,
            left: `${cutLeft}px`,
            width: `${cutWidth}px`,
            height: `${cutHeight}px`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
          }}
          className="pointer-events-none fixed z-50 rounded-xl border-2 border-primary ring-4 ring-primary/50 shadow-[0_0_35px_rgba(46,118,170,0.85)] transition-all duration-200"
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-50 bg-black/75 backdrop-blur-xs" />
      )}

      {/* Card Flutuante de Instrução com layout à prova de cortes */}
      <div
        className="pointer-events-auto fixed z-60 max-w-md animate-in fade-in zoom-in-95 duration-200"
        style={getCardPosition(targetRect, step.preferredPlacement)}
      >
        <div
          data-tutorial-card
          className="flex max-h-[min(480px,calc(100vh-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-md"
        >
          {/* Header Fixo */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-card px-5 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </div>
              <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
                Passo {currentStep + 1} de {SPOTLIGHT_STEPS.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label="Pular tutorial"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Conteúdo com rolagem interna independente */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-3">
            <h3 id="tutorial-step-title" className="text-sm font-bold text-foreground sm:text-base">
              {step.title}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{step.instruction}</p>
            <p className="text-[11px] font-medium text-primary">{step.hint}</p>
          </div>

          {/* Barra de Ações Fixa e Pinned — NUNCA sai da tela */}
          <div className="flex shrink-0 items-center justify-between border-t border-border/70 bg-card/95 px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Pular
            </Button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 gap-1 px-3 text-xs">
                  <ArrowLeft className="size-3.5" />
                  Anterior
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="h-8 gap-1.5 px-3.5 text-xs font-semibold">
                {isLast ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Calcula a melhor posição na tela para o Card de instrução com delimitação estrita de viewport */
function getCardPosition(rect: DOMRect | null, preferred = "right"): React.CSSProperties {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // Em telas pequenas (mobile), ancoragem estrita no rodapé
  if (isMobile) {
    return {
      bottom: "1rem",
      left: "1rem",
      right: "1rem",
      width: "calc(100vw - 2rem)",
      maxWidth: "calc(100vw - 2rem)",
    }
  }

  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "400px",
    }
  }

  const cardWidth = 380
  const cardHeight = 260
  const winW = typeof window !== "undefined" ? window.innerWidth : 1200
  const winH = typeof window !== "undefined" ? window.innerHeight : 800

  const maxTop = Math.max(16, winH - cardHeight - 24)
  const maxLeft = Math.max(16, winW - cardWidth - 24)

  const spaceRight = winW - rect.right
  const spaceLeft = rect.left
  const spaceBottom = winH - rect.bottom
  const spaceTop = rect.top

  // 1. Preferência Direita
  if (preferred === "right" && spaceRight >= cardWidth + 24) {
    return {
      top: Math.max(16, Math.min(rect.top - 10, maxTop)),
      left: Math.min(rect.right + 20, maxLeft),
      width: `${cardWidth}px`,
    }
  }

  // 2. Preferência Esquerda
  if (preferred === "left" && spaceLeft >= cardWidth + 24) {
    return {
      top: Math.max(16, Math.min(rect.top - 10, maxTop)),
      left: Math.max(16, rect.left - cardWidth - 20),
      width: `${cardWidth}px`,
    }
  }

  // 3. Preferência Abaixo
  if (preferred === "bottom" && spaceBottom >= cardHeight + 24) {
    return {
      top: Math.min(rect.bottom + 16, maxTop),
      left: Math.max(16, Math.min(rect.left, maxLeft)),
      width: `${cardWidth}px`,
    }
  }

  // 4. Preferência Acima
  if (spaceTop >= cardHeight + 24) {
    return {
      top: Math.max(16, rect.top - cardHeight - 16),
      left: Math.max(16, Math.min(rect.left, maxLeft)),
      width: `${cardWidth}px`,
    }
  }

  // Se cabe à direita em fallback
  if (spaceRight >= cardWidth + 20) {
    return {
      top: Math.max(16, Math.min(rect.top, maxTop)),
      left: Math.min(rect.right + 16, maxLeft),
      width: `${cardWidth}px`,
    }
  }

  // Se cabe abaixo em fallback
  if (spaceBottom >= cardHeight + 20) {
    return {
      top: Math.min(rect.bottom + 16, maxTop),
      left: Math.max(16, Math.min(rect.left, maxLeft)),
      width: `${cardWidth}px`,
    }
  }

  // Centro da tela com garantia de não cortar
  return {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "400px",
  }
}
