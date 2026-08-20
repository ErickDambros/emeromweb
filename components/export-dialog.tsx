"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Code2,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  Printer,
  ShieldCheck,
  Sparkles,
  X as XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { copyToClipboard } from "@/lib/export-utils"
import { cn } from "@/lib/utils"

export interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  documentTitle: string
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
}

interface FormatCard {
  id: string
  title: string
  ext: string
  description: string
  category: "doc" | "data" | "text"
  badges: string[]
  icon: typeof FileText
  iconColor: string
  iconBg: string
  actionLabel: string
  onAction?: () => void | Promise<void>
  isCopy?: boolean
}

export function ExportDialog({
  isOpen,
  onClose,
  documentTitle,
  documentSubtitle,
  documentHash,
  itemCount,
  category = "Institucional",
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
}: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"formats" | "preview" | "code" | "options">("formats")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  // Modo de seleção — permite escolher quais formatos baixar antes de confirmar
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Opções customizáveis de exportação
  const [includeHeader, setIncludeHeader] = useState(true)
  const [includeHash, setIncludeHash] = useState(true)
  const [includeTimestamp, setIncludeTimestamp] = useState(true)

  const handleAction = async (id: string, action?: () => void | Promise<void>, isCopy = false) => {
    if (isCopy && buildText) {
      const ok = await copyToClipboard(buildText())
      if (ok) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2500)
      }
      return
    }

    if (action) {
      try {
        await action()
        setDownloadSuccess(id)
        setTimeout(() => setDownloadSuccess(null), 3000)
      } catch (err) {
        console.error("Erro na ação de exportação:", err)
      }
    }
  }

  const toggleSelectionMode = () => {
    setActiveTab("formats")
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(formats.map((f) => f.id)))

  // Baixa apenas os formatos marcados no modo de seleção
  const handleDownloadSelection = async () => {
    try {
      for (const fmt of formats) {
        if (!selectedIds.has(fmt.id)) continue
        if (fmt.isCopy && buildText) {
          await copyToClipboard(buildText())
        } else if (fmt.onAction) {
          await fmt.onAction()
        }
      }
      setDownloadSuccess("selection")
      setTimeout(() => setDownloadSuccess(null), 4000)
      setSelectionMode(false)
      setSelectedIds(new Set())
    } catch (err) {
      console.error("Erro ao baixar seleção:", err)
    }
  }

  const formats: FormatCard[] = useMemo(() => {
    const list: FormatCard[] = []

    if (onPdf) {
      list.push({
        id: "pdf",
        title: "PDF Oficial A4 (Impressão & Portaria)",
        ext: ".pdf",
        description: "Layout A4 formatado com cabeçalho oficial do TJ-RO, carimbo de data, gráficos SVG e hash de autenticidade.",
        category: "doc",
        badges: ["Oficial TJ-RO", "A4 Padronizado", "Gráficos SVG", "Diálogo de Impressão"],
        icon: Printer,
        iconColor: "text-chart-4",
        iconBg: "bg-chart-4/10 border-chart-4/20",
        actionLabel: "Imprimir / Salvar PDF",
        onAction: onPdf,
      })
    }

    if (onDoc) {
      list.push({
        id: "docx",
        title: "Documento Word Oficial (.docx)",
        ext: ".docx",
        description: "Documento DOCX nativo do Microsoft Word e LibreOffice com tabelas sombreadas, KPIs e formatação institucional.",
        category: "doc",
        badges: ["DOCX Nativo", "MS Word & LibreOffice", "Tabelas Sombreadas"],
        icon: FileText,
        iconColor: "text-primary",
        iconBg: "bg-primary/10 border-primary/20",
        actionLabel: "Baixar Documento .docx",
        onAction: onDoc,
      })
    }

    if (onExcel) {
      list.push({
        id: "xlsx",
        title: "Planilha Microsoft Excel Estilizada",
        ext: ".xlsx",
        description: "Planilha binária gerada com ExcelJS com banners azul-marinho, alinhamentos, bordas, formatação de moeda R$ e abas.",
        category: "data",
        badges: ["ExcelJS", "Banners TJ-RO", "Bordas & Cores", "Moeda R$"],
        icon: FileSpreadsheet,
        iconColor: "text-chart-3",
        iconBg: "bg-chart-3/10 border-chart-3/20",
        actionLabel: "Baixar Planilha .xlsx",
        onAction: onExcel,
      })
    }    if (onCsv) {
      list.push({
        id: "csv",
        title: "Arquivo CSV Padronizado",
        ext: ".csv",
        description: "Arquivo delimitado por ponto-e-vírgula com BOM UTF-8 para abrir no Excel pt-BR sem corromper acentos.",
        category: "data",
        badges: ["UTF-8 com BOM", "Delimitador ;", "Compatível pt-BR"],
        icon: FileCode,
        iconColor: "text-chart-2",
        iconBg: "bg-chart-2/10 border-chart-2/20",
        actionLabel: "Baixar Arquivo .csv",
        onAction: onCsv,
      })
    }

    if (onJson) {
      list.push({
        id: "json",
        title: "Dados Estruturados JSON",
        ext: ".json",
        description: "Objeto JSON completo formatado com metadados institucionais para APIs e integrações.",
        category: "data",
        badges: ["JSON Schema", "Auditoria", "API Ready"],
        icon: Code2,
        iconColor: "text-chart-5",
        iconBg: "bg-chart-5/10 border-chart-5/20",
        actionLabel: "Baixar Dados .json",
        onAction: onJson,
      })
    }

    if (onHtml) {
      list.push({
        id: "html",
        title: "Página Web Autônoma Offline",
        ext: ".html",
        description: "Arquivo HTML completo autocontido com estilos embutidos, pronto para visualização offline ou e-mail.",
        category: "doc",
        badges: ["Autocontido", "Visualização Offline", "HTML5"],
        icon: Globe,
        iconColor: "text-primary",
        iconBg: "bg-primary/10 border-primary/20",
        actionLabel: "Baixar Página .html",
        onAction: onHtml,
      })
    }

    if (onIcs) {
      list.push({
        id: "ics",
        title: "Calendário iCal (Outlook / Google)",
        ext: ".ics",
        description: "Pacote de eventos com datas, horários e alertas para importar em agendas institucionais.",
        category: "data",
        badges: ["RFC 5545", "Outlook & Google", "Apple Calendar"],
        icon: Calendar,
        iconColor: "text-chart-2",
        iconBg: "bg-chart-2/10 border-chart-2/20",
        actionLabel: "Baixar Calendário .ics",
        onAction: onIcs,
      })
    }

    if (onMarkdown) {
      list.push({
        id: "md",
        title: "Nota Técnica em Markdown",
        ext: ".md",
        description: "Documento formatado em Markdown com tabelas e checklist para despachos no SEI ou documentação.",
        category: "text",
        badges: ["Markdown Rico", "Tabelas & Checklist", "Despachos SEI"],
        icon: FileCode,
        iconColor: "text-chart-3",
        iconBg: "bg-chart-3/10 border-chart-3/20",
        actionLabel: "Baixar Nota .md",
        onAction: onMarkdown,
      })
    }

    if (onTxt) {
      list.push({
        id: "txt",
        title: "Arquivo de Texto Puro",
        ext: ".txt",
        description: "Documento de texto estruturado com seções e autenticação para processos administrativos.",
        category: "text",
        badges: ["Texto Puro", "Universal", "Anexo Processual"],
        icon: FileText,
        iconColor: "text-muted-foreground",
        iconBg: "bg-muted border-border",
        actionLabel: "Baixar Arquivo .txt",
        onAction: onTxt,
      })
    }

    if (buildText) {
      list.push({
        id: "copy",
        title: "Copiar Resumo Textual",
        ext: "Área de transf.",
        description: "Copia o texto estruturado diretamente para a sua área de transferência com 1 clique.",
        category: "text",
        badges: ["Área de Transferência", "Colagem Imediata", "SEI TJ-RO"],
        icon: ClipboardCopy,
        iconColor: "text-accent",
        iconBg: "bg-accent/10 border-accent/20",
        actionLabel: "Copiar para Área de Transferência",
        isCopy: true,
      })
    }

    return list
  }, [onPdf, onDoc, onExcel, onCsv, onJson, onHtml, onIcs, onMarkdown, onTxt, buildText])

  const previewHtml = useMemo(() => {
    if (buildHtmlPreview) return buildHtmlPreview()
    return null
  }, [buildHtmlPreview])

  const previewJson = useMemo(() => {
    if (buildJsonData) return JSON.stringify(buildJsonData(), null, 2)
    if (buildText) return buildText()
    return ""
  }, [buildJsonData, buildText])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden sm:max-h-[92vh] flex flex-col">
        {/* Header Institucional Estilo Hub */}
        <div className="border-b border-border bg-muted/40 p-5 md:p-6 shrink-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary font-bold text-xs text-primary-foreground">
                  TJ
                </span>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Sparkles className="size-3 text-primary" />
                  Central de Exportação & Conversão
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground md:text-2xl">
                {documentTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground md:text-sm">
                {documentSubtitle || "Converta, exporte e baixe seus dados em múltiplos formatos 100% no seu navegador com conformidade LGPD."}
              </DialogDescription>
            </div>

            {/* Selo de Segurança e Hash */}
            <div className="flex shrink-0 flex-col items-start gap-1 rounded-lg border border-border bg-card/80 p-2.5 text-xs md:items-end shadow-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="size-3.5" />
                <span>Client-Side Seguro</span>
              </div>
              {documentHash && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                  <span>Hash:</span>
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground">{documentHash}</code>
                </div>
              )}
              {itemCount !== undefined && (
                <span className="text-[11px] text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "registro processado" : "registros processados"}
                </span>
              )}
            </div>
          </div>

          {/* Notificação de Sucesso */}
          {downloadSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                {downloadSuccess === "selection"
                  ? "Seleção baixada com sucesso no seu computador!"
                  : "Arquivo gerado e baixado com sucesso no seu computador!"}
              </span>
            </div>
          )}
        </div>

        {/* Abas de Navegação */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-5 pt-2 shrink-0">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="formats" className="gap-1.5 text-xs sm:text-sm">
                <Layers className="size-4" />
                <span>Formatos ({formats.length})</span>
              </TabsTrigger>
              {previewHtml && (
                <TabsTrigger value="preview" className="gap-1.5 text-xs sm:text-sm">
                  <Eye className="size-4" />
                  <span>Pré-Visualização</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="code" className="gap-1.5 text-xs sm:text-sm">
                <Code2 className="size-4" />
                <span>Dados & Código</span>
              </TabsTrigger>
              <TabsTrigger value="options" className="gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="size-4" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-muted/10">
            {/* ABA 1: GRADE ESTILO iLovePDF */}
            <TabsContent value="formats" className="m-0 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {selectionMode ? "Selecione os formatos para baixar" : "Escolha o formato desejado"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectionMode
                      ? "Marque um ou mais cartões e confirme o download da seleção."
                      : "Clique em qualquer cartão para baixar ou processar imediatamente."}
                  </p>
                </div>

                {selectionMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={selectAll} className="h-8 text-xs">
                      Selecionar todos
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownloadSelection}
                      disabled={selectedIds.size === 0}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <Download className="size-3.5" />
                      Baixar Seleção
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleSelectionMode} className="h-8 gap-1.5 text-xs">
                      <XIcon className="size-3.5" />
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
                    title="Escolha quais formatos deseja baixar antes de confirmar"
                  >
                    <CheckSquare className="size-4" />
                    <span className="hidden sm:inline">Baixar Seleção</span>
                  </Button>
                )}
              </div>

              {/* Grid Responsivo de Formatos */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {formats.map((fmt) => {
                  const Icon = fmt.icon
                  const isCopied = copiedId === fmt.id
                  const isSuccess = downloadSuccess === fmt.id
                  const isSelected = selectedIds.has(fmt.id)

                  return (
                    <div
                      key={fmt.id}
                      onClick={() =>
                        selectionMode ? toggleSelected(fmt.id) : handleAction(fmt.id, fmt.onAction, fmt.isCopy)
                      }
                      className={cn(
                        "group relative flex cursor-pointer flex-col justify-between rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/60",
                      )}
                    >
                      {selectionMode && (
                        <div
                          className={cn(
                            "absolute right-3 top-3 flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-transparent",
                          )}
                        >
                          <Check className="size-3.5" />
                        </div>
                      )}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`flex size-10 items-center justify-center rounded-lg border ${fmt.iconBg} ${fmt.iconColor} transition-transform group-hover:scale-105`}>
                            <Icon className="size-5" />
                          </div>
                          {!selectionMode && (
                            <span className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-foreground">
                              {fmt.ext}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {fmt.title}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {fmt.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {fmt.badges.map((b, idx) => (
                            <Badge key={idx} variant="secondary" className="px-1.5 py-0 text-[9px] font-normal">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {!selectionMode && (
                        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                          <span className={isCopied || isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}>
                            {isCopied ? "Copiado com Sucesso!" : isSuccess ? "Baixado com Sucesso!" : fmt.actionLabel}
                          </span>
                          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {isCopied || isSuccess ? <Check className="size-3.5" /> : <Download className="size-3.5" />}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* ABA 2: PRÉ-VISUALIZAÇÃO AO VIVO */}
            {previewHtml && (
              <TabsContent value="preview" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Pré-Visualização do Documento A4</h3>
                    <p className="text-xs text-muted-foreground">Renderização exata de impressão oficial da EMERON / TJ-RO.</p>
                  </div>
                  {onPdf && (
                    <Button size="sm" onClick={onPdf} className="gap-1.5 text-xs">
                      <Printer className="size-4" />
                      Imprimir / Salvar PDF
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-white shadow-inner overflow-hidden max-h-[500px] overflow-y-auto">
                  <iframe
                    srcDoc={previewHtml}
                    title="Pré-visualização"
                    className="w-full h-[600px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </TabsContent>
            )}

            {/* ABA 3: CÓDIGO E DADOS */}
            <TabsContent value="code" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Estrutura de Dados em Memória</h3>
                  <p className="text-xs text-muted-foreground">Dados estruturados e notas textuais para conferência e cópia.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction("code-copy", undefined, true)}
                  className="gap-1.5 text-xs"
                >
                  {copiedId === "code-copy" ? <Check className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4" />}
                  <span>{copiedId === "code-copy" ? "Copiado!" : "Copiar Dados"}</span>
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs overflow-x-auto max-h-[420px]">
                <pre className="text-foreground whitespace-pre-wrap">{previewJson}</pre>
              </div>
            </TabsContent>

            {/* ABA 4: CONFIGURAÇÕES */}
            <TabsContent value="options" className="m-0 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Preferências de Emissão Institucional</h3>
                <p className="text-xs text-muted-foreground">Personalize os elementos a serem inseridos nos documentos gerados.</p>
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="size-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground">Cabeçalho Oficial do Tribunal de Justiça de Rondônia</p>
                    <p className="text-xs text-muted-foreground">Insere o brasão, identificação da EMERON e títulos oficiais.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHash}
                    onChange={(e) => setIncludeHash(e.target.checked)}
                    className="size-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground">Hash de Autenticidade Digital (FNV-1a 32-bit)</p>
                    <p className="text-xs text-muted-foreground">Gera o código verificador criptográfico para conferência visual.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    className="size-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground">Carimbo de Data e Hora de Emissão</p>
                    <p className="text-xs text-muted-foreground">Registra a data e hora exata da geração no navegador.</p>
                  </div>
                </label>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-border bg-card p-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Processamento 100% no navegador · Nenhum dado sai do seu computador.</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
            {selectionMode ? (
              <Button
                size="sm"
                onClick={handleDownloadSelection}
                disabled={selectedIds.size === 0}
                className="gap-1.5 text-xs"
              >
                <Download className="size-4" />
                Baixar Seleção ({selectedIds.size})
              </Button>
            ) : (
              <Button size="sm" onClick={toggleSelectionMode} className="gap-1.5 text-xs">
                <CheckSquare className="size-4" />
                Baixar Seleção
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
