import React from 'react';

export function LandingPage({ onOpenApp }) {
  return (
    <div className="dark-theme">
      {/* NAVBAR PÚBLICA FINTECH */}
      <nav className="landing-nav" id="main-nav">
        <a href="#hero" className="landing-nav__logo">
          <img src="/assets/logo_main.png" alt="G-Tech Planner Logo" className="landing-nav__logo-img" />
          <div className="landing-nav__logo-text">G-TECH <span>PLANNER</span></div>
        </a>
        <div className="landing-nav__links">
          <a href="#features" className="landing-nav__link">Recursos</a>
          <a href="#como-funciona" className="landing-nav__link">Como Funciona</a>
          <a href="#planos" className="landing-nav__link">Planos</a>
          <button onClick={onOpenApp} className="btn btn--ghost btn-login-ghost">Entrar</button>
          <button onClick={onOpenApp} className="btn btn--emerald cta-btn-auth">
            <i className="fa-solid fa-bolt"></i> Começar Grátis
          </button>
        </div>
      </nav>

      {/* SEÇÃO HERO */}
      <header className="hero" id="hero">
        <div className="hero__mesh-bg"></div>
        <div className="hero__glow-sphere"></div>

        {/* Chips de Métricas Financeiras em Glassmorphism */}
        <div className="hero__floating-chip hero__floating-chip--1">
          <div className="floating-chip__icon floating-chip__icon--purple">
            <i className="fa-solid fa-credit-card"></i>
          </div>
          <div className="floating-chip__content">
            <span className="floating-chip__label">Fatura Nubank Roxinho</span>
            <span className="floating-chip__val">R$ 1.840,50 <small>Virada dia 15</small></span>
          </div>
        </div>

        <div className="hero__floating-chip hero__floating-chip--2">
          <div className="floating-chip__icon floating-chip__icon--emerald">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div className="floating-chip__content">
            <span className="floating-chip__label">IA Financial Copilot</span>
            <span className="floating-chip__val">Economia de +R$ 350 este mês! 🟢</span>
          </div>
        </div>

        <div className="hero__floating-chip hero__floating-chip--3">
          <div className="floating-chip__icon floating-chip__icon--cyan">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div className="floating-chip__content">
            <span className="floating-chip__label">Meta Lazer &amp; Viagens</span>
            <span className="floating-chip__val">68% atingido <small>No limite seguro</small></span>
          </div>
        </div>

        <div className="hero__container">
          <div className="hero__content">
            <div className="hero__badge">
              <span className="hero__badge-pulse"></span>
              ⚡ INTELIGÊNCIA FINANCEIRA DE ELITE (REACT SPA)
            </div>
            <h1 className="hero__title">
              Controle suas finanças com <span className="hero__title-gradient">Precisão Fintech &amp; IA</span>
            </h1>
            <p className="hero__desc">
              Monitore faturas de múltiplos cartões com viradas de ciclo automáticas, projete parcelamentos futuros sem surpresas e tome decisões orientadas por Inteligência Artificial.
            </p>
            
            <div className="hero__actions">
              <button onClick={onOpenApp} className="btn btn--emerald btn--lg cta-btn-auth">
                <i className="fa-solid fa-rocket"></i> Abrir Painel React
              </button>
              <a href="#features" className="btn btn--outline-glass btn--lg">
                Explorar Recursos <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <div className="hero__trial-badge">
              <i className="fa-solid fa-shield-halved"></i> Versão Beta 100% Gratuita • Sem cartão de crédito
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__mockup-wrapper">
              <div className="hero__mockup-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="mockup-title">G-Tech Planner Dashboard (React v18)</span>
              </div>
              <img src="/assets/financial_dashboard_preview.png" alt="G-Tech Planner Dashboard Preview" className="hero__illustration" />
            </div>
          </div>
        </div>
      </header>

      {/* METRICS TICKER / SOCIAL PROOF */}
      <section className="social-proof">
        <div className="social-proof__container">
          <div className="proof-stat">
            <div className="proof-stat__value">100%</div>
            <div className="proof-stat__label">Privado &amp; Criptografado</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">3x</div>
            <div className="proof-stat__label">Mais Previsibilidade de Faturas</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">0</div>
            <div className="proof-stat__label">Burocracia de Cadastro</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">24/7</div>
            <div className="proof-stat__label">Assistente IA Integrado</div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE RECURSOS (BENTO GRID) */}
      <section className="features" id="features">
        <div className="features__container">
          <div className="features__header">
            <span className="features__subtitle">Engenharia Financeira de Elite</span>
            <h2 className="features__title">Tudo o que você precisa para dominar seu orçamento</h2>
            <p className="features__desc">Uma arquitetura reativa moderna criada para eliminar o caos das faturas de cartão, parcelamentos longos e despesas descontroladas.</p>
          </div>

          <div className="bento-grid">
            {/* Bento Card 1: AI Assistant */}
            <div className="bento-card bento-card--featured">
              <div className="bento-card__badge"><i className="fa-solid fa-sparkles"></i> Destaque Inteligente</div>
              <div className="bento-card__icon bento-card__icon--emerald">
                <i className="fa-solid fa-robot"></i>
              </div>
              <h3 className="bento-card__title">Assistente Virtual com IA em Tempo Real</h3>
              <p className="bento-card__desc">
                Converse com seu copilot financeiro diretamente no app. Faça perguntas sobre saldo e faturas e receba diagnósticos instantâneos.
              </p>
              <div className="bento-card__ai-preview">
                <div className="ai-msg ai-msg--user">
                  <i className="fa-solid fa-user"></i> Quanto já comprometi para a fatura do mês que vem?
                </div>
                <div className="ai-msg ai-msg--bot">
                  <i className="fa-solid fa-robot"></i> <strong>Assistente G-Tech:</strong> Sua próxima fatura tem <strong>R$ 1.250,00</strong> confirmados, sendo R$ 850 em 3 compras parceladas.
                </div>
              </div>
            </div>

            {/* Bento Card 2: Múltiplos Cartões */}
            <div className="bento-card">
              <div className="bento-card__icon bento-card__icon--cyan">
                <i className="fa-regular fa-credit-card"></i>
              </div>
              <h3 className="bento-card__title">Virada de Ciclo de Cartões</h3>
              <p className="bento-card__desc">
                Configure as datas de fechamento e vencimento de cada cartão. O app direciona cada nova compra para a fatura correta.
              </p>
              <div className="bento-card__chips-preview">
                <span className="chip-card chip-card--violet">💜 Nubank (Fech. 15)</span>
                <span className="chip-card chip-card--orange">🧡 Itaú (Fech. 22)</span>
                <span className="chip-card chip-card--teal">💚 Inter (Fech. 05)</span>
              </div>
            </div>

            {/* Bento Card 3: Despesas Parceladas */}
            <div className="bento-card">
              <div className="bento-card__icon bento-card__icon--purple">
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <h3 className="bento-card__title">Projeção de Parcelamentos</h3>
              <p className="bento-card__desc">
                Veja claramente os impactos das compras parceladas em 6x, 12x ou 24x nos meses futuros.
              </p>
              <div className="bento-card__progress-demo">
                <div className="demo-bar-label"><span>MacBook Pro (10x)</span> <span>3/10 completas</span></div>
                <div className="demo-bar"><div className="demo-bar-fill" style={{ width: '30%' }}></div></div>
              </div>
            </div>

            {/* Bento Card 4: Metas por Categoria */}
            <div className="bento-card">
              <div className="bento-card__icon bento-card__icon--amber">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 className="bento-card__title">Metas de Gastos por Categoria</h3>
              <p className="bento-card__desc">
                Estipule tetos mensais para Alimentação, Lazer e Transporte. Acompanhe visualmente com barras de status em tempo real.
              </p>
            </div>

            {/* Bento Card 5: Fluxo de Caixa Pix */}
            <div className="bento-card">
              <div className="bento-card__icon bento-card__icon--emerald">
                <i className="fa-solid fa-building-columns"></i>
              </div>
              <h3 className="bento-card__title">Fluxo de Caixa Pix &amp; Débito</h3>
              <p className="bento-card__desc">
                Monitore rendimentos, saldos em conta-corrente e movimentações imediatas com atualização de saldo disponível.
              </p>
            </div>

            {/* Bento Card 6: Extrato Unificado */}
            <div className="bento-card">
              <div className="bento-card__icon bento-card__icon--rose">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <h3 className="bento-card__title">Extratos Unificados e Filtros</h3>
              <p className="bento-card__desc">
                Visualização completa de todas as suas entradas e saídas em um extrato limpo com filtros rápidos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="landing-footer__logo">
            <img src="/assets/logo_main.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
            <span>G-TECH PLANNER REACT</span>
          </div>
          <p>&copy; 2026 G-TECH PLANNER. Aplicação React SPA integrada com Supabase Cloud.</p>
        </div>
      </footer>
    </div>
  );
}
