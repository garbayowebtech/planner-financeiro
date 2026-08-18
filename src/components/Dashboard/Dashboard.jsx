import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { 
  CreditCard, Wallet, TrendingUp, TrendingDown, Plus, Trash2, Bot, 
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Target, Sparkles, LogOut, CheckCircle2 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AIChatDrawer } from '../AI/AIChatDrawer';

export function Dashboard({ onBackToLanding }) {
  const { user, logout } = useAuth();
  const { 
    categories, creditExpenses, debitTransactions, installments, 
    cards, selectedCardId, setSelectedCardId, currentCard, 
    totalBalance, cardInvoiceTotal, addCreditExpense, addDebitTransaction,
    addInstallment, deleteCreditExpense, deleteDebitTransaction, deleteInstallment
  } = useFinance();

  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('credit'); // 'credit', 'debit', 'installments'
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTxnType, setFormTxnType] = useState('expense');
  const [formTotalInst, setFormTotalInst] = useState(6);

  // Chart data
  const pieData = categories.map(cat => {
    const totalExp = creditExpenses
      .filter(e => e.categoryId === cat.id && e.cardId === selectedCardId)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: totalExp, color: cat.color || '#38BDF8' };
  }).filter(item => item.value > 0);

  const defaultPieData = [
    { name: 'Alimentação', value: 450, color: '#10B981' },
    { name: 'Lazer', value: 300, color: '#38BDF8' },
    { name: 'Transporte', value: 220, color: '#F59E0B' },
    { name: 'Saúde', value: 180, color: '#A855F7' }
  ];

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formAmount || isNaN(formAmount)) return;

    const amount = parseFloat(formAmount);
    const categoryId = formCategory || (categories[0]?.id ?? 'default');

    if (activeTab === 'credit') {
      await addCreditExpense({
        name: formName,
        amount,
        date: formDate,
        categoryId,
        cycleStart: formDate,
        cycleEnd: formDate,
        dueDate: formDate
      });
    } else if (activeTab === 'debit') {
      await addDebitTransaction({
        name: formName,
        amount,
        date: formDate,
        categoryId,
        type: formTxnType
      });
    } else if (activeTab === 'installments') {
      await addInstallment({
        name: formName,
        installmentAmount: amount,
        totalInstallments: parseInt(formTotalInst),
        currentInstallment: 1,
        date: formDate,
        categoryId
      });
    }

    setFormName('');
    setFormAmount('');
    setShowAddModal(false);
  };

  return (
    <div style={{ backgroundColor: '#060911', minHeight: '100vh', color: '#F8FAFC', paddingBottom: '3rem' }}>
      {/* APP HEADER */}
      <header style={{
        backgroundColor: '#0E1320',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBackToLanding} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src="/assets/logo_main.png" alt="Logo" style={{ height: '36px' }} />
          </button>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}>
            G-TECH <span style={{ color: '#34D399' }}>PLANNER REACT</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsAIChatOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              padding: '0.5rem 1rem',
              borderRadius: '99px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Bot size={16} /> IA Copilot Chat
          </button>

          {user && (
            <button 
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '0.5rem 1rem',
                borderRadius: '99px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <LogOut size={16} /> Sair
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1240px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* CARDS SELECTOR & SUMMARY TOP ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Card Selector Widget */}
          <div style={cardBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Cartão de Crédito Ativo</span>
              <CreditCard size={20} color="#34D399" />
            </div>
            
            <select 
              value={selectedCardId} 
              onChange={(e) => setSelectedCardId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                outline: 'none',
                marginBottom: '1rem'
              }}
            >
              {cards.map(c => (
                <option key={c.id} value={c.id} style={{ backgroundColor: '#0E1320' }}>{c.name}</option>
              ))}
            </select>

            <div style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Virada do Ciclo: <strong>Dia {currentCard.closingDay}</strong></span>
              <span>Vencimento: <strong>Dia {currentCard.dueDay}</strong></span>
            </div>
          </div>

          {/* Fatura Atual Card */}
          <div style={cardBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Fatura {currentCard.name}</span>
              <TrendingDown size={20} color="#F87171" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans' }}>
              R$ {cardInvoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Fatura Aberta • Cálculo automático
            </div>
          </div>

          {/* Saldo Conta Corrente Card */}
          <div style={cardBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Saldo Conta Corrente / Pix</span>
              <Wallet size={20} color="#38BDF8" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: totalBalance >= 0 ? '#34D399' : '#F87171', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans' }}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Entradas &amp; Saídas consolidadas
            </div>
          </div>

        </div>

        {/* MIDDLE SECTION: CHARTS & TABS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Main Content Area (Tabs & Table) */}
          <div style={cardBoxStyle}>
            
            {/* TAB BUTTONS & ADD ACTION */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setActiveTab('credit')} style={tabBtnStyle(activeTab === 'credit')}>
                  Despesas de Crédito ({creditExpenses.length})
                </button>
                <button onClick={() => setActiveTab('debit')} style={tabBtnStyle(activeTab === 'debit')}>
                  Conta / Pix ({debitTransactions.length})
                </button>
                <button onClick={() => setActiveTab('installments')} style={tabBtnStyle(activeTab === 'installments')}>
                  Parcelamentos ({installments.length})
                </button>
              </div>

              <button 
                onClick={() => setShowAddModal(true)}
                style={{
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '99px',
                  padding: '0.5rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Novo Lançamento
              </button>
            </div>

            {/* TAB CONTENT: CREDIT EXPENSES */}
            {activeTab === 'credit' && (
              <div>
                {creditExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    Nenhuma despesa de crédito cadastrada neste cartão. Clique no botão acima para adicionar.
                  </div>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Descrição</th>
                        <th style={{ padding: '0.75rem' }}>Data</th>
                        <th style={{ padding: '0.75rem' }}>Valor</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditExpenses.map(exp => (
                        <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{exp.name}</td>
                          <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{exp.date}</td>
                          <td style={{ padding: '0.75rem', color: '#F87171', fontWeight: 700 }}>R$ {exp.amount.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button onClick={() => deleteCreditExpense(exp.id)} style={deleteBtnStyle}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEBIT TRANSACTIONS */}
            {activeTab === 'debit' && (
              <div>
                {debitTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    Nenhuma movimentação de conta corrente cadastrada.
                  </div>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Descrição</th>
                        <th style={{ padding: '0.75rem' }}>Tipo</th>
                        <th style={{ padding: '0.75rem' }}>Data</th>
                        <th style={{ padding: '0.75rem' }}>Valor</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debitTransactions.map(txn => (
                        <tr key={txn.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{txn.name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '99px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: txn.type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: txn.type === 'income' ? '#34D399' : '#f87171'
                            }}>
                              {txn.type === 'income' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{txn.date}</td>
                          <td style={{ padding: '0.75rem', color: txn.type === 'income' ? '#34D399' : '#F87171', fontWeight: 700 }}>
                            {txn.type === 'income' ? '+' : '-'} R$ {txn.amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button onClick={() => deleteDebitTransaction(txn.id)} style={deleteBtnStyle}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT: INSTALLMENTS */}
            {activeTab === 'installments' && (
              <div>
                {installments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                    Nenhum parcelamento futuro cadastrado neste cartão.
                  </div>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Compra</th>
                        <th style={{ padding: '0.75rem' }}>Progresso</th>
                        <th style={{ padding: '0.75rem' }}>Valor/Mês</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map(inst => (
                        <tr key={inst.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{inst.name}</td>
                          <td style={{ padding: '0.75rem', color: '#94A3B8' }}>
                            {inst.currentInstallment}/{inst.totalInstallments} parcelas
                          </td>
                          <td style={{ padding: '0.75rem', color: '#F87171', fontWeight: 700 }}>R$ {inst.installmentAmount.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button onClick={() => deleteInstallment(inst.id)} style={deleteBtnStyle}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>

          {/* Right Sidebar Chart Widget */}
          <div style={cardBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <PieIcon size={18} color="#34D399" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Gastos por Categoria</h3>
            </div>

            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : defaultPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(pieData.length > 0 ? pieData : defaultPieData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0E1320', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category legend */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(pieData.length > 0 ? pieData : defaultPieData).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ color: '#94A3B8' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>R$ {item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* MODAL PARA NOVO LANÇAMENTO */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 800 }}>Novo Lançamento ({activeTab})</h3>
            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Descrição</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Supermercado, Aluguel" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Valor (R$)</label>
                <input type="number" step="0.01" required value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
              </div>

              {activeTab === 'debit' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Tipo de Movimentação</label>
                  <select value={formTxnType} onChange={e => setFormTxnType(e.target.value)} style={inputStyle}>
                    <option value="expense" style={{ backgroundColor: '#0E1320' }}>Saída (Despesa / Pix)</option>
                    <option value="income" style={{ backgroundColor: '#0E1320' }}>Entrada (Receita / Salário)</option>
                  </select>
                </div>
              )}

              {activeTab === 'installments' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Total de Parcelas</label>
                  <input type="number" min="2" max="48" value={formTotalInst} onChange={e => setFormTotalInst(e.target.value)} style={inputStyle} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={cancelBtnStyle}>Cancelar</button>
                <button type="submit" style={saveBtnStyle}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IA CHAT DRAWER */}
      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}

const cardBoxStyle = {
  backgroundColor: '#0E1320',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '20px',
  padding: '1.5rem',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
};

const tabBtnStyle = (active) => ({
  backgroundColor: active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
  border: active ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
  color: active ? '#34D399' : '#94A3B8',
  padding: '0.5rem 1rem',
  borderRadius: '99px',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer'
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem'
};

const deleteBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#f87171',
  cursor: 'pointer',
  padding: '4px'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalBoxStyle = {
  backgroundColor: '#0E1320',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '450px',
  padding: '2rem',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#94A3B8',
  marginBottom: '6px',
  fontWeight: 600
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  padding: '0.65rem 1rem',
  color: '#ffffff',
  fontSize: '0.9rem',
  outline: 'none'
};

const cancelBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#94A3B8',
  padding: '0.6rem 1.25rem',
  borderRadius: '99px',
  fontWeight: 600,
  cursor: 'pointer'
};

const saveBtnStyle = {
  backgroundColor: '#10B981',
  border: 'none',
  color: '#ffffff',
  padding: '0.6rem 1.5rem',
  borderRadius: '99px',
  fontWeight: 700,
  cursor: 'pointer'
};
