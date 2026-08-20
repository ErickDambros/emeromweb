"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Send, Sparkles, X } from "lucide-react"
import { AssistantAvatarIcon } from "@/components/icons/assistant-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDataStore } from "./data-store"
import {
  queryAssistant,
  SUGGESTED_QUESTIONS,
  type AssistantMessage,
} from "@/lib/assistant-engine"

export function AssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const { sources, datasets, activeDataset } = useDataStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Olá! Eu sou o **Assistente RADAR**, a Central de Ajuda institucional da EMERON. Posso tirar dúvidas sobre a navegação no sistema ou consultar dados e prazos em tempo real das ações carregadas.",
      timestamp: Date.now(),
      category: "nav",
    },
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = (textToSend?: string) => {
    const rawText = (textToSend || input).trim()
    if (!rawText) return

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: rawText,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput("")

    // Resposta determinística imediata via motor de regras
    const result = queryAssistant(rawText, { sources, datasets, activeDataset })
    const assistantMsg: AssistantMessage = {
      id: `asst-${Date.now()}`,
      sender: "assistant",
      text: result.text,
      category: result.category,
      timestamp: Date.now() + 50,
    }

    setMessages((prev) => [...prev, assistantMsg])
  }

  return (
    <div
      id="assistant-drawer-root"
      className={`no-print fixed bottom-5 right-5 ${isOpen ? "z-50" : "z-40"}`}
    >
      {/* Painel do Chat */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Assistente RADAR Central de Ajuda"
          className="mb-3 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 sm:w-[420px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20 p-0.5 text-white">
                <AssistantAvatarIcon className="size-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold leading-none">Assistente RADAR</h2>
                  <Badge variant="secondary" className="h-4 bg-white/20 px-1.5 text-[9px] font-normal text-white">
                    Central de Ajuda
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-primary-foreground/80">FAQ & Consulta aos dados em memória</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="size-7 rounded-full text-primary-foreground hover:bg-white/20 hover:text-white"
              aria-label="Fechar Central de Ajuda"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs sm:text-sm">
            {messages.map((m) => {
              const isUser = m.sender === "user"
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <AssistantAvatarIcon className="size-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {renderFormattedText(m.text)}
                    </div>
                    <div
                      className={`mt-1 text-[9px] ${
                        isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Perguntas Sugeridas */}
          <div className="border-t border-border/70 bg-muted/30 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Perguntas sugeridas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sq)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground transition-colors hover:border-primary hover:bg-accent/40 hover:text-primary"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Input e Envio */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre o sistema ou dados..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim()}
              className="h-8 gap-1 px-3 text-xs"
              aria-label="Enviar pergunta"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Botão Flutuante Principal */}
      <button
        id="tutorial-assistant-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fechar Assistente RADAR" : "Abrir Assistente RADAR Central de Ajuda"}
        className="flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-2"
        title="Assistente RADAR · Central de Ajuda"
      >
        {isOpen ? <X className="size-6" /> : <AssistantAvatarIcon className="size-full" />}
      </button>
    </div>
  )
}

/** Renderiza markdown rico (negrito, itálico, código, listas e checklists) */
function renderFormattedText(text: string) {
  const lines = text.split("\n")
  return lines.map((line, lineIdx) => {
    // Linha vazia vira espaçamento entre parágrafos
    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />
    }

    // Linha de checklist: - [ ] ou - [x]
    if (/^(\s*-\s*\[([ xX])\]\s*)(.*)/.test(line)) {
      const match = line.match(/^(\s*-\s*\[([ xX])\]\s*)(.*)/)
      if (match) {
        const isChecked = match[2].toLowerCase() === "x"
        return (
          <div key={lineIdx} className="my-0.5 flex items-start gap-1.5 pl-1 text-xs">
            <span className={`font-mono text-xs ${isChecked ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}`}>
              {isChecked ? "☑" : "☐"}
            </span>
            <span className="flex-1">{formatInline(match[3])}</span>
          </div>
        )
      }
    }

    // Linha de item de lista: • ou - ou *
    if (/^(\s*[•\-\*]\s+)(.*)/.test(line)) {
      const match = line.match(/^(\s*[•\-\*]\s+)(.*)/)
      if (match) {
        return (
          <div key={lineIdx} className="my-0.5 flex items-start gap-1.5 pl-1">
            <span className="text-primary font-bold">•</span>
            <span className="flex-1">{formatInline(match[2])}</span>
          </div>
        )
      }
    }

    // Linha numerada: 1. ou 2.
    if (/^(\s*\d+\.\s+)(.*)/.test(line)) {
      const match = line.match(/^(\s*\d+\.\s+)(.*)/)
      if (match) {
        return (
          <div key={lineIdx} className="my-0.5 flex items-start gap-1.5 pl-1">
            <span className="font-semibold text-primary">{match[1]}</span>
            <span className="flex-1">{formatInline(match[2])}</span>
          </div>
        )
      }
    }

    return (
      <p key={lineIdx} className="my-0.5 leading-relaxed">
        {formatInline(line)}
      </p>
    )
  })
}

function formatInline(text: string) {
  // Split por code `...`, bold **...**, e italic *...*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((token, i) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary border border-border">
          {token.slice(1, -1)}
        </code>
      )
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={i} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      )
    }
    return token
  })
}
