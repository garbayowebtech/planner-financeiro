import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage/LandingPage';
import { AuthView } from './components/AuthView';
import { TopCalendarBar } from './components/TopCalendarBar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardGrid, TutorialModal } from './components/DashboardGrid';
import { Modals } from './components/Modals';
import { GoalAlertPopup } from './components/GoalAlertPopup';
import { AIBotPopup } from './components/AIBotPopup';

function MainAppLayout() {
  const { currentView, setCurrentView, loadingSession, calendarBar } = useApp();

  if (loadingSession) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--c-primary)', marginBottom: '1rem' }}></i>
          <p style={{ color: 'var(--c-text-muted)', fontFamily: 'Inter, sans-serif' }}>Carregando G-TECH PLANNER...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage onOpenApp={() => setCurrentView('auth')} />;
  }

  if (currentView === 'auth') {
    return <AuthView />;
  }

  return (
    <div id="app-view" className="view-container active" style={{ paddingTop: calendarBar ? '40px' : '0' }}>
      <TopCalendarBar />
      <Sidebar />
      <main className="main-content">
        <Header />
        <DashboardGrid />
      </main>
      <Modals />
      <TutorialModal />
      <GoalAlertPopup />
      <AIBotPopup />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}

export default App;
