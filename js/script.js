/**
 * script.js â€” Render Functions, Charts & Utilities
 * Depends on: STATE, DOM, DB (all from app-auth.js / app-crud.js / db.js)
 */

// â”€â”€ PAGINATION UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updatePaginationUI(type, page, totalPages) {
    let btnPrev, btnNext, pageInfo;
    if (type === 'credit') { btnPrev = DOM.btnPrevCredit; btnNext = DOM.btnNextCredit; pageInfo = DOM.pageInfoCredit; }
    else if (type === 'inst') { btnPrev = DOM.btnPrevInst; btnNext = DOM.btnNextInst; pageInfo = DOM.pageInfoInst; }
    else if (type === 'debit') { btnPrev = DOM.btnPrevDebit; btnNext = DOM.btnNextDebit; pageInfo = DOM.pageInfoDebit; }

    if (pageInfo) pageInfo.textContent = page > 0 ? `${page} / ${totalPages}` : '1 / 1';
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;
}

// â”€â”€ FILTER EVENT LISTENERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setupFilterEventListeners() {
    ['credit', 'inst', 'debit'].forEach(type => {
        let filterCat, sortSelect, btnPrev, btnNext;
        if (type === 'credit') { filterCat = DOM.filterCatCredit; sortSelect = DOM.sortCredit; btnPrev = DOM.btnPrevCredit; btnNext = DOM.btnNextCredit; }
        else if (type === 'inst') { filterCat = DOM.filterCatInst; sortSelect = DOM.sortInst; btnPrev = DOM.btnPrevInst; btnNext = DOM.btnNextInst; }
        else { filterCat = DOM.filterCatDebit; sortSelect = DOM.sortDebit; btnPrev = DOM.btnPrevDebit; btnNext = DOM.btnNextDebit; }

        filterCat?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (type === 'credit') { STATE.creditFilterCat = val; STATE.creditPage = 1; renderCreditTable(); }
            if (type === 'inst') { STATE.instFilterCat = val; STATE.instPage = 1; renderInstallmentsTable(); }
            if (type === 'debit') { STATE.debitFilterCat = val; STATE.debitPage = 1; renderDebitTable(); }
        });
        sortSelect?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (type === 'credit') { STATE.creditSort = val; renderCreditTable(); }
            if (type === 'inst') { STATE.instSort = val; renderInstallmentsTable(); }
            if (type === 'debit') { STATE.debitSort = val; renderDebitTable(); }
        });
        btnPrev?.addEventListener('click', () => {
            if (type === 'credit') { STATE.creditPage--; renderCreditTable(); }
            if (type === 'inst') { STATE.instPage--; renderInstallmentsTable(); }
            if (type === 'debit') { STATE.debitPage--; renderDebitTable(); }
        });
        btnNext?.addEventListener('click', () => {
            if (type === 'credit') { STATE.creditPage++; renderCreditTable(); }
            if (type === 'inst') { STATE.instPage++; renderInstallmentsTable(); }
            if (type === 'debit') { STATE.debitPage++; renderDebitTable(); }
        });
    });
}

// â”€â”€ MOBILE NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setupMobileNav() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('btn-hamburger');
    const open = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
    hamburger?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => { if (window.innerWidth <= 768) close(); });
    });
}

// â”€â”€ UTILITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatDate(dateStr) {
    const p = dateStr.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function calculateCycle(dateStr, closingDay) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]), month = parseInt(parts[1]) - 1, day = parseInt(parts[2]);
    let start = new Date(year, month, closingDay);
    let end = new Date(year, month + 1, closingDay - 1);
    if (day < closingDay) { start = new Date(year, month - 1, closingDay); end = new Date(year, month, closingDay - 1); }
    return { start, end };
}

// Returns 1 if the purchase date falls AFTER the closing day (so the first
// installment is charged in the NEXT billing cycle), otherwise 0.
function instCycleOffset(dateStr, closingDay) {
    const day = parseInt(dateStr.split('-')[2]);
    return day >= closingDay ? 1 : 0;
}

// â”€â”€ GOAL ALERTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function checkGoalAlerts() {
    const popup = document.getElementById('goal-alert-popup');
    const list = document.getElementById('goal-alert-list');
    const btnOnce = document.getElementById('btn-close-alert-once');
    const btnMonth = document.getElementById('btn-dismiss-alert-month');
    if (!popup || !list || !STATE.userData) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}_${now.getMonth()}`;

    // Check database settings instead of transient localStorage
    if (STATE.userData.settings && STATE.userData.settings.goalAlertDismissed === monthKey) return;

    const catSpent = {};
    (STATE.userData.categories || []).forEach(cat => { catSpent[cat.id] = 0; });
    const curYear = now.getFullYear(), curMonth = now.getMonth();

    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (parseInt(p[0]) === curYear && parseInt(p[1]) - 1 === curMonth && catSpent[exp.categoryId] !== undefined)
            catSpent[exp.categoryId] += exp.amount;
    });
    (STATE.userData.debitTransactions || []).forEach(txn => {
        if (txn.type !== 'expense') return;
        const p = txn.date.split('-');
        if (parseInt(p[0]) === curYear && parseInt(p[1]) - 1 === curMonth && catSpent[txn.categoryId] !== undefined)
            catSpent[txn.categoryId] += txn.amount;
    });
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-');
        const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === (inst.cardId || 'card1'));
        const closing = card?.closingDay || 11;
        const diff = (curYear - py) * 12 + (curMonth - pm) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments && catSpent[inst.categoryId] !== undefined)
            catSpent[inst.categoryId] += inst.installmentAmount;
    });

    const exceeded = [];
    (STATE.userData.categories || []).forEach(cat => {
        const goal = cat.goal || 0, spent = catSpent[cat.id] || 0;
        if (goal > 0 && spent >= goal) exceeded.push({ cat, spent, goal, over: spent > goal });
    });
    if (exceeded.length === 0) return;

    list.innerHTML = '';
    exceeded.forEach(({ cat, spent, goal, over }) => {
        const pct = ((spent / goal) * 100).toFixed(0);
        const li = document.createElement('li');
        li.className = over ? 'exceeded' : 'reached';
        li.innerHTML = `${over ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>'} <span style="flex:1">${cat.name}</span> <span>${formatCurrency(spent)} / ${formatCurrency(goal)} (${pct}%)</span>`;
        list.appendChild(li);
    });
    popup.classList.remove('hidden');
    btnOnce.onclick = () => popup.classList.add('hidden');
    btnMonth.onclick = async () => {
        popup.classList.add('hidden');

        try {
            if (!STATE.userData.settings) STATE.userData.settings = {};
            STATE.userData.settings.goalAlertDismissed = monthKey;

            // Persist preference to Supabase
            await DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings);
        } catch (err) {
            console.error('Failed to save goal alert preference:', err);
        }
    };
}

// â”€â”€ CARD TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCardTabs() {
    const tabsContainer = document.getElementById('credit-card-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const cards = STATE.userData?.settings?.cards || [];
    cards.forEach(card => {
        const btn = document.createElement('button');
        const isActive = card.id === STATE.currentCardId;
        btn.className = `btn ${isActive ? 'btn-primary' : 'btn-outline'}`;
        btn.textContent = card.name;
        btn.style.whiteSpace = 'nowrap';
        btn.style.height = '40px';
        btn.onclick = () => {
            STATE.currentCardId = card.id;
            STATE.creditPage = 1;
            STATE.instPage = 1;
            renderCardTabs();
            renderCreditTable();
            renderCreditChart();
            renderInstallmentsTable();
            renderInstallmentsChart();
        };
        tabsContainer.appendChild(btn);
    });

    if (cards.length < 3) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-text';
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Adicionar';
        addBtn.style.whiteSpace = 'nowrap';
        addBtn.style.height = '40px';
        addBtn.onclick = () => {
            document.getElementById('card-modal').classList.remove('hidden');
        };
        tabsContainer.appendChild(addBtn);
    }
}

// â”€â”€ DASHBOARD INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function initDashboard() {
    DOM.expCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.debCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.instCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.filterCatCredit.innerHTML = '<option value="all">Todas as Categorias</option>';
    DOM.filterCatInst.innerHTML = '<option value="all">Todas as Categorias</option>';
    DOM.filterCatDebit.innerHTML = '<option value="all">Todas as Categorias</option>';
    
    const incCategorySelect = document.getElementById('inc-category');
    if (incCategorySelect) incCategorySelect.innerHTML = '<option value="">Nenhuma / Outros...</option>';

    (STATE.userData.categories || []).forEach(cat => {
        const type = cat.type || 'expense';
        const opt = document.createElement('option');
        opt.value = cat.id; opt.textContent = cat.name;

        if (type === 'expense') {
            DOM.expCategorySelect.appendChild(opt);
            DOM.debCategorySelect.appendChild(opt.cloneNode(true));
            DOM.instCategorySelect.appendChild(opt.cloneNode(true));
            DOM.filterCatCredit.appendChild(opt.cloneNode(true));
            DOM.filterCatInst.appendChild(opt.cloneNode(true));
            DOM.filterCatDebit.appendChild(opt.cloneNode(true));
        } else if (type === 'income') {
            if (incCategorySelect) incCategorySelect.appendChild(opt);
        }
    });

    if (!STATE.userData.installments) STATE.userData.installments = [];
    STATE.creditPage = 1; STATE.instPage = 1; STATE.debitPage = 1;

    renderCardTabs();
    renderCreditTable(); renderCreditChart();
    renderDebitTable(); renderDebitChart();
    renderGoalsChart(); renderOverallPieChart();
    renderInstallmentsTable(); renderInstallmentsChart();

    // Seed default income categories if none exist
    const hasIncomeCats = (STATE.userData.categories || []).some(c => c.type === 'income');
    if (!hasIncomeCats && STATE.currentUser) {
        (async () => {
            const c1 = await DB.createCategory(STATE.currentUser.id, { name: 'Salário', goal: 0, color: '#10B981', textColor: '#FFFFFF', type: 'income' });
            const c2 = await DB.createCategory(STATE.currentUser.id, { name: 'Pensão', goal: 0, color: '#3B82F6', textColor: '#FFFFFF', type: 'income' });
            STATE.userData.categories.push(c1, c2);
            renderCategoriesTable();
            initDashboard(); // Re-populate selects
        })();
    }

    const extractsGrid = document.getElementById('extracts-grid');
    if (extractsGrid && !extractsGrid.classList.contains('hidden')) {
        window.renderConsolidatedExtracts();
    }
}

// â”€â”€ CREDIT TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCreditTable() {
    DOM.creditTableBody.innerHTML = '';
    if (!STATE.userData.creditExpenses || STATE.userData.creditExpenses.length === 0) {
        DOM.creditTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma despesa registrada.</td></tr>';
        updatePaginationUI('credit', 0, 1); return;
    }

    let filtered = STATE.userData.creditExpenses.filter(exp => {
        const p = exp.dueDate.split('-');
        return parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth && (exp.cardId || 'card1') === STATE.currentCardId;
    });

    let currentTotal = 0;
    const nextMonth = STATE.viewMonth === 11 ? 0 : STATE.viewMonth + 1;
    const nextYear = STATE.viewMonth === 11 ? STATE.viewYear + 1 : STATE.viewYear;
    let nextTotal = 0;
    STATE.userData.creditExpenses.forEach(exp => {
        if ((exp.cardId || 'card1') !== STATE.currentCardId) return;
        const p = exp.dueDate.split('-');
        const dy = parseInt(p[0]), dm = parseInt(p[1]) - 1;
        if (dy === STATE.viewYear && dm === STATE.viewMonth) currentTotal += exp.amount;
        else if (dy === nextYear && dm === nextMonth) nextTotal += exp.amount;
    });

    if (STATE.creditFilterCat !== 'all') filtered = filtered.filter(e => e.categoryId === STATE.creditFilterCat);
    filtered.sort((a, b) => {
        if (STATE.creditSort === 'date_desc') return new Date(b.date) - new Date(a.date);
        if (STATE.creditSort === 'date_asc') return new Date(a.date) - new Date(b.date);
        if (STATE.creditSort === 'val_desc') return b.amount - a.amount;
        if (STATE.creditSort === 'val_asc') return a.amount - b.amount;
        return 0;
    });

    const totalPages = Math.ceil(filtered.length / STATE.itemsPerPage) || 1;
    if (STATE.creditPage > totalPages) STATE.creditPage = totalPages;
    const paged = filtered.slice((STATE.creditPage - 1) * STATE.itemsPerPage, STATE.creditPage * STATE.itemsPerPage);
    updatePaginationUI('credit', STATE.creditPage, totalPages);

    if (paged.length === 0) { DOM.creditTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma despesa correspondente.</td></tr>'; }
    else paged.forEach(exp => {
        const cat = STATE.userData.categories.find(c => c.id === exp.categoryId);
        const catHtml = cat ? `<span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span>` : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatDate(exp.date)}</td><td><strong>${exp.name}</strong></td><td class="text-danger">-${formatCurrency(exp.amount)}</td><td>${catHtml}</td><td><small>${formatDate(exp.cycleStart)} a ${formatDate(exp.cycleEnd)}</small></td><td>${formatDate(exp.dueDate)}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editCreditExpense('${exp.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteCreditExpense('${exp.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
        DOM.creditTableBody.appendChild(tr);
    });

    const cv = document.getElementById('credit-current-value');
    const nv = document.getElementById('credit-next-value');
    const tv = document.getElementById('credit-total-value');

    let instThisMonth = 0, instNextMonth = 0;
    (STATE.userData.installments || []).forEach(inst => {
        if ((inst.cardId || 'card1') !== STATE.currentCardId) return;
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === STATE.currentCardId);
        const closing = card?.closingDay || 11;
        const offset = instCycleOffset(inst.date, closing);
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm) - offset;
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) instThisMonth += inst.installmentAmount;
        const diffN = (nextYear - py) * 12 + (nextMonth - pm) - offset;
        const projN = inst.currentInstallment + diffN;
        if (projN >= 1 && projN <= inst.totalInstallments) instNextMonth += inst.installmentAmount;
    });

    if (cv) cv.textContent = formatCurrency(currentTotal);
    if (nv) nv.textContent = formatCurrency(nextTotal + instNextMonth);
    if (tv) tv.textContent = formatCurrency(currentTotal + instThisMonth);
}

window.editCreditExpense = function (id) {
    const exp = STATE.userData.creditExpenses.find(e => e.id === id);
    if (!exp) return;
    STATE.editingCreditId = id;
    document.querySelector('#expense-modal .modal-header h3').textContent = 'Editar Despesa de Crédito';
    document.getElementById('exp-name').value = exp.name;
    document.getElementById('exp-amount').value = exp.amount;
    document.getElementById('exp-date').value = exp.date;
    document.getElementById('exp-category').value = exp.categoryId;
    DOM.expenseModal.classList.remove('hidden');
};

// â”€â”€ CREDIT CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCreditChart() {
    const ctx = document.getElementById('credit-chart');
    if (!ctx) return;
    if (creditChartInstance) creditChartInstance.destroy();

    const filtered = (STATE.userData.creditExpenses || []).filter(exp => {
        const p = exp.dueDate.split('-');
        return parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth && (exp.cardId || 'card1') === STATE.currentCardId;
    });
    if (filtered.length === 0) return;

    const catTotals = {};
    filtered.forEach(exp => { catTotals[exp.categoryId] = (catTotals[exp.categoryId] || 0) + exp.amount; });

    const labels = [], data = [], bgColors = [];
    Object.keys(catTotals).forEach(catId => {
        const cat = STATE.userData.categories.find(c => c.id === catId);
        if (cat) { labels.push(cat.name); bgColors.push(cat.color); data.push(catTotals[catId]); }
    });

    creditChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter', sans-serif" } } } } } });
}

// â”€â”€ DEBIT / PIX & INCOMES TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDebitTable() {
    DOM.debitTableBody.innerHTML = '';
    const incBody = document.getElementById('income-table-body');
    if (incBody) incBody.innerHTML = '';

    if (!STATE.userData.debitTransactions || STATE.userData.debitTransactions.length === 0) {
        DOM.debitTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma despesa registrada.</td></tr>';
        if (incBody) incBody.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhum rendimento registrado.</td></tr>';
        updatePaginationUI('debit', 0, 1);
        
        const bVal = document.getElementById('cc-balance-value');
        const iVal = document.getElementById('cc-income-value');
        const eVal = document.getElementById('cc-expense-value');
        if (bVal) { bVal.textContent = 'R$ 0,00'; bVal.className = 'value text-success'; }
        if (iVal) iVal.textContent = 'R$ 0,00';
        if (eVal) eVal.textContent = 'R$ 0,00';
        return;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    
    let filteredDespesas = [];
    let incomes = [];

    STATE.userData.debitTransactions.forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            if (txn.type === 'income') {
                incomes.push(txn);
                totalIncome += txn.amount;
            } else {
                filteredDespesas.push(txn);
                totalExpense += txn.amount;
            }
        }
    });

    // Incomes render (all of them)
    incomes.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (incomes.length === 0 && incBody) {
        incBody.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhum rendimento registrado.</td></tr>';
    } else if (incBody) {
        incomes.forEach(txn => {
            const catHtml = txn.categoryId ? (() => {
                const cat = STATE.userData.categories.find(c => c.id === txn.categoryId);
                return cat ? `<span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span>` : '-';
            })() : '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${formatDate(txn.date)}</td><td><strong>${txn.name}</strong></td><td class="text-success">+${formatCurrency(txn.amount)}</td><td>${catHtml}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editIncomeTransaction('${txn.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteDebitTransaction('${txn.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
            incBody.appendChild(tr);
        });
    }

    // Expenses render (paginated & filtered)
    if (STATE.debitFilterCat !== 'all') filteredDespesas = filteredDespesas.filter(t => t.categoryId === STATE.debitFilterCat);
    filteredDespesas.sort((a, b) => {
        if (STATE.debitSort === 'date_desc') return new Date(b.date) - new Date(a.date);
        if (STATE.debitSort === 'date_asc') return new Date(a.date) - new Date(b.date);
        if (STATE.debitSort === 'val_desc') return b.amount - a.amount;
        if (STATE.debitSort === 'val_asc') return a.amount - b.amount;
        return 0;
    });

    const totalPages = Math.ceil(filteredDespesas.length / STATE.itemsPerPage) || 1;
    if (STATE.debitPage > totalPages) STATE.debitPage = totalPages;
    const paged = filteredDespesas.slice((STATE.debitPage - 1) * STATE.itemsPerPage, STATE.debitPage * STATE.itemsPerPage);
    updatePaginationUI('debit', STATE.debitPage, totalPages);

    if (paged.length === 0) { DOM.debitTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma despesa correspondente.</td></tr>'; }
    else paged.forEach(txn => {
        const cat = STATE.userData.categories.find(c => c.id === txn.categoryId);
        const catHtml = cat ? `<span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span>` : '-';
        const typeLabel = txn.type === 'debit' ? 'Débito' : (txn.type === 'pix' ? 'Pix' : (txn.type === 'expense' ? 'Saída' : txn.type));
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatDate(txn.date)}</td><td><strong>${txn.name}</strong></td><td class="text-danger">-${formatCurrency(txn.amount)}</td><td>${catHtml}</td><td><small>${typeLabel}</small></td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editDebitTransaction('${txn.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteDebitTransaction('${txn.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
        DOM.debitTableBody.appendChild(tr);
    });

    const balanceTotal = totalIncome - totalExpense;
    const bVal = document.getElementById('cc-balance-value');
    const iVal = document.getElementById('cc-income-value');
    const eVal = document.getElementById('cc-expense-value');
    if (bVal) { bVal.textContent = formatCurrency(balanceTotal); bVal.className = `value ${balanceTotal >= 0 ? 'text-success' : 'text-danger'}`; }
    if (iVal) iVal.textContent = formatCurrency(totalIncome);
    if (eVal) eVal.textContent = formatCurrency(totalExpense);
}

window.editDebitTransaction = function (id) {
    const txn = STATE.userData.debitTransactions.find(t => t.id === id);
    if (!txn) return;
    STATE.editingDebitId = id;
    document.querySelector('#debit-modal .modal-header h3').textContent = 'Editar Despesa Conta-correnete';
    document.getElementById('deb-name').value = txn.name;
    document.getElementById('deb-amount').value = txn.amount;
    document.getElementById('deb-date').value = txn.date;
    document.getElementById('deb-category').value = txn.categoryId || '';
    document.getElementById('deb-type').value = (txn.type === 'expense' ? 'debit' : txn.type);
    document.getElementById('debit-modal').classList.remove('hidden');
};

window.editIncomeTransaction = function (id) {
    const txn = STATE.userData.debitTransactions.find(t => t.id === id);
    if (!txn) return;
    STATE.editingDebitId = id;
    document.querySelector('#income-modal .modal-header h3').textContent = 'Editar Rendimento';
    document.getElementById('inc-name').value = txn.name;
    document.getElementById('inc-amount').value = txn.amount;
    document.getElementById('inc-date').value = txn.date;
    document.getElementById('inc-category').value = txn.categoryId || '';
    document.getElementById('income-modal').classList.remove('hidden');
};

// â”€â”€ DEBIT CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDebitChart() {
    const ctx = document.getElementById('debit-chart');
    if (!ctx) return;
    if (debitChartInstance) debitChartInstance.destroy();
    let expenses = (STATE.userData.debitTransactions || []).filter(t => t.type !== 'income').filter(exp => {
        const p = exp.date.split('-');
        return parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth;
    });
    if (expenses.length === 0) return;
    const catTotals = {};
    expenses.forEach(exp => { catTotals[exp.categoryId] = (catTotals[exp.categoryId] || 0) + exp.amount; });
    const labels = [], data = [], bgColors = [];
    Object.keys(catTotals).forEach(catId => {
        const cat = STATE.userData.categories.find(c => c.id === catId);
        if (cat) { labels.push(cat.name); bgColors.push(cat.color); data.push(catTotals[catId]); }
    });
    debitChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter',sans-serif" } } }, title: { display: true, text: 'Somente Saídas (Despesas)' } } } });
}

// â”€â”€ CATEGORIES TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderCategoriesTable() {
    DOM.categoriesTableBody.innerHTML = '';
    const filtered = (STATE.userData.categories || []).filter(c => (c.type || 'expense') === STATE.currentCategoryTab);
    
    if (filtered.length === 0) {
        DOM.categoriesTableBody.innerHTML = `<tr class="empty-row"><td colspan="4">Nenhuma categoria de ${STATE.currentCategoryTab === 'expense' ? 'despesa' : 'rendimento'} registrada.</td></tr>`; 
        return;
    }

    filtered.forEach(cat => {
        const tc = cat.textColor || '#ffffff';
        const goalHtml = STATE.currentCategoryTab === 'expense' ? `<td class="text-right">${formatCurrency(cat.goal || 0)}</td>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><span class="category-badge" style="background:${cat.color};color:${tc};padding:.5rem 1rem">${cat.name}</span></td><td><strong>${cat.name}</strong></td>${goalHtml}<td class="text-center" style="display:flex;gap:.5rem;justify-content:center"><button class="btn-icon" onclick="editCategory('${cat.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button></td>`;
        DOM.categoriesTableBody.appendChild(tr);
    });
}

function editCategory(id) {
    const cat = STATE.userData.categories.find(c => c.id === id);
    if (!cat) return;
    
    // Switch tab if editing a category of different type
    const type = cat.type || 'expense';
    if (STATE.currentCategoryTab !== type) {
        const tabBtn = document.getElementById(type === 'expense' ? 'tab-cat-expense' : 'tab-cat-income');
        tabBtn?.click();
    }

    editingCategoryId = id;
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-goal').value = cat.goal || 0;
    document.getElementById('cat-bg').value = cat.color;
    document.getElementById('cat-text').value = cat.textColor || '#ffffff';
    DOM.btnSaveCategory.textContent = 'Salvar Alterações';
    DOM.btnCancelCategoryEdit.classList.remove('hidden');
    document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelCategoryEdit() {
    editingCategoryId = null;
    DOM.categoryForm.reset();
    document.getElementById('cat-bg').value = '#3B82F6';
    document.getElementById('cat-text').value = '#FFFFFF';
    DOM.btnSaveCategory.textContent = 'Adicionar';
    DOM.btnCancelCategoryEdit.classList.add('hidden');
}

// â”€â”€ OVERALL PIE CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderOverallPieChart() {
    const ctx = document.getElementById('overall-pie-chart');
    const expenseCategories = (STATE.userData?.categories || []).filter(c => (c.type || 'expense') === 'expense');
    if (!ctx || !expenseCategories.length) return;
    if (overallPieChartInstance) overallPieChartInstance.destroy();

    const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();
    let totalCredit = 0, totalDebit = 0, totalInst = 0;

    (STATE.userData.creditExpenses || []).forEach(exp => {
        const s = exp.cycleStart.split('-'), e = exp.cycleEnd.split('-');
        const cs = new Date(+s[0], +s[1] - 1, +s[2]), ce = new Date(+e[0], +e[1] - 1, +e[2]);
        if (now >= cs && now <= ce) totalCredit += exp.amount;
    });
    (STATE.userData.debitTransactions || []).forEach(txn => {
        if (txn.type !== 'expense') return;
        const p = txn.date.split('-');
        if (+p[0] === cy && +p[1] - 1 === cm) totalDebit += txn.amount;
    });
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-');
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === (inst.cardId || 'card1'));
        const closing = card?.closingDay || 11;
        const diff = (STATE.viewYear - +p[0]) * 12 + (STATE.viewMonth - (+p[1] - 1)) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) totalInst += inst.installmentAmount;
    });

    if (!totalCredit && !totalDebit && !totalInst) return;
    overallPieChartInstance = new Chart(ctx, { type: 'pie', data: { labels: ['Cartão de Crédito', 'Débito / Pix', 'Compras Parceladas'], datasets: [{ data: [totalCredit, totalDebit, totalInst], backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter',sans-serif" } } }, tooltip: { callbacks: { label: ctx => (ctx.label || '') + ': ' + formatCurrency(ctx.parsed) } } } } });
}

// â”€â”€ GOALS BALANCE WIDGET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderGoalsBalanceWidget(containerId, catExpMap, categories) {
    const el = document.getElementById(containerId);
    if (!el) return;

    let totalGoal = 0, totalSpent = 0;
    (categories || []).forEach(cat => {
        if (cat.type === 'income') return; // Income categories don't have goals or count here
        const entry = catExpMap[cat.id];
        const goal = cat.goal || (entry ? entry.goal : 0) || 0;
        const spent = (entry ? entry.spent : catExpMap[cat.id]) || 0;
        if (goal > 0) {
            totalGoal += goal;
            totalSpent += spent;
        }
    });

    if (totalGoal === 0) { el.innerHTML = ''; return; }

    const diff = totalGoal - totalSpent;
    const isOver = diff < 0;
    const pct = Math.min((totalSpent / totalGoal) * 100, 100).toFixed(1);
    const barColor = isOver ? '#EF4444' : totalSpent / totalGoal > 0.8 ? '#D97706' : '#10B981';
    const diffLabel = isOver
        ? `<span style="color:#EF4444;font-weight:700">Estouro: +${formatCurrency(Math.abs(diff))}</span>`
        : `<span style="color:#10B981;font-weight:700">Economia: ${formatCurrency(diff)}</span>`;
    const icon = isOver
        ? '<i class="fa-solid fa-triangle-exclamation" style="color:#EF4444"></i>'
        : '<i class="fa-solid fa-scale-balanced" style="color:#10B981"></i>';
    const statusMsg = isOver
        ? 'O total de gastos excedeu o orçamento global das metas neste mês.'
        : 'Mesmo excedendo alguns limites, o total geral ainda está dentro do orçamento.';

    el.innerHTML = `
    <div style="
        background: var(--c-bg-card);
        border: 2px solid ${isOver ? '#EF4444' : '#10B981'};
        border-radius: var(--radius-lg);
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        align-items: center;
    ">
        <div style="font-size: 2rem; line-height:1;">${icon}</div>
        <div style="flex: 1; min-width: 180px;">
            <p style="font-weight: 700; font-size: 1rem; margin: 0 0 0.2rem;">Balancete Global das Metas</p>
            <p style="font-size: 0.85rem; color: var(--c-text-muted); margin: 0;">${statusMsg}</p>
        </div>
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div style="text-align:center;">
                <span style="display:block; font-size:0.75rem; color:var(--c-text-muted); margin-bottom:0.2rem;">Somatório de Todas as Metas</span>
                <span style="font-size:1.1rem; font-weight:700;">${formatCurrency(totalGoal)}</span>
            </div>
            <div style="text-align:center;">
                <span style="display:block; font-size:0.75rem; color:var(--c-text-muted); margin-bottom:0.2rem;">Total Gasto</span>
                <span style="font-size:1.1rem; font-weight:700; color:${isOver ? '#EF4444' : 'var(--c-text-main)'}">${formatCurrency(totalSpent)}</span>
            </div>
            <div style="text-align:center;">
                <span style="display:block; font-size:0.75rem; color:var(--c-text-muted); margin-bottom:0.2rem;">${isOver ? 'Estouro' : 'Saldo Disponível'}</span>
                <span style="font-size:1.1rem;">${diffLabel}</span>
            </div>
        </div>
        <div style="width:100%; background: var(--c-border); border-radius: 99px; height: 8px; margin-top:0.25rem;">
            <div style="width:${pct}%; background:${barColor}; height:8px; border-radius:99px; transition: width .4s;"></div>
        </div>
        <p style="width:100%; text-align:right; font-size:0.75rem; color:var(--c-text-muted); margin:0;">${pct}% do orçamento utilizado</p>
    </div>`;
}

// â”€â”€ GOALS CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderGoalsChart() {
    const ctx = document.getElementById('goals-chart');
    const expenseCategories = (STATE.userData?.categories || []).filter(c => (c.type || 'expense') === 'expense');
    if (!ctx || !expenseCategories.length) return;
    if (goalsChartInstance) goalsChartInstance.destroy();

    const catExp = {};
    expenseCategories.forEach(cat => { catExp[cat.id] = 0; });

    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (+p[0] === STATE.viewYear && +p[1] - 1 === STATE.viewMonth && catExp[exp.categoryId] !== undefined)
            catExp[exp.categoryId] += exp.amount;
    });
    (STATE.userData.debitTransactions || []).forEach(txn => {
        if (txn.type !== 'expense') return;
        const p = txn.date.split('-');
        if (+p[0] === STATE.viewYear && +p[1] - 1 === STATE.viewMonth && catExp[txn.categoryId] !== undefined)
            catExp[txn.categoryId] += txn.amount;
    });
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-');
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === (inst.cardId || 'card1'));
        const closing = card?.closingDay || 11;
        const diff = (STATE.viewYear - +p[0]) * 12 + (STATE.viewMonth - (+p[1] - 1)) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments && catExp[inst.categoryId] !== undefined)
            catExp[inst.categoryId] += inst.installmentAmount;
    });

    const tsEl = document.getElementById('goals-text-summary');
    if (tsEl) tsEl.innerHTML = '';

    // â”€â”€ Balance Widget on Visão Geral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const balWidgetCats = {};
    STATE.userData.categories.forEach(cat => { balWidgetCats[cat.id] = { spent: catExp[cat.id] || 0, goal: cat.goal || 0 }; });
    renderGoalsBalanceWidget('goals-balance-widget', balWidgetCats, STATE.userData.categories);

    const labels = [], spentData = [], goalData = [], spentColors = [], goalColors = [];
    const isDark = STATE.userData?.settings?.darkMode;

    const categoriesWithGoals = STATE.userData.categories
        .map(cat => ({
            cat,
            spent: catExp[cat.id] || 0,
            goal: cat.goal || 0
        }))
        .filter(item => item.spent > 0 || item.goal > 0);

    categoriesWithGoals.sort((a, b) => {
        const getStatus = (item) => {
            if (item.goal > 0 && item.spent > item.goal) return 2; // red
            if (item.goal > 0 && item.spent > item.goal * 0.8) return 1; // orange
            return 0; // green
        };
        const statusDiff = getStatus(b) - getStatus(a);
        if (statusDiff !== 0) return statusDiff;
        return b.spent - a.spent;
    });

    categoriesWithGoals.forEach(({ cat, spent, goal }) => {
        labels.push(cat.name); spentData.push(spent); goalData.push(goal);
        goalColors.push(isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
        spentColors.push(cat.color);

        let statusHex = cat.color, statusClass = 'text-success';
        if (goal > 0 && spent > goal) { statusHex = '#EF4444'; statusClass = 'text-danger'; }
        else if (goal > 0 && spent > goal * .8) { statusHex = '#D97706'; statusClass = 'text-warning'; }

        if (tsEl && goal > 0) {
            const pct = Math.min((spent / goal) * 100, 100).toFixed(0);
            const isOver = goal > 0 && spent > goal;
            const overIcon = isOver ? `<i class="fa-solid fa-circle-exclamation" style="color:#EF4444;animation:pulse 1.2s infinite;margin-left:.4rem;font-size:.95rem" title="Meta estourada!"></i>` : '';
            tsEl.insertAdjacentHTML('beforeend', `<div class="summary-card" style="flex:1;min-width:200px;border-left:4px solid ${cat.color}"><span class="label" style="display:flex;align-items:center"><strong>${cat.name}</strong>${overIcon}</span><span class="value ${statusClass}">${formatCurrency(spent)}</span><span class="label" style="font-size:.8rem;margin-top:.25rem">Meta: ${formatCurrency(goal)} (${pct}%)</span></div>`);
        }
    });

    if (labels.length === 0) return;
    goalsChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Gasto Atual', data: spentData, backgroundColor: spentColors, borderRadius: 4 }, { label: 'Meta', data: goalData, backgroundColor: goalColors, borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true, ticks: { font: { family: "'Inter',sans-serif" } } }, y: { ticks: { font: { family: "'Inter',sans-serif" } } } }, plugins: { legend: { position: 'top', labels: { font: { family: "'Inter',sans-serif" } } }, tooltip: { callbacks: { label: ctx => { const l = (ctx.dataset.label || '') + ': '; return l + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.parsed.x); } } } } } });
}

// â”€â”€ INSTALLMENTS TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderInstallmentsTable() {
    const tbody = DOM.installmentsTableBody;
    if (!tbody) return;
    tbody.innerHTML = '';
    const installments = STATE.userData.installments || [];

    if (installments.length === 0) { tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma compra parcelada registrada.</td></tr>'; updatePaginationUI('inst', 0, 1); return; }

    let totalOpen = 0, totalThisMonth = 0, activeCount = 0;
    let active = [];
    installments.forEach(inst => {
        if ((inst.cardId || 'card1') !== STATE.currentCardId) return;
        const p = inst.date.split('-'), py = +p[0], pm = +p[1] - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === STATE.currentCardId);
        const closing = card?.closingDay || 11;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) {
            const rem = (inst.totalInstallments - proj + 1) * inst.installmentAmount;
            totalOpen += rem; totalThisMonth += inst.installmentAmount; activeCount++;
            active.push({ ...inst, projectedInst: proj, remainingTotal: rem });
        }
    });

    if (STATE.instFilterCat !== 'all') active = active.filter(i => i.categoryId === STATE.instFilterCat);
    active.sort((a, b) => {
        if (STATE.instSort === 'date_desc') return new Date(b.date) - new Date(a.date);
        if (STATE.instSort === 'date_asc') return new Date(a.date) - new Date(b.date);
        if (STATE.instSort === 'val_desc') return b.installmentAmount - a.installmentAmount;
        if (STATE.instSort === 'val_asc') return a.installmentAmount - b.installmentAmount;
        return 0;
    });

    const totalPages = Math.ceil(active.length / STATE.itemsPerPage) || 1;
    if (STATE.instPage > totalPages) STATE.instPage = totalPages;
    const paged = active.slice((STATE.instPage - 1) * STATE.itemsPerPage, STATE.instPage * STATE.itemsPerPage);
    updatePaginationUI('inst', STATE.instPage, totalPages);
    if (paged.length === 0) { tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma parcela correspondente.</td></tr>'; }
    else paged.forEach(inst => {
        const cat = STATE.userData.categories.find(c => c.id === inst.categoryId) || { name: 'Sem Categ.', color: '#ccc', textColor: '#000' };
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatDate(inst.date)}</td><td>${inst.name}</td><td>${formatCurrency(inst.installmentAmount)}</td><td><span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span></td><td class="text-center">${inst.projectedInst}/${inst.totalInstallments}</td><td class="text-right">${formatCurrency(inst.remainingTotal)}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editInstallment('${inst.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteInstallment('${inst.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
        tbody.appendChild(tr);
    });

    const oe = document.getElementById('inst-total-open'), me = document.getElementById('inst-this-month'), ae = document.getElementById('inst-active-count');
    if (oe) oe.textContent = formatCurrency(totalOpen);
    if (me) me.textContent = formatCurrency(totalThisMonth);
    if (ae) ae.textContent = activeCount;
}

window.editInstallment = function (id) {
    const inst = STATE.userData.installments.find(i => i.id === id);
    if (!inst) return;
    STATE.editingInstId = id;
    document.querySelector('#installment-modal .modal-header h3').textContent = 'Editar Compra Parcelada';
    document.getElementById('inst-name').value = inst.name;
    document.getElementById('inst-amount').value = inst.installmentAmount;
    document.getElementById('inst-total').value = inst.totalInstallments;
    document.getElementById('inst-current').value = inst.currentInstallment;
    document.getElementById('inst-date').value = inst.date;
    document.getElementById('inst-category').value = inst.categoryId;
    const valueRadioInstallment = document.querySelector('input[name="inst-value-type"][value="installment"]');
    if (valueRadioInstallment) valueRadioInstallment.checked = true;
    const labelInstAmount = document.getElementById('label-inst-amount');
    if (labelInstAmount) labelInstAmount.textContent = 'Valor da Parcela (R$)';
    DOM.installmentModal.classList.remove('hidden');
};

// â”€â”€ INSTALLMENTS CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderInstallmentsChart() {
    const ctx = document.getElementById('installments-chart');
    if (!ctx) return;
    if (installmentChartInstance) installmentChartInstance.destroy();

    const catTotals = {};
    (STATE.userData.installments || []).forEach(inst => {
        if ((inst.cardId || 'card1') !== STATE.currentCardId) return;
        const p = inst.date.split('-'), py = +p[0], pm = +p[1] - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === STATE.currentCardId);
        const closing = card?.closingDay || 11;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) {
            const cat = STATE.userData.categories.find(c => c.id === inst.categoryId);
            if (cat) catTotals[cat.name] = (catTotals[cat.name] || 0) + inst.installmentAmount;
        }
    });

    const labels = Object.keys(catTotals), data = Object.values(catTotals);
    const colors = labels.map(n => { const c = STATE.userData.categories.find(c => c.name === n); return c ? c.color : '#ccc'; });
    if (labels.length === 0) return;

    installmentChartInstance = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter',sans-serif" } } }, tooltip: { callbacks: { label: ctx => ' ' + ctx.label + ': ' + formatCurrency(ctx.raw) } } } } });
}

// â”€â”€ CONSOLIDATED EXTRACTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let extractPieChartInstance = null;
let extractTypeChartInstance = null;
window.renderConsolidatedExtracts = function renderConsolidatedExtracts() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('extract-month-label').textContent = `${months[STATE.viewMonth]} ${STATE.viewYear}`;

    let totalIncome = 0;
    let totalExpense = 0;

    let totalTypeDebit = 0;
    let totalTypeCredit = 0;
    let totalTypeInst = 0;
    let activeInstCount = 0;
    let activeInstTotal = 0;
    let maxInstMonth = -1;
    let maxInstYear = -1;
    let cardUsage = {};

    const catExp = {};
    (STATE.userData.categories || []).forEach(c => { catExp[c.id] = { name: c.name, color: c.color, spent: 0, goal: c.goal || 0 }; });

    // Debit Transactions
    (STATE.userData.debitTransactions || []).forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            if (txn.type === 'income') totalIncome += txn.amount;
            else {
                totalExpense += txn.amount;
                totalTypeDebit += txn.amount;
                if (catExp[txn.categoryId]) catExp[txn.categoryId].spent += txn.amount;
            }
        }
    });

    // Credit Expenses
    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            totalExpense += exp.amount;
            totalTypeCredit += exp.amount;
            const cid = exp.cardId || 'card1';
            cardUsage[cid] = (cardUsage[cid] || 0) + exp.amount;
            if (catExp[exp.categoryId]) catExp[exp.categoryId].spent += exp.amount;
        }
    });

    // Installments
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const cid = inst.cardId || 'card1';
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === cid);
        const closing = card?.closingDay || 11;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) {
            totalExpense += inst.installmentAmount;
            totalTypeInst += inst.installmentAmount;
            cardUsage[cid] = (cardUsage[cid] || 0) + inst.installmentAmount;
            activeInstCount++;
            activeInstTotal += inst.installmentAmount;
            
            const remainingMonths = inst.totalInstallments - proj;
            let endM = STATE.viewMonth + remainingMonths;
            let endY = STATE.viewYear + Math.floor(endM / 12);
            endM = endM % 12;
            if (endY > maxInstYear || (endY === maxInstYear && endM > maxInstMonth)) {
                maxInstYear = endY;
                maxInstMonth = endM;
            }

            if (catExp[inst.categoryId]) catExp[inst.categoryId].spent += inst.installmentAmount;
        }
    });

    const balance = totalIncome - totalExpense;
    const bColor = balance >= 0 ? 'text-success' : 'text-danger';

    document.getElementById('extract-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('extract-total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('extract-balance').textContent = formatCurrency(balance);
    document.getElementById('extract-balance').className = `value ${bColor}`;

    // Pie Chart
    const ctx = document.getElementById('extract-pie-chart');
    if (ctx) {
        if (extractPieChartInstance) extractPieChartInstance.destroy();
        const labels = [], data = [], colors = [];
        Object.values(catExp).forEach(c => {
            if (c.spent > 0) {
                labels.push(c.name);
                data.push(c.spent);
                colors.push(c.color);
            }
        });
        if (data.length > 0) {
            extractPieChartInstance = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: "'Inter', sans-serif", size: 10 } } } } } });
        }
    }

    // Type Chart
    const ctxType = document.getElementById('extract-type-chart');
    if (ctxType) {
        if (extractTypeChartInstance) extractTypeChartInstance.destroy();
        const tLabels = ['Cartão de Crédito', 'Débito / Pix', 'Compras Parceladas'];
        const tData = [totalTypeCredit, totalTypeDebit, totalTypeInst];
        const tColors = ['#4F46E5', '#10B981', '#F59E0B'];
        if (tData.some(v => v > 0)) {
            extractTypeChartInstance = new Chart(ctxType, { type: 'pie', data: { labels: tLabels, datasets: [{ data: tData, backgroundColor: tColors, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: "'Inter', sans-serif", size: 10 } } } } } });
        }
    }

    // Insights Update
    const insightsContainer = document.getElementById('extract-insights');
    const insightInst = document.getElementById('extract-insight-installments');
    const insightCard = document.getElementById('extract-insight-card');
    
    if (insightsContainer && insightInst && insightCard) {
        let hasInsights = false;
        
        if (activeInstCount > 0) {
            let lastMonthStr = 'N/A';
            if (maxInstMonth >= 0) {
                const maxMFormat = (maxInstMonth < 12 && maxInstMonth >= 0) ? months[maxInstMonth] : 'N/A';
                lastMonthStr = `${maxMFormat}/${maxInstYear}`;
            }
            insightInst.innerHTML = `Este mês você teve <strong>${activeInstCount}</strong> compras ativas parceladas, num valor total de: <strong>${formatCurrency(activeInstTotal)}</strong>.<br>A última parcela a ser paga está prevista para o mês: <strong>${lastMonthStr}</strong>.`;
            insightInst.style.display = 'block';
            hasInsights = true;
        } else {
            insightInst.style.display = 'none';
        }

        let bestCardId = null;
        let bestCardVal = 0;
        Object.keys(cardUsage).forEach(cid => {
            if (cardUsage[cid] > bestCardVal) {
                bestCardVal = cardUsage[cid];
                bestCardId = cid;
            }
        });

        if (bestCardId && bestCardVal > 0) {
            const cardDef = (STATE.userData.settings?.cards || []).find(c => c.id === bestCardId);
            const cardName = cardDef ? cardDef.name : 'Cartão Principal';
            insightCard.innerHTML = `O cartão de crédito mais usado foi: <strong>${cardName}</strong> (Movimentação no mês: ${formatCurrency(bestCardVal)}).`;
            insightCard.style.display = 'block';
            hasInsights = true;
        } else {
            insightCard.style.display = 'none';
        }

        insightsContainer.style.display = hasInsights ? 'block' : 'none';
    }

    // â”€â”€ Balance Widget on Extratos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    renderGoalsBalanceWidget('extract-balance-widget', catExp, STATE.userData.categories || []);

    // Goals Text Summary
    const summaryEl = document.getElementById('extract-goals-summary');
    if (summaryEl) {
        summaryEl.innerHTML = '';
        
        const catsWithGoals = Object.values(catExp).filter(c => c.goal > 0);
        catsWithGoals.sort((a, b) => {
            const getStatus = (item) => {
                if (item.spent > item.goal) return 2; // red
                if (item.spent > item.goal * 0.8) return 1; // orange
                return 0; // green
            };
            const statusDiff = getStatus(b) - getStatus(a);
            if (statusDiff !== 0) return statusDiff;
            return b.spent - a.spent;
        });

        catsWithGoals.forEach(c => {
            const isOver = c.spent > c.goal;
            const diff = Math.abs(c.spent - c.goal);
            const pct = ((c.spent / c.goal) * 100).toFixed(0);
            let text = '';
            let icon = '';
            
            // Note: keeping the original text/icon logic, just sorted differently
            if (isOver) {
                text = `Você excedeu a meta de ${formatCurrency(c.goal)} em <strong class="text-danger">${formatCurrency(diff)}</strong> (${pct}% consumido).`;
                icon = '<i class="fa-solid fa-circle-exclamation text-danger"></i>';
            } else if (c.spent > 0) {
                text = `Você gastou ${formatCurrency(c.spent)} de sua meta de ${formatCurrency(c.goal)}. Ainda tem <strong class="text-success">${formatCurrency(diff)}</strong> disponível (${pct}% consumido).`;
                icon = '<i class="fa-solid fa-circle-check text-success"></i>';
            } else {
                text = `Você ainda não registrou gastos. Sua meta inteira de <strong class="text-success">${formatCurrency(c.goal)}</strong> está disponível.`;
                icon = '<i class="fa-regular fa-circle-check" style="color:var(--c-text-muted)"></i>';
            }
            summaryEl.insertAdjacentHTML('beforeend', `<div style="margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--c-border); display:flex; gap:1rem; align-items:flex-start;">
                <span style="font-size:1.2rem; margin-top:0.2rem;">${icon}</span>
                <div>
                    <strong style="display:block; margin-bottom:0.2rem;">${c.name}</strong>
                    <span style="font-size:0.9rem; color:var(--c-text-muted); line-height:1.4;">${text}</span>
                </div>
            </div>`);
        });
        if (summaryEl.innerHTML === '') {
            summaryEl.innerHTML = '<p style="color:var(--c-text-muted); font-size: 0.9rem;">Nenhuma meta definida para as categorias.</p>';
        }
    }
}

// â”€â”€ TOP CALENDAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function startCalendar() {
    const dateEl = document.getElementById('calendar-date');
    const dateShortEl = document.getElementById('calendar-date-short');
    const timeEl = document.getElementById('calendar-time');

    if (!dateEl || !timeEl) return;

    function update() {
        const now = new Date();

        // Format Full Date: Quarta-feira, 15 de Outubro de 2026
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dateStr = now.toLocaleDateString('pt-BR', dateOptions);
        // Capitalize trailing words dynamically
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        // Format Short Date: 15/10/2026
        let dateShortStr = now.toLocaleDateString('pt-BR');

        // Format Time: 14:35:09
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        let timeStr = now.toLocaleTimeString('pt-BR', timeOptions);

        dateEl.textContent = dateStr;
        if (dateShortEl) dateShortEl.textContent = dateShortStr;
        timeEl.textContent = timeStr;
    }

    update();
    setInterval(update, 1000);
}

//  INITIALIZE UI SCRIPTS ONCE AUTH IS READY -
window.addEventListener('app-auth-ready', () => {
    startCalendar();
    setupFilterEventListeners();
    setupMobileNav();
});

// â”€â”€ AI ASSISTANT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Standalone AI month/year state (independent of the global month selector)
let aiViewMonth = null;
let aiViewYear = null;

/**
 * Returns the month/year that is allowed for AI report generation.
 * That is always: the month immediately before the current real month.
 */
function getAllowedAIMonth() {
    const now = new Date();
    let m = now.getMonth() - 1;
    let y = now.getFullYear();
    if (m < 0) { m = 11; y--; }
    return { month: m, year: y };
}

/**
 * Updates the AI month navigation label and disables/enables arrows.
 */
function updateAIMonthNav() {
    const label = document.getElementById('ai-month-nav-label');
    if (label) {
        label.textContent = `${STATE.monthNames[aiViewMonth]} ${aiViewYear}`;
    }

    // Disable prev if we're at the minimum (Jan 2026)
    const prevBtn = document.getElementById('btn-ai-prev-month');
    if (prevBtn) {
        prevBtn.disabled = (aiViewYear === 2026 && aiViewMonth === 0);
    }

    // Disable next only when 6 months past the current real month (generous future cap)
    const nextBtn = document.getElementById('btn-ai-next-month');
    if (nextBtn) {
        const now = new Date();
        const capIndex = (now.getFullYear() * 12 + now.getMonth()) + 6;
        const viewIndex = aiViewYear * 12 + aiViewMonth;
        nextBtn.disabled = (viewIndex >= capIndex);
    }
}


/**
/**
 * Builds a text summary of a given month/year's financial data to send to the AI.
 */
function buildAIPrompt(y, m) {
    const monthName = STATE.monthNames[m];

    // ── Incomes ───────────────────────────────────────────────────
    let totalIncome = 0;
    (STATE.userData.debitTransactions || []).forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && txn.type === 'income') {
            totalIncome += txn.amount;
        }
    });

    // ── Debit expenses ────────────────────────────────────────────
    let totalDebit = 0;
    (STATE.userData.debitTransactions || []).forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && txn.type !== 'income') {
            totalDebit += txn.amount;
        }
    });

    // ── Credit expenses ───────────────────────────────────────────
    let totalCredit = 0;
    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m) {
            totalCredit += exp.amount;
        }
    });

    // ── Installments (projected for this month) ───────────────────
    let totalInst = 0, activeInstCount = 0;
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === (inst.cardId || 'card1'));
        const closing = card?.closingDay || 11;
        const diff = (y - py) * 12 + (m - pm) - instCycleOffset(inst.date, closing);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) {
            totalInst += inst.installmentAmount;
            activeInstCount++;
        }
    });

    // ── Goals by category ─────────────────────────────────────────
    const catSpent = {};
    (STATE.userData.categories || []).filter(c => (c.type || 'expense') === 'expense').forEach(cat => {
        catSpent[cat.id] = { name: cat.name, goal: cat.goal || 0, spent: 0 };
    });

    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && catSpent[exp.categoryId])
            catSpent[exp.categoryId].spent += exp.amount;
    });
    (STATE.userData.debitTransactions || []).forEach(txn => {
        if (txn.type === 'income') return;
        const p = txn.date.split('-');
        if (parseInt(p[0]) === y && parseInt(p[1]) - 1 === m && catSpent[txn.categoryId])
            catSpent[txn.categoryId].spent += txn.amount;
    });
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const card = (STATE.userData.settings?.cards || []).find(c => c.id === (inst.cardId || 'card1'));
        const closing = card?.closingDay || 11;
        const diff = (y - py) * 12 + (m - pm) - instCycleOffset(inst.date, closing);
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
}
/**
 * Initialises the AI section: sets up pagination and checks generation eligibility.
 */
async function initAIAssistant() {
    if (!STATE.currentUser) return;

    // ── Initialise standalone AI month state (only once per session entry) ──
    const allowed = getAllowedAIMonth();
    if (aiViewMonth === null) {
        aiViewMonth = allowed.month;
        aiViewYear = allowed.year;
    }

    // ── Wire pagination buttons (only once) ──────────────────────
    const prevBtn = document.getElementById('btn-ai-prev-month');
    const nextBtn = document.getElementById('btn-ai-next-month');
    if (prevBtn && !prevBtn._aiPagAttached) {
        prevBtn._aiPagAttached = true;
        prevBtn.addEventListener('click', () => {
            if (aiViewYear === 2026 && aiViewMonth === 0) return;
            if (--aiViewMonth < 0) { aiViewMonth = 11; aiViewYear--; }
            initAIAssistant();
        });
    }
    if (nextBtn && !nextBtn._aiPagAttached) {
        nextBtn._aiPagAttached = true;
        nextBtn.addEventListener('click', () => {
            const now = new Date();
            const capIndex = (now.getFullYear() * 12 + now.getMonth()) + 6;
            const viewIndex = aiViewYear * 12 + aiViewMonth;
            if (viewIndex >= capIndex) return;
            if (++aiViewMonth > 11) { aiViewMonth = 0; aiViewYear++; }
            initAIAssistant();
        });
    }

    updateAIMonthNav();

    // ── Determine status ──────────────────────────────────────────
    const btn = document.getElementById('btn-generate-ai-report');
    const statusMsg = document.getElementById('ai-status-msg');
    const monthLabel = document.getElementById('ai-month-label');
    const reportArea = document.getElementById('ai-report-area');

    if (!btn) return;

    const monthYear = `${aiViewYear}-${String(aiViewMonth + 1).padStart(2, '0')}`;
    const monthDisplayName = `${STATE.monthNames[aiViewMonth]} ${aiViewYear}`;
    if (monthLabel) monthLabel.textContent = monthDisplayName;
    if (reportArea) reportArea.classList.add('hidden');

    // Determine if this month is "generatable":
    // Only the previous calendar month (relative to today) is allowed.
    const isAllowedMonth = (aiViewMonth === allowed.month && aiViewYear === allowed.year);
    // Past months that are NOT the allowed one have expired
    const monthIndex = aiViewYear * 12 + aiViewMonth;
    const allowedIndex = allowed.year * 12 + allowed.month;
    const isExpired = monthIndex < allowedIndex;

    // ── Check Supabase for an existing report ────────────────────
    try {
        const { data: existing } = await supabaseClient
            .from('ai_reports')
            .select('id, created_at, report_text')
            .eq('user_id', STATE.currentUser.id)
            .eq('month_year', monthYear)
            .maybeSingle();

        if (existing) {
            // Report already generated — show it
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Relatório já gerado este mês';
            if (statusMsg) statusMsg.textContent = `Relatório de ${monthDisplayName} já foi gerado. O próximo estará disponível no mês que vem! 📅`;

            if (existing.report_text) {
                const reportContent = document.getElementById('ai-report-content');
                const reportBadge = document.getElementById('ai-report-month-badge');
                const reportTimestamp = document.getElementById('ai-report-timestamp');
                if (reportBadge) reportBadge.textContent = monthDisplayName;
                if (reportTimestamp) {
                    const dateObj = new Date(existing.created_at);
                    reportTimestamp.textContent = `(Gerado em ${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR')})`;
                }
                if (reportContent) reportContent.innerHTML = parseAIMarkdown(existing.report_text);
                if (reportArea) reportArea.classList.remove('hidden');
            }

        } else if (isAllowedMonth) {
             // This is the correct month and no report yet — allow generation
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar Relatório do Mês';
            if (statusMsg) statusMsg.innerHTML = `Clique no botão abaixo para gerar seu relatório financeiro personalizado com inteligência artificial para <strong>${monthDisplayName}</strong>.`;
            const reportContent = document.getElementById('ai-report-content');
            if (reportContent) reportContent.innerHTML = '';

        } else if (isExpired) {
            // Months older than the allowed window — permanently locked
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-ban"></i> Prazo expirado';
            if (statusMsg) statusMsg.innerHTML = `<span style="color:var(--c-danger)"><i class="fa-solid fa-circle-xmark"></i> O relatório de <strong>${monthDisplayName}</strong> não foi gerado no prazo e não pode mais ser criado.</span>`;
            const reportContent = document.getElementById('ai-report-content');
            if (reportContent) reportContent.innerHTML = '';

        } else {
            // Future / current month — not closed yet
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-clock"></i> Mês em andamento';
            if (statusMsg) statusMsg.innerHTML = `<span style="color:var(--c-text-muted)"><i class="fa-solid fa-hourglass-half"></i> O relatório de <strong>${monthDisplayName}</strong> ficará disponível a partir do dia 1 do mês seguinte.</span>`;
            const reportContent = document.getElementById('ai-report-content');
            if (reportContent) reportContent.innerHTML = '';
        }

    } catch (err) {
        console.error('Erro ao verificar limite da IA:', err);
    }

    // ── Attach generate button listener (only once) ───────────────
    if (!btn._aiListenerAttached) {
        btn._aiListenerAttached = true;
        btn.addEventListener('click', handleAIReport);
    }
}

/**
 * Simple Markdown parser for AI responses
 */
function parseAIMarkdown(text) {
    if (!text) return '';
    
    // 1. First escape HTML to prevent "<" and ">" from hiding text
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. Parse Markdown
    html = html
        .replace(/^### (.*$)/gim, '<h5 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--c-text-main); font-size: 1.1rem; font-weight: 600;">$1</h5>')
        .replace(/^## (.*$)/gim, '<h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--c-primary); font-size: 1.25rem; font-weight: 700;">$1</h4>')
        .replace(/^# (.*$)/gim, '<h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--c-primary); font-size: 1.5rem; font-weight: 800;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--c-text-main); font-weight: 600;">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Wrap lists properly by converting literal newlines of list items
        .replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom: 0.4rem; margin-left: 1.5rem; list-style-type: disc;">$1</li>');
        
    // 3. Convert remaining newlines to line breaks, ignoring those already inside blocks
    html = html.replace(/\n/g, '<br>');
        
    return html;
}

/**
 * Calls the Edge Function to generate the AI report.
 */
async function handleAIReport() {
    const btn = document.getElementById('btn-generate-ai-report');
    const loadingEl = document.getElementById('ai-loading');
    const reportArea = document.getElementById('ai-report-area');
    const reportContent = document.getElementById('ai-report-content');
    const reportBadge = document.getElementById('ai-report-month-badge');
    const statusMsg = document.getElementById('ai-status-msg');

    if (!btn || btn.disabled) return;

    const monthYear = `${aiViewYear}-${String(aiViewMonth + 1).padStart(2, '0')}`;
    const monthDisplayName = `${STATE.monthNames[aiViewMonth]} ${aiViewYear}`;
    const promptData = buildAIPrompt(aiViewYear, aiViewMonth);

    // Show loading state
    btn.disabled = true;
    btn.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (reportArea) reportArea.classList.add('hidden');

    try {
        const { data, error } = await supabaseClient.functions.invoke('generate-ai-report', {
            body: { promptData, monthYear },
        });

        if (loadingEl) loadingEl.classList.add('hidden');
        btn.classList.remove('hidden');

        if (error) throw error;

        if (data?.error === 'limite_mensal') {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Relatório já gerado este mês';
            if (statusMsg) statusMsg.textContent = data.message;
            return;
        }

        if (data?.error === 'cota_gemini' || data?.error === 'gemini_error' || data?.error === 'resposta_vazia') {
            let errorDetailsHtml = '';
            if (data?.details) {
                try {
                    const parsed = JSON.parse(data.details);
                    errorDetailsHtml = `<div style="margin-top:0.5rem; font-size:0.8rem; background:rgba(0,0,0,0.1); padding:0.5rem; border-radius:4px; text-align:left; word-break:break-all;"><strong>Detalhes do Google:</strong> ${parsed?.error?.message || data.details}</div>`;
                } catch(e) {
                    errorDetailsHtml = `<div style="margin-top:0.5rem; font-size:0.8rem; background:rgba(0,0,0,0.1); padding:0.5rem; border-radius:4px; text-align:left; word-break:break-all;"><strong>Detalhes do Google:</strong> ${data.details}</div>`;
                }
            }
            if (statusMsg) statusMsg.innerHTML = `<span style="color: var(--c-warning)"><i class="fa-solid fa-triangle-exclamation"></i> ${data.message}</span>${errorDetailsHtml}`;
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Tentar Novamente';
            return;
        }

        if (data?.success && data?.report) {
            // Success! Show report
            if (reportBadge) reportBadge.textContent = monthDisplayName;
            const reportTimestamp = document.getElementById('ai-report-timestamp');
            if (reportTimestamp) {
                const dateObj = new Date();
                reportTimestamp.textContent = `(Gerado em ${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR')})`;
            }
            if (reportContent) reportContent.innerHTML = parseAIMarkdown(data.report);
            if (reportArea) reportArea.classList.remove('hidden');

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Relatório já gerado este mês';
            if (statusMsg) statusMsg.textContent = `Relatório gerado com sucesso para ${monthDisplayName}! ✨`;
            document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
        }

    } catch (err) {
        if (loadingEl) loadingEl.classList.add('hidden');
        btn.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Tentar Novamente';
        console.error('Erro ao gerar relatório IA:', err);
        if (statusMsg) statusMsg.innerHTML = `<span style="color: var(--c-danger)"><i class="fa-solid fa-circle-xmark"></i> Erro ao conectar com o serviço. Tente novamente.</span>`;
    }
}
