import type { ActionDossier, CellValue, DataDivergence, Dataset, DataSource, DossierDocument } from "./types"

const setores = [
  "Coordenação Pedagógica",
  "Secretaria Escolar",
  "Infraestrutura",
  "Tecnologia da Informação",
  "Assistência ao Estudante",
  "Gestão Financeira",
]

const categorias = ["Ensino", "Infraestrutura", "Formação", "Tecnologia", "Assistência", "Administrativo"]
const status = ["Concluída", "Em andamento", "Planejada", "Atrasada"]
const prioridades = ["Alta", "Média", "Baixa"]
const responsaveis = [
  "Ana Souza",
  "Carlos Lima",
  "Mariana Alves",
  "Rafael Nunes",
  "Beatriz Rocha",
  "João Pereira",
]

const acoes = [
  "Capacitação em Magistério Superior e Metodologias Ativas",
  "Modernização do Laboratório de Inovação Jurídica",
  "Programa de Formação Continuada de Servidores",
  "Seminário Estadual de Direito Público e Cidadania",
  "Digitalização e Preservação da Memória Institucional",
  "Reforma e Acessibilidade das Salas de Aula",
  "Curso de Especialização em Gestão Judiciária",
  "Implementação do Ambiente Virtual de Aprendizagem Moodle",
  "Aquisição de Equipamentos de Videoconferência",
  "Oficina de Redação de Decisões e Sentenças",
  "Programa de Apoio Psicossocial e Bem-Estar",
  "Recuperação e Expansão do Acervo da Biblioteca",
  "Infraestrutura de Rede e Wi-Fi das Unidades",
  "Feira de Conhecimento e Boas Práticas da Justiça",
  "Treinamento em Segurança da Informação e LGPD",
]

/* PRNG determinístico para dados consistentes */
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

export function buildSampleSource(): DataSource {
  const rng = makeRng(20260817)
  const rows: Record<string, CellValue>[] = []
  const total = 48

  for (let i = 0; i < total; i++) {
    const canonicalId = `EMERON-2026-${String(i + 1).padStart(3, "0")}`
    const seiNum = String(12000 + i * 37).padStart(7, "0")
    const seiProcess = `00${seiNum}.000048/2026-${String((i * 13) % 90 + 10)}`
    const emeronWebId = `EW-2026-${String(8100 + i * 19)}`

    const previsto = Math.round((8 + rng() * 85) * 1000)
    const execPct = 0.25 + rng() * 0.75
    const executado = Math.round(previsto * execPct)
    const month = Math.floor(rng() * 12)
    const day = 1 + Math.floor(rng() * 27)
    const workload = [20, 30, 40, 60, 120][Math.floor(rng() * 5)]

    rows.push({
      "Código": canonicalId,
      "Ação": acoes[i % acoes.length] + (i >= acoes.length ? ` (Turma ${Math.floor(i / acoes.length) + 1})` : ""),
      "Processo SEI": seiProcess,
      "ID EmeronWeb": emeronWebId,
      Setor: setores[Math.floor(rng() * setores.length)],
      Categoria: categorias[Math.floor(rng() * categorias.length)],
      Responsável: responsaveis[Math.floor(rng() * responsaveis.length)],
      Status: status[Math.floor(rng() * status.length)],
      Prioridade: prioridades[Math.floor(rng() * prioridades.length)],
      Prazo: new Date(2026, month, day),
      "Carga Horária (h)": workload,
      "Orçamento Previsto": previsto,
      "Orçamento Executado": executado,
      "Alunos Beneficiados": Math.round(25 + rng() * 450),
      "Progresso (%)": Math.round(execPct * 100),
    })
  }

  const dataset: Dataset = {
    id: "sample-ds",
    fileName: "acoes_institucionais_emeron_2026.xlsx",
    sheetName: "Ações EMERON 2026",
    rowCount: rows.length,
    rows,
    columns: [
      { name: "Código", type: "category", filled: total, distinct: total },
      { name: "Ação", type: "category", filled: total, distinct: total },
      { name: "Processo SEI", type: "text", filled: total, distinct: total },
      { name: "ID EmeronWeb", type: "text", filled: total, distinct: total },
      { name: "Setor", type: "category", filled: total, distinct: setores.length },
      { name: "Categoria", type: "category", filled: total, distinct: categorias.length },
      { name: "Responsável", type: "category", filled: total, distinct: responsaveis.length },
      { name: "Status", type: "category", filled: total, distinct: status.length },
      { name: "Prioridade", type: "category", filled: total, distinct: prioridades.length },
      { name: "Prazo", type: "date", filled: total, distinct: 0 },
      { name: "Carga Horária (h)", type: "number", filled: total, distinct: 0 },
      { name: "Orçamento Previsto", type: "number", filled: total, distinct: 0 },
      { name: "Orçamento Executado", type: "number", filled: total, distinct: 0 },
      { name: "Alunos Beneficiados", type: "number", filled: total, distinct: 0 },
      { name: "Progresso (%)", type: "number", filled: total, distinct: 0 },
    ],
  }

  return {
    id: "sample-src",
    fileName: "acoes_institucionais_emeron_2026.xlsx",
    kind: "spreadsheet",
    sizeKb: 54,
    addedAt: Date.now(),
    datasets: [dataset],
  }
}

/** Extrai ou sintetiza o Dossiê Completo (Prontuário Vivo) de uma Ação */
export function getActionDossier(row: Record<string, CellValue>, index = 0): ActionDossier {
  const canonicalId = String(row["Código"] || `EMERON-2026-${String(index + 1).padStart(3, "0")}`)
  const name = String(row["Ação"] || row["Nome"] || row["Título"] || `Ação ${canonicalId}`)
  const seiProcess = String(row["Processo SEI"] || `00${String(12000 + index * 41).padStart(7, "0")}.000048/2026-14`)
  const emeronWebId = String(row["ID EmeronWeb"] || `EW-2026-${String(8200 + index * 23)}`)
  const sector = String(row["Setor"] || "Coordenação Pedagógica")
  const category = String(row["Categoria"] || "Formação")
  const responsible = String(row["Responsável"] || "Mariana Alves")
  const statusStr = String(row["Status"] || "Em andamento")
  const priority = String(row["Prioridade"] || "Alta")
  const deadline = row["Prazo"] instanceof Date ? row["Prazo"] : typeof row["Prazo"] === "string" ? new Date(row["Prazo"]) : null
  
  const budgetPlanned = Number(row["Orçamento Previsto"] || 45000)
  const budgetExecuted = Number(row["Orçamento Executado"] || 28000)
  const students = Number(row["Alunos Beneficiados"] || 120)
  const progress = Number(row["Progresso (%)"] || Math.round((budgetExecuted / (budgetPlanned || 1)) * 100))
  const workloadHours = Number(row["Carga Horária (h)"] || 40)

  // Checklist de Documentos Obrigatórios
  const isConcluded = statusStr === "Concluída"
  const isLate = statusStr === "Atrasada"

  const documents: DossierDocument[] = [
    {
      id: "doc-1",
      name: "Projeto Pedagógico / Plano de Trabalho",
      required: true,
      status: "concluido",
      description: "Documento base de especificação pedagógica e metodológica aprovado pela Diretoria.",
      updatedAt: "12/01/2026",
    },
    {
      id: "doc-2",
      name: "Ofício de Instauração no SEI",
      required: true,
      status: "concluido",
      description: `Autuado sob processo institucional ${seiProcess}.`,
      updatedAt: "15/01/2026",
    },
    {
      id: "doc-3",
      name: "Termo de Referência / Orçamento Estimado",
      required: true,
      status: isConcluded || !isLate ? "concluido" : "em_analise",
      description: "Previsão orçamentária detalhada e aprovação financeira.",
      updatedAt: "28/01/2026",
    },
    {
      id: "doc-4",
      name: "Lista de Presença e Registro de Frequência",
      required: true,
      status: isConcluded ? "concluido" : isLate ? "pendente" : "em_analise",
      description: "Controle de frequência dos participantes no EmeronWeb e Moodle.",
      updatedAt: isConcluded ? "10/02/2026" : undefined,
    },
    {
      id: "doc-5",
      name: "Relatório Final de Execução e Avaliação",
      required: true,
      status: isConcluded ? "concluido" : "pendente",
      description: "Prestação de contas técnica e mensuração de impacto dos alunos beneficiados.",
      updatedAt: isConcluded ? "15/02/2026" : undefined,
    },
  ]

  // Divergências simuladas para enriquecer o diferencial institucional (Camada 2)
  const divergences: DataDivergence[] = []

  if (index % 4 === 1) {
    divergences.push({
      id: "div-1",
      field: "Carga Horária",
      sourceA: { name: "Planilha de Cursos (Unidade)", value: `${workloadHours} horas` },
      sourceB: { name: "Ofício no SEI", value: `${Math.max(16, workloadHours - 8)} horas` },
      severity: "media",
      explanation: "A carga horária cadastrada na planilha do setor difere do termo aprovado no processo SEI. Requer alinhamento pedagógico.",
    })
  }

  if (index % 5 === 2) {
    divergences.push({
      id: "div-2",
      field: "Dotação Orçamentária Prevista",
      sourceA: { name: "Planilha Financeira", value: `R$ ${budgetPlanned.toLocaleString("pt-BR")}` },
      sourceB: { name: "Sistema EmeronWeb", value: `R$ ${(budgetPlanned * 0.9).toLocaleString("pt-BR")}` },
      severity: "alta",
      explanation: "Valor de empenho reservado no EmeronWeb está 10% inferior ao orçamento previsto na planilha setorial.",
    })
  }

  const history = [
    { date: "15/01/2026", description: `Abertura do processo SEI ${seiProcess} para a ação educacional.`, author: responsible },
    { date: "28/01/2026", description: "Aprovação do plano de trabalho pela Coordenação Pedagógica.", author: "Coordenação Pedagógica" },
    { date: "05/02/2026", description: `Atualização de progresso: ${progress}% com ${students} participantes inscritos.`, author: "Secretaria Escolar" },
  ]

  return {
    canonicalId,
    seiProcess,
    emeronWebId,
    name,
    sector,
    category,
    responsible,
    status: statusStr,
    priority,
    deadline,
    budgetPlanned,
    budgetExecuted,
    students,
    progress,
    workloadHours,
    documents,
    divergences,
    history,
  }
}
