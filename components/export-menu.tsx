"use client"

import { useState } from "react"
import { Check, ClipboardCopy, Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copyToClipboard } from "@/lib/export-utils"

interface ExportMenuProps {
  onPdf: () => void
  onExcel: () => void
  /** Retorna o resumo textual a ser copiado para a área de transferência */
  buildText: () => string
  align?: "start" | "center" | "end"
  className?: string
}

/**
 * Botão único "Exportar" que abre um menu de opções na própria tela.
 * Toda a exportação ocorre 100% no cliente, sem redirecionamento externo.
 */
export function ExportMenu({ onPdf, onExcel, buildText, align = "end", className }: ExportMenuProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildText())
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className={`gap-2 ${className ?? ""}`}>
            <Download className="size-4" />
            Exportar
          </Button>
        }
      />
      <DropdownMenuContent align={align} className="w-72">
        <DropdownMenuLabel>Escolha o formato de exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onPdf} className="gap-2.5 py-2">
          <FileText className="size-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">PDF Oficial A4</span>
            <span className="text-[11px] text-muted-foreground">Cabeçalho TJ-RO, hash e divergências</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onExcel} className="gap-2.5 py-2">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Planilha Excel (.xlsx)</span>
            <span className="text-[11px] text-muted-foreground">Gerada no navegador com SheetJS</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            // Impede o fechamento imediato para o usuário ver o feedback
            e.preventDefault()
            handleCopy()
          }}
          className="gap-2.5 py-2"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4 text-accent" />}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{copied ? "Copiado!" : "Resumo Textual"}</span>
            <span className="text-[11px] text-muted-foreground">Copiar para colar em despachos no SEI</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
