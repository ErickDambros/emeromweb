"use client"

import { useEffect, useState } from "react"
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
}

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    targetId: "tutorial-nav-fontes",
    title: "1. Fontes de Dados (Upload Universal)",
    instruction:
      "Comece por aqui: clique em Fontes de Dados para unificar planilhas Excel (.xlsx, .csv) e processos em PDF. O processamento acontece 100% no seu navegador.",
    hint: "Dica: clique diretamente no botão iluminado ou em 'Próximo'.",
    icon: Database,
    viewKey: "fontes",
    preferredPlacement: "right",
  },
  {
    targetId: "tutorial-upload-zone",
    title: "2. Ingestão & Amostra Oficial",
    instruction:
      "Arraste seus arquivos para esta área ou utilize o botão 'Ver dados de exemplo' no topo para carregar a base de demonstração da EMERON.",
    hint: "Planilhas e PDFs são analisados e estruturados instantaneamente.",
    icon: Sparkles,
    viewKey: "fontes",
    preferredPlacement: "bottom",
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
      "Ficou com alguma dúvida? Clique neste botão no canto inferior direito para tirar dúvidas sobre o sistema e consultar métricas em tempo real. Funciona 100% offline!",
    hint: "Central de Ajuda determinística e instantânea, sem menção a IA.",
    icon: HelpCircle,
    preferredPlacement: "left",
  },
]

export function OnboardingTutorial({ isOpen, onClose, onNavigateStep }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = SPOTLIGHT_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === SPOTLIGHT_STEPS.length - 1

  // Atualiza posição do elemento alvo
  useEffect(() => {
    if (!isOpen || !step) return

    // Se o passo requer navegação de tela prévia, realiza a transição
    if (step.viewKey && onNavigateStep) {
      onNavigateStep(step.viewKey)
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId)
      if (el) {
        setTargetRect(el.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    // Aguarda renderização da view para calcular as coordenadas exatas
    const timer1 = setTimeout(updateRect, 60)
    const timer2 = setTimeout(updateRect, 200)
    window.addEventListener("resize", updateRect)
    window.addEventListener("scroll", updateRect)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener("resize", updateRect)
      window.removeEventListener("scroll", updateRect)
    }
  }, [isOpen, currentStep, step, onNavigateStep])

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

  const handleHighlightClick = () => {
    const el = document.getElementById(step.targetId)
    if (el) {
      el.click()
    }
    handleNext()
  }

  const Icon = step.icon

  // Dimensões do recorte iluminado
  const padding = 8
  const cutTop = targetRect ? Math.max(0, targetRect.top - padding) : 0
  const cutLeft = targetRect ? Math.max(0, targetRect.left - padding) : 0
  const cutWidth = targetRect ? targetRect.width + padding * 2 : 0
  const cutHeight = targetRect ? targetRect.height + padding * 2 : 0
  const cutBottom = cutTop + cutHeight
  const cutRight = cutLeft + cutWidth

  // Bloqueio de cliques externos
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-step-title"
      className="fixed inset-0 z-50 overflow-hidden font-sans"
    >
      {/* 4 Painéis de Fundo Escuro que bloqueiam qualquer clique fora e deixam o alvo 100% claro */}
      {targetRect ? (
        <>
          {/* Painel Superior */}
          <div
            onClick={handleBackdropClick}
            style={{ top: 0, left: 0, right: 0, height: `${cutTop}px` }}
            className="fixed z-40 bg-black/75 backdrop-blur-xs transition-all duration-200"
          />
          {/* Painel Inferior */}
          <div
            onClick={handleBackdropClick}
            style={{ top: `${cutBottom}px`, left: 0, right: 0, bottom: 0 }}
            className="fixed z-40 bg-black/75 backdrop-blur-xs transition-all duration-200"
          />
          {/* Painel Esquerdo */}
          <div
            onClick={handleBackdropClick}
            style={{ top: `${cutTop}px`, left: 0, width: `${cutLeft}px`, height: `${cutHeight}px` }}
            className="fixed z-40 bg-black/75 backdrop-blur-xs transition-all duration-200"
          />
          {/* Painel Direito */}
          <div
            onClick={handleBackdropClick}
            style={{ top: `${cutTop}px`, left: `${cutRight}px`, right: 0, height: `${cutHeight}px` }}
            className="fixed z-40 bg-black/75 backdrop-blur-xs transition-all duration-200"
          />

          {/* Anel luminoso interativo sobre o elemento destacado (Totalmente Claro e Clicável) */}
          <div
            onClick={handleHighlightClick}
            style={{
              top: `${cutTop}px`,
              left: `${cutLeft}px`,
              width: `${cutWidth}px`,
              height: `${cutHeight}px`,
            }}
            className="fixed z-50 cursor-pointer rounded-xl border-2 border-primary ring-4 ring-primary/50 shadow-[0_0_35px_rgba(46,118,170,0.85)] transition-all duration-200 hover:ring-primary focus:outline-none"
            title="Clique aqui para acionar e avançar"
          />
        </>
      ) : (
        /* Fallback Backdrop se o elemento não for localizado na tela */
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
        />
      )}

      {/* Card Flutuante de Instrução (Moderno & Conciso) */}
      <div
        className="pointer-events-auto fixed z-50 max-w-md animate-in fade-in zoom-in-95 duration-200"
        style={getCardPosition(targetRect, step.preferredPlacement)}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
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
              className="size-6 text-muted-foreground hover:text-foreground"
              aria-label="Pular tutorial"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Título & Instrução */}
          <div className="mt-3 space-y-2">
            <h3 id="tutorial-step-title" className="text-sm font-bold text-foreground sm:text-base">
              {step.title}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{step.instruction}</p>
            <p className="text-[11px] font-medium text-primary">{step.hint}</p>
          </div>

          {/* Barra de Ações */}
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Pular
            </Button>

            <div className="flex items-center gap-1.5">
              {!isFirst && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="h-7 gap-1 px-2.5 text-xs">
                  <ArrowLeft className="size-3" />
                  Anterior
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="h-7 gap-1 px-3 text-xs">
                {isLast ? (
                  <>
                    <CheckCircle2 className="size-3" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="size-3" />
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

/** Calcula a melhor posição na tela para o Card de instrução */
function getCardPosition(rect: DOMRect | null, preferred = "right"): React.CSSProperties {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "420px",
    }
  }

  const cardWidth = 380
  const cardHeight = 220
  const spaceRight = window.innerWidth - rect.right
  const spaceLeft = rect.left
  const spaceBottom = window.innerHeight - rect.bottom
  const spaceTop = rect.top

  // Se cabe à direita
  if (preferred === "right" && spaceRight >= cardWidth + 24) {
    return {
      top: Math.max(16, Math.min(rect.top - 10, window.innerHeight - cardHeight - 24)),
      left: rect.right + 20,
      width: `${cardWidth}px`,
    }
  }

  // Se cabe à esquerda
  if (preferred === "left" && spaceLeft >= cardWidth + 24) {
    return {
      top: Math.max(16, Math.min(rect.top - 10, window.innerHeight - cardHeight - 24)),
      left: rect.left - cardWidth - 20,
      width: `${cardWidth}px`,
    }
  }

  // Se cabe abaixo
  if (spaceBottom >= cardHeight + 24) {
    return {
      top: rect.bottom + 20,
      left: Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 24)),
      width: `${cardWidth}px`,
    }
  }

  // Se cabe acima
  if (spaceTop >= cardHeight + 24) {
    return {
      top: Math.max(16, rect.top - cardHeight - 20),
      left: Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 24)),
      width: `${cardWidth}px`,
    }
  }

  // Centro da tela se nenhum lado tiver espaço suficiente
  return {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "400px",
  }
}
