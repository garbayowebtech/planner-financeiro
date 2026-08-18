import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, DB } from '../services/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Navigation State
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'auth', 'app'
  const [authSection, setAuthSection] = useState('login'); // 'login', 'register'
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard', 'credit', 'debit', 'consolidated-extracts', 'categories', 'ai-assistant', 'settings'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkModeState] = useState(false);
  const [calendarBar, setCalendarBarState] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // Month Navigation State
  const [viewDate, setViewDate] = useState(new Date(2026, 0, 1)); // Default January 2026

  // Financial Data State
  const [categories, setCategories] = useState([]);
  const [creditExpenses, setCreditExpenses] = useState([]);
  const [debitTransactions, setDebitTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [userSettings, setUserSettings] = useState({
    cards: [
      { id: 'card1', name: 'Cartão 1', closingDay: 11, dueDay: 18, color: '#4F46E5' },
      { id: 'card2', name: 'Cartão 2', closingDay: 15, dueDay: 22, color: '#0ea5e9' }
    ],
    goalAlertDismissed: ''
  });
  const [currentCardId, setCurrentCardId] = useState('card1');

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'credit', 'installment', 'income', 'debit', 'category', 'card-settings', 'tutorial'
  const [editingCreditId, setEditingCreditId] = useState(null);
  const [editingDebitId, setEditingDebitId] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [editingCatId, setEditingCatId] = useState(null);

  // Filter & Pagination States
  const [creditFilterCat, setCreditFilterCat] = useState('all');
  const [creditSort, setCreditSort] = useState('date_desc');
  const [creditPage, setCreditPage] = useState(1);

  const [instFilterCat, setInstFilterCat] = useState('all');
  const [instSort, setInstSort] = useState('date_desc');
  const [instPage, setInstPage] = useState(1);

  const [debitFilterCat, setDebitFilterCat] = useState('all');
  const [debitSort, setDebitSort] = useState('date_desc');
  const [debitPage, setDebitPage] = useState(1);

  // Initialize Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        setCurrentView('app');
      } else {
        setLoadingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
        setCurrentView('app');
      } else {
        setLoadingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Dark mode DOM sync
  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode);
  }, [darkMode]);

  const fetchUserData = async (userId) => {
    setLoadingSession(true);
    try {
      const prof = await DB.getProfile(userId);
      setProfile(prof);
      if (prof?.settings) {
        const s = prof.settings;
        if (s.cards) {
          setUserSettings(s);
          if (s.cards.length > 0) setCurrentCardId(s.cards[0].id);
        }
        // Restore appearance preferences
        const isDark = !!s.darkMode;
        const isCalBar = s.calendarBar !== false;
        setDarkModeState(isDark);
        setCalendarBarState(isCalBar);
        // Auto-start tutorial on first login
        if (!s.tutorialSeen) {
          setTimeout(() => setShowTutorial(true), 1500);
        }
      } else {
        // New user — show tutorial
        setTimeout(() => setShowTutorial(true), 1500);
      }

      const [cats, credits, debits, insts] = await Promise.all([
        DB.getCategories(userId),
        DB.getCreditExpenses(userId),
        DB.getDebitTransactions(userId),
        DB.getInstallments(userId)
      ]);

      setCategories(cats);
      setCreditExpenses(credits);
      setDebitTransactions(debits);
      setInstallments(insts);
    } catch (err) {
      console.warn("User data fetch error:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  // ── Appearance helpers ──────────────────────────────────────────
  const applyDarkMode = async (isDark) => {
    setDarkModeState(isDark);
    if (currentUser && userSettings) {
      const newSettings = { ...userSettings, darkMode: isDark };
      setUserSettings(newSettings);
      await DB.updateProfileSettings(currentUser.id, newSettings).catch(console.error);
    }
  };

  const applyCalendarBar = async (isVisible) => {
    setCalendarBarState(isVisible);
    if (currentUser && userSettings) {
      const newSettings = { ...userSettings, calendarBar: isVisible };
      setUserSettings(newSettings);
      await DB.updateProfileSettings(currentUser.id, newSettings).catch(console.error);
    }
  };

  // ── Tutorial ────────────────────────────────────────────────────
  const finishTutorial = async () => {
    setShowTutorial(false);
    if (currentUser && userSettings && !userSettings.tutorialSeen) {
      const newSettings = { ...userSettings, tutorialSeen: true };
      setUserSettings(newSettings);
      await DB.updateProfileSettings(currentUser.id, newSettings).catch(console.error);
    }
  };

  // ── User Profile Actions ────────────────────────────────────────
  const handleUpdateName = async (newName) => {
    if (!currentUser) throw new Error('Não autenticado');
    await DB.updateProfileName(currentUser.id, newName);
    setProfile(prev => ({ ...prev, name: newName }));
  };

  const handleUpdateEmail = async (newEmail) => {
    if (!currentUser) throw new Error('Não autenticado');
    await DB.updateEmail(newEmail);
  };

  const handleUpdatePassword = async (newPassword) => {
    if (!currentUser) throw new Error('Não autenticado');
    await DB.updatePassword(newPassword);
  };

  const handleDeleteAccount = async (password) => {
    if (!currentUser) throw new Error('Não autenticado');
    // Verify password by re-signing in
    await DB.signIn(currentUser.email, password);
    await DB.deleteAccount();
    await handleLogout();
  };

  // Month navigation helpers
  const prevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentMonthLabel = useMemo(() => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  }, [viewDate]);

  // Auth Operations
  const handleLogin = async (email, password) => {
    const user = await DB.signIn(email, password);
    setCurrentUser(user);
    setCurrentView('app');
  };

  const handleRegister = async (email, password, name) => {
    await DB.signUp(email, password, name);
    alert("Cadastro realizado! Verifique seu e-mail para confirmar a conta se necessário.");
  };

  const handleLogout = async () => {
    await DB.signOut();
    setCurrentUser(null);
    setSession(null);
    setProfile(null);
    setCurrentView('landing');
  };

  // CRUD Actions
  const handleSaveCreditExpense = async (data) => {
    if (!currentUser) return;
    if (editingCreditId) {
      await DB.updateCreditExpense(editingCreditId, data);
      setCreditExpenses(prev => prev.map(e => e.id === editingCreditId ? { ...e, ...data } : e));
      setEditingCreditId(null);
    } else {
      const created = await DB.createCreditExpense(currentUser.id, { ...data, cardId: currentCardId });
      setCreditExpenses(prev => [...prev, created]);
    }
    setActiveModal(null);
  };

  const handleDeleteCreditExpense = async (id) => {
    if (!confirm("Deseja realmente excluir esta despesa à vista?")) return;
    await DB.deleteCreditExpense(id);
    setCreditExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveDebitTransaction = async (data) => {
    if (!currentUser) return;
    if (editingDebitId) {
      await DB.updateDebitTransaction(editingDebitId, data);
      setDebitTransactions(prev => prev.map(t => t.id === editingDebitId ? { ...t, ...data } : t));
      setEditingDebitId(null);
    } else {
      const created = await DB.createDebitTransaction(currentUser.id, data);
      setDebitTransactions(prev => [...prev, created]);
    }
    setActiveModal(null);
  };

  const handleDeleteDebitTransaction = async (id) => {
    if (!confirm("Deseja realmente excluir esta movimentação?")) return;
    await DB.deleteDebitTransaction(id);
    setDebitTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveInstallment = async (data) => {
    if (!currentUser) return;
    if (editingInstId) {
      await DB.updateInstallment(editingInstId, data);
      setInstallments(prev => prev.map(i => i.id === editingInstId ? { ...i, ...data } : i));
      setEditingInstId(null);
    } else {
      const created = await DB.createInstallment(currentUser.id, { ...data, cardId: currentCardId });
      setInstallments(prev => [...prev, created]);
    }
    setActiveModal(null);
  };

  const handleDeleteInstallment = async (id) => {
    if (!confirm("Deseja realmente excluir esta compra parcelada?")) return;
    await DB.deleteInstallment(id);
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveCategory = async (data) => {
    if (!currentUser) return;
    if (editingCatId) {
      await DB.updateCategory(editingCatId, data);
      setCategories(prev => prev.map(c => c.id === editingCatId ? { ...c, ...data } : c));
      setEditingCatId(null);
    } else {
      const created = await DB.createCategory(currentUser.id, data);
      setCategories(prev => [...prev, created]);
    }
    setActiveModal(null);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Deseja excluir esta categoria?")) return;
    await DB.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      session,
      currentUser,
      profile,
      loadingSession,
      currentView,
      setCurrentView,
      authSection,
      setAuthSection,
      activeNav,
      setActiveNav,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      darkMode,
      calendarBar,
      applyDarkMode,
      applyCalendarBar,
      showTutorial,
      setShowTutorial,
      finishTutorial,
      viewDate,
      prevMonth,
      nextMonth,
      currentMonthLabel,
      categories,
      creditExpenses,
      debitTransactions,
      installments,
      userSettings,
      setUserSettings,
      currentCardId,
      setCurrentCardId,
      activeModal,
      setActiveModal,
      editingCreditId, setEditingCreditId,
      editingDebitId, setEditingDebitId,
      editingInstId, setEditingInstId,
      editingCatId, setEditingCatId,
      creditFilterCat, setCreditFilterCat,
      creditSort, setCreditSort,
      creditPage, setCreditPage,
      instFilterCat, setInstFilterCat,
      instSort, setInstSort,
      instPage, setInstPage,
      debitFilterCat, setDebitFilterCat,
      debitSort, setDebitSort,
      debitPage, setDebitPage,
      handleLogin,
      handleRegister,
      handleLogout,
      handleSaveCreditExpense,
      handleDeleteCreditExpense,
      handleSaveDebitTransaction,
      handleDeleteDebitTransaction,
      handleSaveInstallment,
      handleDeleteInstallment,
      handleSaveCategory,
      handleDeleteCategory,
      handleUpdateName,
      handleUpdateEmail,
      handleUpdatePassword,
      handleDeleteAccount
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
