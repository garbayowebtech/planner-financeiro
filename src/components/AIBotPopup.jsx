import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function AIBotPopup() {
  const { setActiveNav } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('hideAiBotPopupUntil_v2');
    const now = new Date().getTime();

    let shouldShow = true;
    if (dismissedUntil && now < parseInt(dismissedUntil, 10)) {
      shouldShow = false;
    }

    const sessionHidden = sessionStorage.getItem('aiBotPopupHidden_v2');
    if (sessionHidden === 'true') {
      shouldShow = false;
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleCloseSession = () => {
    setVisible(false);
    sessionStorage.setItem('aiBotPopupHidden_v2', 'true');
  };

  const handleDismiss30Days = () => {
    setVisible(false);
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expiryTime = new Date().getTime() + thirtyDaysInMs;
    localStorage.setItem('hideAiBotPopupUntil_v2', expiryTime.toString());
  };

  const handleOpenAI = () => {
    setActiveNav('ai-assistant');
    handleCloseSession();
  };

  return (
    <div className="bot-popup" id="ai-bot-popup">
      <button className="bot-popup-close" id="btn-close-bot-popup" title="Fechar" onClick={handleCloseSession}>
        <i className="fa-solid fa-xmark"></i>
      </button>
      <div className="bot-popup-content">
        <img src="/assets/robot_overlay.png" alt="Assistente IA" className="bot-popup-img" />
        <div className="bot-popup-text">
          <p>
            Olá! Sou o seu <strong>Assistente de IA</strong>. Quer uma análise das suas finanças este mês?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAI} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> Abrir Assistente
            </button>
            <button
              id="btn-bot-popup-dismiss"
              className="btn btn-text btn-sm"
              onClick={handleDismiss30Days}
              style={{ fontSize: '0.72rem', color: 'var(--c-text-muted)', padding: '0.2rem' }}
            >
              Não mostrar por 30 dias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
