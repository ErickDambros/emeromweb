"use client"

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  FileCheck,
  FileDown,
  FileText,
  History,
  Layers,
  Printer,
  ShieldAlert,
  User,
  Users,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ActionDossier, DocumentStatus } from "@/lib/types"

interface ProntuarioViewProps {
  dossier: ActionDossier
  onBack: () => void
}

const statusColorMap: Record<DocumentStatus, { label: string; badgeClass: string; icon: typeof CheckCircle2 }> = {
  concluido: {
    label: "Concluído",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  em_analise: {
    label: "Em Análise",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  pendente: {
    label: "Pendente",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    icon: AlertCircle,
  },
}

export function ProntuarioView({ dossier, onBack }: ProntuarioViewProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const completedDocsCount = dossier.documents.filter((d) => d.status === "concluido").length
  const totalDocsCount = dossier.documents.length
  const compliancePct = Math.round((completedDocsCount / (totalDocsCount || 1)) * 100)

  return (
    <div className="space-y-6">
      {/* Barra de Navegação Superior / Ações */}
      <div className="no-print flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-4" />
            Voltar para Prioridades
          </Button>
          <div className="h-5 w-px bg-border" />
          <div>
            <span className="text-xs font-mono font-semibold text-primary">{dossier.canonicalId}</span>
            <span className="mx-2 text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Prontuário Vivo Individual</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} className="gap-2" size="sm">
            <FileDown className="size-4" />
            Exportar Dossiê em PDF
          </Button>
        </div>
      </div>

      {/* Dossiê Imprimível / Visualização Principal */}
      <div className="print-area mx-auto w-full max-w-4xl space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
        {/* Cabeçalho Institucional do Dossiê */}
        <div className="border-b border-border pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                  {dossier.canonicalId}
                </span>
                <Badge
                  variant={dossier.priority === "Alta" ? "destructive" : "secondary"}
                  className="text-xs font-medium"
                >
                  Prioridade {dossier.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {dossier.status}
                </Badge>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">{dossier.name}</h1>
              <p className="text-sm text-muted-foreground">
                Setor Responsável: <strong className="text-foreground">{dossier.sector}</strong> · Categoria:{" "}
                <strong className="text-foreground">{dossier.category}</strong>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1 rounded-lg border border-border bg-muted/40 p-3 text-xs sm:items-end">
              <p className="text-muted-foreground">Emissão institucional</p>
              <p className="font-mono font-medium text-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
              <p className="text-[10px] text-muted-foreground">Processamento 100% no navegador</p>
            </div>
          </div>

          {/* Identificadores Cruzados (ID Canônico + SEI + EmeronWeb) */}
          <div className="mt-5 grid grid-cols-1 gap-2 rounded-lg border border-border/80 bg-accent/20 p-3 text-xs sm:grid-cols-3">
            <div className="flex items-center justify-between gap-2 px-2 py-1">
              <div>
                <span className="text-muted-foreground">Código Canônico:</span>
                <p className="font-mono font-semibold text-foreground">{dossier.canonicalId}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(dossier.canonicalId, "id")}
                title="Copiar código"
              >
                <Copy className="size-3" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1 sm:border-l sm:border-t-0">
              <div>
                <span className="text-muted-foreground">Processo SEI:</span>
                <p className="font-mono font-semibold text-foreground">{dossier.seiProcess}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(dossier.seiProcess, "sei")}
                title="Copiar número SEI"
              >
                <Copy className="size-3" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1 sm:border-l sm:border-t-0">
              <div>
                <span className="text-muted-foreground">ID EmeronWeb:</span>
                <p className="font-mono font-semibold text-foreground">{dossier.emeronWebId}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(dossier.emeronWebId, "ew")}
                title="Copiar ID EmeronWeb"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* ALERTA DE DIVERGÊNCIA ENTRE FONTES (Diferencial Camada 2) */}
        {dossier.divergences && dossier.divergences.length > 0 && (
          <div className="rounded-lg border-2 border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Detecção Automática de Divergência entre Fontes
                  </h2>
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    Atenção do Gestor
                  </Badge>
                </div>
                {dossier.divergences.map((div) => (
                  <div key={div.id} className="rounded-md bg-card/80 p-3 text-xs text-foreground shadow-sm">
                    <p className="font-semibold text-amber-700 dark:text-amber-400">
                      Campo Conflitante: {div.field}
                    </p>
                    <p className="mt-1 text-muted-foreground">{div.explanation}</p>
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded border border-border bg-background p-2">
                        <span className="font-medium text-muted-foreground">{div.sourceA.name}:</span>
                        <p className="font-mono font-semibold text-foreground">{div.sourceA.value}</p>
                      </div>
                      <div className="rounded border border-border bg-background p-2">
                        <span className="font-medium text-muted-foreground">{div.sourceB.name}:</span>
                        <p className="font-mono font-semibold text-foreground">{div.sourceB.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Métricas Executivas da Ação */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-4 text-primary" />
              <span className="text-xs">Responsável</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{dossier.responsible}</p>
            <p className="text-[11px] text-muted-foreground">{dossier.sector}</p>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4 text-chart-2" />
              <span className="text-xs">Prazo Estimado</span>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">
              {dossier.deadline ? dossier.deadline.toLocaleDateString("pt-BR") : "A definir"}
            </p>
            <p className="text-[11px] text-muted-foreground">Cronograma 2026</p>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 text-chart-3" />
              <span className="text-xs">Beneficiários</span>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{dossier.students}</p>
            <p className="text-[11px] text-muted-foreground">alunos / servidores</p>
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="size-4 text-chart-4" />
              <span className="text-xs">Orçamento (Exec/Prev)</span>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">
              R$ {(dossier.budgetExecuted / 1000).toFixed(1)}k / {(dossier.budgetPlanned / 1000).toFixed(1)}k
            </p>
            <Progress value={dossier.progress} className="mt-1.5 h-1.5" />
          </Card>
        </div>

        {/* CHECKLIST DE DOCUMENTOS OBRIGATÓRIOS (Conformidade Institucional) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileCheck className="size-4 text-primary" />
                Checklist de Documentos Obrigatórios
              </h2>
              <p className="text-xs text-muted-foreground">
                Conformidade com os ritos pedagógicos e administrativos da Escola de Governo
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-semibold text-foreground">
                {completedDocsCount}/{totalDocsCount} ({compliancePct}%)
              </span>
              <p className="text-[10px] text-muted-foreground">Aprovados</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-12 text-center">Status</TableHead>
                  <TableHead>Documento Institucional</TableHead>
                  <TableHead className="hidden md:table-cell">Finalidade / Descrição</TableHead>
                  <TableHead className="w-28 text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dossier.documents.map((doc) => {
                  const item = statusColorMap[doc.status]
                  const Icon = item.icon
                  return (
                    <TableRow key={doc.id} className="text-xs">
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Icon
                            className={`size-4 ${
                              doc.status === "concluido"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : doc.status === "em_analise"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="space-y-0.5">
                          <p>{doc.name}</p>
                          <Badge variant="outline" className={`text-[10px] ${item.badgeClass}`}>
                            {item.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {doc.description}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {doc.updatedAt || "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Histórico de Tramitação */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <History className="size-4 text-primary" />
            Histórico e Tramitação da Ação
          </h2>
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
            {dossier.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="font-mono font-medium text-muted-foreground">{h.date}</span>
                <span className="text-muted-foreground">·</span>
                <div className="flex-1">
                  <p className="text-foreground">{h.description}</p>
                  <p className="text-[10px] text-muted-foreground">Por: {h.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé institucional para impressão */}
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Printer className="size-3.5" />
            <span>EMEROMWEB · Sistema de Gestão e Tomada de Decisão</span>
          </div>
          <span className="font-mono">{dossier.canonicalId}</span>
        </div>
      </div>
    </div>
  )
}
