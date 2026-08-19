import * as fs from "fs"
import * as path from "path"
import ExcelJS from "exceljs"

async function generateSampleExcelFiles() {
  const outputDir = path.join(process.cwd(), "inputs")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log("Gerando 5 planilhas Excel completas em:", outputDir)

  const C_NAVY = "0D2D46"
  const C_LIGHT_BLUE = "E0F2FE"
  const C_ZEBRA = "F8FAFC"
  const C_BORDER = "CBD5E1"

  function styleWorksheet(
    ws: ExcelJS.Worksheet,
    title: string,
    subtitle: string,
    headers: string[],
    rows: (string | number | Date)[][],
    columnWidths: number[],
    numFormats: Record<number, string> = {},
    alignments: Record<number, "left" | "center" | "right"> = {},
  ) {
    // 1. Banner Superior
    ws.mergeCells(1, 1, 1, headers.length)
    const titleCell = ws.getCell(1, 1)
    titleCell.value = title.toUpperCase()
    titleCell.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } }
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C_NAVY } }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(1).height = 28

    ws.mergeCells(2, 1, 2, headers.length)
    const subCell = ws.getCell(2, 1)
    subCell.value = `${subtitle} · Gerado em ${new Date().toLocaleDateString("pt-BR")}`
    subCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF" + C_NAVY } }
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C_LIGHT_BLUE } }
    subCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(2).height = 20

    ws.addRow([]) // Linha 3 vazia

    // 2. Linha de Cabeçalho (Linha 4)
    const headerRow = ws.addRow(headers)
    headerRow.height = 24
    headerRow.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + C_NAVY } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = {
        top: { style: "thin", color: { argb: "FF" + C_NAVY } },
        bottom: { style: "medium", color: { argb: "FF" + C_NAVY } },
        left: { style: "thin", color: { argb: "FF" + C_NAVY } },
        right: { style: "thin", color: { argb: "FF" + C_NAVY } },
      }
    })

    // 3. Linhas de Dados
    rows.forEach((r, idx) => {
      const row = ws.addRow(r)
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

        // Alinhamento
        const align = alignments[colNum] || (typeof cell.value === "number" ? "right" : "left")
        cell.alignment = { horizontal: align, vertical: "middle" }

        // Formato numérico
        if (numFormats[colNum]) {
          cell.numFmt = numFormats[colNum]
        }
      })
    })

    // Larguras das colunas
    ws.columns = columnWidths.map((w) => ({ width: w }))
  }

  /* ------------------------------------------------------------------ */
  /* 1. PLANO ANUAL DE CAPACITAÇÃO 2026                                */
  /* ------------------------------------------------------------------ */
  {
    const wb = new ExcelJS.Workbook()
    wb.creator = "EMERON / TJ-RO"
    const ws = wb.addWorksheet("Acoes_Capacitacao_2026")

    const headers = [
      "Codigo_Acao",
      "Nome_Acao",
      "Setor_Demandante",
      "Eixo_Tematico",
      "Publico_Alvo",
      "Modalidade",
      "Carga_Horaria",
      "Vagas_Ofertadas",
      "Inscritos",
      "Status",
      "Prioridade",
      "Data_Inicio",
      "Data_Termino",
      "Orcamento_Previsto",
      "Orcamento_Executado",
      "Processo_SEI",
      "Responsavel",
    ]

    const rows = [
      ["EMERON-2026-001", "Pós-Graduação em Direito Digital e Inteligência Artificial", "Gabinete Presidência", "Direito e Tecnologia", "Magistrados e Assessores", "Híbrido", 360, 45, 52, "Em Andamento", "Alta", "2026-03-02", "2026-11-30", 185000, 142000, "0012345.000048/2026-12", "Dra. Mariana Vasconcelos"],
      ["EMERON-2026-002", "Oficina Prática de Redação de Sentenças Cíveis", "Corregedoria-Geral", "Prática Jurisdicional", "Juízes Substitutos", "Presencial", 40, 30, 28, "Concluído", "Alta", "2026-02-10", "2026-02-28", 32000, 31500, "0012345.000072/2026-55", "Dr. Roberto Albuquerque"],
      ["EMERON-2026-003", "Capacitação Avançada em Gestão Processual e E-Proc", "Secretaria Judiciária", "Gestão Judiciária", "Chefes de Cartório", "EAD", 60, 120, 115, "Em Andamento", "Média", "2026-04-01", "2026-05-15", 28000, 18200, "0012345.000103/2026-91", "Coord. Fabiana Rios"],
      ["EMERON-2026-004", "Simpósio Rondoniense de Direito Ambiental e Amazônia", "Comitê Ambiental TJRO", "Direito Ambiental", "Magistrados e Comunidade", "Presencial", 24, 200, 210, "Planejada", "Alta", "2026-08-18", "2026-08-20", 95000, 0, "0012345.000144/2026-30", "Des. Carlos Eduardo Mendes"],
      ["EMERON-2026-005", "Curso de Aperfeiçoamento em Mediação e Conciliação Judicial (NUPEMEC)", "NUPEMEC", "Métodos Consensuais", "Servidores e Mediadores", "Híbrido", 80, 50, 48, "Em Andamento", "Média", "2026-03-15", "2026-05-30", 45000, 29000, "0012345.000189/2026-88", "Dra. Luciana Freitas"],
      ["EMERON-2026-006", "Formação Continuada em Direito Penal Econômico e Lavagem de Capitais", "Varas Criminais", "Ciências Criminais", "Magistrados Criminais", "Presencial", 45, 35, 33, "Planejada", "Alta", "2026-09-01", "2026-09-15", 68000, 0, "0012345.000210/2026-14", "Dr. Marcelo Fagundes"],
      ["EMERON-2026-007", "Inteligência Artificial Aplicada à Pesquisa Jurisprudencial", "DTI - Tecnologia da Informação", "Direito e Tecnologia", "Assessores Jurídicos", "EAD", 30, 150, 148, "Concluído", "Baixa", "2026-01-15", "2026-02-15", 15000, 14800, "0012345.000245/2026-67", "Analista Gabriel Torres"],
      ["EMERON-2026-008", "Direitos Humanos, Povos Tradicionais e Jurisdição Indígena", "Comissão de Direitos Humanos", "Direitos Fundamentais", "Magistrados da Amazônia", "Presencial", 40, 40, 39, "Em Análise", "Alta", "2026-10-05", "2026-10-09", 74000, 12000, "0012345.000301/2026-42", "Dra. Yara Tupinambá"],
      ["EMERON-2026-009", "Gestão Emocional, Prevenção ao Burnout e Liderança Humanizada", "Secretaria de Gestão de Pessoas", "Saúde e Liderança", "Magistrados e Diretores", "Híbrido", 20, 80, 76, "Concluído", "Média", "2026-03-01", "2026-03-20", 22000, 21500, "0012345.000340/2026-19", "Psic. Heloísa Prado"],
      ["EMERON-2026-010", "Seminário Internacional sobre o Novo Código de Processo Civil e Precedentes", "Diretoria Geral EMERON", "Direito Processual", "Magistrados e Servidores", "Presencial", 32, 250, 245, "Planejada", "Alta", "2026-11-10", "2026-11-13", 120000, 0, "0012345.000412/2026-80", "Des. Alexandre Godoy"],
    ]

    const widths = [18, 48, 25, 22, 25, 14, 15, 16, 14, 16, 14, 14, 14, 20, 20, 24, 28]
    const numFmts: Record<number, string> = {
      7: "#,##0",
      8: "#,##0",
      9: "#,##0",
      14: '"R$ "#,##0.00',
      15: '"R$ "#,##0.00',
    }
    const aligns: Record<number, "left" | "center" | "right"> = {
      1: "center",
      6: "center",
      7: "center",
      8: "center",
      9: "center",
      10: "center",
      11: "center",
      12: "center",
      13: "center",
      14: "right",
      15: "right",
      16: "center",
    }

    styleWorksheet(ws, "PLANO ANUAL DE CAPACITAÇÃO 2026 — EMERON / TJ-RO", "Matriz Geral de Cursos, Pós-Graduações, Oficinas e Seminários", headers, rows, widths, numFmts, aligns)
    await wb.xlsx.writeFile(path.join(outputDir, "01_plano_anual_capacitacao_2026.xlsx"))
  }

  /* ------------------------------------------------------------------ */
  /* 2. EXECUÇÃO ORÇAMENTÁRIA EMERON 2026                              */
  /* ------------------------------------------------------------------ */
  {
    const wb = new ExcelJS.Workbook()
    wb.creator = "EMERON / TJ-RO"
    const ws = wb.addWorksheet("Execucao_Orcamentaria")

    const headers = [
      "Numero_Empenho",
      "Processo_SEI",
      "Acao_Formativa",
      "Elemento_Despesa",
      "Favorecido_Contratado",
      "Valor_Dotacao",
      "Valor_Empenhado",
      "Valor_Liquidado",
      "Valor_Pago",
      "Saldo_Dotacao",
      "Fonte_Recurso",
      "Status_Liquidacao",
      "Data_Emissao",
      "Comarca_Polo",
    ]

    const rows = [
      ["2026NE000142", "0012345.000048/2026-12", "Pós-Graduação em Direito Digital e IA", "33.90.39 - Outros Serviços Terceiros PJ", "Fundação Getulio Vargas (FGV)", 185000, 185000, 142000, 142000, 43000, "0100 - Tesouro Estadual", "Parcialmente Liquidado", "2026-02-15", "Porto Velho"],
      ["2026NE000155", "0012345.000072/2026-55", "Oficina de Redação de Sentenças", "33.90.36 - Serviços Terceiros PF (Docência)", "Prof. Dr. Nelson Nery Jr.", 32000, 32000, 31500, 31500, 500, "0100 - Tesouro Estadual", "Totalmente Liquidado", "2026-01-20", "Porto Velho"],
      ["2026NE000188", "0012345.000103/2026-91", "Capacitação em Gestão E-Proc", "33.90.39 - Licença Software e Plataforma EAD", "EdTech Soluções Educacionais Ltda", 28000, 28000, 18200, 18200, 9800, "0240 - Recursos Próprios TJRO", "Parcialmente Liquidado", "2026-03-10", "Ji-Paraná"],
      ["2026NE000212", "0012345.000144/2026-30", "Simpósio de Direito Ambiental", "33.90.30 - Material de Consumo e Apoio", "Gráfica & Editora Rondoniense Ltda", 15000, 15000, 0, 0, 15000, "0100 - Tesouro Estadual", "Pendente", "2026-04-02", "Cacoal"],
      ["2026NE000213", "0012345.000144/2026-30", "Simpósio de Direito Ambiental", "33.90.33 - Passagens e Diárias de Palestrantes", "Companhia Aérea Gol / Latam", 80000, 80000, 0, 0, 80000, "0100 - Tesouro Estadual", "Pendente", "2026-04-02", "Porto Velho"],
      ["2026NE000245", "0012345.000189/2026-88", "Curso Mediação e Conciliação NUPEMEC", "33.90.36 - Instrutoria e Treinamento", "Instrutora Maria Clara Esteves", 45000, 45000, 29000, 29000, 16000, "0240 - Recursos Próprios TJRO", "Parcialmente Liquidado", "2026-02-28", "Vilhena"],
      ["2026NE000280", "0012345.000245/2026-67", "IA Aplicada à Jurisprudência", "33.90.39 - Servidores e Cloud Computing", "Amazon Web Services Brasil", 15000, 15000, 14800, 14800, 200, "0100 - Tesouro Estadual", "Totalmente Liquidado", "2026-01-10", "Porto Velho"],
      ["2026NE000310", "0012345.000301/2026-42", "Direitos Humanos e Jurisdição Indígena", "33.90.36 - Docência de Especialistas", "Antropólogo Dr. Vicente Meireles", 74000, 74000, 12000, 12000, 62000, "0100 - Tesouro Estadual", "Parcialmente Liquidado", "2026-04-12", "Guajará-Mirim"],
      ["2026NE000335", "0012345.000340/2026-19", "Gestão Emocional e Liderança", "33.90.39 - Consultoria em Desenvolvimento", "Instituto Liderança e Saúde Mental", 22000, 22000, 21500, 21500, 500, "0240 - Recursos Próprios TJRO", "Totalmente Liquidado", "2026-02-18", "Ariquemes"],
      ["2026NE000390", "0012345.000412/2026-80", "Seminário Novo CPC e Precedentes", "33.90.39 - Organização de Grandes Eventos", "Eventos & Convenções da Amazônia", 120000, 120000, 0, 0, 120000, "0100 - Tesouro Estadual", "Pendente", "2026-05-05", "Porto Velho"],
    ]

    const widths = [18, 24, 38, 32, 32, 18, 18, 18, 18, 18, 24, 22, 14, 18]
    const numFmts: Record<number, string> = {
      6: '"R$ "#,##0.00',
      7: '"R$ "#,##0.00',
      8: '"R$ "#,##0.00',
      9: '"R$ "#,##0.00',
      10: '"R$ "#,##0.00',
    }
    const aligns: Record<number, "left" | "center" | "right"> = {
      1: "center",
      2: "center",
      6: "right",
      7: "right",
      8: "right",
      9: "right",
      10: "right",
      12: "center",
      13: "center",
      14: "center",
    }

    styleWorksheet(ws, "EXECUÇÃO ORÇAMENTÁRIA E FINANCEIRA 2026 — EMERON", "Acompanhamento de Empenhos, Liquidações, Pagamentos e Saldos de Dotação", headers, rows, widths, numFmts, aligns)
    await wb.xlsx.writeFile(path.join(outputDir, "02_execucao_orcamentaria_emeron_2026.xlsx"))
  }

  /* ------------------------------------------------------------------ */
  /* 3. ACOMPANHAMENTO DE TURMAS E EVASÃO                              */
  /* ------------------------------------------------------------------ */
  {
    const wb = new ExcelJS.Workbook()
    wb.creator = "EMERON / TJ-RO"
    const ws = wb.addWorksheet("Controle_Turmas_Evasao")

    const headers = [
      "Codigo_Turma",
      "Nome_Curso",
      "Instrutor_Responsavel",
      "Ambiente_AVA",
      "Total_Matriculados",
      "Participantes_Ativos",
      "Concluintes",
      "Evasoes_Registradas",
      "Taxa_Conclusao",
      "Media_Final_Turma",
      "NPS_Satisfacao",
      "Status_Turma",
      "Data_Fechamento",
      "Certificados_Emitidos",
    ]

    const rows = [
      ["TURMA-2026-T1", "Pós-Graduação em Direito Digital e IA", "Dra. Mariana Vasconcelos", "Moodle Institucional", 45, 42, 0, 3, 0.933, 8.8, 94, "Em Andamento", "2026-11-30", 0],
      ["TURMA-2026-T2", "Oficina de Redação de Sentenças Cíveis", "Dr. Roberto Albuquerque", "Sala Presencial EMERON 1", 30, 30, 29, 1, 0.967, 9.2, 98, "Concluída", "2026-02-28", 29],
      ["TURMA-2026-T3", "Gestão Processual e E-Proc", "Coord. Fabiana Rios", "Moodle Institucional", 120, 108, 0, 12, 0.900, 8.4, 88, "Em Andamento", "2026-05-15", 0],
      ["TURMA-2026-T4", "IA Aplicada à Pesquisa Jurisprudencial", "Analista Gabriel Torres", "Google Classroom / Teams", 150, 145, 142, 5, 0.947, 9.0, 96, "Concluída", "2026-02-15", 142],
      ["TURMA-2026-T5", "Mediação e Conciliação Judicial (NUPEMEC)", "Dra. Luciana Freitas", "Moodle + Sala de Audiência", 50, 47, 0, 3, 0.940, 8.6, 92, "Em Andamento", "2026-05-30", 0],
      ["TURMA-2026-T6", "Gestão Emocional e Liderança Humanizada", "Psic. Heloísa Prado", "Auditório Principal TJRO", 80, 78, 76, 2, 0.950, 9.5, 99, "Concluída", "2026-03-20", 76],
      ["TURMA-2026-T7", "Audiências de Custódia e Garantias Processuais", "Juiz Substituto Rogério Matos", "Presencial Ji-Paraná", 40, 36, 0, 4, 0.900, 8.1, 85, "Em Andamento", "2026-06-10", 0],
      ["TURMA-2026-T8", "Oratória, Argumentação e Sustentação Oral", "Prof. Paulo Henrique Siqueira", "Moodle + Webinários", 60, 52, 49, 8, 0.817, 7.9, 82, "Concluída", "2026-03-10", 49],
      ["TURMA-2026-T9", "Direito Notarial e Registral na Amazônia", "Tabelião Convidado Marcos Viana", "Moodle Institucional", 70, 68, 0, 2, 0.971, 8.9, 91, "Em Andamento", "2026-07-20", 0],
      ["TURMA-2026-T10", "Direitos Fundamentais e Povos Indígenas", "Dra. Yara Tupinambá", "Polo Guajará-Mirim", 40, 39, 0, 1, 0.975, 9.3, 97, "Planejada", "2026-10-09", 0],
    ]

    const widths = [18, 42, 28, 25, 18, 18, 16, 18, 16, 18, 16, 16, 16, 20]
    const numFmts: Record<number, string> = {
      5: "#,##0",
      6: "#,##0",
      7: "#,##0",
      8: "#,##0",
      9: "0.0%",
      10: "0.0",
      11: "0",
      14: "#,##0",
    }
    const aligns: Record<number, "left" | "center" | "right"> = {
      1: "center",
      4: "center",
      5: "center",
      6: "center",
      7: "center",
      8: "center",
      9: "center",
      10: "center",
      11: "center",
      12: "center",
      13: "center",
      14: "center",
    }

    styleWorksheet(ws, "CONTROLE PEDAGÓGICO DE TURMAS E DESEMPENHO ACADÊMICO", "Acompanhamento de Matrículas, Frequência, Evasão e Avaliação de Satisfação", headers, rows, widths, numFmts, aligns)
    await wb.xlsx.writeFile(path.join(outputDir, "03_acompanhamento_turmas_e_evasao.xlsx"))
  }

  /* ------------------------------------------------------------------ */
  /* 4. CRONOGRAMA DE EVENTOS E PRAZOS SEI                             */
  /* ------------------------------------------------------------------ */
  {
    const wb = new ExcelJS.Workbook()
    wb.creator = "EMERON / TJ-RO"
    const ws = wb.addWorksheet("Cronograma_Prazos_SEI")

    const headers = [
      "ID_Evento",
      "Descricao_Atividade",
      "Tipo_Evento",
      "Setor_Responsavel",
      "Data_Limite",
      "Data_Conclusao",
      "Dias_Restantes",
      "Status_Prazo",
      "Impacto_Institucional",
      "Numero_Processo_SEI",
      "Observacoes_Operacionais",
    ]

    const rows = [
      ["EVT-2026-01", "Publicação do Edital do Processo Seletivo de Pós-Graduação", "Edital", "Secretaria Acadêmica", "2026-01-15", "2026-01-14", 0, "Concluído", "Crítico", "0012345.000048/2026-12", "Publicado no DJE edição 012/2026"],
      ["EVT-2026-02", "Contratação dos Docentes da Oficina de Sentenças", "Contrato", "Coordenadoria Financeira", "2026-01-30", "2026-01-28", 0, "Concluído", "Alto", "0012345.000072/2026-55", "Contrato assinado pelo Diretor-Geral"],
      ["EVT-2026-03", "Lançamento de Notas do Módulo 1 da Pós-Graduação", "Avaliação", "Coordenação Pedagógica", "2026-04-15", "", 12, "Em Andamento", "Médio", "0012345.000048/2026-12", "Professores enviando notas pelo Moodle"],
      ["EVT-2026-04", "Prestação de Contas do Simpósio de Direito Ambiental", "Financeiro", "Comissão Organizadora", "2026-09-10", "", 150, "Pendente", "Alto", "0012345.000144/2026-30", "Aguardando realização do evento"],
      ["EVT-2026-05", "Emissão dos Certificados do Curso de Conciliação NUPEMEC", "Certificação", "Secretaria de Registros", "2026-06-15", "", 70, "Pendente", "Médio", "0012345.000189/2026-88", "Necessita frequência mínima de 75%"],
      ["EVT-2026-06", "Auditoria de Conformidade Regulatória ENFAM", "Auditoria", "Gabinete da Direção", "2026-07-30", "", 110, "Em Análise", "Crítico", "0012345.000500/2026-01", "Dossiê pedagógico em consolidação"],
      ["EVT-2026-07", "Fechamento da Folha de Pagamento de Instrutoria Março", "Folha", "Recursos Humanos", "2026-03-25", "2026-03-24", 0, "Concluído", "Alto", "0012345.000340/2026-19", "Empenhos liquidados com sucesso"],
      ["EVT-2026-08", "Abertura das Inscrições para o Seminário Novo CPC", "Inscrições", "Assessoria de Comunicação", "2026-10-01", "", 180, "Planejado", "Médio", "0012345.000412/2026-80", "Divulgação no portal e redes sociais"],
      ["EVT-2026-09", "Relatório de Gestão Semestral à Presidência do TJRO", "Relatório", "Diretoria Geral", "2026-07-15", "", 95, "Em Andamento", "Crítico", "0012345.000620/2026-44", "Coleta de dados pelo Radar EMERON"],
      ["EVT-2026-10", "Renovação das Licenças de Software Educacional Moodle", "TI / Contratos", "Divisão de Informática", "2026-05-01", "", 25, "Urgente", "Alto", "0012345.000103/2026-91", "Termo de Referência em análise jurídica"],
    ]

    const widths = [16, 46, 18, 26, 15, 15, 16, 16, 20, 24, 38]
    const numFmts: Record<number, string> = {
      7: "#,##0",
    }
    const aligns: Record<number, "left" | "center" | "right"> = {
      1: "center",
      3: "center",
      5: "center",
      6: "center",
      7: "center",
      8: "center",
      9: "center",
      10: "center",
    }

    styleWorksheet(ws, "CRONOGRAMA INSTITUCIONAL DE MARCOS E PRAZOS SEI 2026", "Acompanhamento Temporal de Editais, Contratos, Avaliações e Auditorias", headers, rows, widths, numFmts, aligns)
    await wb.xlsx.writeFile(path.join(outputDir, "04_cronograma_eventos_e_prazos_sei.xlsx"))
  }

  /* ------------------------------------------------------------------ */
  /* 5. CADASTRO DE DOCENTES E INSTRUTORES                             */
  /* ------------------------------------------------------------------ */
  {
    const wb = new ExcelJS.Workbook()
    wb.creator = "EMERON / TJ-RO"
    const ws = wb.addWorksheet("Docentes_e_Instrutores")

    const headers = [
      "Matricula_Docente",
      "Nome_Completo",
      "Titulacao_Academica",
      "Tribunal_Instituicao",
      "Especialidade_Juridica",
      "Horas_Aulas_2026",
      "Turmas_Ministradas",
      "Nota_Avaliacao_Media",
      "Status_Credenciamento",
      "Ultima_Atuacao",
      "Valor_Hora_Aula",
    ]

    const rows = [
      ["DOC-2026-001", "Dra. Mariana Vasconcelos", "Doutorado", "TJ-RO / Magistrada", "Direito Digital e Proteção de Dados", 60, 2, 9.8, "Ativo / Regular", "2026-03-15", 350],
      ["DOC-2026-002", "Dr. Roberto Albuquerque", "Mestrado", "TJ-RO / Juiz de Direito", "Direito Processual Civil e Sentenças", 40, 1, 9.6, "Ativo / Regular", "2026-02-28", 300],
      ["DOC-2026-003", "Prof. Dr. Nelson Nery Jr.", "Pós-Doutorado", "PUC-SP / Professor Convidado", "Teoria Geral dos Recursos e Processo Civil", 16, 1, 10.0, "Convidado Especial", "2026-02-12", 650],
      ["DOC-2026-004", "Coord. Fabiana Rios", "Especialização", "TJ-RO / Analista Judiciária", "Gestão de Sistemas e E-Proc", 45, 2, 9.2, "Ativo / Regular", "2026-04-01", 200],
      ["DOC-2026-005", "Dra. Luciana Freitas", "Mestrado", "TJ-RO / Magistrada NUPEMEC", "Mediação, Arbitragem e Métodos Autocompositivos", 50, 2, 9.5, "Ativo / Regular", "2026-03-20", 300],
      ["DOC-2026-006", "Dr. Marcelo Fagundes", "Doutorado", "TRF-1 / Juiz Federal", "Direito Penal Econômico e Crimes Financeiros", 30, 1, 9.4, "Credenciado Externo", "2026-04-10", 380],
      ["DOC-2026-007", "Analista Gabriel Torres", "Mestrado", "TJ-RO / DTI", "Inteligência Artificial e Engenharia de Prompt", 30, 1, 9.7, "Ativo / Regular", "2026-02-15", 220],
      ["DOC-2026-008", "Dra. Yara Tupinambá", "Doutorado", "UNIR / Professora Titular", "Direitos Indígenas e Políticas Étnicas", 40, 1, 9.9, "Credenciado Externo", "2026-04-12", 350],
      ["DOC-2026-009", "Psic. Heloísa Prado", "Mestrado", "Especialista em Saúde Ocupacional", "Psicologia Organizacional e Liderança", 20, 1, 9.9, "Credenciado Externo", "2026-03-20", 280],
      ["DOC-2026-010", "Des. Alexandre Godoy", "Doutorado", "TJ-RO / Desembargador", "Precedentes Judiciais Obrigatórios", 24, 1, 9.8, "Corpo Permanente", "2026-04-05", 400],
    ]

    const widths = [18, 32, 22, 28, 38, 18, 18, 20, 22, 16, 18]
    const numFmts: Record<number, string> = {
      6: "#,##0",
      7: "#,##0",
      8: "0.0",
      11: '"R$ "#,##0.00',
    }
    const aligns: Record<number, "left" | "center" | "right"> = {
      1: "center",
      3: "center",
      4: "center",
      6: "center",
      7: "center",
      8: "center",
      9: "center",
      10: "center",
      11: "right",
    }

    styleWorksheet(ws, "CADASTRO INSTITUCIONAL DO CORPO DOCENTE E INSTRUTORES", "Ficha Cadastral, Titulação Acadêmica, Horas-Aula e Avaliações de Desempenho", headers, rows, widths, numFmts, aligns)
    await wb.xlsx.writeFile(path.join(outputDir, "05_prontuario_docentes_e_avaliacoes.xlsx"))
  }

  console.log("Todas as 5 planilhas foram geradas com sucesso!")
}

generateSampleExcelFiles().catch(console.error)
