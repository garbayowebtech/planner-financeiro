import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Bot, User, Send, X, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export function AIChatDrawer({ isOpen, onClose }) {
  const { currentCard, cardInvoiceTotal, totalBalance, creditExpenses, installments } = useFinance();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Olá! Sou o seu Assistente de Inteligência Financeira G-Tech. Como posso te ajudar a economizar ou analisar seu orçamento hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    const prompt = input.toLowerCase();
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let botResponse = "";

      if (prompt.includes('fatura') || prompt.includes('cartao') || prompt.includes('cartão')) {
        botResponse = `Sua fatura atual do ${currentCard.name} está em R$ ${cardInvoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. A virada do ciclo ocorre no dia ${currentCard.closingDay} e o vencimento é dia ${currentCard.dueDay}.`;
      } else if (prompt.includes('saldo') || prompt.includes('conta') || prompt.includes('pix')) {
        botResponse = `Seu saldo em conta corrente/Pix atualmente é de R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      } else if (prompt.includes('parcela') || prompt.includes('parcelamento')) {
        botResponse = `Você possui ${installments.length} compras parceladas ativas. Recomendamos evitar novos parcelamentos longos este mês para manter o fluxo saudável.`;
      } else if (prompt.includes('economizar') || prompt.includes('dica') || prompt.includes('meta')) {
        botResponse = `💡 Dica de Ouro: Você pode economizar até 15% redirecionando pequenas compras do crédito para o Pix à vista sempre que houver desconto!`;
      } else {
        botResponse = `Analisei seu perfil financeiro: seu saldo disponível é R$ ${totalBalance.toFixed(2)} e sua fatura total em ${currentCard.name} é R$ ${cardInvoiceTotal.toFixed(2)}. Posso ajudar a simular o parcelamento de uma compra ou estipular uma meta de gastos!`;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        backgroundColor: '#0E1320',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>IA Financial Copilot</h3>
              <span style={{ fontSize: '0.75rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Integrado ao seu Orçamento
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <button onClick={() => setInput('Qual minha fatura atual?')} style={chipStyle}>
            💳 Qual minha fatura?
          </button>
          <button onClick={() => setInput('Qual meu saldo em conta?')} style={chipStyle}>
            💰 Meu saldo
          </button>
          <button onClick={() => setInput('Como economizar este mês?')} style={chipStyle}>
            💡 Dicas para economizar
          </button>
        </div>

        {/* Message Area */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((m) => (
            <div key={m.id} style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              {m.sender === 'bot' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={16} />
                </div>
              )}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: m.sender === 'user' ? '#10B981' : 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                border: m.sender === 'bot' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
              }}>
                {m.text}
              </div>
              {m.sender === 'user' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#38BDF8',
                  color: '#060911',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} className="animate-spin" /> Digitando resposta da IA...
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre faturas, saldo ou economias..."
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '99px',
              padding: '0.65rem 1.25rem',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button type="submit" style={{
            backgroundColor: '#10B981',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

const chipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '99px',
  color: '#94A3B8',
  padding: '4px 12px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
