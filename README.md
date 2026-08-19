# 🏆 Radar EMERON (`emeromweb`) — Versão 2.0

> **Painel de Inteligência de Dados Educacionais, Gestão Estratégica e Central de Exportação Multiformato da Escola da Magistratura do Estado de Rondônia (EMERON / TJ-RO).**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![LGPD](https://img.shields.io/badge/LGPD-100%25%20Client--Side-10b981?style=flat-square)](https://www.gov.br/anpd/pt-br)
[![Acessibilidade](https://img.shields.io/badge/Acessibilidade-e--MAG%20%7C%20CNJ%20%7C%20W3C-green?style=flat-square)](https://www.cnj.jus.br/)

---

## 🎯 Sobre a Plataforma

O **Radar EMERON** (`emeromweb`) é a plataforma analítica oficial desenvolvida para modernizar a gestão pedagógica, o acompanhamento orçamentário e a conformidade regulatória das ações de capacitação da **Escola da Magistratura de Rondônia (EMERON)**, vinculada ao **Tribunal de Justiça do Estado de Rondônia (TJ-RO)**.

Projetada com arquitetura *zero-latency* e conformidade com a LGPD, todo o processamento de dados e geração de documentos ocorre **100% no navegador do usuário**, sem persistência externa de informações sensíveis.

---

## 🚀 Principais Módulos & Recursos

### 1. 🎛️ Central de Exportação & Conversão de Documentos (Estilo *iLovePDF*)
Popup/modal integrado em todas as telas com download em 1 clique e suporte a **9 formatos oficiais**:

| Formato | Extensão | Descrição / Destaques Técnicos |
| :--- | :---: | :--- |
| **PDF Oficial A4** | `.pdf` | Layout A4 institucional com cabeçalho oficial do TJ-RO, selo EMERON, gráficos vetoriais SVG embutidos (barras e rosca), checklist e hash de autenticidade FNV-1a. |
| **Word Oficial** | `.docx` | Arquivo Office Open XML nativo gerado via `docx`, com tabelas sombreadas em azul-marinho, cartões de KPIs e campos para assinatura da Diretoria. |
| **Planilha Excel** | `.xlsx` | Planilha binária estilizada via `ExcelJS` com banners institucionais `#0D2D46`, bordas, linhas zebradas, auto-largura de colunas e formatação monetária `R$ #,##0.00`. |
| **CSV Padronizado** | `.csv` | Arquivo UTF-8 com Byte Order Mark (`\uFEFF`) e delimitador `;` para abertura direta no Excel pt-BR sem erros de codificação em acentos. |
| **Página Web Autônoma** | `.html` | Documento HTML5 autocontido com CSS embutido e gráficos SVG para visualização e arquivamento offline. |
| **Dados Estruturados** | `.json` | Schema completo com metadados de emissão, indicadores calculados e registros tabulares para APIs e auditoria. |
| **Calendário iCal** | `.ics` | Pacote RFC 5545 com alarmes de 24h para importação no Outlook, Google Calendar e Apple Calendar. |
| **Nota Técnica Markdown** | `.md` | Documento com tabelas GFM, checklists `- [x]` e diagramas Mermaid (`pie title ...`). |
| **Texto Puro** | `.txt` | Documento com molduras em ASCII Art e alinhamento de colunas para processos e despachos no SEI. |

---

### 2. 🩺 Prontuário Vivo Individual da Ação
- **Rastreabilidade de 360 Graus:** Código canônico institucional (`EMERON-2026-XXX`), número do processo SEI e identificador de integração EmeronWeb.
- **Execução Orçamentária:** Gráficos comparativos entre orçamento previsto e executado com taxa de progresso em tempo real.
- **Checklist de Conformidade Documental:** Status visual de Termos de Referência, Planos de Trabalho, Listas de Presença e Relatórios Finais.
- **Detecção de Divergências:** Identificação automática de inconsistências de dados entre diferentes fontes e planilhas.
- **Histórico de Tramitação:** Linha do tempo com registros de despachos e responsáveis.

---

### 3. 📊 Painel de Indicadores & Tomada de Decisão
- KPIs em tempo real (turmas ativas, orçamento executado, total de participantes e taxa de conformidade).
- Agrupamento dinâmico por dimensões (Setor, Categoria, Responsável, Status) e medidas numéricas.
- Gráficos responsivos com Recharts e exportação direta da tabela de dados.

---

### 4. 🎯 Matriz de Prioridades & Atenção
- Ranking de criticidade baseado em impacto orçamentário e urgência de prazo.
- Drill-down direto de qualquer categoria para abrir o Prontuário Vivo correspondente.

---

### 5. 📅 Agendas & Cronogramas
- Linha do tempo mensal de vencimentos, cursos e prazos institucionais.
- Exportação direta para calendários corporativos via arquivo `.ics` (iCalendar).

---

### 6. ♿ Acessibilidade Universal & Recursos Inclusivos
- **Padrões de Acessibilidade:** Conformidade com **e-MAG**, **W3C WCAG 2.1 AA** e diretrizes de acessibilidade do **CNJ**.
- **Menu de Acessibilidade:** Ajuste dinâmico de tamanho de fontes (Pequeno, Normal, Grande, Extra Grande) e modo de **Alto Contraste**.
- **Tema Claro / Escuro:** Alternância instantânea de tema com persistência.
- **Assistente Virtual RADAR:** Chatbot institucional offline para consultas rápidas e orientações operacionais.

---

## 🛠️ Stack Tecnológica

- **Core:** [Next.js 16.3.0](https://nextjs.org/) (App Router, Turbopack, Standalone Output)
- **Interface:** [React 19](https://react.dev/), [TailwindCSS v4](https://tailwindcss.com/), [Base UI](https://base-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Visualização de Dados:** [Recharts 3.8](https://recharts.org/) & Gráficos SVG Nativos
- **Motor de Documentos:** [docx](https://docx.js.org/) (DOCX Nativo), [ExcelJS](https://github.com/exceljs/exceljs) (XLSX Estilizado), [SheetJS / xlsx](https://sheetjs.com/) (CSV/Data)
- **Containerização:** [Docker](https://www.docker.com/) multi-stage (`node:20-alpine`)

---

## 📁 Estrutura do Repositório

```
emeromweb/
├── app/                        # Next.js App Router
│   ├── globals.css             # Design Tokens & Tailwind v4
│   ├── layout.tsx              # Root Layout, Tipografia e Metadados
│   └── page.tsx                # Entrypoint da Aplicação
├── components/                 # Componentes React
│   ├── ui/                     # Primitivas de UI (Dialog, Dropdown, Button, Card...)
│   ├── views/                  # Telas Principais (Prontuário, Relatórios, Indicadores...)
│   ├── export-dialog.tsx       # Central de Exportação Modal (Estilo iLovePDF)
│   ├── export-menu.tsx         # Botão de Acionamento da Exportação
│   ├── data-store.tsx          # Gerenciador de Estado e Fontes de Dados (React Context)
│   ├── topbar.tsx              # Barra Superior com Filtros Globais e Ações
│   ├── sidebar.tsx             # Menu de Navegação Lateral
│   ├── accessibility-menu.tsx  # Menu de Acessibilidade (e-MAG / CNJ)
│   └── assistant-drawer.tsx    # Assistente Virtual RADAR
├── lib/                        # Motores Lógicos e Utilitários
│   ├── data-engine.ts          # Parser de planilhas e motor de agregações
│   ├── export-utils.ts         # Motor Universal de Exportação (DOCX, XLSX, PDF, SVG...)
│   ├── sample-data.ts          # Gerador de base oficial de demonstração
│   ├── assistant-engine.ts     # Mecanismo de NLP e respostas do assistente
│   └── types.ts                # Definições TypeScript
├── public/                     # Assets estáticos e favicons
├── Dockerfile                  # Build multi-stage standalone otimizado
├── docker-compose.yml          # Configuração de orquestração Docker
├── package.json                # Dependências do projeto
└── tsconfig.json               # Configurações TypeScript
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v20+ ou v22+
- [npm](https://www.npmjs.com/) v10+

### 2. Instalação e Execução
```bash
# Clone o repositório
git clone https://github.com/ErickDambros/emeromweb.git
cd emeromweb

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador: **`http://localhost:3000`**

### 3. Build de Produção
```bash
npm run build
npm start
```

---

## 🐳 Executando com Docker Compose

Para subir a aplicação em ambiente de produção ou servidores Proxmox LXC:

```bash
# Construir e iniciar o container em segundo plano
docker compose up -d --build

# Verificar logs da aplicação
docker compose logs -f

# Parar o serviço
docker compose down
```

O container expõe a porta `3000:3000` e roda em modo standalone seguro com usuário não-root (`nextjs:nodejs`).

---

## 🔒 Segurança & Privacidade (LGPD)

- **Processamento no Cliente:** Todos os cálculos estatísticos, renderização de gráficos e geração de arquivos (PDF, DOCX, XLSX) ocorrem estritamente na máquina local do usuário.
- **Sem Telemetria Indesejada:** Nenhum dado pedagógico ou cadastral é enviado para servidores de terceiros.
- **Integridade Criptográfica:** Cada relatório e dossiê exportado recebe uma assinatura com hash determinístico FNV-1a de 32-bits para conferência e auditoria governamental.

---

## 🏛️ Créditos & Realização

Desenvolvido para a **Escola da Magistratura de Rondônia (EMERON)**  
**Tribunal de Justiça do Estado de Rondônia (TJ-RO)**
