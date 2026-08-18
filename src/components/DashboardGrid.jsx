import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import logoGarbayo from '../assets/logo_garbayo.png';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const formatCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const formatDate = d => { if (!d) return '-'; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };

function parseAIMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html
    .replace(/^### (.*$)/gim, '<h5 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--c-text-main); font-size: 1.1rem; font-weight: 600;">$1</h5>')
    .replace(/^## (.*$)/gim, '<h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--c-primary); font-size: 1.25rem; font-weight: 700;">$1</h4>')
    .replace(/^# (.*$)/gim, '<h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--c-primary); font-size: 1.5rem; font-weight: 800;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--c-text-main); font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom: 0.4rem; margin-left: 1.5rem; list-style-type: disc;">$1</li>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

// Calcula se uma parcela está ativa no mês/ano de view
function instCycleOffset(dateStr, closingDay) {
  const day = parseInt(dateStr.split('-')[2]);
  return day >= closingDay ? 1 : 0;
}
function isInstallmentActiveInMonth(inst, viewYear, viewMonth, cards) {
  const p = inst.date.split('-');
  const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
  const card = cards.find(c => c.id === (inst.cardId || 'card1'));
  const closing = card?.closingDay || 11;
  const offset = instCycleOffset(inst.date, closing);
  const diff = (viewYear - py) * 12 + (viewMonth - pm) - offset;
  const proj = inst.currentInstallment + diff;
  return proj >= 1 && proj <= inst.totalInstallments;
}

function ChartEmpty() {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
      Sem dados para exibir neste mês.
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        background: 'var(--c-bg-card)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem 0.75rem',
        boxShadow: 'var(--shadow-md)',
        fontSize: '0.85rem'
      }}>
        <div style={{ fontWeight: 600, color: data.payload?.color || 'var(--c-text-main)', marginBottom: '0.2rem' }}>
          {data.name}
        </div>
        <div style={{ color: 'var(--c-text-muted)' }}>
          {formatCurrency(data.value)}
        </div>
      </div>
    );
  }
  return null;
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-controls" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.75rem',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      <button
        className="btn-icon"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--c-border)',
          background: 'var(--c-bg)',
          color: currentPage <= 1 ? 'var(--c-text-muted)' : 'var(--c-text-main)',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          transition: 'all 0.2s ease',
          opacity: currentPage <= 1 ? 0.4 : 1
        }}
        title="Página Anterior"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      <span style={{ fontSize: '0.85rem', color: 'var(--c-text-muted)', fontWeight: 500 }}>
        {currentPage} / {totalPages}
      </span>

      <button
        className="btn-icon"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--c-border)',
          background: 'var(--c-bg)',
          color: currentPage >= totalPages ? 'var(--c-text-muted)' : 'var(--c-text-main)',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          transition: 'all 0.2s ease',
          opacity: currentPage >= totalPages ? 0.4 : 1
        }}
        title="Próxima Página"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
}

export function DashboardGrid() {
  const {
    activeNav,
    categories,
    creditExpenses,
    debitTransactions,
    installments,
    userSettings,
    setUserSettings,
    currentCardId,
    setCurrentCardId,
    setActiveModal,
    setEditingCreditId,
    setEditingDebitId,
    setEditingInstId,
    setEditingCatId,
    handleDeleteCreditExpense,
    handleDeleteDebitTransaction,
    handleDeleteInstallment,
    handleSaveCategory,
    handleDeleteCategory,
    viewDate,
    creditFilterCat, setCreditFilterCat,
    creditSort, setCreditSort,
    debitFilterCat, setDebitFilterCat,
    debitSort, setDebitSort,
    instFilterCat, setInstFilterCat,
    instSort, setInstSort,
    currentUser,
    profile,
    darkMode,
    calendarBar,
    applyDarkMode,
    applyCalendarBar,
    setShowTutorial,
    handleUpdateName,
    handleUpdateEmail,
    handleUpdatePassword,
    handleDeleteAccount,
  } = useApp();

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const cards = userSettings.cards || [];

  // Smooth scroll container to top whenever active view changes
  React.useEffect(() => {
    const contentEl = document.querySelector('.content-scroll');
    if (contentEl) {
      contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeNav]);

  // Pagination states (up to 7 items per page)
  const ITEMS_PER_PAGE = 7;
  const [creditPage, setCreditPage] = useState(1);
  const [instPage, setInstPage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [debitPage, setDebitPage] = useState(1);
  const [catPage, setCatPage] = useState(1);

  React.useEffect(() => { setCreditPage(1); }, [creditFilterCat, creditSort, currentCardId, viewDate]);
  React.useEffect(() => { setInstPage(1); }, [instFilterCat, instSort, currentCardId, viewDate]);
  React.useEffect(() => { setDebitPage(1); }, [debitFilterCat, debitSort, viewDate]);
  React.useEffect(() => { setIncomePage(1); }, [viewDate]);

  // ── AI ASSISTANT STATE & LOGIC ──
  const allowedAiMonthObj = React.useMemo(() => {
    const n = new Date();
    let m = n.getMonth() - 1;
    let y = n.getFullYear();
    if (m < 0) { m = 11; y--; }
    return { month: m, year: y };
  }, []);

  const [aiViewMonth, setAiViewMonth] = useState(allowedAiMonthObj.month);
  const [aiViewYear, setAiViewYear] = useState(allowedAiMonthObj.year);
  const [aiReportText, setAiReportText] = useState('');
  const [aiReportMeta, setAiReportMeta] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [aiExistingReport, setAiExistingReport] = useState(false);

  const monthYearKey = `${aiViewYear}-${String(aiViewMonth + 1).padStart(2, '0')}`;
  const isAllowedMonth = (aiViewMonth === allowedAiMonthObj.month && aiViewYear === allowedAiMonthObj.year);
  const viewIdx = aiViewYear * 12 + aiViewMonth;
  const allowedIdx = allowedAiMonthObj.year * 12 + allowedAiMonthObj.month;
  const isExpired = viewIdx < allowedIdx;

  React.useEffect(() => {
    if (!currentUser || activeNav !== 'ai-assistant') return;
    let isMounted = true;

    async function checkReport() {
      try {
        const { data } = await supabase
          .from('ai_reports')
          .select('id, created_at, report_text')
          .eq('user_id', currentUser.id)
          .eq('month_year', monthYearKey)
          .maybeSingle();

        if (!isMounted) return;

        if (data && data.report_text) {
          setAiExistingReport(true);
          setAiReportText(data.report_text);
          setAiReportMeta(data.created_at);
          setAiStatusMsg(`Relatório de ${MONTHS_PT[aiViewMonth]} ${aiViewYear} já foi gerado. O próximo estará disponível no mês que vem! 📅`);
        } else {
          setAiExistingReport(false);
          setAiReportText('');
          setAiReportMeta(null);
          if (isAllowedMonth) {
            setAiStatusMsg(`Clique no botão abaixo para gerar seu relatório financeiro personalizado com inteligência artificial para ${MONTHS_PT[aiViewMonth]} ${aiViewYear}.`);
          } else if (isExpired) {
            setAiStatusMsg(`O relatório de ${MONTHS_PT[aiViewMonth]} ${aiViewYear} não foi gerado no prazo e não pode mais ser criado.`);
          } else {
            setAiStatusMsg(`O relatório de ${MONTHS_PT[aiViewMonth]} ${aiViewYear} ficará disponível a partir do dia 1 do mês seguinte.`);
          }
        }
      } catch (err) {
        console.error("Error checking AI report:", err);
      }
    }

    checkReport();
    return () => { isMounted = false; };
  }, [currentUser, activeNav, aiViewMonth, aiViewYear, monthYearKey, isAllowedMonth, isExpired]);

  const buildAIPrompt = (y, m) => {
    const monthName = MONTHS_PT[m];

    let totalIncome = 0;
    (debitTransactions || []).forEach(txn => {
      const p = txn.date.split('-');
      if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && txn.type === 'income') {
        totalIncome += txn.amount;
      }
    });

    let totalDebit = 0;
    (debitTransactions || []).forEach(txn => {
      const p = txn.date.split('-');
      if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && txn.type !== 'income') {
        totalDebit += txn.amount;
      }
    });

    let totalCredit = 0;
    (creditExpenses || []).forEach(exp => {
      if (!exp.dueDate) return;
      const p = exp.dueDate.split('-');
      if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m) {
        totalCredit += exp.amount;
      }
    });

    let totalInst = 0, activeInstCount = 0;
    (installments || []).forEach(inst => {
      const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
      const card = cards.find(c => c.id === (inst.cardId || 'card1'));
      const closing = card?.closingDay || 11;
      const day = parseInt(inst.date.split('-')[2]);
      const offset = day >= closing ? 1 : 0;
      const diff = (y - py) * 12 + (m - pm) - offset;
      const proj = inst.currentInstallment + diff;
      if (proj >= 1 && proj <= inst.totalInstallments) {
        totalInst += inst.installmentAmount;
        activeInstCount++;
      }
    });

    const catSpent = {};
    (categories || []).filter(c => (c.type || 'expense') === 'expense').forEach(cat => {
      catSpent[cat.id] = { name: cat.name, goal: cat.goal || 0, spent: 0 };
    });

    (creditExpenses || []).forEach(exp => {
      if (!exp.dueDate) return;
      const p = exp.dueDate.split('-');
      if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && catSpent[exp.categoryId])
        catSpent[exp.categoryId].spent += exp.amount;
    });
    (debitTransactions || []).forEach(txn => {
      if (txn.type === 'income') return;
      const p = txn.date.split('-');
      if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && catSpent[txn.categoryId])
        catSpent[txn.categoryId].spent += txn.amount;
    });
    (installments || []).forEach(inst => {
      const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
      const card = cards.find(c => c.id === (inst.cardId || 'card1'));
      const closing = card?.closingDay || 11;
      const day = parseInt(inst.date.split('-')[2]);
      const offset = day >= closing ? 1 : 0;
      const diff = (y - py) * 12 + (m - pm) - offset;
      const proj = inst.currentInstallment + diff;
      if (proj >= 1 && proj <= inst.totalInstallments && catSpent[inst.categoryId])
        catSpent[inst.categoryId].spent += inst.installmentAmount;
    });

    const goalsLines = Object.values(catSpent)
      .filter(c => c.goal > 0 || c.spent > 0)
      .map(c => {
        const pct = c.goal > 0 ? ((c.spent / c.goal) * 100).toFixed(0) : '-';
        const status = c.goal > 0 && c.spent > c.goal ? '⚠️ META EXCEDIDA' : (c.goal > 0 && c.spent > c.goal * 0.8 ? '⚠️ Quase no limite' : '✅ OK');
        return `  - ${c.name}: Gasto ${formatCurrency(c.spent)} / Meta ${formatCurrency(c.goal)} (${pct}%) ${status}`;
      }).join('\n');

    const totalExpenses = totalDebit + totalCredit + totalInst;
    const balance = totalIncome - totalExpenses;

    return `## Dados Financeiros — ${monthName} ${y}

**Receitas:**
- Total de Rendimentos: ${formatCurrency(totalIncome)}

**Despesas:**
- Débito / Pix: ${formatCurrency(totalDebit)}
- Cartão de Crédito (à vista): ${formatCurrency(totalCredit)}
- Compras Parceladas (${activeInstCount} parcelas ativas): ${formatCurrency(totalInst)}
- Total de Despesas: ${formatCurrency(totalExpenses)}

**Saldo do Mês:** ${formatCurrency(balance)} ${balance >= 0 ? '✅ Positivo' : '❌ Negativo'}

**Metas por Categoria:**
${goalsLines || '  Nenhuma categoria com meta definida.'}

Por favor, analise esses dados, destaque pontos de atenção, celebre conquistas e dê dicas práticas e personalizadas em português do Brasil.`;
  };

  const handleGenerateAIReport = async () => {
    if (!isAllowedMonth || aiLoading) return;
    setAiLoading(true);
    setAiStatusMsg("Gerando relatório com Inteligência Artificial...");

    try {
      const promptData = buildAIPrompt(aiViewYear, aiViewMonth);
      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { promptData, monthYear: monthYearKey }
      });

      if (error) throw error;

      if (data?.error) {
        setAiStatusMsg(`Aviso: ${data.message || data.error}`);
        setAiLoading(false);
        return;
      }

      if (data?.success && data?.report) {
        setAiReportText(data.report);
        setAiExistingReport(true);
        setAiReportMeta(new Date().toISOString());
        setAiStatusMsg(`Relatório gerado com sucesso para ${MONTHS_PT[aiViewMonth]} ${aiViewYear}! ✨`);
      }
    } catch (err) {
      console.error("Error generating AI report:", err);
      setAiStatusMsg("Erro ao conectar com o serviço de IA. Verifique se a Edge Function está configurada no Supabase.");
    } finally {
      setAiLoading(false);
    }
  };

  // Settings local states
  const [cardNameInput, setCardNameInput] = useState('');
  const [cardClosingDayInput, setCardClosingDayInput] = useState('');
  const [cardDueDayInput, setCardDueDayInput] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  // User Settings local states
  const [nameInput, setNameInput] = useState('');
  const [nameMsg, setNameMsg] = useState({ text: '', ok: true });
  const [emailInput, setEmailInput] = useState('');
  const [emailMsg, setEmailMsg] = useState({ text: '', ok: true });
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', ok: true });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteMsg, setDeleteMsg] = useState({ text: '', ok: true });
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Helper for feedback messages
  const showMsg = (setter, text, ok) => {
    setter({ text, ok });
    setTimeout(() => setter({ text: '', ok: true }), 4000);
  };

  // Category form local states
  const [catNameInput, setCatNameInput] = useState('');
  const [catGoalInput, setCatGoalInput] = useState('');
  const [catBgInput, setCatBgInput] = useState('#3B82F6');
  const [catTextInput, setCatTextInput] = useState('#FFFFFF');
  const [catTab, setCatTab] = useState('expense');

  const currentCard = cards.find(c => c.id === currentCardId) || cards[0] || { name: 'Cartão 1', closingDay: 11, dueDay: 18 };

  // ── CREDIT filter by dueDate matching viewYear/viewMonth
  const cardCredits = creditExpenses.filter(e => {
    if (!e.dueDate) return false;
    const p = e.dueDate.split('-');
    return parseInt(p[0]) === viewYear && parseInt(p[1]) - 1 === viewMonth && (e.cardId || 'card1') === currentCardId;
  });

  // ── INSTALLMENTS filter — active in viewMonth
  const cardInstsActive = installments.filter(i => (i.cardId || 'card1') === currentCardId && isInstallmentActiveInMonth(i, viewYear, viewMonth, cards));
  const cardInstsAll = installments.filter(i => (i.cardId || 'card1') === currentCardId);

  // ── DEBIT filter by date matching viewYear/viewMonth
  const debitThisMonth = debitTransactions.filter(t => {
    const p = t.date.split('-');
    return parseInt(p[0]) === viewYear && parseInt(p[1]) - 1 === viewMonth;
  });
  const incomeThisMonth = debitThisMonth.filter(t => t.type === 'income');
  const expenseDebitThisMonth = debitThisMonth.filter(t => t.type !== 'income');

  const totalVista = cardCredits.reduce((s, e) => s + (e.amount || 0), 0);
  const totalInstsThisMonth = cardInstsActive.reduce((s, i) => s + (i.installmentAmount || 0), 0);
  const totalFaturaMes = totalVista + totalInstsThisMonth;

  // Next month installments
  const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
  const cardInstsNext = installments.filter(i => (i.cardId || 'card1') === currentCardId && isInstallmentActiveInMonth(i, nextY, nextM, cards));
  const totalInstsNextMonth = cardInstsNext.reduce((s, i) => s + (i.installmentAmount || 0), 0);
  const creditNext = creditExpenses.filter(e => {
    if (!e.dueDate) return false;
    const p = e.dueDate.split('-');
    return parseInt(p[0]) === nextY && parseInt(p[1]) - 1 === nextM && (e.cardId || 'card1') === currentCardId;
  }).reduce((s, e) => s + e.amount, 0);
  const totalNextFatura = creditNext + totalInstsNextMonth;

  const totalInstsOpen = cardInstsAll.reduce((s, i) => {
    const p = i.date.split('-');
    const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
    const card = cards.find(c => c.id === (i.cardId || 'card1'));
    const closing = card?.closingDay || 11;
    const offset = instCycleOffset(i.date, closing);
    const diff = (viewYear - py) * 12 + (viewMonth - pm) - offset;
    const currentProj = i.currentInstallment + diff;
    const remaining = Math.max(0, i.totalInstallments - currentProj + 1);
    return s + remaining * i.installmentAmount;
  }, 0);

  const totalIncome = incomeThisMonth.reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenseDebit = expenseDebitThisMonth.reduce((s, t) => s + (t.amount || 0), 0);
  const totalBalanceCC = totalIncome - totalExpenseDebit;

  // ── EXPENSE CATEGORIES spending for goals/charts
  const expenseCategories = categories.filter(c => (c.type || 'expense') === 'expense');
  const catSpentMap = {};
  expenseCategories.forEach(cat => { catSpentMap[cat.id] = 0; });
  cardCredits.forEach(e => { if (catSpentMap[e.categoryId] !== undefined) catSpentMap[e.categoryId] += e.amount; });
  expenseDebitThisMonth.forEach(t => { if (catSpentMap[t.categoryId] !== undefined) catSpentMap[t.categoryId] += t.amount; });
  cardInstsActive.forEach(i => { if (catSpentMap[i.categoryId] !== undefined) catSpentMap[i.categoryId] += i.installmentAmount; });

  // ── CHARTS DATA
  const goalsBarsData = expenseCategories
    .filter(cat => (cat.goal || 0) > 0)
    .map(cat => ({
      name: cat.name,
      Gasto: catSpentMap[cat.id] || 0,
      Meta: cat.goal || 0,
      fill: cat.color || '#4F46E5',
    }));

  const overallPieData = [
    { name: 'Cartão de Crédito', value: totalVista, color: '#4F46E5' },
    { name: 'Débito / Pix', value: totalExpenseDebit, color: '#10B981' },
    { name: 'Compras Parceladas', value: totalInstsThisMonth, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const creditPieData = Object.entries(
    cardCredits.reduce((acc, e) => { acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount; return acc; }, {})
  ).map(([catId, val]) => {
    const cat = categories.find(c => c.id === catId);
    return { name: cat?.name || 'Outros', value: val, color: cat?.color || '#4F46E5' };
  });

  const debitPieData = Object.entries(
    expenseDebitThisMonth.reduce((acc, e) => { acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount; return acc; }, {})
  ).map(([catId, val]) => {
    const cat = categories.find(c => c.id === catId);
    return { name: cat?.name || 'Outros', value: val, color: cat?.color || '#10B981' };
  });

  // ── CONSOLIDATED EXTRACTS CALCULATIONS (ALL CARDS + ACCOUNTS) ──
  let consolidatedIncome = 0;
  let consolidatedDebitExpense = 0;
  let consolidatedCreditVista = 0;
  let consolidatedInstTotal = 0;
  let activeInstCount = 0;
  let maxInstMonth = -1;
  let maxInstYear = -1;
  const cardUsage = {};
  const consolidatedCatSpent = {};
  categories.forEach(c => {
    consolidatedCatSpent[c.id] = { name: c.name, color: c.color, spent: 0, goal: c.goal || 0 };
  });

  // 1. Process Debits
  debitTransactions.forEach(t => {
    if (!t.date) return;
    const p = t.date.split('-');
    if (parseInt(p[0]) === viewYear && parseInt(p[1]) - 1 === viewMonth) {
      if (t.type === 'income') {
        consolidatedIncome += t.amount || 0;
      } else {
        consolidatedDebitExpense += t.amount || 0;
        if (consolidatedCatSpent[t.categoryId]) {
          consolidatedCatSpent[t.categoryId].spent += t.amount || 0;
        }
      }
    }
  });

  // 2. Process Credit Expenses (ALL cards matching dueDate viewYear/viewMonth)
  creditExpenses.forEach(exp => {
    if (!exp.dueDate) return;
    const p = exp.dueDate.split('-');
    if (parseInt(p[0]) === viewYear && parseInt(p[1]) - 1 === viewMonth) {
      consolidatedCreditVista += exp.amount || 0;
      const cid = exp.cardId || 'card1';
      cardUsage[cid] = (cardUsage[cid] || 0) + (exp.amount || 0);
      if (consolidatedCatSpent[exp.categoryId]) {
        consolidatedCatSpent[exp.categoryId].spent += exp.amount || 0;
      }
    }
  });

  // 3. Process Installments (ALL cards active in viewYear/viewMonth)
  installments.forEach(inst => {
    if (!inst.date) return;
    const p = inst.date.split('-');
    const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
    const cid = inst.cardId || 'card1';
    const card = cards.find(c => c.id === cid);
    const closing = card?.closingDay || 11;
    const diff = (viewYear - py) * 12 + (viewMonth - pm) - instCycleOffset(inst.date, closing);
    const proj = inst.currentInstallment + diff;
    if (proj >= 1 && proj <= inst.totalInstallments) {
      consolidatedInstTotal += inst.installmentAmount || 0;
      cardUsage[cid] = (cardUsage[cid] || 0) + (inst.installmentAmount || 0);
      activeInstCount++;

      const remainingMonths = inst.totalInstallments - proj;
      let endM = viewMonth + remainingMonths;
      let endY = viewYear + Math.floor(endM / 12);
      endM = endM % 12;
      if (endY > maxInstYear || (endY === maxInstYear && endM > maxInstMonth)) {
        maxInstYear = endY;
        maxInstMonth = endM;
      }

      if (consolidatedCatSpent[inst.categoryId]) {
        consolidatedCatSpent[inst.categoryId].spent += inst.installmentAmount || 0;
      }
    }
  });

  const consolidatedTotalExpense = consolidatedDebitExpense + consolidatedCreditVista + consolidatedInstTotal;
  const consolidatedBalance = consolidatedIncome - consolidatedTotalExpense;

  // Insights calculation
  let bestCardName = null;
  let bestCardVal = 0;
  Object.keys(cardUsage).forEach(cid => {
    if (cardUsage[cid] > bestCardVal) {
      bestCardVal = cardUsage[cid];
      const cardDef = cards.find(c => c.id === cid);
      bestCardName = cardDef ? cardDef.name : 'Cartão Principal';
    }
  });

  let lastInstMonthStr = 'N/A';
  if (maxInstMonth >= 0) {
    lastInstMonthStr = `${MONTHS_PT[maxInstMonth]}/${maxInstYear}`;
  }

  // Chart 1: Expenses by Category
  const extractCatPieData = Object.values(consolidatedCatSpent)
    .filter(c => c.spent > 0)
    .map(c => ({ name: c.name, value: c.spent, color: c.color || '#4F46E5' }));

  // Chart 2: Expenses by Type
  const extractTypePieData = [
    { name: 'Cartão de Crédito', value: consolidatedCreditVista, color: '#4F46E5' },
    { name: 'Débito / Pix', value: consolidatedDebitExpense, color: '#10B981' },
    { name: 'Compras Parceladas', value: consolidatedInstTotal, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  // Goals summary list sorted: exceeded (>100%) first, then high (>80%), then others
  const extractGoalsList = Object.values(consolidatedCatSpent)
    .filter(c => c.goal > 0)
    .sort((a, b) => {
      const getStatus = (item) => {
        if (item.spent > item.goal) return 2;
        if (item.spent > item.goal * 0.8) return 1;
        return 0;
      };
      const diff = getStatus(b) - getStatus(a);
      if (diff !== 0) return diff;
      return b.spent - a.spent;
    });

  // Consolidated cat spent map for GoalsBalanceWidget
  const consolidatedCatSpentMap = Object.fromEntries(
    Object.entries(consolidatedCatSpent).map(([k, v]) => [k, v.spent])
  );

  // Sorting helpers
  const sortRows = (arr, sort, amountKey = 'amount') => {
    return [...arr].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sort === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sort === 'val_desc') return b[amountKey] - a[amountKey];
      if (sort === 'val_asc') return a[amountKey] - b[amountKey];
      return 0;
    });
  };

  const filteredCredits = sortRows(
    creditFilterCat === 'all' ? cardCredits : cardCredits.filter(e => e.categoryId === creditFilterCat),
    creditSort
  );
  const creditTotalPages = Math.ceil(filteredCredits.length / ITEMS_PER_PAGE) || 1;
  const paginatedCredits = filteredCredits.slice((creditPage - 1) * ITEMS_PER_PAGE, creditPage * ITEMS_PER_PAGE);

  const filteredInsts = sortRows(
    instFilterCat === 'all' ? cardInstsAll : cardInstsAll.filter(i => i.categoryId === instFilterCat),
    instSort, 'installmentAmount'
  );
  const instTotalPages = Math.ceil(filteredInsts.length / ITEMS_PER_PAGE) || 1;
  const paginatedInsts = filteredInsts.slice((instPage - 1) * ITEMS_PER_PAGE, instPage * ITEMS_PER_PAGE);

  const filteredDebits = sortRows(
    debitFilterCat === 'all' ? expenseDebitThisMonth : expenseDebitThisMonth.filter(t => t.categoryId === debitFilterCat),
    debitSort
  );
  const debitTotalPages = Math.ceil(filteredDebits.length / ITEMS_PER_PAGE) || 1;
  const paginatedDebits = filteredDebits.slice((debitPage - 1) * ITEMS_PER_PAGE, debitPage * ITEMS_PER_PAGE);

  const incomeSorted = [...incomeThisMonth].sort((a, b) => new Date(b.date) - new Date(a.date));
  const incomeTotalPages = Math.ceil(incomeSorted.length / ITEMS_PER_PAGE) || 1;
  const paginatedIncome = incomeSorted.slice((incomePage - 1) * ITEMS_PER_PAGE, incomePage * ITEMS_PER_PAGE);

  const filteredCategories = categories.filter(c => (c.type || 'expense') === catTab);
  const catTotalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = filteredCategories.slice((catPage - 1) * ITEMS_PER_PAGE, catPage * ITEMS_PER_PAGE);

  // Settings submit
  const onSettingsSubmit = (e) => {
    e.preventDefault();
    const updatedCards = cards.map(c => {
      if (c.id === currentCardId) {
        return {
          ...c,
          name: cardNameInput || c.name,
          closingDay: parseInt(cardClosingDayInput) || c.closingDay,
          dueDay: parseInt(cardDueDayInput) || c.dueDay
        };
      }
      return c;
    });
    setUserSettings(prev => ({ ...prev, cards: updatedCards }));
    setSettingsMsg('Configurações salvas com sucesso!');
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  const onCategorySubmit = (e) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    handleSaveCategory({ name: catNameInput, goal: parseFloat(catGoalInput) || 0, color: catBgInput, textColor: catTextInput, type: catTab });
    setCatNameInput(''); setCatGoalInput('');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--c-bg-card)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].name}</p>
          <p style={{ margin: 0, color: payload[0].payload.color }}>{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const GoalsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--c-bg-card)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{label}</p>
          {payload.map(p => (
            <p key={p.name} style={{ margin: 0, color: p.name === 'Gasto' ? '#EF4444' : '#10B981' }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="content-scroll">

      {/* ── DASHBOARD / VISÃO GERAL ── */}
      {(activeNav === 'dashboard') && (
        <div id="dashboard-grid" className="dashboard-grid">

          {/* SECTION GOALS */}
          <section id="section-goals" className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-bullseye" style={{ color: 'var(--c-warning)' }}></i>
                <h3>Metas de Categorias</h3>
              </div>
            </div>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
              Acompanhe o limite numérico e visual de gastos definido para cada categoria neste mês.
            </p>

            {/* Goals Balance Widget */}
            <GoalsBalanceWidget expenseCategories={expenseCategories} catSpentMap={catSpentMap} />

            {/* Goals text summary */}
            <div
              id="goals-text-summary"
              className="summary-cards"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                width: '100%',
                margin: '1.5rem 0'
              }}
            >
              {expenseCategories
                .filter(cat => (cat.goal || 0) > 0)
                .map(cat => {
                  const spent = catSpentMap[cat.id] || 0;
                  const pctRaw = cat.goal > 0 ? (spent / cat.goal) * 100 : 0;
                  const pctWidth = Math.min(100, pctRaw);

                  // Group Priority & Colors:
                  // 1: Red (>= 100%)
                  // 2: Yellow (70% - 99%)
                  // 3: Green (<= 69%)
                  let groupPriority = 3;
                  let statusColor = '#10B981';
                  if (pctRaw >= 100) {
                    groupPriority = 1;
                    statusColor = '#EF4444';
                  } else if (pctRaw >= 70) {
                    groupPriority = 2;
                    statusColor = '#F59E0B';
                  }

                  return {
                    ...cat,
                    spent,
                    pctRaw,
                    pctWidth,
                    groupPriority,
                    statusColor
                  };
                })
                .sort((a, b) => {
                  // 1. Group by status (Red -> Yellow -> Green)
                  if (a.groupPriority !== b.groupPriority) {
                    return a.groupPriority - b.groupPriority;
                  }
                  // 2. Sort descending by percentage within same group
                  return b.pctRaw - a.pctRaw;
                })
                .map(cat => (
                  <div
                    key={cat.id}
                    className="summary-card"
                    style={{
                      borderLeft: `4px solid ${cat.statusColor}`,
                      width: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between'
                    }}
                  >
                    <div>
                      <span className="label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{cat.name}</span>
                      <span className="value" style={{ fontSize: '1rem', color: cat.statusColor, fontWeight: 700, marginTop: '0.2rem' }}>
                        {formatCurrency(cat.spent)} / {formatCurrency(cat.goal)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--c-border)', borderRadius: 99, marginTop: '0.6rem', overflow: 'hidden' }}>
                      <div style={{ width: `${cat.pctWidth}%`, height: '100%', background: cat.statusColor, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="dashboard-grid goals-charts-grid" style={{ gap: '1.5rem', marginTop: 0 }}>
              <div className="chart-container" style={{ marginTop: 0 }}>
                <h4>Progresso das Metas</h4>
                <div className="chart-wrapper" style={{ height: 350 }}>
                  {goalsBarsData.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={goalsBarsData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }} angle={-35} textAnchor="end" />
                        <YAxis tickFormatter={v => `R$${v}`} tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }} width={70} />
                        <Tooltip content={<GoalsTooltip />} />
                        <Legend />
                        <Bar dataKey="Gasto" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Meta" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="chart-container" style={{ marginTop: 0 }}>
                <h4 style={{ fontSize: '0.95rem' }}>Distribuição (Crédito + Débito + Parcelado)</h4>
                <div className="chart-wrapper" style={{ height: 350 }}>
                  {overallPieData.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={overallPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {overallPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* ── CREDIT SECTION ── */}
      {(activeNav === 'dashboard' || activeNav === 'credit') && (
        <div id="credit-grid" className="dashboard-grid">
          <section id="section-credit" className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-regular fa-credit-card icon-credit"></i>
                <h3>Cartões de Crédito</h3>
              </div>
            </div>

            {/* Card Tabs */}
            <div id="credit-card-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--c-border)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
              {cards.map(card => (
                <button key={card.id} className={`btn ${currentCardId === card.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCurrentCardId(card.id)} style={{ borderRadius: '99px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {card.name}
                </button>
              ))}
              <button onClick={() => setActiveModal('card-settings')} className="btn btn-text" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-plus"></i> Adicionar
              </button>
            </div>

            {/* À Vista sub-section */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <i className="fa-solid fa-receipt" style={{ color: 'var(--c-primary)', fontSize: '1.25rem' }}></i>
                <h3 style={{ fontSize: '1.25rem' }}>Compras à Vista <span style={{ color: 'var(--c-text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>({currentCard.name})</span></h3>
              </div>
              <button onClick={() => { setEditingCreditId(null); setActiveModal('credit'); }} className="btn btn-primary btn-shadow">
                <i className="fa-solid fa-plus"></i> Nova Despesa à Vista
              </button>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <span className="label">Pagamentos à Vista</span>
                <span className="value text-danger" id="credit-current-value">{formatCurrency(totalVista)}</span>
              </div>
              <div className="summary-card" id="credit-total-card">
                <span className="label">Fatura Total deste Mês</span>
                <span className="value text-danger" id="credit-total-value">{formatCurrency(totalFaturaMes)}</span>
                <span className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>pagamentos à vista + parcelas</span>
              </div>
              <div className="summary-card">
                <span className="label">Próxima Fatura</span>
                <span className="value text-warning" id="credit-next-value">{formatCurrency(totalNextFatura)}</span>
                <span className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>pagamentos à vista + parcelas</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="list-controls" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
              <div className="filter-group">
                <span className="filter-label">Filtrar pesquisa:</span>
                <div className="filter-selects">
                  <select id="filter-cat-credit" className="form-select filter-select" value={creditFilterCat} onChange={e => setCreditFilterCat(e.target.value)}>
                    <option value="all">Todas as Categorias</option>
                    {categories.filter(c => (c.type || 'expense') === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select id="sort-credit" className="form-select filter-select" value={creditSort} onChange={e => setCreditSort(e.target.value)}>
                    <option value="date_desc">Data (Mais Novas)</option>
                    <option value="date_asc">Data (Mais Antigas)</option>
                    <option value="val_desc">Maior Valor</option>
                    <option value="val_asc">Menor Valor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table" id="credit-table">
                <thead>
                  <tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th><th>Vigência</th><th>Vencimento</th><th className="text-center" style={{ width: 50 }}>Ação</th></tr>
                </thead>
                <tbody>
                  {filteredCredits.length === 0 ? (
                    <tr className="empty-row"><td colSpan="7">Nenhuma despesa registrada para {currentCard.name} em {MONTHS_PT[viewMonth]} {viewYear}.</td></tr>
                  ) : paginatedCredits.map(exp => {
                    const cat = categories.find(c => c.id === exp.categoryId);
                    return (
                      <tr key={exp.id}>
                        <td>{formatDate(exp.date)}</td>
                        <td><strong>{exp.name}</strong></td>
                        <td className="text-danger">-{formatCurrency(exp.amount)}</td>
                        <td>{cat ? <span className="category-badge" style={{ background: cat.color, color: cat.textColor || '#fff' }}>{cat.name}</span> : '-'}</td>
                        <td><small>{formatDate(exp.cycleStart)} a {formatDate(exp.cycleEnd)}</small></td>
                        <td>{formatDate(exp.dueDate)}</td>
                        <td className="text-center">
                          <button onClick={() => { setEditingCreditId(exp.id); setActiveModal('credit'); }} className="btn-edit" title="Editar" style={{ marginRight: '0.4rem' }}><i className="fa-solid fa-pen-to-square"></i></button>
                          <button onClick={() => handleDeleteCreditExpense(exp.id)} className="btn-delete" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControls currentPage={creditPage} totalPages={creditTotalPages} onPageChange={setCreditPage} />

            {/* Credit Chart */}
            <div className="chart-container">
              <h4>Despesas à Vista por Categoria</h4>
              <div className="chart-wrapper">
                {creditPieData.length === 0 ? <ChartEmpty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={creditPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {creditPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* INSTALLMENTS SUB-SECTION */}
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px dashed var(--c-border)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ color: 'var(--c-primary)', fontSize: '1.25rem' }}></i>
                  <h3 style={{ fontSize: '1.25rem' }}>Compras Parceladas <span style={{ color: 'var(--c-text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>({currentCard.name})</span></h3>
                </div>
                <button onClick={() => { setEditingInstId(null); setActiveModal('installment'); }} className="btn btn-primary btn-shadow">
                  <i className="fa-solid fa-cart-shopping"></i> Nova Compra Parcelada
                </button>
              </div>

              <div className="summary-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="summary-card" style={{ flex: '0 0 auto', minWidth: 180 }}>
                  <span className="label">Nº de Compras Ativas</span>
                  <span className="value" id="inst-active-count">{cardInstsAll.length}</span>
                </div>
                <div className="summary-card" style={{ flex: 1, minWidth: 200 }}>
                  <span className="label">Parcelas este Mês</span>
                  <span className="value text-warning" id="inst-this-month">{formatCurrency(totalInstsThisMonth)}</span>
                  <span className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>parcelas a serem pagas na vigência desta fatura</span>
                </div>
                <div className="summary-card" style={{ flex: 1, minWidth: 200 }}>
                  <span className="label">Total em Aberto</span>
                  <span className="value text-danger" id="inst-total-open">{formatCurrency(totalInstsOpen)}</span>
                  <span className="label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>soma da totalidade das parcelas</span>
                </div>
              </div>

              {/* Inst filters */}
              <div className="list-controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div className="filter-group">
                  <span className="filter-label">Filtrar pesquisa:</span>
                  <div className="filter-selects">
                    <select id="filter-cat-inst" className="form-select filter-select" value={instFilterCat} onChange={e => setInstFilterCat(e.target.value)}>
                      <option value="all">Todas as Categorias</option>
                      {categories.filter(c => (c.type || 'expense') === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select id="sort-inst" className="form-select filter-select" value={instSort} onChange={e => setInstSort(e.target.value)}>
                      <option value="date_desc">Data (Mais Novas)</option>
                      <option value="date_asc">Data (Mais Antigas)</option>
                      <option value="val_desc">Maior Valor/Parcela</option>
                      <option value="val_asc">Menor Valor/Parcela</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table" id="installments-table">
                  <thead>
                    <tr><th>Data</th><th>Descrição</th><th>Valor/Parcela</th><th>Categoria</th><th className="text-center">Parcela (neste mês)</th><th className="text-right">Total Restante</th><th className="text-center" style={{ width: 50 }}>Ação</th></tr>
                  </thead>
                  <tbody id="installments-table-body">
                    {filteredInsts.length === 0 ? (
                      <tr className="empty-row"><td colSpan="7">Nenhuma compra parcelada registrada.</td></tr>
                    ) : paginatedInsts.map(inst => {
                      const cat = categories.find(c => c.id === inst.categoryId);
                      const p = inst.date.split('-');
                      const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
                      const card = cards.find(c => c.id === (inst.cardId || 'card1'));
                      const closing = card?.closingDay || 11;
                      const offset = instCycleOffset(inst.date, closing);
                      const diff = (viewYear - py) * 12 + (viewMonth - pm) - offset;
                      const currentProj = inst.currentInstallment + diff;
                      const remaining = Math.max(0, inst.totalInstallments - currentProj + 1);
                      const active = currentProj >= 1 && currentProj <= inst.totalInstallments;
                      return (
                        <tr key={inst.id} style={{ opacity: active ? 1 : 0.5 }}>
                          <td>{formatDate(inst.date)}</td>
                          <td><strong>{inst.name}</strong></td>
                          <td className="text-danger">{formatCurrency(inst.installmentAmount)}</td>
                          <td>{cat ? <span className="category-badge" style={{ background: cat.color, color: cat.textColor || '#fff' }}>{cat.name}</span> : '-'}</td>
                          <td className="text-center">{active ? `${currentProj} / ${inst.totalInstallments}` : <span style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>Não ativa</span>}</td>
                          <td className="text-right">{formatCurrency(remaining * inst.installmentAmount)}</td>
                          <td className="text-center">
                            <button onClick={() => { setEditingInstId(inst.id); setActiveModal('installment'); }} className="btn-edit" title="Editar" style={{ marginRight: '0.4rem' }}><i className="fa-solid fa-pen-to-square"></i></button>
                            <button onClick={() => handleDeleteInstallment(inst.id)} className="btn-delete" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationControls currentPage={instPage} totalPages={instTotalPages} onPageChange={setInstPage} />
            </div>
          </section>
        </div>
      )}

      {/* ── DEBIT SECTION ── */}
      {(activeNav === 'dashboard' || activeNav === 'debit') && (
        <div id="debit-grid" className="dashboard-grid">
          <section id="section-debit" className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-building-columns icon-debit"></i>
                <h3>Conta-corrente</h3>
              </div>
              <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => { setEditingDebitId(null); setActiveModal('income'); }} className="btn btn-success btn-shadow">
                  <i className="fa-solid fa-plus"></i> Nova Receita
                </button>
                <button onClick={() => { setEditingDebitId(null); setActiveModal('debit'); }} className="btn btn-primary btn-shadow">
                  <i className="fa-solid fa-plus"></i> Nova Despesa
                </button>
              </div>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <span className="label">Saldo Mensal (Receitas - Despesas)</span>
                <span className={`value ${totalBalanceCC >= 0 ? 'text-success' : 'text-danger'}`} id="cc-balance-value">{formatCurrency(totalBalanceCC)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Total Receitas</span>
                <span className="value text-success" id="cc-income-value">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Total Despesas</span>
                <span className="value text-danger" id="cc-expense-value">{formatCurrency(totalExpenseDebit)}</span>
              </div>
            </div>

            {/* Income table */}
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4><i className="fa-solid fa-arrow-trend-up" style={{ color: 'var(--c-success)', marginRight: '0.5rem' }}></i> Rendimentos</h4>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th><th className="text-center" style={{ width: 50 }}>Ação</th></tr></thead>
                  <tbody id="income-table-body">
                    {incomeThisMonth.length === 0 ? (
                      <tr className="empty-row"><td colSpan="5">Nenhum rendimento registrado em {MONTHS_PT[viewMonth]} {viewYear}.</td></tr>
                    ) : paginatedIncome.map(txn => {
                      const cat = categories.find(c => c.id === txn.categoryId);
                      return (
                        <tr key={txn.id}>
                          <td>{formatDate(txn.date)}</td>
                          <td><strong>{txn.name}</strong></td>
                          <td className="text-success">+{formatCurrency(txn.amount)}</td>
                          <td>{cat ? <span className="category-badge" style={{ background: cat.color, color: cat.textColor || '#fff' }}>{cat.name}</span> : '-'}</td>
                          <td className="text-center">
                            <button onClick={() => { setEditingDebitId(txn.id); setActiveModal('income'); }} className="btn-edit" title="Editar" style={{ marginRight: '0.4rem' }}><i className="fa-solid fa-pen-to-square"></i></button>
                            <button onClick={() => handleDeleteDebitTransaction(txn.id)} className="btn-delete" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationControls currentPage={incomePage} totalPages={incomeTotalPages} onPageChange={setIncomePage} />
            </div>

            {/* Debit filter + table */}
            <div className="list-controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="filter-group">
                <span className="filter-label">Filtrar pesquisa:</span>
                <div className="filter-selects">
                  <select id="filter-cat-debit" className="form-select filter-select" value={debitFilterCat} onChange={e => setDebitFilterCat(e.target.value)}>
                    <option value="all">Todas as Categorias</option>
                    {categories.filter(c => (c.type || 'expense') === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select id="sort-debit" className="form-select filter-select" value={debitSort} onChange={e => setDebitSort(e.target.value)}>
                    <option value="date_desc">Data (Mais Novas)</option>
                    <option value="date_asc">Data (Mais Antigas)</option>
                    <option value="val_desc">Maior Valor</option>
                    <option value="val_asc">Menor Valor</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table" id="debit-table">
                <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th><th>Tipo</th><th className="text-center" style={{ width: 50 }}>Ação</th></tr></thead>
                <tbody>
                  {filteredDebits.length === 0 ? (
                    <tr className="empty-row"><td colSpan="6">Nenhuma despesa em {MONTHS_PT[viewMonth]} {viewYear}.</td></tr>
                  ) : paginatedDebits.map(txn => {
                    const cat = categories.find(c => c.id === txn.categoryId);
                    const typeLabel = txn.type === 'debit' ? 'Débito' : txn.type === 'pix' ? 'Pix' : 'Saída';
                    return (
                      <tr key={txn.id}>
                        <td>{formatDate(txn.date)}</td>
                        <td><strong>{txn.name}</strong></td>
                        <td className="text-danger">-{formatCurrency(txn.amount)}</td>
                        <td>{cat ? <span className="category-badge" style={{ background: cat.color, color: cat.textColor || '#fff' }}>{cat.name}</span> : '-'}</td>
                        <td><small>{typeLabel}</small></td>
                        <td className="text-center">
                          <button onClick={() => { setEditingDebitId(txn.id); setActiveModal('debit'); }} className="btn-edit" title="Editar" style={{ marginRight: '0.4rem' }}><i className="fa-solid fa-pen-to-square"></i></button>
                          <button onClick={() => handleDeleteDebitTransaction(txn.id)} className="btn-delete" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls currentPage={debitPage} totalPages={debitTotalPages} onPageChange={setDebitPage} />

            {/* Debit Chart */}
            <div className="chart-container">
              <h4>Despesas Conta-corrente por Categoria (Somente Saídas)</h4>
              <div className="chart-wrapper">
                {debitPieData.length === 0 ? <ChartEmpty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={debitPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {debitPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── CATEGORIES GRID ── */}
      {activeNav === 'categories' && (
        <div id="categories-grid" className="dashboard-grid">
          <section className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-tags" style={{ color: 'var(--c-primary)' }}></i>
                <h3>Gerenciador de Categorias</h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button className={`btn ${catTab === 'expense' ? 'btn-primary' : 'btn-outline'}`} id="tab-cat-expense" onClick={() => setCatTab('expense')}>Despesas</button>
              <button className={`btn ${catTab === 'income' ? 'btn-primary' : 'btn-outline'}`} id="tab-cat-income" onClick={() => setCatTab('income')}>Rendimentos</button>
            </div>

            <form id="category-form" onSubmit={onCategorySubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flexGrow: 1, margin: 0, minWidth: 200 }}>
                <label htmlFor="cat-name">Nome da Categoria</label>
                <input type="text" id="cat-name" required placeholder="Ex: Lazer, Saúde" value={catNameInput} onChange={e => setCatNameInput(e.target.value)} />
              </div>
              {catTab === 'expense' && (
                <div className="form-group" style={{ margin: 0, width: 150 }}>
                  <label htmlFor="cat-goal">Meta Mensal (R$)</label>
                  <input type="number" id="cat-goal" step="0.01" min="0" placeholder="0.00" value={catGoalInput} onChange={e => setCatGoalInput(e.target.value)} />
                </div>
              )}
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cat-bg">Cor de Fundo</label>
                <input type="color" id="cat-bg" value={catBgInput} onChange={e => setCatBgInput(e.target.value)} style={{ height: 44, padding: '0.25rem', cursor: 'pointer', borderRadius: 6 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="cat-text">Cor do Texto</label>
                <input type="color" id="cat-text" value={catTextInput} onChange={e => setCatTextInput(e.target.value)} style={{ height: 44, padding: '0.25rem', cursor: 'pointer', borderRadius: 6 }} />
              </div>
              <button type="submit" className="btn btn-primary" id="btn-save-category" style={{ height: 44 }}>Adicionar</button>
            </form>

            <div className="table-container">
              <table className="data-table" id="categories-table">
                <thead>
                  <tr>
                    <th>Pré-visualização</th><th>Nome</th>
                    {catTab === 'expense' && <th className="text-right">Meta (R$)</th>}
                    <th className="text-center" style={{ width: 80 }}>Ação</th>
                  </tr>
                </thead>
                <tbody id="categories-table-body">
                  {filteredCategories.length === 0 ? (
                    <tr className="empty-row"><td colSpan="4">Nenhuma categoria cadastrada neste grupo.</td></tr>
                  ) : paginatedCategories.map(cat => (
                    <tr key={cat.id}>
                      <td><span className="category-badge" style={{ background: cat.color, color: cat.textColor, padding: '0.5rem 1rem' }}>{cat.name}</span></td>
                      <td><strong>{cat.name}</strong></td>
                      {catTab === 'expense' && <td className="text-right">{formatCurrency(cat.goal || 0)}</td>}
                      <td className="text-center">
                        <button onClick={() => { setEditingCatId(cat.id); setCatNameInput(cat.name); setCatBgInput(cat.color); setCatTextInput(cat.textColor || '#ffffff'); setCatGoalInput(cat.goal || ''); setEditingCat(true); }} className="btn-edit" title="Editar" style={{ marginRight: '0.4rem' }}><i className="fa-solid fa-pen-to-square"></i></button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn-delete" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls currentPage={catPage} totalPages={catTotalPages} onPageChange={setCatPage} />
          </section>
        </div>
      )}

      {/* ── SETTINGS GRID ── */}
      {activeNav === 'settings' && (
        <div id="settings-grid" className="dashboard-grid">
          <section className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-gear" style={{ color: 'var(--c-text-muted)' }}></i>
                <h3>Configurações do Cartão</h3>
              </div>
            </div>
            <form onSubmit={onSettingsSubmit} style={{ maxWidth: 400 }}>
              <p className="subtitle" style={{ marginBottom: '2rem' }}>Renomeie seus cartões e defina os dias de fechamento e vencimento.</p>
              <div className="form-group">
                <label htmlFor="settings-card-select">Selecione o Cartão</label>
                <select id="settings-card-select" className="form-select" value={currentCardId} onChange={e => {
                  setCurrentCardId(e.target.value);
                  const sel = cards.find(c => c.id === e.target.value);
                  if (sel) { setCardNameInput(sel.name); setCardClosingDayInput(sel.closingDay); setCardDueDayInput(sel.dueDay); }
                }}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-card-name">Nome do Cartão</label>
                <input type="text" id="set-card-name" placeholder={currentCard.name} value={cardNameInput} onChange={e => setCardNameInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="set-closing-day">Dia de Virada da Fatura</label>
                <small style={{ display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem', color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>A partir deste dia, as compras já entram na fatura do mês seguinte.</small>
                <input type="number" id="set-closing-day" min="1" max="31" placeholder={currentCard.closingDay} value={cardClosingDayInput} onChange={e => setCardClosingDayInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="set-due-day">Dia de Vencimento da Fatura</label>
                <input type="number" id="set-due-day" min="1" max="31" placeholder={currentCard.dueDay} value={cardDueDayInput} onChange={e => setCardDueDayInput(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Salvar Configurações</button>
              {settingsMsg && <p className="text-success" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>{settingsMsg}</p>}
            </form>
          </section>

          {/* ── User Profile Settings Card ── */}
          <section className="card-section">
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-circle-user" style={{ color: 'var(--c-primary)' }}></i>
                <h3>Configurações de Usuário</h3>
              </div>
            </div>

            {/* Change Name */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const n = nameInput.trim();
              if (n.length < 2) { showMsg(setNameMsg, 'Nome muito curto.', false); return; }
              try {
                await handleUpdateName(n);
                setNameInput('');
                showMsg(setNameMsg, '✔ Nome alterado com sucesso!', true);
              } catch (err) { showMsg(setNameMsg, err.message || 'Erro.', false); }
            }} style={{ maxWidth: 400, marginBottom: '2rem' }}>
              <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Altere o nome exibido no sistema.</p>
              <div className="form-group">
                <label htmlFor="user-new-name">Novo Nome</label>
                <input type="text" id="user-new-name" placeholder={profile?.name || 'Digite o novo nome'}
                  value={nameInput} onChange={e => setNameInput(e.target.value)} autoComplete="off" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <i className="fa-solid fa-pen"></i> Salvar Nome
              </button>
              {nameMsg.text && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: nameMsg.ok ? 'var(--c-success)' : 'var(--c-danger)' }}>{nameMsg.text}</p>}
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '1.5rem 0' }} />

            {/* Change Email */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const em = emailInput.trim();
              if (!em || !em.includes('@')) { showMsg(setEmailMsg, 'Por favor, insira um e-mail válido.', false); return; }
              try {
                showMsg(setEmailMsg, 'Enviando solicitação...', true);
                await handleUpdateEmail(em);
                setEmailInput('');
                showMsg(setEmailMsg, `✔ Solicitação enviada! Verifique sua caixa de entrada do e-mail atual e de ${em} para confirmar.`, true);
              } catch (err) {
                const msg = err.status === 422 || err.message?.includes('422')
                  ? 'Confirme a solicitação enviada ao seu e-mail atual antes de tentar novamente.'
                  : err.message?.includes('already') ? 'Este e-mail já está em uso.'
                  : err.message || 'Erro ao alterar e-mail.';
                showMsg(setEmailMsg, msg, false);
              }
            }} style={{ maxWidth: 400, marginBottom: '2rem' }}>
              <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Altere o e-mail de acesso da sua conta.</p>
              <div className="form-group">
                <label htmlFor="user-current-email">E-mail Atual</label>
                <input type="email" id="user-current-email" readOnly value={currentUser?.email || ''} autoComplete="email" />
              </div>
              <div className="form-group">
                <label htmlFor="user-new-email">Novo E-mail</label>
                <input type="email" id="user-new-email" required placeholder="seunovoemail@exemplo.com"
                  value={emailInput} onChange={e => setEmailInput(e.target.value)} autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <i className="fa-solid fa-envelope"></i> Alterar E-mail
              </button>
              {emailMsg.text && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: emailMsg.ok ? 'var(--c-success)' : 'var(--c-danger)', lineHeight: 1.4 }}>{emailMsg.text}</p>}
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '1.5rem 0' }} />

            {/* Change Password */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newPw.length < 6) { showMsg(setPwMsg, 'A senha deve ter no mínimo 6 caracteres.', false); return; }
              if (newPw !== confirmPw) { showMsg(setPwMsg, 'As senhas não coincidem.', false); return; }
              try {
                await handleUpdatePassword(newPw);
                setNewPw(''); setConfirmPw('');
                showMsg(setPwMsg, '✔ Senha alterada com sucesso!', true);
              } catch (err) { showMsg(setPwMsg, err.message || 'Erro ao alterar senha.', false); }
            }} style={{ maxWidth: 400 }}>
              <input type="text" id="change-pin-username" autoComplete="username" aria-hidden="true"
                defaultValue={currentUser?.email || ''} style={{ display: 'none' }} />
              <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Para alterar sua senha, informe a nova senha de no mínimo 6 caracteres.</p>
              <div className="form-group">
                <label htmlFor="user-new-pin">Nova Senha</label>
                <input type="password" id="user-new-pin" minLength={6} placeholder="••••••"
                  value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label htmlFor="user-confirm-pin">Confirmar Nova Senha</label>
                <input type="password" id="user-confirm-pin" minLength={6} placeholder="••••••"
                  value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <i className="fa-solid fa-lock"></i> Alterar Senha
              </button>
              {pwMsg.text && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: pwMsg.ok ? 'var(--c-success)' : 'var(--c-danger)' }}>{pwMsg.text}</p>}
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '1.5rem 0' }} />

            {/* Appearance */}
            <div style={{ maxWidth: 400 }}>
              <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Aparência do Sistema</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: 500 }}>Modo Escuro</span>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
                  <input type="checkbox" id="user-dark-mode" checked={darkMode} onChange={e => applyDarkMode(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: darkMode ? 'var(--c-primary)' : 'var(--c-border)', transition: '.4s', borderRadius: 34 }}></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-md)', marginTop: '0.75rem' }}>
                <span style={{ fontWeight: 500 }}>Barra de Calendário</span>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 50, height: 28 }}>
                  <input type="checkbox" id="user-calendar-bar" checked={calendarBar} onChange={e => applyCalendarBar(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: calendarBar ? 'var(--c-primary)' : 'var(--c-border)', transition: '.4s', borderRadius: 34 }}></span>
                </label>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '1.5rem 0' }} />

            {/* Tutorial */}
            <div style={{ maxWidth: 400 }}>
              <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Tutoriais e Ajuda</p>
              <button id="btn-replay-tutorial" className="btn btn-outline" style={{ width: '100%' }}
                onClick={() => setShowTutorial(true)}>
                <i className="fa-solid fa-graduation-cap"></i> Assistir Tutorial Inicial
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)', margin: '1.5rem 0' }} />

            {/* Danger Zone */}
            <div style={{ maxWidth: 400, padding: '1.5rem', border: '1px solid var(--c-danger)', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.05)' }}>
              <h4 style={{ color: 'var(--c-danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-triangle-exclamation"></i> Zona de Perigo
              </h4>
              <p className="subtitle" style={{ marginBottom: '1.5rem', color: 'var(--c-text-main)' }}>A exclusão da sua conta apagará permanentemente todos os seus dados e não poderá ser desfeita.</p>
              <button id="btn-delete-account-trigger" className="btn btn-danger" style={{ width: '100%' }}
                onClick={() => { setDeletePw(''); setDeleteMsg({ text: '', ok: true }); setShowDeleteModal(true); }}>
                <i className="fa-solid fa-user-xmark"></i> Excluir Minha Conta
              </button>
            </div>
          </section>

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="modal-overlay" style={{ display: 'flex' }}>
              <div className="modal-card">
                <div className="modal-header">
                  <h3 style={{ color: 'var(--c-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Excluir Conta
                  </h3>
                  <button className="btn-icon" onClick={() => setShowDeleteModal(false)}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>Para confirmar a exclusão <strong>permanente</strong> da sua conta e de todos os seus dados, por favor, digite a sua senha atual.</p>
                  <form id="delete-account-form" onSubmit={async (e) => {
                    e.preventDefault();
                    if (!deletePw) return;
                    setDeletingAccount(true);
                    setDeleteMsg({ text: '', ok: true });
                    try {
                      await handleDeleteAccount(deletePw);
                      setShowDeleteModal(false);
                    } catch (err) {
                      const errStr = (err.message || '').toLowerCase();
                      const msg = errStr.includes('login') || errStr.includes('credentials') || errStr.includes('invalid')
                        ? 'Senha incorreta. A exclusão não foi autorizada.'
                        : errStr.includes('function') || errStr.includes('rpc')
                        ? 'A exclusão falhou: o administrador precisa rodar o script SQL no Supabase.'
                        : 'Ocorreu um erro ao excluir a conta. Tente novamente mais tarde.';
                      setDeleteMsg({ text: msg, ok: false });
                    } finally { setDeletingAccount(false); }
                  }}>
                    <div className="form-group">
                      <label htmlFor="delete-account-pw">Sua Senha</label>
                      <input type="password" id="delete-account-pw" required value={deletePw}
                        onChange={e => setDeletePw(e.target.value)} placeholder="••••••" autoComplete="current-password" />
                    </div>
                    {deleteMsg.text && <p id="delete-account-msg" style={{ marginBottom: '1rem', fontSize: '0.85rem', color: deleteMsg.ok ? 'var(--c-success)' : 'var(--c-danger)' }}>{deleteMsg.text}</p>}
                    <div className="form-actions">
                      <button type="button" className="btn btn-text" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                      <button type="submit" id="btn-confirm-delete-account" className="btn btn-danger" disabled={deletingAccount}>
                        {deletingAccount ? <><i className="fa-solid fa-spinner fa-spin"></i> Excluindo...</> : 'Confirmar Exclusão'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ── CONSOLIDATED EXTRACTS ── */}
      {activeNav === 'consolidated-extracts' && (
        <div id="extracts-grid" className="dashboard-grid">
          <section className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <div className="header-title">
                <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--c-primary)' }}></i>
                <h3>Extratos Mensais Consolidados — {MONTHS_PT[viewMonth]} {viewYear}</h3>
              </div>
            </div>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
              Resumo completo da sua atividade financeira no mês, incluindo métricas e progresso das metas de categorias.
            </p>

            {/* Summary Cards */}
            <div className="summary-cards" style={{ marginBottom: '2rem' }}>
              <div className="summary-card">
                <span className="label">Total de Receitas</span>
                <span className="value text-success">{formatCurrency(consolidatedIncome)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Total de Despesas</span>
                <span className="value text-danger">{formatCurrency(consolidatedTotalExpense)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Saldo do Mês</span>
                <span className={`value ${consolidatedBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(consolidatedBalance)}
                </span>
              </div>
            </div>

            {/* AI & Custom Insights */}
            {(activeInstCount > 0 || (bestCardVal > 0 && bestCardName)) && (
              <div id="extract-insights" style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'var(--c-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--c-border)',
                borderLeft: '4px solid var(--c-primary)'
              }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <i className="fa-solid fa-lightbulb"></i> Insights do Mês
                </h4>
                {activeInstCount > 0 && (
                  <p style={{ marginBottom: '0.75rem', color: 'var(--c-text-main)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    Este mês você teve <strong>{activeInstCount}</strong> {activeInstCount === 1 ? 'compra ativa parcelada' : 'compras ativas parceladas'}, num valor total de: <strong>{formatCurrency(consolidatedInstTotal)}</strong>.<br />
                    A última parcela a ser paga está prevista para o mês: <strong>{lastInstMonthStr}</strong>.
                  </p>
                )}
                {bestCardVal > 0 && bestCardName && (
                  <p style={{ margin: 0, color: 'var(--c-text-main)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    O cartão de crédito mais usado foi: <strong>{bestCardName}</strong> (Movimentação no mês: <strong>{formatCurrency(bestCardVal)}</strong>).
                  </p>
                )}
              </div>
            )}

            {/* Extract Goals Balance Widget */}
            <div id="extract-balance-widget" style={{ marginBottom: '2rem' }}>
              <GoalsBalanceWidget
                expenseCategories={expenseCategories}
                catSpentMap={consolidatedCatSpentMap}
              />
            </div>

            {/* Charts & Goals Summary Grid */}
            <div className="dashboard-grid goals-charts-grid" style={{ gap: '1.5rem', marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              
              {/* Pie Chart 1: Categorias */}
              <div className="chart-container" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', background: 'var(--c-bg)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--c-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-main)', marginBottom: '1.5rem', textAlign: 'center' }}>Distribuição de Despesas por Categoria</h4>
                <div className="chart-wrapper" style={{ height: 320 }}>
                  {extractCatPieData.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={extractCatPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                          {extractCatPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Pie Chart 2: Tipo de Pagamento */}
              <div className="chart-container" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', background: 'var(--c-bg)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--c-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-main)', marginBottom: '1.5rem', textAlign: 'center' }}>Divisão por Tipo (Crédito, Débito, Parcelas)</h4>
                <div className="chart-wrapper" style={{ height: 320 }}>
                  {extractTypePieData.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={extractTypePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                          {extractTypePieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Card 3: Resumo das Metas */}
              <div className="chart-container" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1', background: 'var(--c-bg)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--c-border)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-main)', marginBottom: '1.5rem', textAlign: 'left' }}>Resumo das Metas</h4>
                <div id="extract-goals-summary" style={{ flex: 1, padding: '0.5rem 0' }}>
                  {extractGoalsList.length === 0 ? (
                    <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>Nenhuma meta definida para as categorias.</p>
                  ) : (
                    extractGoalsList.map(c => {
                      const isOver = c.spent > c.goal;
                      const diff = Math.abs(c.spent - c.goal);
                      const pct = c.goal > 0 ? ((c.spent / c.goal) * 100).toFixed(0) : 0;
                      
                      return (
                        <div key={c.name} style={{
                          marginBottom: '1rem', paddingBottom: '1rem',
                          borderBottom: '1px solid var(--c-border)',
                          display: 'flex', gap: '1rem', alignItems: 'flex-start'
                        }}>
                          <span style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
                            {isOver ? (
                              <i className="fa-solid fa-circle-exclamation text-danger"></i>
                            ) : c.spent > 0 ? (
                              <i className="fa-solid fa-circle-check text-success"></i>
                            ) : (
                              <i className="fa-regular fa-circle-check" style={{ color: 'var(--c-text-muted)' }}></i>
                            )}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <strong style={{ fontSize: '0.95rem' }}>{c.name}</strong>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isOver ? 'var(--c-danger)' : 'var(--c-text-muted)' }}>
                                {formatCurrency(c.spent)} / {formatCurrency(c.goal)} ({pct}%)
                              </span>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--c-text-muted)', lineHeight: 1.4 }}>
                              {isOver ? (
                                <>Você excedeu a meta de {formatCurrency(c.goal)} em <strong className="text-danger">{formatCurrency(diff)}</strong> ({pct}% consumido).</>
                              ) : c.spent > 0 ? (
                                <>Você gastou {formatCurrency(c.spent)} de sua meta de {formatCurrency(c.goal)}. Ainda tem <strong className="text-success">{formatCurrency(diff)}</strong> disponível ({pct}% consumido).</>
                              ) : (
                                <>Você ainda não registrou gastos. Sua meta inteira de <strong className="text-success">{formatCurrency(c.goal)}</strong> está disponível.</>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </section>
        </div>
      )}

      {/* ── AI ASSISTANT ── */}
      {activeNav === 'ai-assistant' && (
        <div id="ai-assistant-grid" className="dashboard-grid">
          <section className="card-section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="header-title">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--c-primary)' }}></i>
                <h3>Relatórios Financeiros com IA</h3>
              </div>

              {/* AI Month Navigation */}
              <div className="month-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--c-bg)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)' }}>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={aiViewYear === 2026 && aiViewMonth === 0}
                  onClick={() => {
                    if (aiViewYear === 2026 && aiViewMonth === 0) return;
                    if (aiViewMonth === 0) {
                      setAiViewMonth(11);
                      setAiViewYear(prev => prev - 1);
                    } else {
                      setAiViewMonth(prev => prev - 1);
                    }
                  }}
                  title="Mês Anterior"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 120, textAlign: 'center' }}>
                  {MONTHS_PT[aiViewMonth]} {aiViewYear}
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={(() => {
                    const now = new Date();
                    const capIndex = (now.getFullYear() * 12 + now.getMonth()) + 6;
                    const viewIndex = aiViewYear * 12 + aiViewMonth;
                    return viewIndex >= capIndex;
                  })()}
                  onClick={() => {
                    if (aiViewMonth === 11) {
                      setAiViewMonth(0);
                      setAiViewYear(prev => prev + 1);
                    } else {
                      setAiViewMonth(prev => prev + 1);
                    }
                  }}
                  title="Próximo Mês"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '2rem 1rem 1rem' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, var(--c-primary), #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 30px rgba(79,70,229,0.3)' }}>
                <i className="fa-solid fa-brain" style={{ fontSize: '1.8rem', color: 'white' }}></i>
              </div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Análise Inteligente Mensal — G-TECH IA</h4>
              <p style={{ color: 'var(--c-text-muted)', maxWidth: 540, margin: '0 auto 1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {aiStatusMsg}
              </p>

              {/* Action Button */}
              {isAllowedMonth && !aiExistingReport && (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={aiLoading}
                  onClick={handleGenerateAIReport}
                  style={{ height: 48, padding: '0 2rem', fontSize: '1rem' }}
                >
                  {aiLoading ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Gerando Análise...</>
                  ) : (
                    <><i className="fa-solid fa-wand-magic-sparkles"></i> Gerar Relatório de {MONTHS_PT[aiViewMonth]}</>
                  )}
                </button>
              )}

              {!isAllowedMonth && !aiExistingReport && (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled
                  style={{ height: 44, opacity: 0.6 }}
                >
                  {isExpired ? (
                    <><i className="fa-solid fa-ban"></i> Prazo Expirado</>
                  ) : (
                    <><i className="fa-solid fa-clock"></i> Mês em Andamento</>
                  )}
                </button>
              )}

              {aiExistingReport && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-success)', background: 'rgba(16,185,129,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-circle-check"></i> Relatório de {MONTHS_PT[aiViewMonth]} {aiViewYear} já gerado!
                </div>
              )}
            </div>

            {/* Generated Report Display */}
            {aiReportText && (
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--c-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-primary)' }}>
                    <i className="fa-solid fa-file-lines"></i> Relatório Financeiro Personalizado
                  </h4>
                  {aiReportMeta && (
                    <small style={{ color: 'var(--c-text-muted)', fontSize: '0.8rem' }}>
                      Gerado em: {new Date(aiReportMeta).toLocaleDateString('pt-BR')} às {new Date(aiReportMeta).toLocaleTimeString('pt-BR')}
                    </small>
                  )}
                </div>

                <div
                  style={{
                    background: 'var(--c-bg)',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--c-border)',
                    lineHeight: 1.7,
                    fontSize: '0.95rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: parseAIMarkdown(aiReportText) }}
                />
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── APP FOOTER ── */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={logoGarbayo} alt="Logo Garbayo Web&Tech" className="footer-logo" />
          </div>
          <div className="footer-info">
            <p>CNPJ: 00.000.000.0000/00</p>
            <p><i className="fa-brands fa-whatsapp"></i> (21) 98769-2747</p>
            <p><i className="fa-regular fa-envelope"></i> <a href="mailto:garbayowebtech@gmail.com">garbayowebtech@gmail.com</a></p>
          </div>
          <div className="footer-social">
            <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
            <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Garbayo Web&Tech. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// ── Tutorial Modal Component ──────────────────────────────────────
const TUTORIAL_SLIDES = [
  {
    icon: 'fa-hand-sparkles',
    title: 'Bem-vindo(a)!',
    text: 'Obrigado por utilizar o nosso app! Preparamos esse passo-a-passo para te mostrar como aproveitar ao máximo cada funcionalidade do G-TECH PLANNER.'
  },
  {
    icon: 'fa-shoe-prints',
    title: 'Primeiro passo',
    text: 'Antes de tudo, assim que você fechar este tutorial, deve ir em configurações e adicionar um cartão de crédito: lembre-se de inserir corretamente as informações para que o app possa te ajudar de forma precisa!'
  },
  {
    icon: 'fa-chart-pie',
    title: 'Visão Geral',
    text: 'Aqui você encontra um panorama completo das suas finanças: o progresso das metas por categorias, gráficos de distribuição e o saldo dos diferentes meios de pagamento.'
  },
  {
    icon: 'fa-credit-card',
    title: 'Cartão de Crédito',
    text: 'Cadastre as compras feitas no crédito, na modalidade à vista, sempre com uma categoria. Essas despesas entrarão automaticamente na fatura correspondente ao ciclo de fechamento configurado.'
  },
  {
    icon: 'fa-cart-shopping',
    title: 'Compras Parceladas',
    text: 'Aqui estão as compras que você parcela na maquininha ou online. É importante inserir corretamente o valor de uma parcela, o número da parcela atual e o total de parcelas para cálculos precisos.'
  },
  {
    icon: 'fa-building-columns',
    title: 'Débito e Pix',
    text: 'Nesta área você deve cadastrar as compras à vista ou receitas que movimentam diretamente a sua conta corrente (saldo atual), seja via débito, Pix, transferências ou boletos.'
  },
  {
    icon: 'fa-file-invoice-dollar',
    title: 'Extratos Consolidados',
    text: 'Um resumo completo e fechado da sua atividade financeira naquele mês: total de receitas, total de despesas, gráficos específicos e o acompanhamento exato de cada meta de categoria.'
  },
  {
    icon: 'fa-tags',
    title: 'Categorias',
    text: 'A chave da organização! Cadastre categorias que englobem todas as suas despesas (usuais ou não) e defina metas (limites de gastos). Quanto mais específico, melhor e mais visual será o seu controle.'
  },
  {
    icon: 'fa-gear',
    title: 'Configurações',
    text: 'Preste atenção às configurações do cartão: os dias de fechamento e vencimento da fatura influenciam diretamente nos balanços mensais. Aqui você também ajusta seu perfil e preferências de visual.'
  }
];

export function TutorialModal() {
  const { showTutorial, finishTutorial } = useApp();
  const [step, setStep] = React.useState(0);
  const total = TUTORIAL_SLIDES.length;

  React.useEffect(() => {
    if (showTutorial) setStep(0);
  }, [showTutorial]);

  if (!showTutorial) return null;

  const slide = TUTORIAL_SLIDES[step];
  const isLast = step === total - 1;

  return (
    <div id="tutorial-modal" className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: 520, width: '100%' }}>
        <div className="modal-header">
          <h3>Tutorial do App</h3>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '2rem', textAlign: 'center', minHeight: 220 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--c-primary), #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', boxShadow: '0 8px 30px rgba(79,70,229,0.25)'
            }}>
              <i className={`fa-solid ${slide.icon}`} style={{ fontSize: '1.75rem', color: 'white' }}></i>
            </div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>{slide.title}</h4>
            <p style={{ color: 'var(--c-text-muted)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>{slide.text}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--c-border)', padding: '1rem 1.5rem' }}>
          {/* Dots */}
          <div id="tutorial-dots" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} onClick={() => setStep(i)} style={{
                width: i === step ? 20 : 8, height: 8, borderRadius: 99, cursor: 'pointer', transition: 'all .3s',
                background: i === step ? 'var(--c-primary)' : 'var(--c-border)'
              }} />
            ))}
          </div>
          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button id="btn-tut-prev" className="btn btn-text" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              onClick={() => setStep(s => s - 1)}>
              <i className="fa-solid fa-arrow-left"></i> Voltar
            </button>
            <button id="btn-tut-next" className="btn btn-primary" onClick={() => {
              if (isLast) { finishTutorial(); }
              else setStep(s => s + 1);
            }}>
              {isLast ? <>Começar a usar! <i className="fa-solid fa-check"></i></> : <>Próximo <i className="fa-solid fa-arrow-right"></i></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goals Balance Widget Component ──
function GoalsBalanceWidget({ expenseCategories, catSpentMap }) {
  const cats = expenseCategories.filter(c => (c.goal || 0) > 0);
  if (cats.length === 0) return null;

  const totalGoal = cats.reduce((s, c) => s + c.goal, 0);
  const totalSpent = cats.reduce((s, c) => s + (catSpentMap[c.id] || 0), 0);
  const pctRaw = totalGoal > 0 ? (totalSpent / totalGoal) * 100 : 0;
  const pctWidth = Math.min(100, pctRaw).toFixed(1);

  let statusColor = '#10B981';
  let isOver = false;
  if (pctRaw >= 100) {
    statusColor = '#EF4444';
    isOver = true;
  } else if (pctRaw >= 70) {
    statusColor = '#F59E0B';
  }

  const diff = Math.abs(totalGoal - totalSpent);
  const formatCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div id="goals-balance-widget" style={{ marginBottom: '1.5rem' }}>
      <div style={{ background: 'var(--c-bg-card)', border: `2px solid ${statusColor}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ fontSize: '2rem' }}>
          {pctRaw >= 100 ? (
            <i className="fa-solid fa-triangle-exclamation" style={{ color: '#EF4444' }}></i>
          ) : pctRaw >= 70 ? (
            <i className="fa-solid fa-circle-exclamation" style={{ color: '#F59E0B' }}></i>
          ) : (
            <i className="fa-solid fa-scale-balanced" style={{ color: '#10B981' }}></i>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.2rem' }}>Balancete Global das Metas</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--c-text-muted)', margin: 0 }}>
            {pctRaw >= 100
              ? 'O total de gastos excedeu o orçamento global das metas neste mês.'
              : pctRaw >= 70
              ? 'Atenção: O orçamento total de metas está próximo do limite (acima de 70%).'
              : 'O total geral ainda está dentro do orçamento.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-muted)', marginBottom: '0.2rem' }}>Somatório de Todas as Metas</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(totalGoal)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-muted)', marginBottom: '0.2rem' }}>Total Gasto</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: statusColor }}>{formatCurrency(totalSpent)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-muted)', marginBottom: '0.2rem' }}>{isOver ? 'Estouro' : 'Saldo Disponível'}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: statusColor }}>{formatCurrency(diff)}</span>
          </div>
        </div>
        <div style={{ width: '100%', background: 'var(--c-border)', borderRadius: 99, height: 8, marginTop: '0.25rem' }}>
          <div style={{ width: `${pctWidth}%`, background: statusColor, height: 8, borderRadius: 99, transition: 'width .4s' }} />
        </div>
        <p style={{ width: '100%', textAlign: 'right', fontSize: '0.75rem', color: 'var(--c-text-muted)', margin: 0 }}>{pctWidth}% do orçamento utilizado</p>
      </div>
    </div>
  );
}
