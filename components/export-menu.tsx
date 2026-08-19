"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExportDialog } from "./export-dialog"

export interface ExportMenuProps {
  label?: string
  documentTitle?: string
  documentSubtitle?: string
  documentHash?: string
  itemCount?: number
  category?: string
  onPdf?: () => void | Promise<void>
  onExcel?: () => void | Promise<void>
  onCsv?: () => void | Promise<void>
  onDoc?: () => void | Promise<void>
  onJson?: () => void | Promise<void>
  onTxt?: () => void | Promise<void>
  onMarkdown?: () => void | Promise<void>
  onHtml?: () => void | Promise<void>
  onIcs?: () => void | Promise<void>
  buildText?: () => string
  buildHtmlPreview?: () => string
  buildJsonData?: () => unknown
  align?: "start" | "center" | "end"
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

/**
 * Botão "Exportar" que abre o Popup / Central de Exportação & Conversão de Documentos (estilo iLovePDF).
 * Permite ao usuário escolher entre PDF, Excel (.xlsx), CSV, Word (.doc), JSON, TXT, Markdown, HTML, iCal e Copiar.
 */
export function ExportMenu({
  label = "Exportar",
  documentTitle,
  documentSubtitle,
  documentHash,
  itemCount,
  category,
  onPdf,
  onExcel,
  onCsv,
  onDoc,
  onJson,
  onTxt,
  onMarkdown,
  onHtml,
  onIcs,
  buildText,
  buildHtmlPreview,
  buildJsonData,
  variant = "default",
  size = "sm",
  className,
}: ExportMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className={`gap-2 ${className ?? ""}`}
      >
        <Download className="size-4" />
        <span>{label}</span>
      </Button>

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        documentTitle={documentTitle || "Central de Exportação & Conversão"}
        documentSubtitle={documentSubtitle}
        documentHash={documentHash}
        itemCount={itemCount}
        category={category}
        onPdf={onPdf}
        onExcel={onExcel}
        onCsv={onCsv}
        onDoc={onDoc}
        onJson={onJson}
        onTxt={onTxt}
        onMarkdown={onMarkdown}
        onHtml={onHtml}
        onIcs={onIcs}
        buildText={buildText}
        buildHtmlPreview={buildHtmlPreview}
        buildJsonData={buildJsonData}
      />
    </>
  )
}
