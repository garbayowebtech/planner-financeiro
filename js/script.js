/**
 * script.js — Render Functions, Charts & Utilities
 * Depends on: STATE, DOM, DB (all from app-auth.js / app-crud.js / db.js)
 */

// ── PAGINATION UI ───────────────────────────────────────────────
function updatePaginationUI(type, page, totalPages) {
    let btnPrev, btnNext, pageInfo;
    if (type === 'credit') { btnPrev = DOM.btnPrevCredit; btnNext = DOM.btnNextCredit; pageInfo = DOM.pageInfoCredit; }
    else if (type === 'inst') { btnPrev = DOM.btnPrevInst; btnNext = DOM.btnNextInst; pageInfo = DOM.pageInfoInst; }
    else if (type === 'debit') { btnPrev = DOM.btnPrevDebit; btnNext = DOM.btnNextDebit; pageInfo = DOM.pageInfoDebit; }

    if (pageInfo) pageInfo.textContent = page > 0 ? `${page} / ${totalPages}` : '1 / 1';
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;
}

// ── FILTER EVENT LISTENERS ─────────────────────────────────────
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

// ── MOBILE NAV ──────────────────────────────────────────────────
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

// ── UTILITIES ───────────────────────────────────────────────────
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

// ── GOAL ALERTS ─────────────────────────────────────────────────
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
        const diff = (curYear - py) * 12 + (curMonth - pm);
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

// ── DASHBOARD INIT ──────────────────────────────────────────────
function initDashboard() {
    DOM.expCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.debCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.instCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    DOM.filterCatCredit.innerHTML = '<option value="all">Todas as Categorias</option>';
    DOM.filterCatInst.innerHTML = '<option value="all">Todas as Categorias</option>';
    DOM.filterCatDebit.innerHTML = '<option value="all">Todas as Categorias</option>';

    (STATE.userData.categories || []).forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id; opt.textContent = cat.name;
        DOM.expCategorySelect.appendChild(opt);
        DOM.debCategorySelect.appendChild(opt.cloneNode(true));
        DOM.instCategorySelect.appendChild(opt.cloneNode(true));
        DOM.filterCatCredit.appendChild(opt.cloneNode(true));
        DOM.filterCatInst.appendChild(opt.cloneNode(true));
        DOM.filterCatDebit.appendChild(opt.cloneNode(true));
    });

    if (!STATE.userData.installments) STATE.userData.installments = [];
    STATE.creditPage = 1; STATE.instPage = 1; STATE.debitPage = 1;

    renderCreditTable(); renderCreditChart();
    renderDebitTable(); renderDebitChart();
    renderGoalsChart(); renderOverallPieChart();
    renderInstallmentsTable(); renderInstallmentsChart();
    const extractsGrid = document.getElementById('extracts-grid');
    if (extractsGrid && !extractsGrid.classList.contains('hidden')) {
        window.renderConsolidatedExtracts();
    }
}

// ── CREDIT TABLE ─────────────────────────────────────────────────
function renderCreditTable() {
    DOM.creditTableBody.innerHTML = '';
    if (!STATE.userData.creditExpenses || STATE.userData.creditExpenses.length === 0) {
        DOM.creditTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma despesa registrada.</td></tr>';
        updatePaginationUI('credit', 0, 1); return;
    }

    let filtered = STATE.userData.creditExpenses.filter(exp => {
        const p = exp.dueDate.split('-');
        return parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth;
    });

    let currentTotal = 0;
    const nextMonth = STATE.viewMonth === 11 ? 0 : STATE.viewMonth + 1;
    const nextYear = STATE.viewMonth === 11 ? STATE.viewYear + 1 : STATE.viewYear;
    let nextTotal = 0;
    STATE.userData.creditExpenses.forEach(exp => {
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
        tr.innerHTML = `<td>${formatDate(exp.date)}</td><td><strong>${exp.name}</strong></td><td>${catHtml}</td><td><small>${formatDate(exp.cycleStart)} a ${formatDate(exp.cycleEnd)}</small></td><td>${formatDate(exp.dueDate)}</td><td class="text-right text-danger">-${formatCurrency(exp.amount)}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editCreditExpense('${exp.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteCreditExpense('${exp.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
        DOM.creditTableBody.appendChild(tr);
    });

    const cv = document.getElementById('credit-current-value');
    const nv = document.getElementById('credit-next-value');
    const tv = document.getElementById('credit-total-value');

    let instThisMonth = 0, instNextMonth = 0;
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) instThisMonth += inst.installmentAmount;
        const diffN = (nextYear - py) * 12 + (nextMonth - pm);
        const projN = inst.currentInstallment + diffN;
        if (projN >= 1 && projN <= inst.totalInstallments) instNextMonth += inst.installmentAmount;
    });

    const closingDay = STATE.userData.settings?.cardClosingDay || 11;
    let postClosing = 0;
    STATE.userData.creditExpenses.forEach(exp => {
        const p = exp.date.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth && parseInt(p[2]) > closingDay)
            postClosing += exp.amount;
    });

    if (cv) cv.textContent = formatCurrency(currentTotal);
    if (nv) nv.textContent = formatCurrency(nextTotal + instNextMonth + postClosing);
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

// ── CREDIT CHART ─────────────────────────────────────────────────
function renderCreditChart() {
    const ctx = document.getElementById('credit-chart');
    if (!ctx) return;
    if (creditChartInstance) creditChartInstance.destroy();

    const filtered = (STATE.userData.creditExpenses || []).filter(exp => {
        const p = exp.dueDate.split('-');
        return parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth;
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

// ── DEBIT TABLE ──────────────────────────────────────────────────
function renderDebitTable() {
    DOM.debitTableBody.innerHTML = '';
    if (!STATE.userData.debitTransactions || STATE.userData.debitTransactions.length === 0) {
        DOM.debitTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma transação registrada.</td></tr>';
        updatePaginationUI('debit', 0, 1); return;
    }

    let balanceTotal = 0;
    let filtered = [];
    STATE.userData.debitTransactions.forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            filtered.push(txn);
            balanceTotal += txn.type === 'income' ? txn.amount : -txn.amount;
        }
    });

    if (STATE.debitFilterCat !== 'all') filtered = filtered.filter(t => t.categoryId === STATE.debitFilterCat);
    filtered.sort((a, b) => {
        if (STATE.debitSort === 'date_desc') return new Date(b.date) - new Date(a.date);
        if (STATE.debitSort === 'date_asc') return new Date(a.date) - new Date(b.date);
        if (STATE.debitSort === 'val_desc') return b.amount - a.amount;
        if (STATE.debitSort === 'val_asc') return a.amount - b.amount;
        return 0;
    });

    const totalPages = Math.ceil(filtered.length / STATE.itemsPerPage) || 1;
    if (STATE.debitPage > totalPages) STATE.debitPage = totalPages;
    const paged = filtered.slice((STATE.debitPage - 1) * STATE.itemsPerPage, STATE.debitPage * STATE.itemsPerPage);
    updatePaginationUI('debit', STATE.debitPage, totalPages);

    if (paged.length === 0) { DOM.debitTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma transação correspondente.</td></tr>'; }
    else paged.forEach(txn => {
        const cat = STATE.userData.categories.find(c => c.id === txn.categoryId);
        const catHtml = cat ? `<span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span>` : '-';
        const op = txn.type === 'income' ? '+' : '-';
        const vc = txn.type === 'income' ? 'text-success' : 'text-danger';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatDate(txn.date)}</td><td><strong>${txn.name}</strong></td><td>${catHtml}</td><td><small>${txn.type === 'income' ? 'Entrada' : 'Saída'}</small></td><td class="text-right ${vc}">${op}${formatCurrency(txn.amount)}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editDebitTransaction('${txn.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteDebitTransaction('${txn.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
        DOM.debitTableBody.appendChild(tr);
    });

    const bv = document.querySelector('#section-debit .summary-cards .summary-card:nth-child(1) .value');
    if (bv) { bv.textContent = formatCurrency(balanceTotal); bv.className = `value ${balanceTotal >= 0 ? 'text-success' : 'text-danger'}`; }
}

window.editDebitTransaction = function (id) {
    const txn = STATE.userData.debitTransactions.find(t => t.id === id);
    if (!txn) return;
    STATE.editingDebitId = id;
    document.querySelector('#debit-modal .modal-header h3').textContent = 'Editar Transação Débito/Pix';
    document.getElementById('deb-name').value = txn.name;
    document.getElementById('deb-amount').value = txn.amount;
    document.getElementById('deb-date').value = txn.date;
    document.getElementById('deb-category').value = txn.categoryId;
    document.getElementById('deb-type').value = txn.type;
    DOM.debitModal.classList.remove('hidden');
};

// ── DEBIT CHART ──────────────────────────────────────────────────
function renderDebitChart() {
    const ctx = document.getElementById('debit-chart');
    if (!ctx) return;
    if (debitChartInstance) debitChartInstance.destroy();
    let expenses = (STATE.userData.debitTransactions || []).filter(t => t.type === 'expense').filter(exp => {
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

// ── CATEGORIES TABLE ─────────────────────────────────────────────
function renderCategoriesTable() {
    DOM.categoriesTableBody.innerHTML = '';
    if (!STATE.userData.categories || STATE.userData.categories.length === 0) {
        DOM.categoriesTableBody.innerHTML = '<tr class="empty-row"><td colspan="3">Nenhuma categoria registrada.</td></tr>'; return;
    }
    STATE.userData.categories.forEach(cat => {
        const tc = cat.textColor || '#ffffff';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><span class="category-badge" style="background:${cat.color};color:${tc};padding:.5rem 1rem">${cat.name}</span></td><td><strong>${cat.name}</strong></td><td class="text-right">${formatCurrency(cat.goal || 0)}</td><td class="text-center" style="display:flex;gap:.5rem;justify-content:center"><button class="btn-icon" onclick="editCategory('${cat.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button></td>`;
        DOM.categoriesTableBody.appendChild(tr);
    });
}

function editCategory(id) {
    const cat = STATE.userData.categories.find(c => c.id === id);
    if (!cat) return;
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

// ── OVERALL PIE CHART ────────────────────────────────────────────
function renderOverallPieChart() {
    const ctx = document.getElementById('overall-pie-chart');
    if (!ctx || !STATE.userData?.categories?.length) return;
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
        const diff = (STATE.viewYear - +p[0]) * 12 + (STATE.viewMonth - (+p[1] - 1));
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) totalInst += inst.installmentAmount;
    });

    if (!totalCredit && !totalDebit && !totalInst) return;
    overallPieChartInstance = new Chart(ctx, { type: 'pie', data: { labels: ['Cartão de Crédito', 'Débito / Pix', 'Compras Parceladas'], datasets: [{ data: [totalCredit, totalDebit, totalInst], backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter',sans-serif" } } }, tooltip: { callbacks: { label: ctx => (ctx.label || '') + ': ' + formatCurrency(ctx.parsed) } } } } });
}

// ── GOALS BALANCE WIDGET ────────────────────────────────────────
function renderGoalsBalanceWidget(containerId, catExpMap, categories) {
    const el = document.getElementById(containerId);
    if (!el) return;

    let totalGoal = 0, totalSpent = 0;
    (categories || []).forEach(cat => {
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
                <span style="display:block; font-size:0.75rem; color:var(--c-text-muted); margin-bottom:0.2rem;">Orçamento Total</span>
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

// ── GOALS CHART ──────────────────────────────────────────────────
function renderGoalsChart() {
    const ctx = document.getElementById('goals-chart');
    if (!ctx || !STATE.userData?.categories?.length) return;
    if (goalsChartInstance) goalsChartInstance.destroy();

    const catExp = {};
    STATE.userData.categories.forEach(cat => { catExp[cat.id] = 0; });

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
        const diff = (STATE.viewYear - +p[0]) * 12 + (STATE.viewMonth - (+p[1] - 1));
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments && catExp[inst.categoryId] !== undefined)
            catExp[inst.categoryId] += inst.installmentAmount;
    });

    const tsEl = document.getElementById('goals-text-summary');
    if (tsEl) tsEl.innerHTML = '';

    // ── Balance Widget on Visão Geral ─────────────────────────────
    const balWidgetCats = {};
    STATE.userData.categories.forEach(cat => { balWidgetCats[cat.id] = { spent: catExp[cat.id] || 0, goal: cat.goal || 0 }; });
    renderGoalsBalanceWidget('goals-balance-widget', balWidgetCats, STATE.userData.categories);

    const labels = [], spentData = [], goalData = [], spentColors = [], goalColors = [];
    const isDark = STATE.userData?.settings?.darkMode;

    STATE.userData.categories.forEach(cat => {
        const spent = catExp[cat.id] || 0, goal = cat.goal || 0;
        if (spent === 0 && goal === 0) return;
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

// ── INSTALLMENTS TABLE ───────────────────────────────────────────
function renderInstallmentsTable() {
    const tbody = DOM.installmentsTableBody;
    if (!tbody) return;
    tbody.innerHTML = '';
    const installments = STATE.userData.installments || [];

    if (installments.length === 0) { tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhuma compra parcelada registrada.</td></tr>'; updatePaginationUI('inst', 0, 1); return; }

    let totalOpen = 0, totalThisMonth = 0, activeCount = 0;
    let active = [];
    installments.forEach(inst => {
        const p = inst.date.split('-'), py = +p[0], pm = +p[1] - 1;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm);
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
        tr.innerHTML = `<td>${formatDate(inst.date)}</td><td>${inst.name}</td><td><span class="category-badge" style="background:${cat.color};color:${cat.textColor || '#fff'}">${cat.name}</span></td><td class="text-center">${inst.projectedInst}/${inst.totalInstallments}</td><td class="text-right">${formatCurrency(inst.installmentAmount)}</td><td class="text-right">${formatCurrency(inst.remainingTotal)}</td><td class="text-center"><div style="display:flex;justify-content:center;gap:.5rem"><button class="btn-icon" style="color:var(--c-primary)" onclick="editInstallment('${inst.id}')"><i class="fa-solid fa-pen"></i></button><button class="btn-delete" onclick="deleteInstallment('${inst.id}')"><i class="fa-solid fa-trash"></i></button></div></td>`;
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
    DOM.installmentModal.classList.remove('hidden');
};

// ── INSTALLMENTS CHART ───────────────────────────────────────────
function renderInstallmentsChart() {
    const ctx = document.getElementById('installments-chart');
    if (!ctx) return;
    if (installmentChartInstance) installmentChartInstance.destroy();

    const catTotals = {};
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = +p[0], pm = +p[1] - 1;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm);
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

// ── CONSOLIDATED EXTRACTS ────────────────────────────────────────
let extractPieChartInstance = null;

window.renderConsolidatedExtracts = function renderConsolidatedExtracts() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('extract-month-label').textContent = `${months[STATE.viewMonth]} ${STATE.viewYear}`;

    let totalIncome = 0;
    let totalExpense = 0;
    const catExp = {};
    (STATE.userData.categories || []).forEach(c => { catExp[c.id] = { name: c.name, color: c.color, spent: 0, goal: c.goal || 0 }; });

    // Debit Transactions
    (STATE.userData.debitTransactions || []).forEach(txn => {
        const p = txn.date.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            if (txn.type === 'income') totalIncome += txn.amount;
            else {
                totalExpense += txn.amount;
                if (catExp[txn.categoryId]) catExp[txn.categoryId].spent += txn.amount;
            }
        }
    });

    // Credit Expenses
    (STATE.userData.creditExpenses || []).forEach(exp => {
        const p = exp.dueDate.split('-');
        if (parseInt(p[0]) === STATE.viewYear && parseInt(p[1]) - 1 === STATE.viewMonth) {
            totalExpense += exp.amount;
            if (catExp[exp.categoryId]) catExp[exp.categoryId].spent += exp.amount;
        }
    });

    // Installments
    (STATE.userData.installments || []).forEach(inst => {
        const p = inst.date.split('-'), py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
        const diff = (STATE.viewYear - py) * 12 + (STATE.viewMonth - pm);
        const proj = inst.currentInstallment + diff;
        if (proj >= 1 && proj <= inst.totalInstallments) {
            totalExpense += inst.installmentAmount;
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

    // ── Balance Widget on Extratos ────────────────────────────────
    renderGoalsBalanceWidget('extract-balance-widget', catExp, STATE.userData.categories || []);

    // Goals Text Summary
    const summaryEl = document.getElementById('extract-goals-summary');
    if (summaryEl) {
        summaryEl.innerHTML = '';
        Object.values(catExp).forEach(c => {
            if (c.goal > 0) {
                const isOver = c.spent > c.goal;
                const diff = Math.abs(c.spent - c.goal);
                const pct = ((c.spent / c.goal) * 100).toFixed(0);
                let text = '';
                let icon = '';
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
            }
        });
        if (summaryEl.innerHTML === '') {
            summaryEl.innerHTML = '<p style="color:var(--c-text-muted); font-size: 0.9rem;">Nenhuma meta definida para as categorias.</p>';
        }
    }
}

// ── TOP CALENDAR ────────────────────────────────────────────────
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

