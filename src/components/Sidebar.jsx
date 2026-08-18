import React from 'react';
import { useApp } from '../context/AppContext';
import logoMain from '../assets/logo_main.png';

export function Sidebar() {
  const { activeNav, setActiveNav, currentUser, profile, handleLogout, mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  const userName = profile?.name || currentUser?.user_metadata?.name || 'Usuário';

  const handleNavClick = (navId) => {
    if (activeNav === 'dashboard' && navId === 'credit') {
      const el = document.getElementById('section-credit');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
        return;
      }
    }
    if (activeNav === 'dashboard' && navId === 'debit') {
      const el = document.getElementById('section-debit');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
        return;
      }
    }
    if (activeNav === 'dashboard' && navId === 'dashboard') {
      const contentEl = document.querySelector('.content-scroll');
      if (contentEl) {
        contentEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
      return;
    }

    setActiveNav(navId);
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  return (
    <>
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <img src={logoMain} alt="G-TECH PLANNER Logo" className="sidebar-logo" style={{ height: '100px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>
        
        <div className="user-profile">
          <div className="avatar-wrapper" title="Alterar foto de perfil">
            <div className="avatar" id="app-user-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="avatar-overlay">
              <i className="fa-solid fa-camera"></i>
            </div>
          </div>
          <div className="user-info">
            <span className="greeting" id="greeting-text">Olá,</span>
            <strong id="app-user-name">{userName}</strong>
          </div>
        </div>

        <nav className="main-nav">
          <a href="#dashboard" className={activeNav === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}>
            <i className="fa-solid fa-chart-pie"></i> Visão Geral
          </a>
          <a href="#credit" className={activeNav === 'credit' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('credit'); }}>
            <i className="fa-regular fa-credit-card"></i> Cartão de Crédito
          </a>
          <a href="#debit" className={activeNav === 'debit' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('debit'); }}>
            <i className="fa-solid fa-building-columns"></i> Conta-corrente
          </a>
          <a href="#consolidated-extracts" className={activeNav === 'consolidated-extracts' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('consolidated-extracts'); }}>
            <i className="fa-solid fa-file-invoice-dollar"></i> Extratos Consolidados
          </a>
          <a href="#categories" className={activeNav === 'categories' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('categories'); }}>
            <i className="fa-solid fa-tags"></i> Categorias
          </a>
          <a href="#ai-assistant" id="nav-ai-assistant" className={activeNav === 'ai-assistant' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('ai-assistant'); }}>
            <span className="nav-content"><i className="fa-solid fa-robot"></i> Assistente IA</span>
          </a>
          <a href="#settings" className={activeNav === 'settings' ? 'active' : ''} onClick={(e) => { e.preventDefault(); handleNavClick('settings'); }}>
            <i className="fa-solid fa-gear"></i> Configurações
          </a>
        </nav>

        <div className="sidebar-footer">
          <button id="btn-logout" className="btn-logout" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sair
          </button>
        </div>
      </aside>

      <div className={`sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`} id="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
    </>
  );
}
