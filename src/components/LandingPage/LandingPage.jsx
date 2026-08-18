import React from 'react';
import logoMain from '../../assets/logo_main.png';
import dashboardPreview from '../../assets/financial_dashboard_preview.png';

export function LandingPage({ onOpenApp }) {
  return (
    <div className="dark-theme" style={{ height: '100vh', overflowY: 'auto', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 999, scrollBehavior: 'smooth' }}>
      {/* NAVBAR PÚBLICA FINTECH */}
      <nav className="landing-nav" id="main-nav">
        <a href="#hero" className="landing-nav__logo">
          <img src={logoMain} alt="G-Tech Planner Logo" className="landing-nav__logo-img" />
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
              <img src={dashboardPreview} alt="G-Tech Planner Dashboard Preview" className="hero__illustration" />
            </div>
          </div>
        </div>
      </header>

      {/* METRICS TICKER / SOCIAL PROOF */}
      <section className="social-proof" style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '2.5rem 0' }}>
        <div className="social-proof__container">
          <div className="proof-stat">
            <div className="proof-stat__value">100%</div>
            <div className="proof-stat__label" style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>Privado &amp; Criptografado</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">3x</div>
            <div className="proof-stat__label" style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>Mais Previsibilidade de Faturas</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">0</div>
            <div className="proof-stat__label" style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>Burocracia de Cadastro</div>
          </div>
          <div className="proof-stat">
            <div className="proof-stat__value">24/7</div>
            <div className="proof-stat__label" style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.9rem' }}>Assistente IA Integrado</div>
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

      {/* SEÇÃO COMO FUNCIONA */}
      <section className="how-it-works" id="como-funciona">
        <div className="how-it-works__container">
          <div className="how-it-works__header">
            <span className="features__subtitle">Simplicidade &amp; Eficiência</span>
            <h2 className="features__title">Como o G-Tech Planner Funciona</h2>
            <p className="features__desc">Três passos simples para transformar sua gestão financeira pessoal.</p>
          </div>

          <div className="how-it-works__steps">
            <div className="step-card">
              <div className="step-card__number">1</div>
              <div>
                <h3 className="step-card__title">Cadastre seus Cartões &amp; Categorias</h3>
                <p className="step-card__desc">
                  Informe o dia de fechamento e vencimento de cada cartão de crédito, e configure suas metas de categorias personalizadas.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-card__number">2</div>
              <div>
                <h3 className="step-card__title">Registre suas Movimentações</h3>
                <p className="step-card__desc">
                  Adicione compras à vista, parcelamentos ou despesas em débito/pix. O app atribui automaticamente cada gasto ao mês correto.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-card__number">3</div>
              <div>
                <h3 className="step-card__title">Receba Diagnósticos Inteligentes de IA</h3>
                <p className="step-card__desc">
                  No início de cada mês, gere seu relatório completo alimentado por Inteligência Artificial para otimizar economias e cortar desperdícios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE PLANOS / PRICING */}
      <section className="pricing" id="planos">
        <div className="pricing__container">
          <div className="pricing__header">
            <span className="features__subtitle">Acesso Ilimitado</span>
            <h2 className="features__title">Plano 100% Gratuito durante a Fase Beta</h2>
            <p className="features__desc">Aproveite todas as funcionalidades premium sem custos ou letras miúdas.</p>
          </div>

          <div className="pricing-card">
            <div className="pricing-card__crown"><i className="fa-solid fa-crown"></i></div>
            <h3 className="pricing-card__name">G-Tech Founder Beta</h3>
            <p className="pricing-card__desc">Acesso completo para gerenciamento pessoal ilimitado</p>
            <div className="pricing-card__price-wrap">
              <span className="pricing-card__currency">R$</span>
              <span className="pricing-card__amount">0</span>
              <span className="pricing-card__period">/mês</span>
            </div>
            <div className="pricing-card__trial-badge">Sem necessidade de cartão de crédito</div>
            <div className="pricing-card__divider"></div>
            <div className="pricing-card__features">
              <div className="pricing-card__feature">
                <i className="fa-solid fa-check pricing-card__check"></i> Gestão ilimitada de cartões e faturas
              </div>
              <div className="pricing-card__feature">
                <i className="fa-solid fa-check pricing-card__check"></i> Projeção inteligente de parcelamentos futuros
              </div>
              <div className="pricing-card__feature">
                <i className="fa-solid fa-check pricing-card__check"></i> Metas visuais de categorias com balancete
              </div>
              <div className="pricing-card__feature">
                <i className="fa-solid fa-check pricing-card__check"></i> Relatórios mensais com Inteligência Artificial
              </div>
              <div className="pricing-card__feature">
                <i className="fa-solid fa-check pricing-card__check"></i> Sincronização em nuvem segura via Supabase
              </div>
            </div>
            <button onClick={onOpenApp} className="btn btn--emerald btn--lg pricing-card__cta">
              <i className="fa-solid fa-bolt"></i> Criar Conta Grátis Agora
            </button>
          </div>
        </div>
      </section>

      {/* SEÇÃO CTA FINAL */}
      <section className="cta-section" style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>
        <div className="cta-section__container">
          <h2 className="cta-section__title" style={{ color: '#0F172A', fontWeight: 800 }}>Pronto para assumir o controle total das suas finanças?</h2>
          <p className="cta-section__desc" style={{ color: '#0F172A', fontWeight: 600, fontSize: '1.1rem' }}>Junte-se ao G-TECH PLANNER hoje e experimente o futuro da gestão financeira pessoal.</p>
          <div className="cta-section__buttons">
            <button onClick={onOpenApp} className="btn btn--emerald btn--lg">
              <i className="fa-solid fa-rocket"></i> Acessar Aplicação
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="landing-footer__logo">
            <img src={logoMain} alt="Logo" style={{ height: '32px', width: 'auto' }} />
            <span>G-TECH PLANNER REACT</span>
          </div>
          <p>&copy; 2026 G-TECH PLANNER. Aplicação React SPA integrada com Supabase Cloud.</p>
        </div>
      </footer>
    </div>
  );
}
