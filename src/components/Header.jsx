import React from 'react';
import { useApp } from '../context/AppContext';

export function Header() {
  const { activeNav, prevMonth, nextMonth, currentMonthLabel, darkMode, applyDarkMode, mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  const getPageTitle = () => {
    switch (activeNav) {
      case 'dashboard': return 'Visão Geral das Finanças';
      case 'credit': return 'Demonstrativo de Cartões';
      case 'debit': return 'Movimentações de Conta-corrente & Pix';
      case 'consolidated-extracts': return 'Extratos Consolidados de Gastos';
      case 'categories': return 'Gestão de Categorias e Orçamentos';
      case 'ai-assistant': return 'Assistente Virtual de Inteligência Artificial';
      case 'settings': return 'Configurações de Cartões e Perfil';
      default: return 'G-TECH PLANNER';
    }
  };

  const toggleDarkMode = () => {
    applyDarkMode(!darkMode);
  };

  return (
    <header className="top-header" style={{ justifyContent: 'flex-start', gap: '1rem', position: 'relative' }}>
      <button className="btn-hamburger" id="btn-hamburger" aria-label="Menu" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
        <i className="fa-solid fa-bars"></i>
      </button>
      <h1 id="page-title">{getPageTitle()}</h1>

      <div
        id="month-navigation"
        className="month-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--c-bg-card)',
          padding: '0.4rem 1rem',
          borderRadius: '99px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--c-border)',
          zIndex: 5
        }}
      >
        <button id="btn-prev-month" className="btn-icon" title="Mês Anterior" style={{ fontSize: '1.2rem' }} onClick={prevMonth}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <span id="label-current-month" style={{ fontWeight: 700, fontSize: '1.2rem', minWidth: '150px', textAlign: 'center', color: 'var(--c-primary)' }}>
          {currentMonthLabel}
        </span>
        <button id="btn-next-month" className="btn-icon" title="Próximo Mês" style={{ fontSize: '1.2rem' }} onClick={nextMonth}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <button id="btn-header-darkmode" className="btn-icon" style={{ marginLeft: 'auto' }} title="Alternar Tema Escuro" onClick={toggleDarkMode}>
        <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
      </button>
    </header>
  );
}
