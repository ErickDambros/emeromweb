# RADAR EMERON — Arquitetura Técnica & Viabilidade Econômica (para defesa no pitch)

## 1. Arquitetura em uma frase

**Aplicação 100% client-side (roda inteira no navegador), sem backend, sem banco de dados, sem servidor de aplicação.** Tudo que acontece — leitura de arquivo, processamento, cálculo de indicadores, geração de PDF — acontece na máquina de quem está usando, não em nenhum servidor da EMERON ou de vocês.

Isso não é "menos robusto por ser mais simples" — é uma escolha de arquitetura deliberada que resolve, ao mesmo tempo, viabilidade técnica, econômica e segurança/LGPD. Vale apresentar assim pra banca: não é limitação, é decisão.

---

## 2. Como funciona, passo a passo (o que contar se perguntarem "como isso roda por trás?")

```
[Usuário seleciona arquivo no navegador]
          ↓
[Parser client-side lê o arquivo na memória do navegador]
   - .xlsx / .xls  → biblioteca SheetJS
   - .csv          → biblioteca PapaParse
   - .pdf (texto)  → biblioteca pdf.js
          ↓
[Dados normalizados em uma estrutura única em memória]
   (um "objeto" por ação educacional: código, unidade, prazo,
    responsável, carga horária, documentos, etc.)
          ↓
[Motor de regras determinístico]
   - calcula score de atenção (prazo + pendência + divergência)
   - compara campos entre fontes para detectar divergência
   - gera o ID canônico da ação
          ↓
[Renderização] → gráficos (Chart.js/Recharts) + fila de prioridade + agenda
          ↓
[Sob demanda] → geração de PDF (jsPDF/pdfmake) direto no navegador,
                baixado como arquivo local (sem passar por servidor)
```

Nenhuma dessas etapas depende de rede, API paga, ou infraestrutura de terceiros. O navegador do usuário faz literalmente todo o trabalho.

---

## 3. Viabilidade técnica — por que isso é defensável

| Pergunta que a banca pode fazer | Resposta honesta e forte |
|---|---|
| "Isso escala?" | Sim — não existe gargalo de servidor porque não existe servidor. Cada usuário processa seus próprios dados na própria máquina. 10 ou 10.000 usuários simultâneos custam exatamente a mesma coisa: zero, porque não há processamento central. |
| "É seguro?" | Os dados nunca saem do navegador de quem está usando — não há upload pra nuvem, não há banco de dados pra vazar. É privacidade por arquitetura, não por promessa. |
| "Funciona offline?" | Sim, depois de carregado, o processamento não depende de internet (só o carregamento inicial da página precisa de rede, como qualquer site). |
| "É tecnologia madura ou experimental?" | Todas as bibliotecas usadas (leitura de Excel, geração de PDF, gráficos) são open-source, amplamente usadas em produção por outras empresas há anos — não é aposta em tecnologia nova ou instável. |
| "O que muda pra virar produção de verdade?" | A arquitetura client-side continua sendo a base. Pra virar produto institucional, adiciona-se opcionalmente: (a) autenticação real de usuário, (b) um backend leve só para guardar histórico entre sessões/dispositivos, (c) integração via API oficial, se e quando a EMERON disponibilizar acesso técnico. Nada disso precisa existir para o MVP funcionar e provar o conceito. |

---

## 4. Viabilidade econômica — números que sustentam o argumento

| Item | Custo no modelo atual (client-side) | Por quê |
|---|---|---|
| Hospedagem | Próximo de zero (camada gratuita de Vercel/Netlify/GitHub Pages) | É só um site estático — HTML/CSS/JS servidos, sem servidor de aplicação rodando |
| Banco de dados | R$ 0 | Não existe — dados vivem só na sessão do navegador |
| Licença de IA / API externa | R$ 0 | Motor de regras é código próprio, não chamada paga de LLM |
| Infraestrutura de segurança de servidor | Não se aplica | Não há servidor central com dado sensível pra proteger |
| Manutenção contínua | Baixa | Sem servidor pra monitorar, sem banco pra fazer backup, sem escalonamento pra gerenciar |

**Argumento central pro pitch:** o custo de colocar isso rodando institucionalmente hoje é essencialmente o custo de desenvolvimento — não há custo recorrente de infraestrutura pra justificar antes mesmo de aprovar o piloto. Isso é raro em propostas de "solução com IA/BI", que normalmente vêm com custo de licença (tipo o próprio Qlik Sense que a EMERON já paga) ou custo de nuvem. Aqui, o piloto pode rodar de graça.

**Comparação implícita útil no pitch:** ferramentas de BI de mercado (Power BI, o próprio Qlik) cobram licença por usuário/mês. A camada de vocês não substitui essas ferramentas — mas pra este caso de uso específico (consolidar e decidir sobre ações educacionais), entrega o resultado sem custo de licenciamento adicional.

---

## 5. O único ponto de honestidade técnica a manter (curto, não é o foco)

A única coisa que não é 100% real hoje é a integração direta com EmeronWeb/SEI/Moodle — porque isso depende de a EMERON abrir acesso técnico, o que nem ela mesma sabe se existe (API confirmada não disponível, conforme as próprias respostas da equipe no hackathon). O fluxo real e viável hoje é: usuário exporta do sistema legado (Excel, que já existe) e sobe manualmente — e é exatamente esse o fluxo que a demo mostra. Não é gambiarra, é o caminho de menor risco técnico disponível agora.

---

## 6. Resumo de uma linha por critério

- **Técnica:** madura, sem servidor, sem infraestrutura própria pra manter, sem tecnologia experimental.
- **Econômica:** custo de operação próximo de zero, sem licença de IA, sem custo de nuvem recorrente.
- **Segurança/LGPD:** dado nunca sai da máquina do usuário — privacidade por arquitetura.
- **Escala:** sem gargalo central — escala com o número de navegadores, não com investimento em servidor.
