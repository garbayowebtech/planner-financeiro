/**
 * app-auth.js — State, DOM, Initialization & Auth
 * Load order: supabase-js > db.js > app-auth.js > script.js
 */

// ── STATE ──────────────────────────────────────────────────────
const STATE = {
    currentUser: null,
    userData: null,
    viewMonth: new Date().getMonth(),
    viewYear: new Date().getFullYear(),
    monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    creditFilterCat: 'all', creditSort: 'date_desc', creditPage: 1,
    instFilterCat: 'all', instSort: 'date_desc', instPage: 1,
    debitFilterCat: 'all', debitSort: 'date_desc', debitPage: 1,
    itemsPerPage: 7,
    editingCreditId: null, editingDebitId: null, editingInstId: null,
    currentCategoryTab: 'expense',
    currentCardId: 'card1'
};

// ── CHART INSTANCES ────────────────────────────────────────────
let creditChartInstance = null, debitChartInstance = null,
    goalsChartInstance = null, overallPieChartInstance = null,
    installmentChartInstance = null;

// ── DOM ─────────────────────────────────────────────────────────
const DOM = {
    authView: document.getElementById('auth-view'),
    appView: document.getElementById('app-view'),

    // Auth
    loginSection: document.getElementById('login-section'),
    loginForm: document.getElementById('login-form'),
    loginErrorMsg: document.getElementById('login-error-msg'),
    registerSection: document.getElementById('register-section'),
    btnShowRegister: document.getElementById('btn-show-register'),
    btnRegCancel: document.getElementById('btn-reg-cancel'),
    regForm: document.getElementById('register-form'),
    regErrorMsg: document.getElementById('reg-error-msg'),

    // App header
    appUserName: document.getElementById('app-user-name'),
    appUserAvatar: document.getElementById('app-user-avatar'),
    btnLogout: document.getElementById('btn-logout'),
    pageTitle: document.getElementById('page-title'),

    // Nav & grids (re-assigned in DOMContentLoaded)
    mainNavLinks: null,
    dashboardGrid: null,
    categoriesGrid: null,
    settingsGrid: null,
    monthNavContainer: document.getElementById('month-navigation'),
    btnPrevMonth: document.getElementById('btn-prev-month'),
    btnNextMonth: document.getElementById('btn-next-month'),
    labelCurrentMonth: document.getElementById('label-current-month'),

    // Modals & forms (used by script.js)
    btnNewTransaction: document.getElementById('btn-new-transaction'),
    expenseModal: document.getElementById('expense-modal'),
    btnCloseExpense: document.getElementById('btn-close-expense'),
    btnCancelExpense: document.getElementById('btn-cancel-expense'),
    expenseForm: document.getElementById('expense-form'),
    expCategorySelect: document.getElementById('exp-category'),

    creditTableBody: document.querySelector('#credit-table tbody'),

    btnNewDebit: document.getElementById('btn-new-debit'),
    debitModal: document.getElementById('debit-modal'),
    btnCloseDebit: document.getElementById('btn-close-debit'),
    btnCancelDebit: document.getElementById('btn-cancel-debit'),
    debitForm: document.getElementById('debit-form'),
    debCategorySelect: document.getElementById('deb-category'),
    debitTableBody: document.querySelector('#debit-table tbody'),

    categoryForm: document.getElementById('category-form'),
    categoriesTableBody: document.querySelector('#categories-table tbody'),
    btnSaveCategory: document.getElementById('btn-save-category'),
    btnCancelCategoryEdit: document.getElementById('btn-cancel-category-edit'),

    settingsForm: document.getElementById('settings-form'),
    setClosingDay: document.getElementById('set-closing-day'),
    setDueDay: document.getElementById('set-due-day'),
    settingsMsg: document.getElementById('settings-msg'),

    btnNewInstallment: document.getElementById('btn-new-installment'),
    installmentModal: document.getElementById('installment-modal'),
    installmentForm: document.getElementById('installment-form'),
    instCategorySelect: document.getElementById('inst-category'),
    installmentsTableBody: document.getElementById('installments-table-body'),

    filterCatCredit: document.getElementById('filter-cat-credit'),
    sortCredit: document.getElementById('sort-credit'),
    btnPrevCredit: document.getElementById('btn-prev-credit'),
    btnNextCredit: document.getElementById('btn-next-credit'),
    pageInfoCredit: document.getElementById('page-info-credit'),

    filterCatInst: document.getElementById('filter-cat-inst'),
    sortInst: document.getElementById('sort-inst'),
    btnPrevInst: document.getElementById('btn-prev-inst'),
    btnNextInst: document.getElementById('btn-next-inst'),
    pageInfoInst: document.getElementById('page-info-inst'),

    filterCatDebit: document.getElementById('filter-cat-debit'),
    sortDebit: document.getElementById('sort-debit'),
    btnPrevDebit: document.getElementById('btn-prev-debit'),
    btnNextDebit: document.getElementById('btn-next-debit'),
    pageInfoDebit: document.getElementById('page-info-debit')
};

// ── AUTH HELPERS ────────────────────────────────────────────────
function showAuthSection(section) {
    if (section === 'login' || section === 'register') {
        isAppLoading = false; // Reset lock when showing forms
    }
    DOM.loginSection.classList.toggle('hidden', section !== 'login');
    DOM.registerSection.classList.toggle('hidden', section !== 'register');
    const loadingSec = document.getElementById('loading-session');
    if (loadingSec) loadingSec.classList.toggle('hidden', section !== 'loading');
}

// Global logout function to clear state, reset UI, and destroy chart instances
window.processLogout = function() {
    console.log("Processing logout cleanup...");
    localStorage.removeItem('sb-ctveuoeoyymzozzwqqln-auth-token');
    STATE.currentUser = null;
    STATE.userData = null;
    
    // Destroy charts to avoid canvas overlap if another user logs in
    if (creditChartInstance) creditChartInstance.destroy();
    if (debitChartInstance) debitChartInstance.destroy();
    if (goalsChartInstance) goalsChartInstance.destroy();
    if (overallPieChartInstance) overallPieChartInstance.destroy();
    if (installmentChartInstance) installmentChartInstance.destroy();
    if (window.extractPieChartInstance) window.extractPieChartInstance.destroy();

    document.body.classList.remove('dark-theme');
    DOM.appView.classList.replace('active', 'hidden');
    DOM.authView.classList.replace('hidden', 'active');
    
    showAuthSection('login');
};

let isAppLoading = false;
let appLoadPromise = null;

function loadAndEnterApp(user) {
    console.log("loadAndEnterApp called. lock:", isAppLoading, "user:", user?.id);
    if (isAppLoading) return appLoadPromise;
    
    // Allow re-entry if state is cleared but we pass same user
    if (STATE.currentUser?.id === user.id && DOM.appView.classList.contains('active')) return Promise.resolve();
    
    isAppLoading = true;
    appLoadPromise = (async () => {
        try {
            STATE.currentUser = user;

            // Retry profile load (trigger may need a moment after signup)
            let profile = null;
            for (let i = 0; i < 4; i++) {
                try { 
                    const pfTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error("Profile timeout")), 8000));
                    profile = await Promise.race([DB.getProfile(user.id), pfTimeout]); 
                    break; 
                }
                catch (e) { if (i < 3) await new Promise(r => setTimeout(r, 600)); else throw e; }
            }

            // Wrap the heavy database fetch Promise.all with a timeout to prevent infinite loading on bad connections
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout: Os dados demoraram muito para carregar. O servidor pode estar indisponível ou há problemas na sua conexão.")), 15000)
            );

            const dataPromise = Promise.all([
                DB.getCategories(user.id),
                DB.getCreditExpenses(user.id),
                DB.getDebitTransactions(user.id),
                DB.getInstallments(user.id)
            ]);

            const [categories, creditExpenses, debitTransactions, installments] = await Promise.race([dataPromise, timeoutPromise]);

            STATE.userData = {
                name: profile.name,
                settings: profile.settings || { darkMode: false },
                categories, creditExpenses, debitTransactions, installments
            };

            // Migrate or initialize cards
            if (!STATE.userData.settings.cards) {
                STATE.userData.settings.cards = [{
                    id: 'card1',
                    name: 'Cartão 1',
                    closingDay: '',
                    dueDay: ''
                }];
            } else {
                STATE.userData.settings.cards.forEach(c => {
                    if (!c.isConfigured && c.closingDay === 11 && c.dueDay === 20) {
                        const hasTx = STATE.userData.creditExpenses.some(e => (e.cardId || 'card1') === c.id) ||
                                      STATE.userData.installments.some(i => (i.cardId || 'card1') === c.id);
                        if (!hasTx) {
                            c.closingDay = '';
                            c.dueDay = '';
                        }
                    }
                });
            }

            window.applyDarkMode(!!STATE.userData.settings.darkMode);
            window.applyCalendarBar(STATE.userData.settings.calendarBar !== false);
            DOM.appUserName.textContent = STATE.userData.name;

            // Render profile photo or initials
            if (profile.avatar_url) {
                DOM.appUserAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" class="avatar-img">`;
            } else {
                DOM.appUserAvatar.textContent = STATE.userData.name.charAt(0).toUpperCase();
            }

            const now = new Date();
            STATE.viewMonth = now.getMonth();
            STATE.viewYear = now.getFullYear();
            updateMonthLabel();

            DOM.authView.classList.replace('active', 'hidden');
            DOM.appView.classList.replace('hidden', 'active');

            initDashboard();
            // Auto-start tutorial on first login
            if (!STATE.userData.settings.tutorialSeen) {
                setTimeout(window.startTutorial, 1500);
            } else {
                setTimeout(checkGoalAlerts, 500);
            }
        } catch(err) {
            console.error("Error during app-load:", err);
            DOM.loginErrorMsg.textContent = "Erro processando login: " + err.message;
            throw err;
        } finally {
            isAppLoading = false;
            appLoadPromise = null;
        }
    })();
    return appLoadPromise;
}

// ── DARK MODE ──────────────────────────────────────────────────
window.applyDarkMode = function (isDark) {
    const headerBtn = document.getElementById('btn-header-darkmode');
    document.body.classList.toggle('dark-theme', isDark);
    if (headerBtn) {
        const icon = headerBtn.querySelector('i');
        if (icon) { icon.classList.toggle('fa-sun', isDark); icon.classList.toggle('fa-moon', !isDark); }
    }
    const toggle = document.getElementById('user-dark-mode');
    if (toggle) toggle.checked = isDark;

    if (STATE.userData) {
        if (!STATE.userData.settings) STATE.userData.settings = {};
        STATE.userData.settings.darkMode = isDark;
    }

    if (STATE.currentUser && STATE.userData?.settings) {
        DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings).catch(console.error);
    }

    const appView = document.getElementById('app-view');
    if (appView?.classList.contains('active')) {
        renderCreditChart(); renderDebitChart(); renderInstallmentsChart();
        renderGoalsChart(); renderOverallPieChart();
    }
};

// ── CALENDAR BAR ───────────────────────────────────────────────
window.applyCalendarBar = function (isVisible) {
    const bar = document.getElementById('top-calendar-bar');
    if (bar) bar.classList.toggle('hidden', !isVisible);

    const appView = document.getElementById('app-view');
    if (appView) appView.style.paddingTop = isVisible ? '40px' : '0';

    const toggle = document.getElementById('user-calendar-bar');
    if (toggle) toggle.checked = isVisible;

    if (STATE.userData) {
        if (!STATE.userData.settings) STATE.userData.settings = {};
        STATE.userData.settings.calendarBar = isVisible;
    }

    if (STATE.currentUser && STATE.userData?.settings) {
        DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings).catch(console.error);
    }
};

// ── TUTORIAL ───────────────────────────────────────────────────
let tutorialCurrentStep = 0;
const TUTORIAL_TOTAL_STEPS = 9;

window.startTutorial = function () {
    const modal = document.getElementById('tutorial-modal');
    if (!modal) return;
    tutorialCurrentStep = 0;
    renderTutorialStep();
    modal.classList.remove('hidden');
};

window.finishTutorial = async function () {
    const modal = document.getElementById('tutorial-modal');
    if (modal) modal.classList.add('hidden');
    
    if (STATE.userData && (!STATE.userData.settings || !STATE.userData.settings.tutorialSeen)) {
        if (!STATE.userData.settings) STATE.userData.settings = {};
        STATE.userData.settings.tutorialSeen = true;
        if (STATE.currentUser) {
            try {
                await DB.updateProfileSettings(STATE.currentUser.id, STATE.userData.settings);
            } catch (err) {
                console.error("Failed to save tutorial setting:", err);
            }
        }
    }
};

function renderTutorialStep() {
    const slider = document.getElementById('tutorial-slider');
    const dotsContainer = document.getElementById('tutorial-dots');
    const btnPrev = document.getElementById('btn-tut-prev');
    const btnNext = document.getElementById('btn-tut-next');
    
    if (!slider || !dotsContainer) return;
    
    // Move slider (100% width per slide)
    slider.style.transform = `translateX(-${tutorialCurrentStep * 100}%)`;
    
    // Render/Update dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < TUTORIAL_TOTAL_STEPS; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === tutorialCurrentStep ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            tutorialCurrentStep = i;
            renderTutorialStep();
        });
        dotsContainer.appendChild(dot);
    }
    
    // Update Prev button
    btnPrev.style.visibility = tutorialCurrentStep === 0 ? 'hidden' : 'visible';
    
    // Update Next button
    if (tutorialCurrentStep === TUTORIAL_TOTAL_STEPS - 1) {
        btnNext.innerHTML = 'Começar a usar! <i class="fa-solid fa-check"></i>';
    } else {
        btnNext.innerHTML = 'Próximo <i class="fa-solid fa-arrow-right"></i>';
    }
}

// ── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    DOM.mainNavLinks = document.querySelectorAll('.main-nav a');
    DOM.dashboardGrid = document.getElementById('dashboard-grid');
    DOM.categoriesGrid = document.getElementById('categories-grid');
    DOM.settingsGrid = document.getElementById('settings-grid');
    DOM.extractsGrid = document.getElementById('extracts-grid');
    DOM.pageTitle = document.getElementById('page-title');

    // Tutorial Listeners
    document.getElementById('btn-close-tutorial')?.addEventListener('click', window.finishTutorial);
    document.getElementById('btn-tut-prev')?.addEventListener('click', () => {
        if (tutorialCurrentStep > 0) { tutorialCurrentStep--; renderTutorialStep(); }
    });
    document.getElementById('btn-tut-next')?.addEventListener('click', () => {
        if (tutorialCurrentStep < TUTORIAL_TOTAL_STEPS - 1) {
            tutorialCurrentStep++;
            renderTutorialStep();
        } else {
            window.finishTutorial();
        }
    });

    // Google Social Login Listeners
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnGoogleRegister = document.getElementById('btn-google-register');
    const handleGoogleLogin = async () => {
        try {
            if (DOM.loginErrorMsg) DOM.loginErrorMsg.textContent = "";
            if (DOM.regErrorMsg) DOM.regErrorMsg.textContent = "";
            if (btnGoogleLogin) btnGoogleLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando...';
            if (btnGoogleRegister) btnGoogleRegister.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando...';
            // The method redirects to Google's oAuth consent screen
            await DB.signInWithGoogle();
        } catch (error) {
            console.error(error);
            if (DOM.loginErrorMsg) DOM.loginErrorMsg.textContent = "Erro ao iniciar login com Google.";
            if (DOM.regErrorMsg) DOM.regErrorMsg.textContent = "Erro ao iniciar registro com Google.";
            
            // Restore button text on error
            if (btnGoogleLogin) btnGoogleLogin.innerHTML = '<i class="fa-brands fa-google"></i> Entrar com o Google';
            if (btnGoogleRegister) btnGoogleRegister.innerHTML = '<i class="fa-brands fa-google"></i> Criar com o Google';
        }
    };
    if (btnGoogleLogin) btnGoogleLogin.addEventListener('click', handleGoogleLogin);
    if (btnGoogleRegister) btnGoogleRegister.addEventListener('click', handleGoogleLogin);

    // 1. Primeiramente, atrelamos todos os listeners para que os botões funcionem
    // imediatamente, mesmo enquanto checamos a sessão no Supabase.
    try {
        setupEventListeners();
    } catch (e) {
        console.error("Erro ao configurar listeners:", e);
        DOM.loginErrorMsg.textContent = "Erro em setupEventListeners: " + e.message;
    }

    try {
        window.dispatchEvent(new Event('app-auth-ready'));
    } catch (e) {
        console.error("Erro auth ready:", e);
    }

    // 2. Listener de autenticação do Supabase
    // NOTA: SIGNED_IN pode disparar ANTES de INITIAL_SESSION (_recoverAndRefresh do Supabase).
    // Por isso, auto-login é feito APENAS em INITIAL_SESSION. SIGNED_IN é ignorado até lá.
    try {
        let initTimerId = null;
        let initialSessionHandled = false;
        
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event:", event);
            
            // Cancela o failsafe assim que qualquer evento principal chegar
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
                if (initTimerId) { clearTimeout(initTimerId); initTimerId = null; }
            }

            if (event === 'INITIAL_SESSION') {
                initialSessionHandled = true;
                if (session) {
                    try {
                        // Valida sessão no servidor antes de carregar dados
                        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
                        if (userError || !user) {
                            localStorage.removeItem(tokenKey);
                            showAuthSection('login');
                            return;
                        }
                        await loadAndEnterApp(user);
                    } catch (e) {
                        // Não faz signOut: o token pode ainda ser válido (ex: lentidão do banco).
                        // Apenas mostra o login para o usuário tentar manualmente.
                        console.error("INITIAL_SESSION: falha ao carregar app:", e);
                        showAuthSection('login');
                    }
                } else {
                    showAuthSection('login');
                }

            } else if (event === 'SIGNED_IN' && session) {
                // Ignora se INITIAL_SESSION ainda não foi tratado (evita corrida de eventos)
                if (!initialSessionHandled) return;
                // Ignora se o mesmo usuário já está ativo
                if (STATE.currentUser?.id === session.user.id) return;
                // Caso legítimo: login manual, ou troca de conta
                try {
                    await loadAndEnterApp(session.user);
                } catch (e) {
                    console.error("SIGNED_IN: falha ao carregar app:", e);
                    showAuthSection('login');
                }

            } else if (event === 'SIGNED_OUT') {
                window.processLogout();
            }
        });
        
        // Failsafe: se INITIAL_SESSION não disparar em 6s, exibe login
        initTimerId = setTimeout(() => {
            if (!initialSessionHandled) {
                console.warn("Auth event watcher timed out, forcing login screen.");
                showAuthSection('login');
            }
        }, 6000);
        
    } catch (e) {
        console.error("Erro onAuthStateChange init:", e);
        localStorage.removeItem(tokenKey);
        DOM.loginErrorMsg.textContent = "Erro no ouvinte de Auth: " + e.message;
        showAuthSection('login');
    }
});

// ── UTIL ────────────────────────────────────────────────────────
function updateMonthLabel() {
    if (DOM.labelCurrentMonth)
        DOM.labelCurrentMonth.textContent = `${STATE.monthNames[STATE.viewMonth]} ${STATE.viewYear}`;
}

function showUserSettingsMsg(el, text, success) {
    el.textContent = text;
    el.style.display = 'block';
    el.style.color = success ? 'var(--c-success)' : 'var(--c-danger)';
    el.style.fontWeight = '500';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 4000);
}
