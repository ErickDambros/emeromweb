# PITCH — RADAR EMERON
### Desafio 02: Planejamento Inteligente das Ações Educacionais — EMERON.code 2026

---

## 1. Nome & Slogan

**Nome:** RADAR EMERON

**Por que esse nome:** "Radar" comunica em uma palavra, pra qualquer pessoa leiga (inclusive a banca), o que o sistema faz: detecta o que precisa de atenção antes que vire problema. Também casa direto com a feature mais forte que vocês já têm pronta — o "Motor de Atenção" ("O que precisa da sua atenção hoje?"). Não é um nome técnico, é um nome que qualquer servidor da EMERON entende de cara.

**Slogan (escolher 1 para o pitch, os outros ficam de reserva para o material escrito):**
- **"Da dispersão à decisão."** ← recomendado, é o mais direto e usa quase literalmente a frase do próprio desafio ("transformar dados dispersos em informações estratégicas").
- "Tudo que importa, num só olhar."
- "O que precisa da sua atenção, hoje."

---

## 2. O que a solução faz (1 frase de elevador)

O RADAR EMERON é uma camada única que junta tudo que hoje está espalhado entre planilhas, SEI, EmeronWeb e Qlik — e devolve pra quem decide um painel simples: o que está crítico, o que está divergente, e o que falta pra cada ação educacional avançar.

---

## 3. Como funciona (fluxo de 4 passos, o que mostrar na demo)

1. **Entrada única** — a unidade sobe os documentos/dados de uma ação educacional (formulário PAC, planilha, ofício SEI) num só lugar, em vez de preencher separadamente em cada sistema.
2. **Consolidação automática** — o sistema junta tudo num "Prontuário Vivo" por ação: um dossiê único, sempre atualizado, com histórico.
3. **Motor de Atenção** — um algoritmo de pontuação cruza prazo, pendência documental obrigatória e divergência entre fontes, e gera um score de 0–100 dizendo o que precisa de atenção **hoje**, sem ninguém precisar abrir 4 sistemas pra descobrir isso manualmente.
4. **Dossiê Oficial** — com um clique, gera um PDF de prestação de contas com capa, índice, situação de conformidade e código de verificação — pronto pra auditoria ou pra levar numa reunião de priorização.

---

## 4. Quem é afetado pelo problema (usar nomes reais da EMERON no pitch — dá muita credibilidade)

- **Divisão de Planejamento Técnico Pedagógico** — hoje é quem recebe, confere e lança manualmente cada pedido no EmeronWeb. É, nas palavras da própria equipe entrevistada, "a etapa mais maçante" do processo.
- **Direção da EMERON** — decide priorização olhando orçamento e cadastros que vêm de fontes desencontradas, sem cruzamento automático.
- **Unidades demandantes** (ex: escolas, comarcas do interior) — preenchem formulários (como o PAC 2027, formulário que vocês têm em mãos) sem visibilidade de onde o pedido está no processo.
- **Magistrados e servidores** que dependem dessas capacitações — sentem o atraso quando o processo emperra na fase manual.

**Dor concreta e citável (do próprio material que a EMERON forneceu):** perguntados se existe um código que seja o mesmo no EmeronWeb, no SEI e no Moodle, a resposta institucional foi *"não sei responder"*. Isso não é uma suposição de vocês — é um fato que a própria instituição admitiu não saber. O RADAR EMERON resolve exatamente essa lacuna com um ID único por ação (ex: `EMERON-2026-048`).

---

## 5. Como a solução resolve o problema / alivia a dor

| Dor real (citada pela EMERON) | Como o RADAR resolve |
|---|---|
| Lançamento orçamentário manual, feito por uma única divisão, consultando planilhas | Entrada única pela própria unidade demandante, com pré-preenchimento e validação automática |
| Sem ID único entre EmeronWeb / SEI / Moodle | Prontuário Vivo com código canônico por ação, referenciando os 3 sistemas |
| Divergência entre fontes (ex: carga horária 20h vs 16h) descoberta tarde, manualmente | Detecção automática de divergência com alerta e trilha de resolução |
| Demora pra saber "o que precisa de atenção" sem abrir vários sistemas | Motor de Atenção com score e fila priorizada, atualizado em tempo real |
| Prestação de contas / dossiê montado manualmente | Geração automática de dossiê em PDF com 1 clique |

---

## 6. Por que é único e valioso — diferencial frente ao que já existe

**O que existe hoje no mercado e por que não resolve isso:**
- **BI genérico (Power BI, próprio Qlik que a EMERON já usa):** mostra indicadores, mas não decide nem prioriza — é passivo, exige que alguém já saiba o que perguntar.
- **Sistemas de gestão acadêmica genéricos (ex: módulos tipo o próprio EmeronWeb):** são bons em cadastro e execução de curso, mas não foram pensados pra cruzar dados entre sistemas diferentes nem pra gerar decisão.
- **Ferramentas de consolidação de documentos (tipo iLovePDF):** juntam arquivos, mas não entendem o *conteúdo institucional* nem geram prioridade.

**O diferencial do RADAR EMERON é a combinação, não a peça isolada:**
1. **Não substitui, complementa** — é uma camada por cima dos sistemas que já existem (EmeronWeb, SEI, Qlik), sem custo de migração nem resistência cultural de trocar de sistema. Isso é literalmente um critério do próprio edital.
2. **Decisão, não só dado** — o Motor de Atenção é o que transforma "dado disperso" em "o que eu faço agora", que é a pergunta que a EMERON realmente fez no desafio.
3. **Acessibilidade como diferencial competitivo, não enfeite** — VLibras, alto contraste e escalonamento de fonte não são "feature bonus": no Judiciário, acessibilidade é exigência de conformidade (CNJ / e-MAG). Um sistema institucional que já nasce acessível tem vantagem real de adoção sobre qualquer concorrente que trate isso como próxima versão.
4. **"iLovePDF institucional"** — o Processador Universal resolve, de forma simples e visual, o mesmo tipo de fricção que ferramentas populares de manipulação de documento resolvem no dia a dia — só que aplicado ao contexto de prontuário/dossiê institucional, algo que nenhum concorrente de mercado genérico faz porque não conhece o domínio jurídico-educacional.

---

## 7. Honestidade sobre IA (importante — como falar isso na pitch sem perder pontos)

O mentor de vocês está certo: **o que precisa funcionar é a demonstração, não a arquitetura de produção.** Mas "funcionar de qualquer jeito" só é seguro se a fala da pitch for transparente sobre o que é real e o que é "sabor" — porque isso é exatamente o tipo de pergunta que uma banca técnica faz.

**Frase pronta pra especialista de pitch usar, se perguntarem "isso usa IA?":**

> "Hoje, no protótipo, a priorização e a classificação de documentos rodam em um motor de regras determinístico — pontuação por prazo, pendência e divergência. Isso já entrega o resultado que a EMERON precisa: saber o que priorizar. Para a versão de produção, o roadmap prevê evoluir esse motor para um classificador de aprendizado de máquina, treinado com o histórico real de ações da EMERON, o que vai refinar a priorização com o tempo em vez de depender só de regras fixas."

Essa resposta é **defensável, honesta e ainda soa como visão de produto madura** — muito melhor do que alegar "IA" e não conseguir sustentar se perguntarem detalhes técnicos.

**Mesma lógica pra tela de integrações:** ao mostrar a aba de conectores com EmeronWeb/SEI/Qlik/Moodle, dizer explicitamente algo como *"esta tela simula como a integração funcionaria — a conexão real dependeria de credenciais e acesso técnico que hoje a própria EMERON ainda está avaliando disponibilizar"*. Isso transforma um ponto fraco (dado fake) em um ponto de maturidade (o time sabe exatamente o que é protótipo e o que é produção).

---

## 8. Critérios de avaliação — como cada um é endereçado

**Viabilidade técnica:** stack conhecida e comprovada (FastAPI, React, MySQL/SQLite, ReportLab), sem dependência de infraestrutura de IA cara ou modelos proprietários no MVP. Arquitetura de "camada" reduz risco técnico porque não exige reescrever ou substituir nada que já funciona.

**Viabilidade econômica:** custo de implantação baixo porque não há migração de sistema legado — só uma camada adicional. Pode nascer como piloto pequeno dentro da própria Divisão de Planejamento Técnico Pedagógico, sem necessidade de contratação externa de grande porte, usando tecnologia open source.

**Grau de inovação:** a inovação não está em "usar IA" (que qualquer um promete), está em combinar detecção de divergência + priorização por score + consolidação documental + acessibilidade nativa numa única camada pensada pro contexto específico de escola judicial — algo que nenhuma ferramenta genérica de mercado faz hoje.

**Escala:** a mesma arquitetura serve, sem redesenho, para outras unidades do TJ-RO além da EMERON, e é replicável para outras escolas judiciais do país (rede ENFAM) — qualquer instituição que planeje ações formativas com múltiplos sistemas desconectados tem o mesmo problema.

**Pitch:** a força está em ancorar cada feature numa dor **citada literalmente pela própria EMERON** (não inventada pelo time) — isso é o que separa "achamos que vocês precisam disso" de "vocês mesmos disseram que precisam disso".

---

## 9. Plano de médio e longo prazo

**Curto prazo (o que já existe / demo do hackathon):**
Protótipo funcional com dados de demonstração, mostrando o conceito completo: entrada, consolidação, priorização, dossiê.

**Médio prazo (6–12 meses, se selecionados):**
- Piloto real com um recorte pequeno do PAC (ex: as 6 propostas já formalizadas no processo SEI 0000654-83.2026.8.22.8700), usando importação manual/CSV do que a EMERON já exporta do EmeronWeb — sem depender de API que hoje não se sabe se existe.
- Ajuste do motor de priorização com dados reais da Divisão de Planejamento Técnico Pedagógico.
- Início de um classificador de ML leve treinado com o histórico real de divergências, substituindo gradualmente as regras fixas do protótipo.

**Longo prazo (12–24+ meses):**
- Integração via API oficial, condicionada à disponibilização de acesso pelo CTIC — item que hoje depende da EMERON, não do time.
- Expansão para outras unidades do TJ-RO além da EMERON.
- Avaliação de replicação para outras escolas judiciais da rede ENFAM, com o RADAR como camada de decisão configurável por instituição.

---

## 10. Checklist rápido pra especialista de pitch (o que falar, em ordem)

1. Abrir com a dor real, citando a própria EMERON ("vocês mesmos nos disseram que não sabem responder se existe um ID único entre sistemas — é exatamente esse buraco que resolvemos").
2. Mostrar o fluxo de 4 passos ao vivo (ou vídeo, plano B).
3. Bater no diferencial: "não substituímos nada, somamos".
4. Se perguntarem sobre IA/integrações reais: usar as frases da seção 7, sem gaguejar, sem overclaim.
5. Fechar com o plano de médio/longo prazo — mostra que não é só protótipo bonito, é produto com caminho.
