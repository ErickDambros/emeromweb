# CONTEXTO E INSTRUÇÕES DE REFINAMENTO - HACKATHON (DESAFIO 2)
# PRAZO DA APRESENTAÇÃO: Amanhã às 08:00 AM

olá, somos uma equipe participando de um hackathon focado no **Desafio 2**. Nosso objetivo é refinar o código do nosso front-end local para que a demo fique impecável para a apresentação de amanhã.

Como o foco é o hackathon, a aplicação será apenas **Front-end** para demonstrar visualmente a nossa solução.

---

## 📂 1. MAPA DE ARQUIVOS DE CONTEXTO LOCAL
Analise os arquivos abaixo na pasta de contexto para entender as regras, o modelo de negócios e o histórico de desenvolvimento:

1. **Regulamento e Validação:**
   - `contexto/Desafios Emeron.pdf` e `contexto\Hackathon Emeron.pdf` (Regras gerais do desafio)
   - `contexto/viabilidade_tecnica_economica.md` (Análise de viabilidade técnica/econômica já validada por outra IA)

2. **Histórico de Chats com outras IAs:**
   - `contexto/pitch_radar_emeron.md` (Contexto do pitch e proposta)

3. **Nossos Diferenciais (Ideias Próprias):**
   - `contexto/Ideais soltas.docx` (Documento com as regras das nossas features exclusivas)

4. **Guia de Identidade Visual:**
   - `contexto/paleta_de_cores.png` (Imagem de referência para a padronização visual da cores do site)

---

## ⚠️ 2. DIAGNÓSTICO DO ESTADO ATUAL DO CÓDIGO
O visual do projeto foi iniciado no **Vercel v0** (onde o layout e a área de exportação de dados ficaram excelentes). Contudo, a continuidade foi feita pelo **Gemini via Antigravity**, o que gerou algumas **incoerências e quebras de padrão visual** nas páginas e componentes.

A lógica base do Desafio 2 já funciona, mas precisamos corrigir bugs críticos de interface, refinar a experiência do usuário (UX) e garantir responsividade total antes da apresentação.

---

## 🛠️ 3. TAREFAS DE REFINAMENTO E CORREÇÃO DE BUGS (CRÍTICO)

Analise os arquivos locais do projeto e execute as seguintes melhorias diretamente no código:

### A) Padronização Estética, UI e Responsividade
- Analise a imagem `contexto/paleta_de_cores.png`.
- Padronize todo o CSS/Estilização do projeto usando esta paleta, **incluindo o visual do Assistente de FAQs**.
- Corrija as inconsistências visuais criadas na transição entre o Vercel v0 e o Gemini, trazendo o acabamento profissional do modelo original do v0 para todo o site.
- **Responsividade Total:** Ajuste o layout para telas mobile, tablets e desktops. Garanta que os **gráficos sejam fáceis de interpretar e fiquem perfeitamente legíveis em telas pequenas**.

### B) Correção de Bugs e Ajustes de Componentes Existentes
1. **Correção do Onboarding / Tutorial Guiado:**
   - O tutorial já existe, mas em alguns passos o botão de "Avançar" some da tela ou fica impossível de clicar. Corrija isso para que a navegação seja fluida e o botão nunca saia da área visível.
   - Quando o foco da página estiver no tutorial, o usuário **NÃO deve conseguir interagir com o resto do site**; ele deve conseguir interagir **apenas com os botões do próprio tutorial (menos na parte de escolher um arquivo e chatbot pois ficaria estranho **.
2. **Conflito de Z-Index (VLibras vs. Assistente):**
   - Corrija a sobreposição visual na tela. O widget do **VLibras** e o **Assistente de FAQs** estão se atropelando visualmente. Garanta que fiquem em posições harmoniosas e com o `z-index` correto para que um não suma embaixo do outro.
3. **Suporte a Novos Inputs:**
   - Modifique o campo de upload/input do sistema para que ele **também aceite e funcione com arquivos nos formatos PDF (`.pdf`) e Word (`.docx`)**.

### C) Alteração no Módulo de Exportação de Relatórios
- **Nova Lógica de Seleção:** Atualmente, o botão "Baixar pacote completo" faz o download de tudo diretamente. Altere esse botão para um tipo **"Baixar seleção"**.
- Ao clicar/marcar esse botão, o sistema deve ativar um **modo de seleção** na tela. O usuário poderá marcar/escolher quais dados específicos deseja exportar e, então, concluir o download apenas do que foi selecionado.
- **Visual do Relatório:** Garanta que a saída/layout do relatório gerado esteja esteticamente agradável, profissional, limpa e bem diagramada, **sem parecer que foi gerada de forma genérica por uma IA**.

---

## 🎯 4. DIRETRIZ DE EXECUÇÃO
- Faça modificações limpas, modulares e que mantenham a estabilidade da nossa demo.
- Trabalhe com foco em velocidade e acabamento visual de alto nível. O design precisa encantar a banca.
- O refinamento precisa estar concluído para que a equipe possa focar 100% no ensaio do pitch.

Pode iniciar a varredura do código e me propor as alterações por arquivos.
