# 🏆 Radar EMERON (`emeromweb`)

> **Painel de Inteligência de Dados Educacionais, Diagnóstico Pedagógico e Gestão Estratégica da Escola da Magistratura do Estado de Rondônia (EMERON / TJ-RO).**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![Acessibilidade](https://img.shields.io/badge/Acessibilidade-e--MAG%20%7C%20CNJ%20%7C%20W3C-green?style=flat-square)](https://www.cnj.jus.br/)

---

## 🎯 Sobre o Projeto

O **Radar EMERON** é uma plataforma de inteligência analítica desenvolvida para transformar dados acadêmicos e pedagógicos em decisões educacionais assertivas. O sistema oferece uma visão de 360 graus sobre ações formativas, aproveitamento de magistrados e servidores, taxas de conclusão, gestão de riscos de evasão e aderência às diretrizes da **ENFAM (Escola Nacional de Formação e Aperfeiçoamento de Magistrados)**.

Projetado com foco em **agilidade operacional**, **visualização rica** e **acessibilidade universal**, o sistema permite a importação de bases de dados locais com cálculo instantâneo de indicadores e prontuários individualizados.

---

## 🚀 Principais Módulos & Funcionalidades

### 1. 📊 Painel de Indicadores & KPIs
- Monitoramento em tempo real de turmas ativas, carga horária executada, índice de satisfação e taxa de evasão.
- Gráficos analíticos de distribuição por comarca, modalidade (EAD/Presencial/Híbrido) e perfil de público-alvo.

### 2. 🎯 Matriz de Priorização Pedagógica
- Matriz de criticidade que cruza urgência e impacto para identificar turmas ou cursos que demandam intervenção preventiva.
- Alertas inteligentes sobre prazos de validação e lançamento de notas.

### 3. 🩺 Prontuário Educacional da Ação
- Ficha pedagógica detalhada de cada curso, registrando histórico de evoluções, frequência, engajamento e ocorrências.
- Diagnóstico automatizado de conformidade institucional.

### 4. 📅 Gestão de Agendas & Cronogramas
- Linha do tempo visual com datas-chave (início de inscrições, ambientação, módulos avaliativos e encerramento).
- Filtros por trimestre, modalidade e status de execução.

### 5. 📑 Central de Relatórios Executivos
- Síntese pedagógica pronta para impressão e exportação.
- Relatórios estruturados para prestação de contas à Diretoria da EMERON e ao Tribunal de Justiça de Rondônia (TJ-RO).

### 6. 📥 Importação e Processamento de Dados em Memória
- Upload dinâmico de planilhas `.xlsx` e `.csv` com processamento client-side seguro (via SheetJS).
- Alternância instantânea entre dados de demonstração (sample data) e dados reais importados.

### 7. 🤖 Assistente Virtual RADAR
- Chatbot institucional integrado para consulta rápida a dados em memória e navegação guiada.
- Respostas determinísticas e inteligentes para dúvidas sobre turmas, médias, prazos e orientações operacionais.

### 8. ♿ Acessibilidade Universal (e-MAG / CNJ / W3C)
- Ícone e menu universal de acessibilidade da ONU/W3C.
- Modos de **Alto Contraste** e ajuste dinâmico do **Tamanho de Fontes** (Pequeno, Normal, Grande, Extra Grande).
- Estrutura semântica para leitores de tela e integração com o ecossistema **VLibras**.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router + Turbopack) | Renderização híbrida com SSR, streaming e modo Standalone |
| **Linguagem** | TypeScript 5.7 & React 19 | Tipagem estrita e novos padrões de componentes funcionais |
| **Estilização** | TailwindCSS v4 | Utility-first CSS de alto rendimento |
| **Componentes** | Base UI + Shadcn/ui + Lucide React | Primitivas acessíveis e ícones universais |
| **Gráficos** | Recharts 3.8 | Visualizações interativas e responsivas |
| **Planilhas** | XLSX (SheetJS) | Parser client-side de planilhas Excel/CSV |
| **Container** | Docker & Docker Compose | Imagem `node:20-alpine` multi-stage standalone |

---

## 📦 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v20+ ou v22+
- [pnpm](https://pnpm.io/) ou [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) e Docker Compose (para execução em container)

---

### Opção 1: Rodando Localmente com pnpm

```bash
# 1. Clone o repositório
git clone https://github.com/ErickDambros/emeromweb.git
cd emeromweb

# 2. Instale as dependências
pnpm install

# 3. Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse em seu navegador: **`http://localhost:3000`**

---

### Opção 2: Rodando com Docker Compose (Produção)

```bash
# 1. Construa a imagem e inicie o container
docker compose up -d --build

# 2. Verificar status do container
docker ps

# 3. Visualizar logs
docker compose logs -f
```

Acesse em seu navegador: **`http://localhost:3000`**

---

## 🏗️ Estrutura de Diretórios

```text
emeromweb/
├── app/
│   ├── globals.css          # Design system, temas claro/escuro e acessibilidade
│   ├── layout.tsx           # Shell raiz com providers e metadados
│   └── page.tsx             # Ponto de entrada SPA do Dashboard
├── components/
│   ├── ui/                  # Componentes reutilizáveis (botões, cards, tabs, etc.)
│   ├── views/               # Telas principais (Indicadores, Prontuário, Agendas...)
│   ├── icons/               # Ícones vetoriais (Acessibilidade Universal, Avatar Assistente)
│   ├── accessibility-menu.tsx # Menu flutuante de acessibilidade (Alto contraste, fontes)
│   ├── assistant-drawer.tsx # Central de Ajuda & Chat com dados
│   ├── data-store.tsx       # Gerenciamento de estado dos datasets
│   ├── onboarding-tutorial.tsx # Tour interativo para novos usuários
│   └── topbar.tsx / sidebar.tsx # Navegação principal do app
├── lib/
│   ├── assistant-engine.ts  # Motor de respostas do chat assistente
│   ├── data-engine.ts       # Cálculos estatísticos, agregações e parse de Excel
│   ├── sample-data.ts       # Base de dados de demonstração institucional
│   └── types.ts             # Tipos TypeScript do domínio educacional
├── public/                  # Favicons, logos institucionais e assets estáticos
├── Dockerfile               # Multi-stage Dockerfile para Next.js Standalone
├── docker-compose.yml       # Orquestração do container de produção
└── package.json
```

---

## 🖥️ Deploy no Homelab Proxmox (`CT 108`)

O sistema está implantado no container LXC de produção do Proxmox:
- **Nó**: `hunter`
- **Container LXC**: `CT 108` (`hackathon`)
- **IP Interno**: `10.10.10.18`
- **Porta**: `3000` (Mapeada para o container `emeromweb`)

---

## 📄 Licença

Este projeto é de propriedade de **Erick Dambros** e desenvolvido no contexto das iniciativas acadêmicas e tecnológicas para a **EMERON / TJ-RO**.
