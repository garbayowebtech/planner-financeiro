/**
 * app-crud.js — Async CRUD handlers using Supabase
 * Replaces all localStorage-based save/load operations.
 * Load order: supabase-js > db.js > app-auth.js > app-crud.js > script.js
 */

// ── CREDIT EXPENSES ─────────────────────────────────────────────
async function handleExpenseSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('exp-name').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;
    const catId = document.getElementById('exp-category').value;
    const closing = STATE.userData.settings.cardClosingDay || 11;
    const dueDay = STATE.userData.settings.cardDueDay || 20;
    const cycle = calculateCycle(date, closing);
    const dueDate = new Date(cycle.end.getFullYear(), cycle.end.getMonth(), dueDay);
    const expData = {
        name, amount, date, categoryId: catId,
        cycleStart: cycle.start.toISOString().split('T')[0],
        cycleEnd: cycle.end.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0]
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
    const name = document.getElementById('deb-name').value.trim();
    const amount = parseFloat(document.getElementById('deb-amount').value);
    const date = document.getElementById('deb-date').value;
    const catId = document.getElementById('deb-category').value;
    const type = document.getElementById('deb-type').value;
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
    renderDebitTable(); renderDebitChart(); renderGoalsChart(); renderOverallPieChart();
}

window.deleteDebitTransaction = async function (id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    await DB.deleteDebitTransaction(id);
    STATE.userData.debitTransactions = STATE.userData.debitTransactions.filter(t => t.id !== id);
    renderDebitTable(); renderDebitChart(); renderGoalsChart(); renderOverallPieChart();
};

// ── INSTALLMENTS ────────────────────────────────────────────────
async function handleInstallmentSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('inst-name').value.trim();
    const amount = parseFloat(document.getElementById('inst-amount').value);
    const total = parseInt(document.getElementById('inst-total').value);
    const current = parseInt(document.getElementById('inst-current').value);
    const date = document.getElementById('inst-date').value;
    const catId = document.getElementById('inst-category').value;
    if (!name || isNaN(amount) || isNaN(total) || isNaN(current) || !date || !catId) return;

    const instData = { name, installmentAmount: amount, totalInstallments: total, currentInstallment: current, date, categoryId: catId };

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
    const catData = { name, goal, color: bg, textColor: txt };

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
    const closing = parseInt(DOM.setClosingDay.value);
    const due = parseInt(DOM.setDueDay.value);

    STATE.userData.settings.cardClosingDay = closing;
    STATE.userData.settings.cardDueDay = due;

    // Recalculate credit expense cycles and bulk update
    const updates = [];
    STATE.userData.creditExpenses.forEach(exp => {
        const cycle = calculateCycle(exp.date, closing);
        const dueDate = new Date(cycle.end.getFullYear(), cycle.end.getMonth(), due);
        exp.cycleStart = cycle.start.toISOString().split('T')[0];
        exp.cycleEnd = cycle.end.toISOString().split('T')[0];
        exp.dueDate = dueDate.toISOString().split('T')[0];
        updates.push(DB.updateCreditExpense(exp.id, exp));
    });

    await Promise.all([
        DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings),
        ...updates
    ]);

    renderCreditTable();
    initDashboard();
    DOM.settingsMsg.style.display = 'block';
    setTimeout(() => { DOM.settingsMsg.style.display = 'none'; }, 3000);
}

// ── SETUP: EVENT LISTENERS ──────────────────────────────────────
function setupEventListeners() {

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
        document.querySelector('#debit-modal .modal-header h3').textContent = 'Nova Transação Débito/Pix';
        document.getElementById('deb-date').value = new Date().toISOString().split('T')[0];
        DOM.debitModal.classList.remove('hidden');
    });
    const closeDebit = () => { STATE.editingDebitId = null; DOM.debitModal.classList.add('hidden'); };
    DOM.btnCloseDebit.addEventListener('click', closeDebit);
    DOM.btnCancelDebit.addEventListener('click', closeDebit);
    DOM.debitForm.addEventListener('submit', handleDebitSubmit);

    // --- INSTALLMENT MODAL ---
    DOM.btnNewInstallment = document.getElementById('btn-new-installment');
    DOM.btnNewInstallment.addEventListener('click', () => {
        STATE.editingInstId = null;
        DOM.installmentForm.reset();
        document.querySelector('#installment-modal .modal-header h3').textContent = 'Nova Compra Parcelada';
        document.getElementById('inst-date').value = new Date().toISOString().split('T')[0];
        DOM.installmentModal.classList.remove('hidden');
    });
    const closeInst = () => { STATE.editingInstId = null; DOM.installmentModal.classList.add('hidden'); };
    document.getElementById('btn-close-installment').addEventListener('click', closeInst);
    document.getElementById('btn-cancel-installment').addEventListener('click', closeInst);
    DOM.installmentForm.addEventListener('submit', handleInstallmentSubmit);

    // --- NAVIGATION ---
    DOM.mainNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');

            DOM.mainNavLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            if (target === '#consolidated-extracts') {
                DOM.pageTitle.textContent = 'Extratos Mensais Consolidados';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.categoriesGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.remove('hidden');
                DOM.monthNavContainer.classList.remove('hidden');
                if (window.renderConsolidatedExtracts) window.renderConsolidatedExtracts();
                document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (target === '#categories') {
                DOM.pageTitle.textContent = 'Gerenciar Categorias';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                DOM.categoriesGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.add('hidden');
                renderCategoriesTable();
            } else if (target === '#settings') {
                DOM.pageTitle.textContent = 'Configurações';
                DOM.dashboardGrid.classList.add('hidden');
                DOM.categoriesGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                DOM.settingsGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.add('hidden');
                if (STATE.userData?.settings) {
                    DOM.setClosingDay.value = STATE.userData.settings.cardClosingDay || 11;
                    DOM.setDueDay.value = STATE.userData.settings.cardDueDay || 20;
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
            } else {
                DOM.categoriesGrid.classList.add('hidden');
                DOM.settingsGrid.classList.add('hidden');
                document.getElementById('extracts-grid').classList.add('hidden');
                DOM.dashboardGrid.classList.remove('hidden');
                DOM.monthNavContainer.classList.remove('hidden');
                if (target === '#dashboard') { DOM.pageTitle.textContent = 'Visão Geral'; document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' }); }
                else if (target === '#credit') { DOM.pageTitle.textContent = 'Cartão de Crédito'; document.getElementById('section-credit')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
                else if (target === '#installments') { DOM.pageTitle.textContent = 'Compras Parceladas'; document.getElementById('section-installments')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
                else if (target === '#debit') { DOM.pageTitle.textContent = 'Débito / Pix'; document.getElementById('section-debit')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            }
        });
    });

    // --- CATEGORY FORM ---
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
