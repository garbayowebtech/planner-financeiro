# 📋 Relatório de Auditoria e Comparativo de Funcionalidades
## G-TECH PLANNER: Projeto Original (Hostinger/Estático) vs. Novo Projeto (React 18)

---

## 📌 Executive Summary / Resumo Executivo

Este relatório apresenta uma análise minuciosa entre a versão original estática do **G-TECH PLANNER** (arquivos `app.html`, `js/db.js`, `js/app-auth.js`, `js/app-crud.js`, `js/script.js`) e a nova versão em desenvolvimento em **React 18** (`src/`).

O projeto React já migrou com sucesso toda a arquitetura de **autenticação Supabase**, **gestão de estado global (AppContext)**, **design system modular**, **filtros e ordenações**, **navegação suave** e a **paginação limitadora de 7 itens por página**.

Abaixo estão detalhadas todas as telas, lógicas de negócio e componentes visuais que do projeto original que ainda precisam ser implementados ou concluídos na versão React.

---

## 🔍 Matriz Comparativa de Telas e Funcionalidades

| Funcionalidade / Tela | Projeto Original (Hostinger) | Novo Projeto (React) | Status |
|---|---|---|---|
| **Landing Page** | Apresentação institucional (`index.html`) | Componente `LandingPage.jsx` | 🟢 Concluído |
| **Autenticação & OAuth** | Login, Registro, Google OAuth, Reset de Senha | `AuthView.jsx` + `AuthContext.jsx` | 🟢 Concluído |
| **Barra Superior de Calendário** | Data completa, relógio em tempo real | `TopCalendarBar.jsx` | 🟢 Concluído |
| **Sidebar & Navegação** | Gaveta deslizante, avatares, dark mode | `Sidebar.jsx` + transições CSS | 🟢 Concluído |
| **Visão Geral (Metas por Categoria)** | Gráficos de barras, pizza e saldo de metas | `DashboardGrid.jsx` (Recharts) | 🟢 Concluído |
| **Cartões de Crédito (À Vista)** | Tabela, gráficos e faturas | `DashboardGrid.jsx` (Paginado 7 itens) | 🟢 Concluído |
| **Compras Parceladas** | Tabela de parcelas ativas, projeção e quitação | `DashboardGrid.jsx` (Paginado 7 itens) | 🟢 Concluído |
| **Conta-Corrente (Débito & Pix)** | Rendimentos e Saídas | `DashboardGrid.jsx` (Paginado 7 itens) | 🟢 Concluído |
| **Extratos Consolidados** | Resumo mensal, gráficos e insights | `DashboardGrid.jsx` (Consolidado) | 🟢 Concluído |
| **Gerenciador de Categorias** | Criação, cores de fundo/texto e metas | `DashboardGrid.jsx` + `AppContext` | 🟢 Concluído |
| **Rolagem Suave entre Telas** | `scrollIntoView` e `scrollTo` | Implementado via CSS + React Hooks | 🟢 Concluído |
| **Paginação (7 itens/página)** | Presente via `updatePaginationUI` em JS | Componente `PaginationControls` em React | 🟢 Concluído |
| **Ação de Edição de Registros** | Botões de edição (Lápis) com pré-preenchimento nos modais | Apenas botão de exclusão nas tabelas | 🔴 Pendente |
| **Modal de Parcelados (Cálculo)** | Alternância entre "Valor Total" e "Valor Parcela" | Apenas campo "Valor da Parcela" | 🟡 Parcial |
| **Popup Flutuante de Alerta de Metas** | Modal flutuante `#goal-alert-popup` com dispensa mensal | Não renderizado no React | 🔴 Pendente |
| **Popup Flutuante do Bot IA** | Botão flutuante `#ai-bot-popup` com regra de 30 dias | Não renderizado no React | 🔴 Pendente |
| **Gerador de Relatórios Mensais IA** | Integração completa com Supabase Edge Function | Card estático/placeholder na aba IA | 🔴 Pendente |

---

## 🛠️ Detalhamento Técnico do que Falta Implementar

### 1. 🔴 Gerador de Relatórios Mensais com IA (Edge Functions Supabase)
- **No Original (`script.js` - `initAIAssistant`, `handleAIReport`, `buildAIPrompt`)**:
  - Navegador de mês exclusivo da IA (`aiViewMonth`, `aiViewYear`).
  - Regra de negócio: permite gerar relatório **somente para o mês imediatamente anterior** ao mês atual. Se for o mês corrente ou futuro, exibe "Mês em andamento"; se for mais antigo, exibe "Prazo expirado".
  - Monta o resumo estruturado (`buildAIPrompt`) com dados de receitas, despesas, parcelas ativas e metas por categoria.
  - Chama a função serverless no Supabase via `supabaseClient.functions.invoke('generate-ai-report')`.
  - Salva o relatório gerado na tabela `ai_reports` para prevenir duplicação.
  - Formata o texto retornado em Markdown para HTML com `parseAIMarkdown`.
- **No React (`src/components/DashboardGrid.jsx` / `AIChatDrawer.jsx`)**:
  - A aba `Assistente IA` possui apenas um painel estático informativo, faltando integrar o fluxo de navegação por mês e a chamada à Edge Function.

---

### 2. 🔴 Botões de Edição de Registros nas Tabelas (Lápis de Edição)
- **No Original (`app-crud.js`)**:
  - Todas as tabelas (Compras à Vista, Parceladas, Débito e Categorias) possuem um botão de edição `<button class="btn-edit">` que abre o modal pré-preenchido com os dados do registro escolhido.
  - Ao salvar o formulário, é disparada a atualização no banco (`DB.updateCreditExpense`, `DB.updateDebitTransaction`, `DB.updateInstallment`, `DB.updateCategory`).
- **No React**:
  - As tabelas possuem atualmente apenas o botão de exclusão (`handleDelete...`). É necessário adicionar a coluna/ação de edição, passar o registro para o estado `editingCreditId` / `editingDebitId` / `editingInstId` e carregar os dados no formulário dos modais.

---

### 3. 🔴 Popup Flutuante de Alerta de Metas Excedidas (`GoalAlertPopup`)
- **No Original (`script.js` - `checkGoalAlerts`, `_goal-alert.css`)**:
  - Ao carregar a aplicação, varre as categorias e verifica se os gastos do mês atingiram ou ultrapassaram a meta.
  - Se houver metas excedidas ou atingidas, abre um popup flutuante no canto inferior da tela.
  - Oferece dois botões: `"Entendi"` (fecha o aviso na sessão) e `"Não mostrar mais este mês"` (salva a preferência `goalAlertDismissed` nas configurações do perfil no Supabase).
- **No React**:
  - O estilo `_goal-alert.css` existe no projeto, mas o componente React do popup flutuante não está sendo renderizado no `App.jsx`.

---

### 4. 🔴 Popup Flutuante do Robô de IA (`AIBotPopup`)
- **No Original (`script.js` - `DOMContentLoaded`, `_bot-popup.css`)**:
  - Exibe um balão flutuante no canto inferior direito com a ilustração do robô `assets/robot_overlay.png`.
  - Convida o usuário a experimentar o Assistente de IA.
  - Permite fechar a mensagem na sessão atual ou dispensá-la por **30 dias** (salvando a data limite no `localStorage`).
- **No React**:
  - O CSS `_bot-popup.css` está disponível, mas o componente do bot flutuante com a lógica de dispensa por 30 dias não está presente.

---

### 5. 🟡 Alternância de Cálculo no Modal de Parcelados (Valor Total vs. Parcela)
- **No Original (`app-crud.js` - `instValueRadios`)**:
  - O modal de Nova Compra Parcelada inclui radio buttons para escolher se o valor digitado é o **"Valor de uma Parcela"** ou o **"Valor Total da Compra"**.
  - Se for digitado o valor total, o script divide automaticamente pelo número total de parcelas antes de salvar.
- **No React (`Modals.jsx`)**:
  - O modal atual aceita apenas a entrada direta do "Valor da Parcela", sem o alternador.

---

## 🎯 Plano de Ação Recomendado para Conclusão

Para alcançar 100% de paridade de recursos entre o projeto original e a nova aplicação React, recomenda-se a seguinte ordem de implementação:

1. **Passo 1: Implementar o Fluxo de Edição nos Modais e Tabelas**
   - Adicionar o ícone de edição (Lápis) nas ações das tabelas de Crédito, Débito, Parcelas e Categorias.
   - Pré-preencher os formulários nos modais ao clicar no botão de editar.

2. **Passo 2: Conectar o Gerador de Relatórios de IA**
   - Criar o componente de geração de relatórios de IA com seletor de mês/ano, verificação de prazos e chamada à Edge Function do Supabase.

3. **Passo 3: Criar os Componentes Flutuantes (`GoalAlertPopup` e `AIBotPopup`)**
   - Criar os componentes React para o alerta de metas e para o popup do robô da IA com persitência de dispensa (sessão e 30 dias).

4. **Passo 4: Aprimorar o Modal de Compras Parceladas**
   - Adicionar o seletor radio (Valor Total vs. Valor Parcela) no modal `installment`.

---
*Relatório gerado automaticamente para direcionar as próximas etapas de desenvolvimento do G-TECH PLANNER.*
