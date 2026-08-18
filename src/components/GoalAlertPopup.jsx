import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const formatCurrency = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export function GoalAlertPopup() {
  const {
    categories,
    creditExpenses,
    debitTransactions,
    installments,
    userSettings,
    setUserSettings,
    cards
  } = useApp();

  const [dismissedOnce, setDismissedOnce] = useState(false);

  if (dismissedOnce) return null;

  const now = new Date();
  const monthKey = `${now.getFullYear()}_${now.getMonth()}`;

  // Check if dismissed for current month in userSettings
  if (userSettings?.goalAlertDismissed === monthKey) return null;

  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const catSpent = {};
  (categories || []).forEach(cat => { catSpent[cat.id] = 0; });

  (creditExpenses || []).forEach(exp => {
    if (!exp.dueDate) return;
    const p = exp.dueDate.split('-');
    if (parseInt(p[0]) === curYear && parseInt(p[1]) - 1 === curMonth && catSpent[exp.categoryId] !== undefined) {
      catSpent[exp.categoryId] += exp.amount;
    }
  });

  (debitTransactions || []).forEach(txn => {
    if (txn.type === 'income') return;
    const p = txn.date.split('-');
    if (parseInt(p[0]) === curYear && parseInt(p[1]) - 1 === curMonth && catSpent[txn.categoryId] !== undefined) {
      catSpent[txn.categoryId] += txn.amount;
    }
  });

  (installments || []).forEach(inst => {
    const p = inst.date.split('-');
    const py = parseInt(p[0]), pm = parseInt(p[1]) - 1;
    const card = (cards || []).find(c => c.id === (inst.cardId || 'card1'));
    const closing = card?.closingDay || 11;
    const day = parseInt(inst.date.split('-')[2]);
    const offset = day >= closing ? 1 : 0;
    const diff = (curYear - py) * 12 + (curMonth - pm) - offset;
    const proj = inst.currentInstallment + diff;
    if (proj >= 1 && proj <= inst.totalInstallments && catSpent[inst.categoryId] !== undefined) {
      catSpent[inst.categoryId] += inst.installmentAmount;
    }
  });

  const exceeded = [];
  (categories || []).forEach(cat => {
    const goal = cat.goal || 0;
    const spent = catSpent[cat.id] || 0;
    if (goal > 0 && spent >= goal) {
      exceeded.push({ cat, spent, goal, over: spent > goal });
    }
  });

  if (exceeded.length === 0) return null;

  const handleDismissMonth = () => {
    setUserSettings(prev => ({
      ...prev,
      goalAlertDismissed: monthKey
    }));
    setDismissedOnce(true);
  };

  return (
    <div className="goal-alert-popup" id="goal-alert-popup">
      <div className="goal-alert-header">
        <i className="fa-solid fa-triangle-exclamation goal-alert-icon"></i>
        <strong>Aviso de Limite de Metas</strong>
        <button className="goal-alert-close" title="Fechar" onClick={() => setDismissedOnce(true)}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <p className="goal-alert-msg">
        Atenção: Você atingiu ou ultrapassou a meta cadastrada nas seguintes categorias neste mês:
      </p>

      <ul className="goal-alert-list" id="goal-alert-list">
        {exceeded.map(({ cat, spent, goal, over }) => {
          const pct = ((spent / goal) * 100).toFixed(0);
          return (
            <li key={cat.id} className={over ? 'exceeded' : 'reached'}>
              {over ? <i className="fa-solid fa-circle-exclamation"></i> : <i className="fa-solid fa-circle-check"></i>}
              <span style={{ flex: 1 }}>{cat.name}</span>
              <span>{formatCurrency(spent)} / {formatCurrency(goal)} ({pct}%)</span>
            </li>
          );
        })}
      </ul>

      <div className="goal-alert-actions">
        <button type="button" className="btn btn-text" onClick={handleDismissMonth}>
          Não mostrar mais este mês
        </button>
      </div>
    </div>
  );
}
