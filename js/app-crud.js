/**
 * app-crud.js — Async CRUD handlers using Supabase
 * Replaces all localStorage-based save/load operations.
 * Load order: supabase-js > db.js > app-auth.js > app-crud.js > script.js
 */

// ── CREDIT EXPENSES ─────────────────────────────────────────────
async function handleExpenseSubmit(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    
    const name = document.getElementById('exp-name').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;
    const catId = document.getElementById('exp-category').value;
    
    if (!name || isNaN(amount) || amount <= 0 || !date) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }
    if (!catId) {
        alert("Por favor, selecione uma categoria. Se não houver, crie uma na aba Categorias.");
        return;
    }

    try {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btnSubmit.disabled = true;

        const currentCard = (STATE.userData.settings.cards || []).find(c => c.id === STATE.currentCardId);
        if (!currentCard || !currentCard.closingDay || !currentCard.dueDay) {
            alert("antes de registrar uma operação de crédito, entre no menu de configurações e informe os dias de virada e de vencimento da fatura!");
            return;
        }
        const closing = currentCard.closingDay;
        const dueDay = currentCard.dueDay;
        const cycle = calculateCycle(date, closing);
        const dueDate = new Date(cycle.end.getFullYear(), cycle.end.getMonth(), dueDay);
        const expData = {
            name, amount, date, categoryId: catId,
            cycleStart: cycle.start.toISOString().split('T')[0],
            cycleEnd: cycle.end.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            cardId: STATE.currentCardId
        };

        if (STATE.editingCreditId) {
            await DB.updateCreditExpense(STATE.editingCreditId, expData);
            const idx = STATE.userData.creditExpenses.findIndex(e => e.id === STATE.editingCreditId);
            if (idx > -1) STATE.userData.creditExpenses[idx] = { ...STATE.userData.creditExpenses[idx], ...expData };
        } else {
            const created = await DB.createCreditExpense(STATE.currentUser.id, expData);
            STATE.userData.creditExpenses.push(created);
        }

        STATE.editingCreditId = null;
        DOM.expenseModal.classList.add('hidden');
        renderCreditTable(); renderCreditChart(); renderGoalsChart(); renderOverallPieChart();
    } catch (err) {
        console.error("Erro ao salvar despesa de crédito:", err);
        alert("Erro ao salvar: " + (err.message || "Erro desconhecido."));
    } finally {
        if(btnSubmit) {
           btnSubmit.innerHTML = originalText;
           btnSubmit.disabled = false;
        }
    }
}

window.deleteCreditExpense = async function (id) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    await DB.deleteCreditExpense(id);
    STATE.userData.creditExpenses = STATE.userData.creditExpenses.filter(e => e.id !== id);
    renderCreditTable(); renderCreditChart(); renderGoalsChart(); renderOverallPieChart();
};

// ── DEBIT TRANSACTIONS ──────────────────────────────────────────
async function handleDebitSubmit(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    
    const name = document.getElementById('deb-name').value.trim();
    const amount = parseFloat(document.getElementById('deb-amount').value);
    const date = document.getElementById('deb-date').value;
    const catId = document.getElementById('deb-category').value;
    const type = document.getElementById('deb-type').value;

    if (!name || isNaN(amount) || amount <= 0 || !date) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }
    if (!catId) {
        alert("Por favor, selecione uma categoria. Se não houver, crie uma na aba Categorias.");
        return;
    }

    try {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btnSubmit.disabled = true;

        const txnData = { name, amount, date, categoryId: catId, type };

        if (STATE.editingDebitId) {
            await DB.updateDebitTransaction(STATE.editingDebitId, txnData);
            const idx = STATE.userData.debitTransactions.findIndex(t => t.id === STATE.editingDebitId);
            if (idx > -1) STATE.userData.debitTransactions[idx] = { ...STATE.userData.debitTransactions[idx], ...txnData };
        } else {
            const created = await DB.createDebitTransaction(STATE.currentUser.id, txnData);
            STATE.userData.debitTransactions.push(created);
        }

        STATE.editingDebitId = null;
        DOM.debitModal.classList.add('hidden');
        if (typeof renderDebitTable === 'function') renderDebitTable();
        if (typeof renderDebitChart === 'function') renderDebitChart();
        if (typeof renderGoalsChart === 'function') renderGoalsChart();
        if (typeof renderOverallPieChart === 'function') renderOverallPieChart();
    } catch (err) {
        console.error("Erro ao salvar despesa de débito:", err);
        alert("Erro ao salvar: " + (err.message || "Erro desconhecido."));
    } finally {
        if(btnSubmit) {
           btnSubmit.innerHTML = originalText;
           btnSubmit.disabled = false;
        }
    }
}

async function handleIncomeSubmit(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    try {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btnSubmit.disabled = true;

        const name = document.getElementById('inc-name').value.trim();
        const amount = parseFloat(document.getElementById('inc-amount').value);
        const date = document.getElementById('inc-date').value;
        const catId = document.getElementById('inc-category').value;
        const type = 'income';
        const txnData = { name, amount, date, categoryId: catId || null, type };

        if (STATE.editingDebitId) {
            await DB.updateDebitTransaction(STATE.editingDebitId, txnData);
            const idx = STATE.userData.debitTransactions.findIndex(t => t.id === STATE.editingDebitId);
            if (idx > -1) STATE.userData.debitTransactions[idx] = { ...STATE.userData.debitTransactions[idx], ...txnData };
        } else {
            const created = await DB.createDebitTransaction(STATE.currentUser.id, txnData);
            STATE.userData.debitTransactions.push(created);
        }

        STATE.editingDebitId = null;
        document.getElementById('income-modal').classList.add('hidden');
        if (typeof renderDebitTable === 'function') renderDebitTable();
        if (typeof renderDebitChart === 'function') renderDebitChart();
        if (typeof renderGoalsChart === 'function') renderGoalsChart();
        if (typeof renderOverallPieChart === 'function') renderOverallPieChart();
    } catch (err) {
        console.error("Erro ao salvar rendimento:", err);
        alert("Erro ao salvar: " + (err.message || "Erro desconhecido."));
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}

window.deleteDebitTransaction = async function (id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
        await DB.deleteDebitTransaction(id);
        STATE.userData.debitTransactions = STATE.userData.debitTransactions.filter(t => t.id !== id);
        renderDebitTable(); renderDebitChart(); renderGoalsChart(); renderOverallPieChart();
    } catch (err) {
        console.error(err);
        alert("Erro ao remover: " + err.message);
    }
};

// ── INSTALLMENTS ────────────────────────────────────────────────
async function handleInstallmentSubmit(e) {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;

    const name = document.getElementById('inst-name').value.trim();
    let amount = parseFloat(document.getElementById('inst-amount').value);
    const total = parseInt(document.getElementById('inst-total').value);
    let current = parseInt(document.getElementById('inst-current').value);
    const date = document.getElementById('inst-date').value;
    const catId = document.getElementById('inst-category').value;
    const valueType = document.querySelector('input[name="inst-value-type"]:checked')?.value || 'installment';

    if (isNaN(current)) current = 1;

    if (valueType === 'total' && !isNaN(total) && total > 0 && !isNaN(amount) && amount > 0) {
        amount = parseFloat((amount / total).toFixed(2));
    }
    
    if (!name || isNaN(amount) || amount <= 0 || isNaN(total) || isNaN(current) || !date) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }
    if (!catId) {
        alert("Por favor, selecione uma categoria. Se não houver, crie uma na aba Categorias.");
        return;
    }

    try {
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
        btnSubmit.disabled = true;

        const currentCard = (STATE.userData.settings.cards || []).find(c => c.id === STATE.currentCardId);
        if (!currentCard || !currentCard.closingDay || !currentCard.dueDay) {
            alert("antes de registrar uma operação de crédito, entre no menu de configurações e informe os dias de virada e de vencimento da fatura!");
            return;
        }

        const instData = { name, installmentAmount: amount, totalInstallments: total, currentInstallment: current, date, categoryId: catId, cardId: STATE.currentCardId };

        if (STATE.editingInstId) {
            await DB.updateInstallment(STATE.editingInstId, instData);
            const idx = STATE.userData.installments.findIndex(i => i.id === STATE.editingInstId);
            if (idx > -1) STATE.userData.installments[idx] = { ...STATE.userData.installments[idx], ...instData };
        } else {
            const created = await DB.createInstallment(STATE.currentUser.id, instData);
            if (!STATE.userData.installments) STATE.userData.installments = [];
            STATE.userData.installments.push(created);
        }

        STATE.editingInstId = null;
        DOM.installmentModal.classList.add('hidden');
        renderInstallmentsTable(); renderInstallmentsChart(); renderOverallPieChart(); renderGoalsChart();
    } catch (err) {
        console.error("Erro ao salvar parcelamento:", err);
        alert("Erro ao salvar: " + (err.message || "Erro desconhecido."));
    } finally {
        if(btnSubmit) {
           btnSubmit.innerHTML = originalText;
           btnSubmit.disabled = false;
        }
    }
}

window.deleteInstallment = async function (id) {
    if (!confirm('Tem certeza que deseja excluir esta compra parcelada?')) return;
    await DB.deleteInstallment(id);
    STATE.userData.installments = STATE.userData.installments.filter(i => i.id !== id);
    renderInstallmentsTable(); renderInstallmentsChart(); renderOverallPieChart(); renderGoalsChart();
};

// ── CATEGORIES ──────────────────────────────────────────────────
let editingCategoryId = null;

async function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    const goal = parseFloat(document.getElementById('cat-goal').value);
    const bg = document.getElementById('cat-bg').value;
    const txt = document.getElementById('cat-text').value;
    const catData = { 
        name, 
        goal: STATE.currentCategoryTab === 'expense' ? goal : 0, 
        color: bg, 
        textColor: txt,
        type: STATE.currentCategoryTab
    };

    if (editingCategoryId) {
        await DB.updateCategory(editingCategoryId, catData);
        const idx = STATE.userData.categories.findIndex(c => c.id === editingCategoryId);
        if (idx !== -1) STATE.userData.categories[idx] = { ...STATE.userData.categories[idx], ...catData };
        editingCategoryId = null;
        DOM.btnSaveCategory.textContent = 'Adicionar';
        DOM.btnCancelCategoryEdit.classList.add('hidden');
    } else {
        const created = await DB.createCategory(STATE.currentUser.id, catData);
        STATE.userData.categories.push(created);
    }

    DOM.categoryForm.reset();
    document.getElementById('cat-bg').value = '#3B82F6';
    document.getElementById('cat-text').value = '#FFFFFF';
    renderCategoriesTable();
    initDashboard();
}

window.deleteCategory = async function (id) {
    if (!confirm('Atenção: Excluir uma categoria removerá a tag visual das despesas associadas. Deseja continuar?')) return;
    await DB.deleteCategory(id);
    STATE.userData.categories = STATE.userData.categories.filter(c => c.id !== id);
    renderCategoriesTable();
    initDashboard();
};

// ── SETTINGS ────────────────────────────────────────────────────
async function handleSettingsSubmit(e) {
    e.preventDefault();
    const cardId = document.getElementById('settings-card-select')?.value;
    const cards = STATE.userData.settings.cards || [];
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) return;

    const newName = document.getElementById('set-card-name').value.trim();
    const closing = parseInt(document.getElementById('set-closing-day').value);
    const due = parseInt(document.getElementById('set-due-day').value);

    cards[cardIndex].name = newName;
    cards[cardIndex].closingDay = closing;
    cards[cardIndex].dueDay = due;
    cards[cardIndex].isConfigured = true;
    STATE.userData.settings.cards = cards;

    // Recalculate credit expense cycles for this specific card
    const updates = [];
    STATE.userData.creditExpenses.forEach(exp => {
        if ((exp.cardId || 'card1') === cardId) {
            const cycle = calculateCycle(exp.date, closing);
            const dueDate = new Date(cycle.end.getFullYear(), cycle.end.getMonth(), due);
            exp.cycleStart = cycle.start.toISOString().split('T')[0];
            exp.cycleEnd = cycle.end.toISOString().split('T')[0];
            exp.dueDate = dueDate.toISOString().split('T')[0];
            updates.push(DB.updateCreditExpense(exp.id, exp));
        }
    });

    await Promise.all([
        DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings),
        ...updates
    ]);

    if (window.renderCardTabs) window.renderCardTabs();
    if (window.renderCreditTable) renderCreditTable();
    if (window.initDashboard) initDashboard();
    
    const msg = document.getElementById('settings-msg');
    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 3000);
    }
}

// ── DELETE CARD LOGIC ───────────────────────────────────────────
function setupDeleteCardLogic() {
    const btnDeleteCard = document.getElementById('btn-delete-card');
    const deleteCardModal = document.getElementById('delete-card-modal');
    const deleteCardNameDisplay = document.getElementById('delete-card-name-display');
    const btnCancelDeleteCard = document.getElementById('btn-cancel-delete-card');
    const btnCloseDeleteCard = document.getElementById('btn-close-delete-card');
    const btnConfirmDeleteCard = document.getElementById('btn-confirm-delete-card');

    if (btnDeleteCard && deleteCardModal) {
        let cardToDeleteId = null;

        btnDeleteCard.addEventListener('click', () => {
            const cardId = document.getElementById('settings-card-select')?.value;
            if (!cardId) return;

            const cards = STATE.userData?.settings?.cards || [];
            if (cards.length <= 1) {
                alert('Você precisa ter pelo menos um cartão cadastrado.');
                return;
            }

            const card = cards.find(c => c.id === cardId);
            if (card) {
                cardToDeleteId = card.id;
                deleteCardNameDisplay.textContent = card.name;
                deleteCardModal.classList.remove('hidden');
            }
        });

        const closeDeleteModal = () => {
            cardToDeleteId = null;
            deleteCardModal.classList.add('hidden');
        };

        btnCancelDeleteCard?.addEventListener('click', closeDeleteModal);
        btnCloseDeleteCard?.addEventListener('click', closeDeleteModal);

        btnConfirmDeleteCard?.addEventListener('click', async () => {
            if (!cardToDeleteId) return;

            try {
                let cards = STATE.userData.settings.cards || [];
                cards = cards.filter(c => c.id !== cardToDeleteId);
                STATE.userData.settings.cards = cards;

                // Adjust current active card if we deleted it
                if (STATE.currentCardId === cardToDeleteId) {
                    STATE.currentCardId = cards.length > 0 ? cards[0].id : null;
                }

                await DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings);

                closeDeleteModal();

                if (window.renderCardTabs) window.renderCardTabs();
                if (window.renderCreditTable) renderCreditTable();
                
                // Re-trigger navigation to refresh settings view
                const settingsLink = Array.from(DOM.mainNavLinks || []).find(l => l.getAttribute('href') === '#settings');
                if (settingsLink) settingsLink.click();
                
            } catch (err) {
                console.error(err);
                alert('Erro ao excluir cartão: ' + err.message);
            }
        });
    }
}

// ── SETUP: EVENT LISTENERS ──────────────────────────────────────
function setupEventListeners() {

    // --- SETUP CARD DELETION ---
    setupDeleteCardLogic();

    // --- AUTH: Login ---
    DOM.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        DOM.loginErrorMsg.textContent = 'Entrando...';
        DOM.loginErrorMsg.style.color = 'var(--c-text-muted)';
        
        try {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout: O servidor demorou muito para responder. Tente novamente.")), 10000)
            );
            
            // 1. Faz o signIn com limite de 10s
            const user = await Promise.race([DB.signIn(email, password), timeoutPromise]);
            
            // 2. Chama a rotina de carregar o app. Usamos promise.race duplo se necessário, mas 
            // a loadAndEnterApp já possui os proprios timeouts (15s).
            await loadAndEnterApp(user);
            
        } catch (err) {
            console.error("Login Form Error:", err);
            
            // Tenta forçar logout silencioso sem await e apaga a chave de cache caso a sessão esteja corrompida!
            localStorage.removeItem('sb-ctveuoeoyymzozzwqqln-auth-token');
            DB.signOut().catch(() => {});
            
            // Red text for error
            DOM.loginErrorMsg.style.color = 'var(--c-danger)';
            // Distinguish between supabase auth error vs internal app init error
            if (err.message && !err.message.includes('corretos') && !err.message.includes('Invalid login') && !err.message.includes('credentials')) {
                DOM.loginErrorMsg.textContent = 'Erro: ' + (err.message || 'Falha ao conectar.');
            } else {
                DOM.loginErrorMsg.textContent = 'E-mail ou senha incorretos.';
            }
        }
    });

    // --- AUTH: Register ---
    DOM.btnShowRegister.addEventListener('click', () => showAuthSection('register'));
    DOM.btnRegCancel.addEventListener('click', () => showAuthSection('login'));

    DOM.regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        DOM.regErrorMsg.textContent = 'Criando conta...';
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        if (name.length < 2) { DOM.regErrorMsg.textContent = 'Nome muito curto.'; return; }
        if (password.length < 6) { DOM.regErrorMsg.textContent = 'Senha deve ter no mínimo 6 caracteres.'; return; }
        try {
            const { user, session } = await DB.signUp(email, password, name);
            if (session) {
                await loadAndEnterApp(user);
            } else {
                DOM.regErrorMsg.style.color = 'var(--c-success)';
                DOM.regErrorMsg.textContent = '✔ Verifique seu e-mail para confirmar o cadastro!';
            }
        } catch (err) {
            DOM.regErrorMsg.style.color = 'var(--c-danger)';
            DOM.regErrorMsg.textContent = err.message || 'Erro ao criar conta.';
        }
    });

    // Forgot password
    document.getElementById('btn-forgot-password')?.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        if (!email) { DOM.loginErrorMsg.textContent = 'Digite seu e-mail primeiro.'; return; }
        try {
            await DB.sendPasswordReset(email);
            DOM.loginErrorMsg.style.color = 'var(--c-success)';
            DOM.loginErrorMsg.textContent = '✔ Link de redefinição enviado para ' + email;
        } catch (err) {
            DOM.loginErrorMsg.textContent = 'Erro ao enviar e-mail.';
        }
    });

    // --- AUTH: Logout ---
    DOM.btnLogout.addEventListener('click', async () => {
        // Limpar login form manualmente apenas quando o usuario intencionalmente tenta sair
        DOM.loginForm.reset();
        DOM.loginErrorMsg.textContent = '';
        
        // Triggering signOut will fire the SIGNED_OUT event in app-auth.js,
        // which handles all the cleanup globally via processLogout().
        await DB.signOut();
    });

    // --- EXPENSE MODAL ---
    DOM.btnNewTransaction.addEventListener('click', () => {
        STATE.editingCreditId = null;
        DOM.expenseForm.reset();
        document.querySelector('#expense-modal .modal-header h3').textContent = 'Nova Despesa de Crédito';
        document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
        DOM.expenseModal.classList.remove('hidden');
    });
    const closeExpense = () => { STATE.editingCreditId = null; DOM.expenseModal.classList.add('hidden'); };
    DOM.btnCloseExpense.addEventListener('click', closeExpense);
    DOM.btnCancelExpense.addEventListener('click', closeExpense);
    DOM.expenseForm.addEventListener('submit', handleExpenseSubmit);

    // --- DEBIT MODAL ---
    DOM.btnNewDebit.addEventListener('click', () => {
        STATE.editingDebitId = null;
        DOM.debitForm.reset();
        document.querySelector('#debit-modal .modal-header h3').textContent = 'Nova Despesa Conta-corrente';
        document.getElementById('deb-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('deb-type').value = 'debit';
        DOM.debitModal.classList.remove('hidden');
    });
    const closeDebit = () => { STATE.editingDebitId = null; DOM.debitModal.classList.add('hidden'); };
    DOM.btnCloseDebit.addEventListener('click', closeDebit);
    DOM.btnCancelDebit.addEventListener('click', closeDebit);
    DOM.debitForm.addEventListener('submit', handleDebitSubmit);

    // --- INCOME MODAL ---
    const btnNewIncome = document.getElementById('btn-new-income');
    const incomeModal = document.getElementById('income-modal');
    const incomeForm = document.getElementById('income-form');
    if (btnNewIncome && incomeModal && incomeForm) {
        btnNewIncome.addEventListener('click', () => {
            STATE.editingDebitId = null;
            incomeForm.reset();
            document.querySelector('#income-modal .modal-header h3').textContent = 'Novo Rendimento (Apenas Receitas)';
            document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
            incomeModal.classList.remove('hidden');
        });
        const closeIncome = () => { STATE.editingDebitId = null; incomeModal.classList.add('hidden'); };
        document.getElementById('btn-close-income').addEventListener('click', closeIncome);
        document.getElementById('btn-cancel-income').addEventListener('click', closeIncome);
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }

    // --- INSTALLMENT MODAL ---
    DOM.btnNewInstallment = document.getElementById('btn-new-installment');
    const labelInstAmount = document.getElementById('label-inst-amount');
    const instValueRadios = document.querySelectorAll('input[name="inst-value-type"]');
    instValueRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (labelInstAmount) labelInstAmount.textContent = e.target.value === 'total' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)';
        });
    });
    DOM.btnNewInstallment.addEventListener('click', () => {
        STATE.editingInstId = null;
        DOM.installmentForm.reset();
        document.querySelector('#installment-modal .modal-header h3').textContent = 'Nova Compra Parcelada';
        document.getElementById('inst-date').value = new Date().toISOString().split('T')[0];
        const defaultRadio = document.querySelector('input[name="inst-value-type"][value="installment"]');
        if (defaultRadio) defaultRadio.checked = true;
        if (labelInstAmount) labelInstAmount.textContent = 'Valor da Parcela (R$)';
        DOM.installmentModal.classList.remove('hidden');
    });
    const closeInst = () => { STATE.editingInstId = null; DOM.installmentModal.classList.add('hidden'); };
    document.getElementById('btn-close-installment').addEventListener('click', closeInst);
    document.getElementById('btn-cancel-installment').addEventListener('click', closeInst);
    DOM.installmentForm.addEventListener('submit', handleInstallmentSubmit);

    // --- ADD CARD MODAL ---
    const addCardForm = document.getElementById('card-form');
    if (addCardForm) {
        addCardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cards = STATE.userData?.settings?.cards || [];
            if (cards.length >= 3) {
                alert('Você já atingiu o limite de 3 cartões de crédito.');
                return;
            }
            const name = document.getElementById('card-name').value.trim();
            const closing = parseInt(document.getElementById('card-closing').value);
            const due = parseInt(document.getElementById('card-due').value);
            
            const newCardId = 'card' + (cards.length > 0 ? Math.max(...cards.map(c => parseInt(c.id.replace('card', '')))) + 1 : 1);
            cards.push({ id: newCardId, name, closingDay: closing, dueDay: due, isConfigured: true });
            
            try {
                if (!STATE.userData.settings) STATE.userData.settings = {};
                STATE.userData.settings.cards = cards;
                await DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings);
                STATE.currentCardId = newCardId;
                document.getElementById('card-modal').classList.add('hidden');
                addCardForm.reset();
                if (window.renderCardTabs) window.renderCardTabs();
                if (window.renderCreditTable) window.renderCreditTable();
                if (window.renderInstallmentsTable) window.renderInstallmentsTable();
            } catch (err) {
                console.error(err);
                alert('Erro ao salvar cartão: ' + err.message);
            }
        });
        const closeCard = () => { document.getElementById('card-modal').classList.add('hidden'); };
        document.getElementById('btn-close-card')?.addEventListener('click', closeCard);
        document.getElementById('btn-cancel-card')?.addEventListener('click', closeCard);
    }

    // --- MOBILE SIDEBAR TOGGLE ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const btnHamburger = document.getElementById('btn-hamburger');

    function openSidebar() {
        sidebar?.classList.add('open');
        sidebarOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    btnHamburger?.addEventListener('click', () => {
        if (sidebar?.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay?.addEventListener('click', closeSidebar);

    // --- NAVIGATION ---
    DOM.mainNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');

            DOM.mainNavLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            // Always close sidebar on mobile when a nav link is clicked
            closeSidebar();

            if (target === '#consolidated-extracts') {
                DOM.pageTitle.textContent = 'Extratos Mensais Consolidados';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.categoriesGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('ai-assistant-grid').classList.add('hidden');
                document.getElementById('extracts-grid').classList.remove('hidden');
                DOM.monthNavContainer.classList.remove('hidden');
                if (window.renderConsolidatedExtracts) window.renderConsolidatedExtracts();
                document.querySelector('.content-scroll')?.scrollTo(0, 0);
            } else if (target === '#categories') {
                DOM.pageTitle.textContent = 'Gerenciar Categorias';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                document.getElementById('ai-assistant-grid').classList.add('hidden');
                DOM.categoriesGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.add('hidden');
                renderCategoriesTable();
                document.querySelector('.content-scroll')?.scrollTo(0, 0);
            } else if (target === '#settings') {
                DOM.pageTitle.textContent = 'Configurações';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.categoriesGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                document.getElementById('ai-assistant-grid').classList.add('hidden');
                DOM.settingsGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.add('hidden');
                document.querySelector('.content-scroll')?.scrollTo(0, 0);
                const cardSelect = document.getElementById('settings-card-select');
                const cardName = document.getElementById('set-card-name');
                const closingDay = document.getElementById('set-closing-day');
                const dueDay = document.getElementById('set-due-day');

                if (STATE.userData?.settings?.cards && cardSelect) {
                    cardSelect.innerHTML = '';
                    STATE.userData.settings.cards.forEach(card => {
                        const opt = document.createElement('option');
                        opt.value = card.id;
                        opt.textContent = card.name;
                        cardSelect.appendChild(opt);
                    });
                    
                    const populateCardForm = (id) => {
                        const card = STATE.userData.settings.cards.find(c => c.id === id);
                        if (card) {
                            cardName.value = card.name;
                            closingDay.value = card.closingDay;
                            dueDay.value = card.dueDay;
                        }
                    };
                    
                    cardSelect.value = STATE.currentCardId || STATE.userData.settings.cards[0].id;
                    populateCardForm(cardSelect.value);
                    
                    cardSelect.onchange = (e) => populateCardForm(e.target.value);
                }
                const dm = document.getElementById('user-dark-mode');
                if (dm && STATE.userData?.settings) dm.checked = !!STATE.userData.settings.darkMode;
                const cb = document.getElementById('user-calendar-bar');
                if (cb && STATE.userData?.settings) cb.checked = STATE.userData.settings.calendarBar !== false;
                const nameInput = document.getElementById('user-new-name');
                if (nameInput && STATE.userData) nameInput.value = STATE.userData.name;
                // Preenche campo oculto de username para o gerenciador de senhas
                const pinUsername = document.getElementById('change-pin-username');
                if (pinUsername && STATE.currentUser?.email) pinUsername.value = STATE.currentUser.email;
            } else if (target === '#ai-assistant') {
                DOM.pageTitle.textContent = 'Assistente Financeiro IA';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.categoriesGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                document.getElementById('ai-assistant-grid').classList.remove('hidden');
                DOM.monthNavContainer.classList.add('hidden');
                document.querySelector('.content-scroll')?.scrollTo(0, 0);
                if (typeof initAIAssistant === 'function') initAIAssistant();
            } else {
                DOM.categoriesGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                document.getElementById('ai-assistant-grid').classList.add('hidden');
                DOM.dashboardGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.remove('hidden');

                const contentScroll = document.querySelector('.content-scroll');
                if (target === '#dashboard') {
                    DOM.pageTitle.textContent = 'Visão Geral';
                    contentScroll?.scrollTo(0, 0);
                } else if (target === '#credit') {
                    DOM.pageTitle.textContent = 'Cartão de Crédito';
                    // Use offsetTop relative to content-scroll so header stays visible on mobile
                    const section = document.getElementById('section-credit');
                    if (section && contentScroll) {
                        contentScroll.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' });
                    }
                } else if (target === '#installments') {
                    DOM.pageTitle.textContent = 'Compras Parceladas';
                    const section = document.getElementById('section-installments');
                    if (section && contentScroll) {
                        contentScroll.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' });
                    }
                } else if (target === '#debit') {
                    DOM.pageTitle.textContent = 'Débito / Pix';
                    const section = document.getElementById('section-debit');
                    if (section && contentScroll) {
                        contentScroll.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' });
                    }
                }
            }
        });
    });

    // --- CATEGORY TABS & FORM ---
    const tabExp = document.getElementById('tab-cat-expense');
    const tabInc = document.getElementById('tab-cat-income');
    const catSubtitle = document.getElementById('cat-subtitle');
    const catGoalGroup = document.getElementById('cat-goal-group');
    const catGoalTh = document.getElementById('cat-goal-th');

    const switchTab = (tab) => {
        STATE.currentCategoryTab = tab;
        
        if (tab === 'expense') {
            tabExp.className = 'btn btn-primary';
            tabInc.className = 'btn btn-outline';
            tabExp.style.height = '44px';
            tabInc.style.height = '44px';
            catSubtitle.textContent = 'Gerencie as categorias de despesas e suas respectivas metas mensais.';
            if (catGoalGroup) catGoalGroup.style.display = 'block';
            if (catGoalTh) catGoalTh.style.display = 'table-cell';
        } else {
            tabExp.className = 'btn btn-outline';
            tabInc.className = 'btn btn-primary';
            tabExp.style.height = '44px';
            tabInc.style.height = '44px';
            catSubtitle.textContent = 'Gerencie suas fontes de renda e rendimentos.';
            if (catGoalGroup) catGoalGroup.style.display = 'none';
            if (catGoalTh) catGoalTh.style.display = 'none';
        }
        renderCategoriesTable();
    };

    tabExp?.addEventListener('click', () => switchTab('expense'));
    tabInc?.addEventListener('click', () => switchTab('income'));

    DOM.categoryForm.addEventListener('submit', handleCategorySubmit);
    DOM.btnCancelCategoryEdit.addEventListener('click', cancelCategoryEdit);

    // --- SETTINGS FORM ---
    DOM.settingsForm.addEventListener('submit', handleSettingsSubmit);

    // --- CHANGE NAME ---
    document.getElementById('change-name-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('user-new-name');
        const msg = document.getElementById('name-change-msg');
        const newName = nameInput.value.trim();
        if (newName.length < 2) { showUserSettingsMsg(msg, 'Nome muito curto.', false); return; }
        await DB.updateProfileName(STATE.currentUser.id, newName);
        STATE.userData.name = newName;
        DOM.appUserName.textContent = newName;
        DOM.appUserAvatar.textContent = newName.charAt(0).toUpperCase();
        nameInput.value = '';
        showUserSettingsMsg(msg, '✔ Nome alterado com sucesso!', true);
    });

    // --- CHANGE EMAIL ---
    document.getElementById('change-email-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('user-new-email');
        const msg = document.getElementById('email-change-msg');
        const newEmail = emailInput.value.trim();
        
        if (!newEmail || !newEmail.includes('@')) { 
            showUserSettingsMsg(msg, 'Por favor, insira um e-mail válido.', false); 
            return; 
        }
        
        try {
            showUserSettingsMsg(msg, 'Enviando solicitação...', true);
            msg.style.color = 'var(--c-text-muted)'; // Neutro durante o envio
            
            await DB.updateEmail(newEmail);
            
            emailInput.value = '';
            showUserSettingsMsg(msg, `✔ Solicitação enviada! Verifique a caixa de entrada do <strong>e-mail atual</strong> e do <strong>${newEmail}</strong> para confirmar a alteração.`, true);
        } catch (err) {
            let errorText = 'Erro ao alterar e-mail.';
            const msg422 = 'Para alterar o e-mail, confirme a solicitação que foi enviada ao seu e-mail atual. Se não recebeu, verifique o spam ou tente novamente mais tarde.';
            if (err.status === 422 || err.message?.includes('422') || err.message?.includes('Unprocessable')) {
                errorText = msg422;
            } else if (err.message?.includes('already registered') || err.message?.includes('already in use') || err.message?.includes('email address is already')) {
                errorText = 'Este e-mail já está em uso por outra conta.';
            } else if (err.message?.includes('rate limit') || err.message?.includes('too many')) {
                errorText = 'Muitas tentativas. Tente novamente mais tarde.';
            }
            showUserSettingsMsg(msg, errorText, false);
        }
    });

    // --- CHANGE PASSWORD ---
    document.getElementById('change-pin-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPw = document.getElementById('user-new-pin').value.trim();
        const confPw = document.getElementById('user-confirm-pin').value.trim();
        const msg = document.getElementById('pin-change-msg');
        if (newPw.length < 6) { showUserSettingsMsg(msg, 'A senha deve ter no mínimo 6 caracteres.', false); return; }
        if (newPw !== confPw) { showUserSettingsMsg(msg, 'As senhas não coincidem.', false); return; }
        try {
            await DB.updatePassword(newPw);
            document.getElementById('user-new-pin').value = '';
            document.getElementById('user-confirm-pin').value = '';
            showUserSettingsMsg(msg, '✔ Senha alterada com sucesso!', true);
        } catch (err) {
            showUserSettingsMsg(msg, err.message || 'Erro ao alterar senha.', false);
        }
    });

    // --- DELETE ACCOUNT ---
    const btnDeleteAccTrigger = document.getElementById('btn-delete-account-trigger');
    const deleteAccModal = document.getElementById('delete-account-modal');
    if (btnDeleteAccTrigger && deleteAccModal) {
        btnDeleteAccTrigger.addEventListener('click', () => {
            document.getElementById('delete-account-form').reset();
            document.getElementById('delete-account-msg').style.display = 'none';
            deleteAccModal.classList.remove('hidden');
        });
        const closeDeleteAcc = () => deleteAccModal.classList.add('hidden');
        document.getElementById('btn-close-delete-account')?.addEventListener('click', closeDeleteAcc);
        document.getElementById('btn-cancel-delete-account')?.addEventListener('click', closeDeleteAcc);

        document.getElementById('delete-account-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('delete-account-pw').value;
            const msg = document.getElementById('delete-account-msg');
            const submitBtn = document.getElementById('btn-confirm-delete-account');
            
            if (!pw) return;

            try {
                msg.style.display = 'none';
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

                // 1. Verify password natively by attempting to sign in locally
                await DB.signIn(STATE.currentUser.email, pw);
                
                // 2. If it succeeds, the password is correct, call the RPC to delete
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
                await DB.deleteAccount();

                // 3. Close modal and logout
                closeDeleteAcc();
                alert('Conta excluída com sucesso. Lamentamos ver você partir!');
                window.processLogout();
                
            } catch (err) {
                console.error("Erro na exclusão de conta: ", err);
                msg.style.display = 'block';
                const errStr = (err.message || '').toLowerCase();
                
                // Detecting if the password was wrong (Supabase auth error) or the RPC failed
                if (errStr.includes('login') || errStr.includes('credentials') || errStr.includes('senha') || errStr.includes('invalid log')) {
                    msg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Senha incorreta. A exclusão não foi autorizada.';
                } else if (errStr.includes('não encontrado') || errStr.includes('not found') || errStr.includes('function delete_user_account')) {
                    msg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> A exclusão falhou: o administrador precisa rodar o script SQL no Supabase.';
                } else {
                    msg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Ocorreu um erro ao excluir a conta. Tente novamente mais tarde.';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Confirmar Exclusão';
                }
            }
        });
    }

    // --- DARK MODE ---
    document.getElementById('user-dark-mode')?.addEventListener('change', (e) => window.applyDarkMode(e.target.checked));
    document.getElementById('btn-header-darkmode')?.addEventListener('click', () => window.applyDarkMode(!document.body.classList.contains('dark-theme')));

    // --- CALENDAR BAR ---
    document.getElementById('user-calendar-bar')?.addEventListener('change', (e) => window.applyCalendarBar(e.target.checked));

    // --- REPLAY TUTORIAL ---
    document.getElementById('btn-replay-tutorial')?.addEventListener('click', () => {
        if (window.startTutorial) window.startTutorial();
    });

    // --- MONTH NAVIGATION ---
    DOM.btnPrevMonth?.addEventListener('click', () => {
        if (STATE.viewYear === 2026 && STATE.viewMonth === 0) return;
        if (--STATE.viewMonth < 0) { STATE.viewMonth = 11; STATE.viewYear--; }
        updateMonthLabel(); initDashboard();
    });
    DOM.btnNextMonth?.addEventListener('click', () => {
        if (STATE.viewYear === 2099 && STATE.viewMonth === 11) return;
        if (++STATE.viewMonth > 11) { STATE.viewMonth = 0; STATE.viewYear++; }
        updateMonthLabel(); initDashboard();
    });

    // --- AVATAR UPLOAD ---
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const avatarUpload = document.getElementById('avatar-upload');

    if (avatarWrapper && avatarUpload) {
        avatarWrapper.addEventListener('click', () => {
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Simple validation
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione uma imagem válida.');
                return;
            }

            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('A imagem é muito grande. O tamanho máximo permitido é 2MB.');
                return;
            }

            try {
                // UI Loading state
                const overlayIcon = avatarWrapper.querySelector('.avatar-overlay i');
                if (overlayIcon) {
                    overlayIcon.classList.replace('fa-camera', 'fa-spinner');
                    overlayIcon.classList.add('fa-spin');
                }

                // 1. Upload to storage
                const publicUrl = await DB.uploadAvatar(STATE.currentUser.id, file);

                // 2. Add cache buster to force browser refresh if replacing same file
                const urlWithBuster = `${publicUrl}?v=${new Date().getTime()}`;

                // 3. Update profile row in DB
                await DB.updateProfileAvatar(STATE.currentUser.id, urlWithBuster);

                // 4. Update UI
                DOM.appUserAvatar.innerHTML = `<img src="${urlWithBuster}" alt="Avatar" class="avatar-img">`;

                if (overlayIcon) {
                    overlayIcon.classList.remove('fa-spin');
                    overlayIcon.classList.replace('fa-spinner', 'fa-camera');
                }
            } catch (err) {
                console.error("Erro no upload do avatar:", err);
                alert('Ocorreu um erro ao enviar a foto de perfil: ' + err.message);

                // Revert icon
                const overlayIcon = avatarWrapper.querySelector('.avatar-overlay i');
                if (overlayIcon) {
                    overlayIcon.classList.remove('fa-spin');
                    overlayIcon.classList.replace('fa-spinner', 'fa-camera');
                }
            } finally {
                avatarUpload.value = ''; // Reset input to allow selecting same file again
            }
        });
    }
}
