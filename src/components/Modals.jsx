import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function Modals() {
  const {
    activeModal,
    setActiveModal,
    categories,
    userSettings,
    setUserSettings,
    creditExpenses,
    debitTransactions,
    installments,
    editingCreditId,
    setEditingCreditId,
    editingDebitId,
    setEditingDebitId,
    editingInstId,
    setEditingInstId,
    handleSaveCreditExpense,
    handleSaveDebitTransaction,
    handleSaveInstallment
  } = useApp();

  // Form local states
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCat, setExpCat] = useState('');

  const [debName, setDebName] = useState('');
  const [debAmount, setDebAmount] = useState('');
  const [debDate, setDebDate] = useState(new Date().toISOString().split('T')[0]);
  const [debCat, setDebCat] = useState('');

  const [incName, setIncName] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incCat, setIncCat] = useState('');

  const [instValueType, setInstValueType] = useState('installment'); // 'installment' | 'total'
  const [instName, setInstName] = useState('');
  const [instAmount, setInstAmount] = useState('');
  const [instTotal, setInstTotal] = useState(12);
  const [instCurrent, setInstCurrent] = useState(1);
  const [instDate, setInstDate] = useState(new Date().toISOString().split('T')[0]);
  const [instCat, setInstCat] = useState('');

  const [cardName, setCardName] = useState('');
  const [cardClosing, setCardClosing] = useState(11);
  const [cardDue, setCardDue] = useState(18);

  // Pre-fill fields when entering Edit Mode
  useEffect(() => {
    if (activeModal === 'credit') {
      if (editingCreditId) {
        const item = creditExpenses.find(e => e.id === editingCreditId);
        if (item) {
          setExpName(item.name || '');
          setExpAmount(item.amount || '');
          setExpDate(item.date || new Date().toISOString().split('T')[0]);
          setExpCat(item.categoryId || '');
        }
      } else {
        setExpName('');
        setExpAmount('');
        setExpDate(new Date().toISOString().split('T')[0]);
        setExpCat('');
      }
    }
  }, [activeModal, editingCreditId, creditExpenses]);

  useEffect(() => {
    if (activeModal === 'debit') {
      if (editingDebitId) {
        const item = debitTransactions.find(t => t.id === editingDebitId && t.type !== 'income');
        if (item) {
          setDebName(item.name || '');
          setDebAmount(item.amount || '');
          setDebDate(item.date || new Date().toISOString().split('T')[0]);
          setDebCat(item.categoryId || '');
        }
      } else {
        setDebName('');
        setDebAmount('');
        setDebDate(new Date().toISOString().split('T')[0]);
        setDebCat('');
      }
    }
  }, [activeModal, editingDebitId, debitTransactions]);

  useEffect(() => {
    if (activeModal === 'income') {
      if (editingDebitId) {
        const item = debitTransactions.find(t => t.id === editingDebitId && t.type === 'income');
        if (item) {
          setIncName(item.name || '');
          setIncAmount(item.amount || '');
          setIncDate(item.date || new Date().toISOString().split('T')[0]);
          setIncCat(item.categoryId || '');
        }
      } else {
        setIncName('');
        setIncAmount('');
        setIncDate(new Date().toISOString().split('T')[0]);
        setIncCat('');
      }
    }
  }, [activeModal, editingDebitId, debitTransactions]);

  useEffect(() => {
    if (activeModal === 'installment') {
      setInstValueType('installment');
      if (editingInstId) {
        const item = installments.find(i => i.id === editingInstId);
        if (item) {
          setInstName(item.name || '');
          setInstAmount(item.installmentAmount || '');
          setInstTotal(item.totalInstallments || 12);
          setInstCurrent(item.currentInstallment || 1);
          setInstDate(item.date || new Date().toISOString().split('T')[0]);
          setInstCat(item.categoryId || '');
        }
      } else {
        setInstName('');
        setInstAmount('');
        setInstTotal(12);
        setInstCurrent(1);
        setInstDate(new Date().toISOString().split('T')[0]);
        setInstCat('');
      }
    }
  }, [activeModal, editingInstId, installments]);

  const closeModal = () => {
    setActiveModal(null);
    setEditingCreditId(null);
    setEditingDebitId(null);
    setEditingInstId(null);
  };

  const onSubmitExpense = (e) => {
    e.preventDefault();
    if (!expName || !expAmount) return;
    handleSaveCreditExpense({
      name: expName,
      amount: parseFloat(expAmount),
      date: expDate,
      categoryId: expCat || categories[0]?.id
    });
    closeModal();
  };

  const onSubmitDebit = (e) => {
    e.preventDefault();
    if (!debName || !debAmount) return;
    handleSaveDebitTransaction({
      name: debName,
      amount: parseFloat(debAmount),
      date: debDate,
      type: 'expense',
      categoryId: debCat || categories[0]?.id
    });
    closeModal();
  };

  const onSubmitIncome = (e) => {
    e.preventDefault();
    if (!incName || !incAmount) return;
    handleSaveDebitTransaction({
      name: incName,
      amount: parseFloat(incAmount),
      date: incDate,
      type: 'income',
      categoryId: incCat || categories[0]?.id
    });
    closeModal();
  };

  const onSubmitInstallment = (e) => {
    e.preventDefault();
    if (!instName || !instAmount) return;
    
    let finalInstallmentVal = parseFloat(instAmount);
    if (instValueType === 'total') {
      const totInst = parseInt(instTotal) || 1;
      finalInstallmentVal = Math.round((finalInstallmentVal / totInst) * 100) / 100;
    }

    handleSaveInstallment({
      name: instName,
      installmentAmount: finalInstallmentVal,
      totalInstallments: parseInt(instTotal),
      currentInstallment: parseInt(instCurrent) || 1,
      date: instDate,
      categoryId: instCat || categories[0]?.id
    });
    closeModal();
  };

  const onSubmitNewCard = (e) => {
    e.preventDefault();
    if (!cardName) return;
    const newCard = {
      id: `card_${Date.now()}`,
      name: cardName,
      closingDay: parseInt(cardClosing) || 11,
      dueDay: parseInt(cardDue) || 18,
      color: '#4F46E5'
    };
    setUserSettings(prev => ({
      ...prev,
      cards: [...(prev.cards || []), newCard]
    }));
    setCardName('');
    closeModal();
  };

  if (!activeModal) return null;

  return (
    <>
      {/* EXPENSE MODAL */}
      {activeModal === 'credit' && (
        <div id="expense-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCreditId ? 'Editar Despesa de Crédito' : 'Nova Despesa de Crédito'}</h3>
              <button className="btn-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form id="expense-form" className="modal-body" onSubmit={onSubmitExpense}>
              <div className="form-group">
                <label htmlFor="exp-name">Descrição</label>
                <input type="text" id="exp-name" required placeholder="Ex: Supermercado" value={expName} onChange={e => setExpName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exp-amount">Valor (R$)</label>
                <input type="number" id="exp-amount" required step="0.01" min="0.01" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exp-date">Data da Despesa</label>
                <input type="date" id="exp-date" required value={expDate} onChange={e => setExpDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exp-category">Categoria</label>
                <select id="exp-category" required className="form-select" value={expCat} onChange={e => setExpCat(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.filter(c => (c.type || 'expense') === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-text" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingCreditId ? 'Salvar Alterações' : 'Salvar Despesa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTALLMENT MODAL */}
      {activeModal === 'installment' && (
        <div id="installment-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingInstId ? 'Editar Compra Parcelada' : 'Nova Compra Parcelada'}</h3>
              <button className="btn-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form id="installment-form" className="modal-body" onSubmit={onSubmitInstallment}>
              <div className="form-group">
                <label>Informar valor por:</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="inst-value-type"
                      value="installment"
                      checked={instValueType === 'installment'}
                      onChange={() => setInstValueType('installment')}
                    />
                    Valor da Parcela
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="inst-value-type"
                      value="total"
                      checked={instValueType === 'total'}
                      onChange={() => setInstValueType('total')}
                    />
                    Valor Total da Compra
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inst-name">Descrição</label>
                <input type="text" id="inst-name" required placeholder="Ex: TV Samsung" value={instName} onChange={e => setInstName(e.target.value)} />
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="inst-amount">
                    {instValueType === 'total' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)'}
                  </label>
                  <input type="number" id="inst-amount" required step="0.01" min="0.01" placeholder="0.00" value={instAmount} onChange={e => setInstAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="inst-total">Total de Parcelas</label>
                  <input type="number" id="inst-total" required min="1" max="99" placeholder="Ex: 12" value={instTotal} onChange={e => setInstTotal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="inst-current">Parcela Atual</label>
                  <input type="number" id="inst-current" min="1" max="99" placeholder="1" value={instCurrent} onChange={e => setInstCurrent(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="inst-date">Data da Compra</label>
                <input type="date" id="inst-date" required value={instDate} onChange={e => setInstDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="inst-category">Categoria</label>
                <select id="inst-category" required className="form-select" value={instCat} onChange={e => setInstCat(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.filter(c => (c.type || 'expense') === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-text" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingInstId ? 'Salvar Alterações' : 'Salvar Compra'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEBIT MODAL */}
      {activeModal === 'debit' && (
        <div id="debit-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingDebitId ? 'Editar Despesa Conta-corrente' : 'Nova Despesa Conta-corrente'}</h3>
              <button className="btn-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form id="debit-form" className="modal-body" onSubmit={onSubmitDebit}>
              <div className="form-group">
                <label htmlFor="deb-name">Descrição</label>
                <input type="text" id="deb-name" required placeholder="Ex: Conta de Luz" value={debName} onChange={e => setDebName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="deb-amount">Valor (R$)</label>
                <input type="number" id="deb-amount" required step="0.01" min="0.01" placeholder="0.00" value={debAmount} onChange={e => setDebAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="deb-date">Data da Transação</label>
                <input type="date" id="deb-date" required value={debDate} onChange={e => setDebDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="deb-category">Categoria</label>
                <select id="deb-category" required className="form-select" value={debCat} onChange={e => setDebCat(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.filter(c => (c.type || 'expense') === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-text" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingDebitId ? 'Salvar Alterações' : 'Salvar Transação'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCOME MODAL */}
      {activeModal === 'income' && (
        <div id="income-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingDebitId ? 'Editar Rendimento' : 'Novo Rendimento (Apenas Receitas)'}</h3>
              <button className="btn-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form id="income-form" className="modal-body" onSubmit={onSubmitIncome}>
              <div className="form-group">
                <label htmlFor="inc-name">Descrição</label>
                <input type="text" id="inc-name" required placeholder="Ex: Salário, Aluguel" value={incName} onChange={e => setIncName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="inc-amount">Valor (R$)</label>
                <input type="number" id="inc-amount" required step="0.01" min="0.01" placeholder="0.00" value={incAmount} onChange={e => setIncAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="inc-date">Data do Rendimento</label>
                <input type="date" id="inc-date" required value={incDate} onChange={e => setIncDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="inc-category">Categoria (Opcional)</label>
                <select id="inc-category" className="form-select" value={incCat} onChange={e => setIncCat(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.filter(c => (c.type || 'expense') === 'income').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-text" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--c-success)' }}>
                  {editingDebitId ? 'Salvar Alterações' : 'Salvar Rendimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARD SETTINGS MODAL */}
      {activeModal === 'card-settings' && (
        <div id="card-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Adicionar Novo Cartão</h3>
              <button className="btn-close" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <form id="card-form" onSubmit={onSubmitNewCard}>
                <div className="form-group">
                  <label htmlFor="card-name">Nome do Cartão</label>
                  <input type="text" id="card-name" placeholder="Ex: Nubank, Itaú..." required value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="card-closing">Dia de Fechamento</label>
                    <input type="number" id="card-closing" min="1" max="31" required value={cardClosing} onChange={e => setCardClosing(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="card-due">Dia de Vencimento</label>
                    <input type="number" id="card-due" min="1" max="31" required value={cardDue} onChange={e => setCardDue(e.target.value)} />
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-text" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Adicionar Cartão</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
