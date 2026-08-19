import type { Dataset, DataSource } from "./types"
import { getActionDossier } from "./sample-data"
import { aggregateOne, measureValues, parseNumberLike } from "./data-engine"

export interface AssistantMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: number
  category?: "nav" | "data" | "fallback"
  metadata?: {
    actionId?: string
    actionName?: string
  }
}

export interface AssistantContext {
  sources: DataSource[]
  datasets: Dataset[]
  activeDataset: Dataset | null
}

export const SUGGESTED_QUESTIONS = [
  "Quantas ações estão críticas?",
  "Qual ação tem prazo mais próximo?",
  "Como exportar o dossiê em PDF?",
  "O processamento dos dados é seguro?",
]

/** Normaliza texto removendo acentos e pontuações para correspondência determinística */
function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Motor de regras determinísticas e consultas ao estado em memória */
export function queryAssistant(rawQuestion: string, ctx: AssistantContext): { text: string; category: "nav" | "data" | "fallback" } {
  const q = normalizeQuery(rawQuestion)
  const { sources, datasets, activeDataset } = ctx

  /* ===================================================================== */
  /* CATEGORIA B — Perguntas Dinâmicas sobre os Dados em Memória            */
  /* ===================================================================== */

  // 1. Contagem de Ações Críticas / Prioritárias / Atrasadas
  if (
    q.includes("quantas acoes") && (q.includes("critica") || q.includes("prioritar") || q.includes("alta") || q.includes("atrasad")) ||
    q.includes("quantas estao criticas") ||
    q.includes("acoes criticas")
  ) {
    if (!activeDataset || activeDataset.rows.length === 0) {
      return {
        category: "data",
        text: "No momento não há dados carregados para verificar ações críticas. Carregue uma planilha ou clique em 'Ver com dados de exemplo'.",
      }
    }

    const rows = activeDataset.rows
    const criticas = rows.filter((r) => {
      const p = String(r["Prioridade"] || "").toLowerCase()
      const s = String(r["Status"] || "").toLowerCase()
      return p.includes("alta") || s.includes("atrasad")
    })

    const atrasadas = rows.filter((r) => String(r["Status"] || "").toLowerCase().includes("atrasad")).length
    const altas = rows.filter((r) => String(r["Prioridade"] || "").toLowerCase().includes("alta")).length

    return {
      category: "data",
      text: `Na tabela ativa **"${activeDataset.sheetName}"** (${activeDataset.rowCount} ações):\n\n` +
        `• **${altas} ações** estão classificadas com **Prioridade Alta**.\n` +
        `• **${atrasadas} ações** estão com status **Atrasada**.\n\n` +
        `Você pode conferir a lista priorizada diretamente na aba **Prioridades** e clicar em qualquer item para ver o dossiê individual.`,
    }
  }

  // 2. Ação com Prazo Mais Próximo
  if (
    q.includes("prazo mais proximo") ||
    q.includes("proximo prazo") ||
    q.includes("qual acao vence") ||
    q.includes("proxima acao")
  ) {
    if (!activeDataset || activeDataset.rows.length === 0) {
      return {
        category: "data",
        text: "Nenhuma ação carregada no momento para consultar prazos.",
      }
    }

    const now = new Date().getTime()
    const rowsWithDate = activeDataset.rows
      .map((r, i) => {
        const raw = r["Prazo"]
        const d = raw instanceof Date ? raw : typeof raw === "string" ? new Date(raw) : null
        return { row: r, date: d, index: i }
      })
      .filter((item): item is { row: Record<string, any>; date: Date; index: number } => item.date !== null && !isNaN(item.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (rowsWithDate.length === 0) {
      return {
        category: "data",
        text: "A tabela atual não possui coluna de prazos reconhecível para ordenar os vencimentos.",
      }
    }

    // Pega o prazo mais próximo (ou primeiro da fila)
    const upcoming = rowsWithDate.find((item) => item.date.getTime() >= now) ?? rowsWithDate[0]
    const dossier = getActionDossier(upcoming.row, upcoming.index)
    const dateStr = upcoming.date.toLocaleDateString("pt-BR")

    return {
      category: "data",
      text: `A ação com prazo em maior destaque é:\n\n` +
        `📌 **${dossier.name}**\n` +
        `• **Código Canônico:** ${dossier.canonicalId}\n` +
        `• **Prazo:** ${dateStr}\n` +
        `• **Responsável:** ${dossier.responsible} (${dossier.sector})\n` +
        `• **Status:** ${dossier.status} (${dossier.progress}% executado)\n\n` +
        `Acesse a aba **Agendas** para o cronograma completo por mês.`,
    }
  }

  // 3. Consulta de Pendência em uma Ação Específica (ex: EMERON-2026-001 ou código)
  const codeMatch = q.match(/emeron\s*2026\s*(\d+)/i) || q.match(/acao\s*(\d+)/i)
  if (codeMatch && (q.includes("pendent") || q.includes("dossie") || q.includes("o que falta") || q.includes("status"))) {
    const num = parseInt(codeMatch[1], 10)
    const targetCode = `EMERON-2026-${String(num).padStart(3, "0")}`

    if (activeDataset) {
      const foundIdx = activeDataset.rows.findIndex((r) => String(r["Código"] || "").includes(targetCode) || String(r["Ação"] || "").includes(codeMatch[1]))
      const targetRow = foundIdx >= 0 ? activeDataset.rows[foundIdx] : activeDataset.rows[Math.min(num - 1, activeDataset.rows.length - 1)]

      if (targetRow) {
        const dossier = getActionDossier(targetRow, foundIdx >= 0 ? foundIdx : num - 1)
        const pendingDocs = dossier.documents.filter((d) => d.status !== "concluido")

        let resp = `📋 **Prontuário da Ação ${dossier.canonicalId}** — *${dossier.name}*:\n\n`
        resp += `• **Responsável:** ${dossier.responsible} | **Status:** ${dossier.status}\n`
        resp += `• **Progresso:** ${dossier.progress}%\n`

        if (pendingDocs.length > 0) {
          resp += `\n⚠️ **Documentos Pendentes no Checklist:**\n`
          pendingDocs.forEach((d) => {
            resp += `  - [ ] **${d.name}** (${d.status === "em_analise" ? "Em Análise" : "Pendente"})\n`
          })
        } else {
          resp += `\n✅ Todos os 5 documentos obrigatórios estão com conformidade aprovada!`
        }

        if (dossier.divergences.length > 0) {
          resp += `\n\n🔍 **Divergência detectada entre fontes:** ${dossier.divergences[0].field} (${dossier.divergences[0].sourceA.name} vs ${dossier.divergences[0].sourceB.name}).`
        }

        return { category: "data", text: resp }
      }
    }
  }

  // 4. Orçamento Total Previsto e Executado
  if (q.includes("orcamento") || q.includes("financeiro") || q.includes("quanto foi gasto") || q.includes("gasto")) {
    if (!activeDataset) {
      return { category: "data", text: "Nenhum dado orçamentário carregado no momento." }
    }

    const prevCol = activeDataset.columns.find((c) => /previsto|orcamento/i.test(c.name))
    const execCol = activeDataset.columns.find((c) => /executado|gasto|realizado/i.test(c.name))

    const prevValues = prevCol ? measureValues(activeDataset, prevCol.name) : []
    const execValues = execCol ? measureValues(activeDataset, execCol.name) : []

    const sumPrev = aggregateOne(prevValues, "sum")
    const sumExec = aggregateOne(execValues, "sum")
    const pct = sumPrev > 0 ? ((sumExec / sumPrev) * 100).toFixed(1) : "0"

    return {
      category: "data",
      text: `📊 **Consolidação Orçamentária da Tabela Ativa:**\n\n` +
        `• **Orçamento Total Previsto:** R$ ${sumPrev.toLocaleString("pt-BR")}\n` +
        `• **Orçamento Total Executado:** R$ ${sumExec.toLocaleString("pt-BR")}\n` +
        `• **Taxa de Execução Geral:** ${pct}%\n\n` +
        `Veja a distribuição gráfica completa na aba **Indicadores** selecionando a medida *Orçamento Executado*.`,
    }
  }

  // 5. Fontes Carregadas
  if (q.includes("quantas fontes") || q.includes("fontes carregadas") || q.includes("quais arquivos") || q.includes("tabelas carregadas")) {
    return {
      category: "data",
      text: `📂 Atualmente o sistema possui **${sources.length} fonte(s) carregada(s)** totalizando **${datasets.length} tabela(s)** em memória.\n\n` +
        sources.map((s) => `• **${s.fileName}** (${s.sizeKb} KB) — ${s.datasets.length} tabela(s)`).join("\n") +
        `\n\nVocê pode adicionar mais planilhas ou PDFs a qualquer momento na aba **Fontes de dados**.`,
    }
  }

  /* ===================================================================== */
  /* CATEGORIA A — Perguntas sobre Navegação, Sistema e Regras              */
  /* ===================================================================== */

  // A1. Como fazer upload / adicionar dados
  if (q.includes("como faco upload") || q.includes("fazer upload") || q.includes("enviar planilha") || q.includes("como subir")) {
    return {
      category: "nav",
      text: `Para adicionar novos dados ao sistema:\n\n` +
        `1. Acesse a aba **Fontes de dados** no menu lateral esquerdo.\n` +
        `2. Arraste suas planilhas (**.xlsx**, **.xls**, **.csv**) ou documentos **.pdf** para a área de upload.\n` +
        `3. O sistema fará a leitura e processamento **100% no seu navegador**, sem enviar nada para servidores externos.\n` +
        `4. As tabelas extraídas ficam imediatamente disponíveis no seletor de dados no topo.`,
    }
  }

  // A2. O que é o motor de atenção / prioridades
  if (q.includes("motor de atencao") || q.includes("como funciona o ranking") || q.includes("prioridades") || q.includes("score")) {
    return {
      category: "nav",
      text: `O **Ranking de Prioridades** organiza as ações institucionais a partir de critérios estratégicos objetivos:\n\n` +
        `• **Nível de Criticidade:** Classificação por urgência da ação e proximidade do prazo de entrega.\n` +
        `• **Impacto e Volume:** Medido pela soma de orçamento e contingente de alunos/servidores beneficiados.\n` +
        `• **Status de Execução:** Ações com atraso ou pendências documentais recebem destaque no topo da fila de gestão.`,
    }
  }

  // A3. Como gerar dossiê, relatórios e formatos de exportação
  if (q.includes("gerar dossie") || q.includes("exportar") || q.includes("formatos") || q.includes("relatorio pdf") || q.includes("como imprimir")) {
    return {
      category: "nav",
      text: `O **RADAR EMERON** suporta exportação completa em múltiplos formatos 100% no cliente:\n\n` +
        `• 📄 **Documentos:** PDF Oficial A4 (Impressão/Salvar), Documento Word (\`.doc\`) e Página Web Autônoma (\`.html\`).\n` +
        `• 📊 **Planilhas & Dados:** Excel (\`.xlsx\`), CSV com BOM UTF-8 (\`.csv\`), JSON (\`.json\`) e Calendário iCal (\`.ics\`).\n` +
        `• 📋 **Texto & SEI:** Arquivo Texto (\`.txt\`), Nota em Markdown (\`.md\`) e Copiar Resumo Textual.\n\n` +
        `Você encontra o menu **"Exportar"** no topo de todas as abas: **Relatórios**, **Prioridades**, **Prontuário Vivo**, **Indicadores** e **Agendas**.`,
    }
  }

  // A4. Privacidade e Segurança dos Dados (LGPD)
  if (q.includes("seguro") || q.includes("privacidade") || q.includes("lgpd") || q.includes("servidor") || q.includes("nuvem")) {
    return {
      category: "nav",
      text: `🔒 **Privacidade por Design (Client-Side Only):**\n\n` +
        `• Todo o processamento de planilhas e extração de dados acontece **exclusivamente dentro do seu navegador Web**.\n` +
        `• Nenhum registro institucional, dado de processo SEI ou informação financeira é transmitido para servidores externos.\n` +
        `• Isso garante conformidade com as diretrizes de segurança da informação e LGPD da EMERON.`,
    }
  }

  // A5. Detecção de Divergências
  if (q.includes("divergencia") || q.includes("conflito") || q.includes("duas fontes") || q.includes("cruzamento")) {
    return {
      category: "nav",
      text: `🔍 **Detecção de Divergências entre Fontes:**\n\n` +
        `Quando duas fontes carregadas descrevem a mesma ação educacional (ex: uma planilha setorial e um ofício do SEI), o motor compara campos como Carga Horária, Orçamento e Prazos.\n` +
        `Havendo divergência, um aviso destacado é inserido no **Prontuário Vivo** da ação indicando exatamente qual valor difere em cada fonte.`,
    }
  }

  // A6. Código Canônico
  if (q.includes("codigo canonico") || q.includes("id unico") || q.includes("identificador")) {
    return {
      category: "nav",
      text: `O **Código Canônico** (ex: \`EMERON-2026-048\`) é um identificador universal gerado pelo sistema para unificar dados da mesma ação dispersos entre diferentes plataformas legadas (SEI, EmeronWeb e Moodle).`,
    }
  }

  /* ===================================================================== */
  /* FALLBACK CONSTRUTIVO                                                 */
  /* ===================================================================== */
  return {
    category: "fallback",
    text: "Ainda não tenho uma resposta pronta para isso, mas posso te ajudar com dúvidas sobre navegação do sistema ou sobre as ações, prazos e indicadores que você está vendo agora.",
  }
}
