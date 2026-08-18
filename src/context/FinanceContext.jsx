import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DB } from '../services/supabaseClient';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [creditExpenses, setCreditExpenses] = useState([]);
  const [debitTransactions, setDebitTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [cards, setCards] = useState([
    { id: 'card1', name: 'Nubank Violeta', closingDay: 15, dueDay: 22, color: '#820ad1' },
    { id: 'card2', name: 'Itaú Personalité', closingDay: 20, dueDay: 27, color: '#ff6200' },
    { id: 'card3', name: 'Banco Inter', closingDay: 5, dueDay: 12, color: '#ff7a00' }
  ]);
  const [selectedCardId, setSelectedCardId] = useState('card1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCategories([]);
      setCreditExpenses([]);
      setDebitTransactions([]);
      setInstallments([]);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cats, credits, debits, insts] = await Promise.all([
        DB.getCategories(user.id),
        DB.getCreditExpenses(user.id),
        DB.getDebitTransactions(user.id),
        DB.getInstallments(user.id)
      ]);
      setCategories(cats);
      setCreditExpenses(credits);
      setDebitTransactions(debits);
      setInstallments(insts);
    } catch (err) {
      console.error("Error loading financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const currentCard = useMemo(() => {
    return cards.find(c => c.id === selectedCardId) || cards[0];
  }, [cards, selectedCardId]);

  const totalBalance = useMemo(() => {
    const income = debitTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = debitTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return income - expense;
  }, [debitTransactions]);

  const cardInvoiceTotal = useMemo(() => {
    const cardCredits = creditExpenses.filter(e => e.cardId === selectedCardId);
    const cardInsts = installments.filter(i => i.cardId === selectedCardId);
    const creditTotal = cardCredits.reduce((acc, e) => acc + e.amount, 0);
    const instTotal = cardInsts.reduce((acc, i) => acc + i.installmentAmount, 0);
    return creditTotal + instTotal;
  }, [creditExpenses, installments, selectedCardId]);

  const addCreditExpense = async (exp) => {
    if (!user) return;
    const created = await DB.createCreditExpense(user.id, { ...exp, cardId: selectedCardId });
    setCreditExpenses(prev => [...prev, created]);
  };

  const addDebitTransaction = async (txn) => {
    if (!user) return;
    const created = await DB.createDebitTransaction(user.id, txn);
    setDebitTransactions(prev => [...prev, created]);
  };

  const addInstallment = async (inst) => {
    if (!user) return;
    const created = await DB.createInstallment(user.id, { ...inst, cardId: selectedCardId });
    setInstallments(prev => [...prev, created]);
  };

  const addCategory = async (cat) => {
    if (!user) return;
    const created = await DB.createCategory(user.id, cat);
    setCategories(prev => [...prev, created]);
  };

  const deleteCreditExpense = async (id) => {
    await DB.deleteCreditExpense(id);
    setCreditExpenses(prev => prev.filter(e => e.id !== id));
  };

  const deleteDebitTransaction = async (id) => {
    await DB.deleteDebitTransaction(id);
    setDebitTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteInstallment = async (id) => {
    await DB.deleteInstallment(id);
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  return (
    <FinanceContext.Provider value={{
      categories,
      creditExpenses,
      debitTransactions,
      installments,
      cards,
      selectedCardId,
      setSelectedCardId,
      currentCard,
      totalBalance,
      cardInvoiceTotal,
      loading,
      refreshData: loadData,
      addCreditExpense,
      addDebitTransaction,
      addInstallment,
      addCategory,
      deleteCreditExpense,
      deleteDebitTransaction,
      deleteInstallment
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
