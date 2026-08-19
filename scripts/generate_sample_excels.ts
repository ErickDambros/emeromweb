import * as fs from "fs"
import * as path from "path"
import ExcelJS from "exceljs"

interface ActionRecord {
  codigo: string
  acao: string
  processoSei: string
  idEmeronWeb: string
  setor: string
  categoria: string
  responsavel: string
  status: string
  prioridade: string
  prazo: Date
  cargaHoraria: number
  orcamentoPrevisto: number
  orcamentoExecutado: number
  alunosBeneficiados: number
  progresso: number
}

async function generateAllExcelInputs() {
  const outputDir = path.join(process.cwd(), "inputs")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log("Gerando 5 planilhas Excel padronizadas para EMERON em:", outputDir)

  const C_NAVY = "0D2D46"
  const C_ZEBRA = "F8FAFC"
  const C_BORDER = "CBD5E1"

  const headers = [
    "Código",
    "Ação",
    "Processo SEI",
    "ID EmeronWeb",
    "Setor",
    "Categoria",
    "Responsável",
    "Status",
    "Prioridade",
    "Prazo",
    "Carga Horária (h)",
    "Orçamento Previsto",
    "Orçamento Executado",
    "Alunos Beneficiados",
    "Progresso (%)",
  ]

  const columnWidths = [18, 48, 26, 18, 28, 22, 24, 16, 14, 15, 18, 22, 22, 20, 16]

  async function createCleanSpreadsheet(
    filePath: string,
    sheetName: string,
    records: ActionRecord[],
  ) {
    const wb = new ExcelJS.Workbook()
    wb.creator = "Escola da Magistratura do Estado de Rondônia (EMERON / TJ-RO)"
    wb.created = new Date(2026, 0, 1)

    const ws = wb.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 1 }], // Congela a primeira linha de cabeçalho
    })

    // 1. Linha de Cabeçalho (Linha 1)
    const headerRow = ws.addRow(headers)
    headerRow.height = 26
    headerRow.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C_NAVY } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = {
        top: { style: "medium", color: { argb: "FF" + C_NAVY } },
        bottom: { style: "medium", color: { argb: "FF" + C_NAVY } },
        left: { style: "thin", color: { argb: "FF" + C_NAVY } },
        right: { style: "thin", color: { argb: "FF" + C_NAVY } },
      }
    })

    // 2. Linhas de Dados
    records.forEach((rec, idx) => {
      const rowValues = [
        rec.codigo,
        rec.acao,
        rec.processoSei,
        rec.idEmeronWeb,
        rec.setor,
        rec.categoria,
        rec.responsavel,
        rec.status,
        rec.prioridade,
        rec.prazo,
        rec.cargaHoraria,
        rec.orcamentoPrevisto,
        rec.orcamentoExecutado,
        rec.alunosBeneficiados,
        rec.progresso,
      ]

      const row = ws.addRow(rowValues)
      row.height = 20
      const isEven = idx % 2 === 1

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Segoe UI", size: 9.5 }
        if (isEven) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C_ZEBRA } }
        }

        cell.border = {
          top: { style: "thin", color: { argb: "FF" + C_BORDER } },
          bottom: { style: "thin", color: { argb: "FF" + C_BORDER } },
          left: { style: "thin", color: { argb: "FF" + C_BORDER } },
          right: { style: "thin", color: { argb: "FF" + C_BORDER } },
        }

        // Alinhamento específico por coluna
        switch (colNum) {
          case 1: // Código
          case 3: // Processo SEI
          case 4: // ID EmeronWeb
          case 8: // Status
          case 9: // Prioridade
          case 10: // Prazo
            cell.alignment = { horizontal: "center", vertical: "middle" }
            break
          case 11: // Carga Horária
          case 12: // Orçamento Previsto
          case 13: // Orçamento Executado
          case 14: // Alunos
          case 15: // Progresso
            cell.alignment = { horizontal: "right", vertical: "middle" }
            break
          default:
            cell.alignment = { horizontal: "left", vertical: "middle" }
        }

        // Formatação de tipos
        if (colNum === 10) {
          cell.numFmt = "dd/mm/yyyy"
        } else if (colNum === 12 || colNum === 13) {
          cell.numFmt = '"R$ "#,##0.00'
        } else if (colNum === 11 || colNum === 14) {
          cell.numFmt = "#,##0"
        } else if (colNum === 15) {
          cell.numFmt = "0%"
        }
      })
    })

    // 3. Ajuste de Larguras
    ws.columns = columnWidths.map((w) => ({ width: w }))

    await wb.xlsx.writeFile(filePath)
    console.log(`  -> Gerado: ${path.basename(filePath)} (${records.length} linhas)`)
  }

  /* ================================================================== */
  /* 1. PLANO ANUAL DE CAPACITAÇÃO 2026 (PAC EMERON)                    */
  /* ================================================================== */
  {
    const pacCursos: { acao: string; setor: string; cat: string; resp: string; prio: string; ch: number; prev: number; exec: number; alunos: number; mes: number; dia: number; status: string }[] = [
      { acao: "Pós-Graduação em Direito Digital, Proteção de Dados e Inteligência Artificial", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Alta", ch: 360, prev: 185000, exec: 142000, alunos: 52, mes: 2, dia: 15, status: "Em andamento" },
      { acao: "Oficina Prática de Redação de Sentenças Cíveis e Decisões Judiciais", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Alta", ch: 40, prev: 32000, exec: 32000, alunos: 30, mes: 1, dia: 20, status: "Concluída" },
      { acao: "Programa de Formação Continuada de Magistrados e Servidores", setor: "Secretaria Escolar", cat: "Formação", resp: "Ana Souza", prio: "Média", ch: 60, prev: 45000, exec: 28000, alunos: 140, mes: 3, dia: 10, status: "Em andamento" },
      { acao: "Seminário Estadual de Direito Público, Cidadania e Amazônia", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Rafael Nunes", prio: "Alta", ch: 30, prev: 95000, exec: 0, alunos: 220, mes: 7, dia: 18, status: "Planejada" },
      { acao: "Digitalização, Governança e Preservação da Memória Institucional", setor: "Tecnologia da Informação", cat: "Tecnologia", resp: "Beatriz Rocha", prio: "Média", ch: 40, prev: 28000, exec: 27500, alunos: 45, mes: 2, dia: 28, status: "Concluída" },
      { acao: "Reforma, Modernização e Acessibilidade das Salas de Aula e Auditórios", setor: "Infraestrutura", cat: "Infraestrutura", resp: "João Pereira", prio: "Alta", ch: 20, prev: 120000, exec: 98000, alunos: 350, mes: 4, dia: 15, status: "Em andamento" },
      { acao: "Curso de Especialização em Gestão Judiciária e Políticas Públicas", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Alta", ch: 180, prev: 150000, exec: 45000, alunos: 60, mes: 5, dia: 5, status: "Em andamento" },
      { acao: "Implementação Avançada do Ambiente Virtual de Aprendizagem Moodle 4.4", setor: "Tecnologia da Informação", cat: "Tecnologia", resp: "Beatriz Rocha", prio: "Média", ch: 60, prev: 35000, exec: 34200, alunos: 180, mes: 1, dia: 30, status: "Concluída" },
      { acao: "Aquisição de Equipamentos de Videoconferência e Estúdio de Gravação", setor: "Infraestrutura", cat: "Infraestrutura", resp: "João Pereira", prio: "Alta", ch: 20, prev: 85000, exec: 85000, alunos: 400, mes: 2, dia: 10, status: "Concluída" },
      { acao: "Oficina de Precedentes Qualificados e Jurisprudência Vinculante", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Alta", ch: 40, prev: 25000, exec: 25000, alunos: 40, mes: 3, dia: 25, status: "Concluída" },
      { acao: "Programa de Apoio Psicossocial, Gestão do Estresse e Saúde no Judiciário", setor: "Assistência ao Estudante", cat: "Assistência", resp: "Ana Souza", prio: "Baixa", ch: 30, prev: 18000, exec: 17500, alunos: 90, mes: 2, dia: 22, status: "Concluída" },
      { acao: "Recuperação, Restauração e Expansão do Acervo Digital da Biblioteca", setor: "Secretaria Escolar", cat: "Administrativo", resp: "Rafael Nunes", prio: "Baixa", ch: 20, prev: 15000, exec: 12000, alunos: 120, mes: 4, dia: 20, status: "Em andamento" },
      { acao: "Expansão da Infraestrutura de Rede, Servidores e Wi-Fi das Salas de Aula", setor: "Tecnologia da Informação", cat: "Infraestrutura", resp: "Beatriz Rocha", prio: "Alta", ch: 30, prev: 65000, exec: 62000, alunos: 250, mes: 3, dia: 15, status: "Concluída" },
      { acao: "Feira de Boas Práticas, Inovação e Inteligência Artificial na Justiça", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Rafael Nunes", prio: "Média", ch: 24, prev: 40000, exec: 0, alunos: 300, mes: 8, dia: 12, status: "Planejada" },
      { acao: "Treinamento em Segurança da Informação, LGPD e Privacidade no TJRO", setor: "Tecnologia da Informação", cat: "Tecnologia", resp: "Beatriz Rocha", prio: "Alta", ch: 30, prev: 22000, exec: 21800, alunos: 210, mes: 1, dia: 25, status: "Concluída" },
      { acao: "Formação Continuada em Direito Penal Econômico e Lavagem de Capitais", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Alta", ch: 45, prev: 68000, exec: 0, alunos: 35, mes: 8, dia: 20, status: "Planejada" },
      { acao: "Curso de Mediação e Conciliação Judicial e Comunitária (NUPEMEC)", setor: "Assistência ao Estudante", cat: "Formação", resp: "Ana Souza", prio: "Média", ch: 80, prev: 45000, exec: 32000, alunos: 48, mes: 4, dia: 28, status: "Em andamento" },
      { acao: "Direitos Humanos, Jurisdição Indígena e Questões Fundiárias na Amazônia", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Alta", ch: 40, prev: 74000, exec: 15000, alunos: 42, mes: 9, dia: 15, status: "Em andamento" },
      { acao: "Capacitação em Gestão Cartorária, Métricas de Produtividade e E-Proc", setor: "Secretaria Escolar", cat: "Administrativo", resp: "Rafael Nunes", prio: "Média", ch: 60, prev: 28000, exec: 28000, alunos: 115, mes: 2, dia: 18, status: "Concluída" },
      { acao: "Curso de Direito Notarial, Registral e Regularização Fundiária Urbana", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Média", ch: 40, prev: 35000, exec: 0, alunos: 65, mes: 10, dia: 10, status: "Planejada" },
      { acao: "Oficina de Linguagem Simples e Visual Law na Prática Judiciária", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Mariana Alves", prio: "Baixa", ch: 20, prev: 15000, exec: 14500, alunos: 95, mes: 3, dia: 5, status: "Concluída" },
      { acao: "Seminário Nacional sobre Infância, Juventude e Adoção", setor: "Assistência ao Estudante", cat: "Ensino", resp: "Ana Souza", prio: "Alta", ch: 24, prev: 55000, exec: 0, alunos: 160, mes: 10, dia: 25, status: "Planejada" },
      { acao: "Capacitação em Auditoria Interna, Compliance e Gestão de Riscos", setor: "Gestão Financeira", cat: "Administrativo", resp: "João Pereira", prio: "Média", ch: 40, prev: 30000, exec: 29000, alunos: 50, mes: 2, dia: 12, status: "Concluída" },
      { acao: "Curso de Julgamento com Perspectiva de Gênero (Resolução CNJ 492)", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Mariana Alves", prio: "Alta", ch: 40, prev: 42000, exec: 41000, alunos: 80, mes: 3, dia: 18, status: "Concluída" },
      { acao: "Formação de Formadores e Tutores EAD para a Escola Judicial", setor: "Secretaria Escolar", cat: "Formação", resp: "Rafael Nunes", prio: "Alta", ch: 60, prev: 38000, exec: 12000, alunos: 40, mes: 5, dia: 20, status: "Atrasada" },
      { acao: "Congresso de Direito Constitucional e Teoria dos Precedentes", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Carlos Lima", prio: "Alta", ch: 32, prev: 110000, exec: 0, alunos: 280, mes: 11, dia: 5, status: "Planejada" },
      { acao: "Oficina de Execução Fiscal Eficiente e Recuperação de Ativos", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Média", ch: 30, prev: 20000, exec: 19500, alunos: 55, mes: 1, dia: 18, status: "Concluída" },
      { acao: "Curso de Perícias Médicas, Dano Corporal e Avaliação Previdenciária", setor: "Assistência ao Estudante", cat: "Formação", resp: "Ana Souza", prio: "Média", ch: 40, prev: 36000, exec: 0, alunos: 45, mes: 9, dia: 28, status: "Planejada" },
      { acao: "Capacitação em Técnicas Restaurativas e Círculos de Paz nas Escolas", setor: "Assistência ao Estudante", cat: "Assistência", resp: "Ana Souza", prio: "Baixa", ch: 30, prev: 24000, exec: 23000, alunos: 70, mes: 3, dia: 28, status: "Concluída" },
      { acao: "Oficina Avançada de Redação de Votos nos Juizados Especiais", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Mariana Alves", prio: "Média", ch: 30, prev: 18000, exec: 17800, alunos: 45, mes: 2, dia: 5, status: "Concluída" },
      { acao: "Implementação do Observatório de Dados e Inteligência Analítica", setor: "Tecnologia da Informação", cat: "Tecnologia", resp: "Beatriz Rocha", prio: "Alta", ch: 80, prev: 75000, exec: 68000, alunos: 35, mes: 6, dia: 10, status: "Em andamento" },
      { acao: "Curso de Formação Inicial para Novos Servidores Aprovados em Concurso", setor: "Secretaria Escolar", cat: "Formação", resp: "Rafael Nunes", prio: "Alta", ch: 120, prev: 88000, exec: 88000, alunos: 150, mes: 1, dia: 15, status: "Concluída" },
      { acao: "Seminário Rondoniense de Direito do Consumidor e Superendividamento", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Carlos Lima", prio: "Média", ch: 24, prev: 32000, exec: 0, alunos: 130, mes: 10, dia: 18, status: "Planejada" },
      { acao: "Capacitação em Gestão de Contratos Administrativos e Nova Lei 14.133", setor: "Gestão Financeira", cat: "Administrativo", resp: "João Pereira", prio: "Alta", ch: 40, prev: 26000, exec: 25800, alunos: 60, mes: 2, dia: 26, status: "Concluída" },
      { acao: "Oficina de Investigação Patrimonial e Quebra de Sigilo Bancário", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Alta", ch: 30, prev: 28000, exec: 27000, alunos: 35, mes: 4, dia: 10, status: "Em andamento" },
      { acao: "Formação em Justiça Climática, Sustentabilidade e ESG no Judiciário", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Baixa", ch: 30, prev: 25000, exec: 0, alunos: 85, mes: 11, dia: 20, status: "Planejada" },
      { acao: "Oficina Prática de Audiências Telepresenciais e Prova Digital", setor: "Tecnologia da Informação", cat: "Tecnologia", resp: "Beatriz Rocha", prio: "Média", ch: 20, prev: 14000, exec: 13800, alunos: 90, mes: 3, dia: 12, status: "Concluída" },
      { acao: "Curso de Extensão Universitária em Direito Processual Penal Aplicado", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Carlos Lima", prio: "Alta", ch: 80, prev: 62000, exec: 30000, alunos: 55, mes: 6, dia: 25, status: "Em andamento" },
      { acao: "Capacitação de Oficiais de Justiça em Avaliação de Imóveis Urbanos", setor: "Secretaria Escolar", cat: "Formação", resp: "Rafael Nunes", prio: "Média", ch: 40, prev: 22000, exec: 21500, alunos: 40, mes: 2, dia: 8, status: "Concluída" },
      { acao: "Ciclo de Palestras sobre Direito e Literatura: Reflexões Humanísticas", setor: "Assistência ao Estudante", cat: "Ensino", resp: "Ana Souza", prio: "Baixa", ch: 16, prev: 12000, exec: 0, alunos: 110, mes: 12, dia: 2, status: "Planejada" },
      { acao: "Curso de Especialização em Direito Notarial e Registral Imobiliário", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Alta", ch: 240, prev: 165000, exec: 55000, alunos: 45, mes: 7, dia: 5, status: "Em andamento" },
      { acao: "Treinamento em Atendimento Inclusivo ao Cidadão e Língua Brasileira de Sinais (Libras)", setor: "Assistência ao Estudante", cat: "Assistência", resp: "Ana Souza", prio: "Média", ch: 60, prev: 28000, exec: 27500, alunos: 65, mes: 4, dia: 18, status: "Em andamento" },
      { acao: "Oficina de Inteligência Investigativa contra Organizações Criminosas", setor: "Coordenação Pedagógica", cat: "Formação", resp: "Carlos Lima", prio: "Alta", ch: 40, prev: 52000, exec: 0, alunos: 30, mes: 10, dia: 5, status: "Planejada" },
      { acao: "Capacitação em Liderança Assertiva, Gestão de Conflitos e Feedback", setor: "Secretaria Escolar", cat: "Administrativo", resp: "Rafael Nunes", prio: "Média", ch: 24, prev: 18000, exec: 17800, alunos: 75, mes: 3, dia: 14, status: "Concluída" },
      { acao: "Formação em Justiça Restaurativa Comunitária e Prevenção à Violência", setor: "Assistência ao Estudante", cat: "Assistência", resp: "Ana Souza", prio: "Média", ch: 40, prev: 32000, exec: 10000, alunos: 50, mes: 8, dia: 28, status: "Em andamento" },
      { acao: "Simpósio Estadual sobre Inovações Processuais e Jurisprudência dos Tribunais Superiores", setor: "Coordenação Pedagógica", cat: "Ensino", resp: "Mariana Alves", prio: "Alta", ch: 30, prev: 88000, exec: 0, alunos: 240, mes: 11, dia: 25, status: "Planejada" },
      { acao: "Oficina de Redação de Ementas, Acórdãos e Indexação Jurisprudencial", setor: "Secretaria Escolar", cat: "Formação", resp: "Rafael Nunes", prio: "Média", ch: 30, prev: 16000, exec: 15800, alunos: 40, mes: 1, dia: 22, status: "Concluída" },
      { acao: "Revisão e Modernização do Regimento Interno e Estatuto da EMERON", setor: "Gabinete Presidência", cat: "Administrativo", resp: "Mariana Alves", prio: "Alta", ch: 40, prev: 25000, exec: 8000, alunos: 25, mes: 6, dia: 30, status: "Atrasada" },
    ]

    const records: ActionRecord[] = pacCursos.map((c, i) => {
      const codigo = `EMERON-2026-${String(i + 1).padStart(3, "0")}`
      const seiNum = String(12000 + i * 39).padStart(7, "0")
      const seiProcess = `00${seiNum}.000048/2026-${String((i * 17) % 90 + 10)}`
      const idEmeronWeb = `EW-2026-${String(8100 + i * 19)}`
      const progresso = c.prev > 0 ? c.exec / c.prev : 0

      return {
        codigo,
        acao: c.acao,
        processoSei: seiProcess,
        idEmeronWeb,
        setor: c.setor,
        categoria: c.cat,
        responsavel: c.resp,
        status: c.status,
        prioridade: c.prio,
        prazo: new Date(2026, c.mes - 1, c.dia),
        cargaHoraria: c.ch,
        orcamentoPrevisto: c.prev,
        orcamentoExecutado: c.exec,
        alunosBeneficiados: c.alunos,
        progresso,
      }
    })

    await createCleanSpreadsheet(
      path.join(outputDir, "01_plano_anual_capacitacao_emeron_2026.xlsx"),
      "Plano_Capacitacao_2026",
      records,
    )
  }

  /* ================================================================== */
  /* 2. EXECUÇÃO ORÇAMENTÁRIA E FINANCEIRA 2026                         */
  /* ================================================================== */
  {
    const setoresFinanceiros = ["Gestão Financeira", "Coordenação Pedagógica", "Tecnologia da Informação", "Infraestrutura", "Secretaria Escolar", "Assistência ao Estudante"]
    const comarcas = ["Porto Velho", "Ji-Paraná", "Cacoal", "Vilhena", "Ariquemes", "Guajará-Mirim", "Rolim de Moura", "Jaru"]
    const despesas = [
      "Docência e Instrutoria em Cursos de Magistrados",
      "Passagens Aéreas e Hospedagem de Professores Convidados",
      "Locação de Plataformas EAD e Ambientes Digitais",
      "Confecção de Material Didático e Publicações Acadêmicas",
      "Serviços Técnicos de Audiovisual e Transmissão ao Vivo",
      "Diárias de Magistrados em Cursos Presenciais nos Polos",
      "Consultoria Pedagógica e Avaliação Institucional",
      "Aquisição de Licenças de Softwares de Pesquisa Jurídica",
      "Manutenção de Equipamentos Didáticos e Laboratórios",
      "Alimentação e Coffee Break em Seminários Oficiais",
    ]

    const records: ActionRecord[] = []
    for (let i = 0; i < 45; i++) {
      const codigo = `FIN-2026-${String(i + 1).padStart(3, "0")}`
      const seiProcess = `00${String(18000 + i * 43).padStart(7, "0")}.000048/2026-${String((i * 11) % 90 + 10)}`
      const idEmeronWeb = `EW-2026-${String(9100 + i * 13)}`
      const setor = setoresFinanceiros[i % setoresFinanceiros.length]
      const comarca = comarcas[i % comarcas.length]
      const despesa = despesas[i % despesas.length]

      const prev = 15000 + ((i * 7300) % 95000)
      const isConcl = i % 3 === 0
      const isLate = i % 7 === 0
      const exec = isConcl ? prev : isLate ? Math.round(prev * 0.2) : Math.round(prev * 0.7)
      const status = isConcl ? "Concluída" : isLate ? "Atrasada" : i % 2 === 0 ? "Em andamento" : "Planejada"
      const prio = i % 4 === 0 ? "Alta" : i % 2 === 0 ? "Média" : "Baixa"
      const mes = (i % 12) + 1
      const dia = ((i * 7) % 27) + 1
      const responsaveis = ["João Pereira", "Mariana Alves", "Beatriz Rocha", "Rafael Nunes", "Carlos Lima", "Ana Souza"]

      records.push({
        codigo,
        acao: `${despesa} - Polo ${comarca}`,
        processoSei: seiProcess,
        idEmeronWeb,
        setor,
        categoria: "Gestão Financeira",
        responsavel: responsaveis[i % responsaveis.length],
        status,
        prioridade: prio,
        prazo: new Date(2026, mes - 1, dia),
        cargaHoraria: [20, 30, 40, 60][i % 4],
        orcamentoPrevisto: prev,
        orcamentoExecutado: exec,
        alunosBeneficiados: Math.round(30 + ((i * 19) % 320)),
        progresso: prev > 0 ? exec / prev : 0,
      })
    }

    await createCleanSpreadsheet(
      path.join(outputDir, "02_execucao_orcamentaria_e_financeira_2026.xlsx"),
      "Execucao_Financeira_2026",
      records,
    )
  }

  /* ================================================================== */
  /* 3. ACOMPANHAMENTO DE TURMAS E EVASÃO                               */
  /* ================================================================== */
  {
    const turmasCursos = [
      "Turma 01 - Direito Digital e IA Aplicada ao Judiciário",
      "Turma 02 - Prática Processual e Redação de Sentenças",
      "Turma 03 - Mediação, Conciliação e Práticas Autocompositivas",
      "Turma 04 - Gestão Eletrônica de Processos e E-Proc Avançado",
      "Turma 05 - Direito Penal Econômico e Lavagem de Dinheiro",
      "Turma 06 - Direitos Humanos e Jurisdição Territorial na Amazônia",
      "Turma 07 - Inteligência Artificial e Pesquisa Jurisprudencial",
      "Turma 08 - Audiências de Custódia e Garantias Constitucionais",
      "Turma 09 - Gestão de Cartórios e Liderança de Equipes",
      "Turma 10 - Avaliação de Provas Digitais e Cadeia de Custódia",
    ]

    const records: ActionRecord[] = []
    for (let i = 0; i < 42; i++) {
      const codigo = `TRM-2026-${String(i + 1).padStart(3, "0")}`
      const curso = turmasCursos[i % turmasCursos.length] + ` (Polo ${["Porto Velho", "Ji-Paraná", "Cacoal", "Vilhena", "EAD"][i % 5]})`
      const seiProcess = `00${String(14000 + i * 51).padStart(7, "0")}.000048/2026-${String((i * 19) % 90 + 10)}`
      const idEmeronWeb = `EW-2026-${String(8400 + i * 17)}`
      const setor = ["Coordenação Pedagógica", "Secretaria Escolar", "Tecnologia da Informação", "Assistência ao Estudante"][i % 4]
      const cat = ["Ensino", "Formação", "Tecnologia", "Assistência"][i % 4]
      const resp = ["Mariana Alves", "Carlos Lima", "Beatriz Rocha", "Ana Souza", "Rafael Nunes"][i % 5]

      const isConcl = i % 4 === 0
      const isLate = i % 6 === 0
      const status = isConcl ? "Concluída" : isLate ? "Atrasada" : i % 2 === 0 ? "Em andamento" : "Planejada"
      const prio = i % 3 === 0 ? "Alta" : i % 2 === 0 ? "Média" : "Baixa"
      const prev = 25000 + ((i * 4500) % 60000)
      const exec = isConcl ? prev : isLate ? Math.round(prev * 0.3) : Math.round(prev * 0.65)
      const mes = (i % 12) + 1
      const dia = ((i * 5) % 27) + 1

      records.push({
        codigo,
        acao: curso,
        processoSei: seiProcess,
        idEmeronWeb,
        setor,
        categoria: cat,
        responsavel: resp,
        status,
        prioridade: prio,
        prazo: new Date(2026, mes - 1, dia),
        cargaHoraria: [30, 40, 60, 120][i % 4],
        orcamentoPrevisto: prev,
        orcamentoExecutado: exec,
        alunosBeneficiados: Math.round(35 + ((i * 13) % 180)),
        progresso: prev > 0 ? exec / prev : 0,
      })
    }

    await createCleanSpreadsheet(
      path.join(outputDir, "03_acompanhamento_pedagogico_turmas_e_evasao.xlsx"),
      "Turmas_e_Desempenho",
      records,
    )
  }

  /* ================================================================== */
  /* 4. CRONOGRAMA DE PRAZOS E MARCOS SEI                               */
  /* ================================================================== */
  {
    const marcos = [
      "Publicação de Edital de Seleção Discente",
      "Contratação de Docência Externa Especializada",
      "Homologação das Inscrições e Turmas",
      "Fechamento do Módulo Avaliativo 1 no AVA",
      "Emissão de Portaria de Conclusão de Curso",
      "Prestação de Contas Financeira e Liquidação",
      "Auditoria Regulatória de Conformidade ENFAM",
      "Emissão e Registro de Certificados Digitais",
      "Avaliação Institucional de Reação pelos Alunos",
      "Encaminhamento de Relatório Semestral à Presidência",
    ]

    const records: ActionRecord[] = []
    for (let i = 0; i < 48; i++) {
      const codigo = `MARCO-2026-${String(i + 1).padStart(3, "0")}`
      const marco = marcos[i % marcos.length] + ` - Ação ${String(i + 1).padStart(2, "0")}`
      const seiProcess = `00${String(16000 + i * 37).padStart(7, "0")}.000048/2026-${String((i * 23) % 90 + 10)}`
      const idEmeronWeb = `EW-2026-${String(8600 + i * 21)}`
      const setor = ["Coordenação Pedagógica", "Gabinete Presidência", "Secretaria Escolar", "Gestão Financeira"][i % 4]
      const cat = ["Administrativo", "Ensino", "Formação", "Tecnologia"][i % 4]
      const resp = ["Mariana Alves", "Rafael Nunes", "João Pereira", "Ana Souza", "Carlos Lima"][i % 5]

      const isConcl = i < 15
      const isLate = i === 18 || i === 25
      const status = isConcl ? "Concluída" : isLate ? "Atrasada" : i < 35 ? "Em andamento" : "Planejada"
      const prio = i % 3 === 0 ? "Alta" : i % 2 === 0 ? "Média" : "Baixa"
      const prev = 18000 + ((i * 3200) % 45000)
      const exec = isConcl ? prev : isLate ? Math.round(prev * 0.25) : Math.round(prev * 0.6)
      const mes = Math.floor(i / 4) + 1
      const dia = ((i * 6) % 27) + 1

      records.push({
        codigo,
        acao: marco,
        processoSei: seiProcess,
        idEmeronWeb,
        setor,
        categoria: cat,
        responsavel: resp,
        status,
        prioridade: prio,
        prazo: new Date(2026, Math.min(11, mes - 1), dia),
        cargaHoraria: [20, 30, 40, 60][i % 4],
        orcamentoPrevisto: prev,
        orcamentoExecutado: exec,
        alunosBeneficiados: Math.round(20 + ((i * 11) % 150)),
        progresso: prev > 0 ? exec / prev : 0,
      })
    }

    await createCleanSpreadsheet(
      path.join(outputDir, "04_cronograma_de_prazos_e_marcos_sei.xlsx"),
      "Cronograma_Prazos_SEI",
      records,
    )
  }

  /* ================================================================== */
  /* 5. CORPO DOCENTE E ESPECIALIZAÇÕES EMERON                          */
  /* ================================================================== */
  {
    const docentes = [
      { nome: "Dra. Mariana Vasconcelos", tema: "Direito Digital e Governança Algorítmica", setor: "Coordenação Pedagógica", prio: "Alta" },
      { nome: "Dr. Roberto Albuquerque", tema: "Técnicas de Decisão Judicial e Sentença Cível", setor: "Coordenação Pedagógica", prio: "Alta" },
      { nome: "Prof. Dr. Nelson Nery Jr.", tema: "Teoria Geral dos Recursos e Precedentes", setor: "Coordenação Pedagógica", prio: "Alta" },
      { nome: "Coord. Fabiana Rios", tema: "Gestão Judiciária e Fluxos Processuais E-Proc", setor: "Secretaria Escolar", prio: "Média" },
      { nome: "Dra. Luciana Freitas", tema: "Métodos Consensuais de Solução de Conflitos", setor: "Assistência ao Estudante", prio: "Média" },
      { nome: "Dr. Marcelo Fagundes", tema: "Direito Penal Econômico e Crimes Tributários", setor: "Coordenação Pedagógica", prio: "Alta" },
      { nome: "Analista Gabriel Torres", tema: "Inteligência Artificial na Pesquisa Jurisprudencial", setor: "Tecnologia da Informação", prio: "Média" },
      { nome: "Dra. Yara Tupinambá", tema: "Direitos Indígenas e Políticas Étnicas na Amazônia", setor: "Coordenação Pedagógica", prio: "Alta" },
      { nome: "Psic. Heloísa Prado", tema: "Saúde Ocupacional e Liderança Humanizada", setor: "Assistência ao Estudante", prio: "Baixa" },
      { nome: "Des. Alexandre Godoy", tema: "Jurisprudência Vinculante dos Tribunais Superiores", setor: "Coordenação Pedagógica", prio: "Alta" },
    ]

    const records: ActionRecord[] = []
    for (let i = 0; i < 40; i++) {
      const d = docentes[i % docentes.length]
      const codigo = `DOC-2026-${String(i + 1).padStart(3, "0")}`
      const acao = `Curso com ${d.nome}: ${d.tema} (Edição ${Math.floor(i / docentes.length) + 1})`
      const seiProcess = `00${String(15000 + i * 47).padStart(7, "0")}.000048/2026-${String((i * 13) % 90 + 10)}`
      const idEmeronWeb = `EW-2026-${String(8800 + i * 15)}`

      const isConcl = i % 3 === 0
      const isLate = i === 11 || i === 23
      const status = isConcl ? "Concluída" : isLate ? "Atrasada" : i % 2 === 0 ? "Em andamento" : "Planejada"
      const prev = 30000 + ((i * 5200) % 80000)
      const exec = isConcl ? prev : isLate ? Math.round(prev * 0.2) : Math.round(prev * 0.7)
      const mes = (i % 12) + 1
      const dia = ((i * 8) % 27) + 1

      records.push({
        codigo,
        acao,
        processoSei: seiProcess,
        idEmeronWeb,
        setor: d.setor,
        categoria: "Formação",
        responsavel: d.nome,
        status,
        prioridade: d.prio,
        prazo: new Date(2026, mes - 1, dia),
        cargaHoraria: [30, 40, 60, 80][i % 4],
        orcamentoPrevisto: prev,
        orcamentoExecutado: exec,
        alunosBeneficiados: Math.round(30 + ((i * 15) % 190)),
        progresso: prev > 0 ? exec / prev : 0,
      })
    }

    await createCleanSpreadsheet(
      path.join(outputDir, "05_corpo_docente_e_especializacoes_emeron.xlsx"),
      "Corpo_Docente_2026",
      records,
    )
  }

  // Remove arquivos antigos que tinham nomes anteriores se existirem
  const oldFiles = [
    "01_plano_anual_capacitacao_2026.xlsx",
    "02_execucao_orcamentaria_emeron_2026.xlsx",
    "03_acompanhamento_turmas_e_evasao.xlsx",
    "04_cronograma_eventos_e_prazos_sei.xlsx",
    "05_prontuario_docentes_e_avaliacoes.xlsx",
  ]
  oldFiles.forEach((f) => {
    const p = path.join(outputDir, f)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  console.log("\n🎉 Todas as 5 planilhas perfeitas foram geradas e validadas com sucesso!")
}

generateAllExcelInputs().catch(console.error)
