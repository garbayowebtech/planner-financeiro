import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DB } from '../services/supabaseClient';
import logoMain from '../assets/logo_main.png';

export function AuthView() {
  const { authSection, setAuthSection, handleLogin, handleRegister, setCurrentView } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await handleLogin(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await handleRegister(email, password, name);
      setSuccessMsg('Conta criada com sucesso! Você já pode fazer login.');
      setAuthSection('login');
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleAuth = async () => {
    setErrorMsg('');
    try {
      await DB.signInWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Falha na autenticação com o Google.');
    }
  };

  const onForgotPassword = async () => {
    const inputEmail = prompt("Informe o seu e-mail cadastrado para redefinir a senha:");
    if (!inputEmail) return;
    try {
      await DB.sendPasswordReset(inputEmail);
      alert("Enviamos um link de recuperação para o seu e-mail.");
    } catch (err) {
      alert("Erro ao enviar recuperação: " + (err.message || 'Tente novamente.'));
    }
  };

  return (
    <div id="auth-view" className="view-container active">
      <div className="auth-card">
        <div className="auth-header">
          <img
            src={logoMain}
            alt="Logo"
            className="auth-logo"
            style={{ height: '100px', objectFit: 'contain', marginBottom: '0.6rem' }}
          />
          <h1>G-TECH <span className="highlight">PLANNER</span></h1>
          <p>Bem-vindo(a). Entre com sua conta para continuar.</p>
        </div>

        {authSection === 'login' ? (
          <div id="login-section">
            <form id="login-form" onSubmit={onLoginSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">E-mail</label>
                <input
                  type="email"
                  id="login-email"
                  required
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Senha</label>
                <input
                  type="password"
                  id="login-password"
                  required
                  placeholder="••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '.5rem' }}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Verificando...</>
                ) : (
                  <><i className="fa-solid fa-arrow-right-to-bracket"></i> Entrar</>
                )}
              </button>
              {errorMsg && <p id="login-error-msg" className="error-msg" style={{ display: 'block' }}>{errorMsg}</p>}
              {successMsg && <p className="text-success" style={{ marginTop: '.5rem', fontSize: '.85rem' }}>{successMsg}</p>}
            </form>

            <div className="oauth-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="btn btn-outline oauth-btn"
              id="btn-google-login"
              onClick={onGoogleAuth}
            >
              <i className="fa-brands fa-google"></i> Entrar com o Google
            </button>

            <div className="auth-actions" style={{ flexDirection: 'column', gap: '.5rem', marginTop: '1rem' }}>
              <button
                id="btn-show-register"
                className="btn btn-outline"
                onClick={() => { setErrorMsg(''); setAuthSection('register'); }}
              >
                <i className="fa-solid fa-user-plus"></i> Criar Nova Conta
              </button>
              <button
                id="btn-forgot-password"
                className="btn btn-text"
                style={{ fontSize: '.85rem', color: 'var(--c-text-muted)' }}
                onClick={onForgotPassword}
              >
                Esqueci minha senha
              </button>
              <button
                onClick={() => setCurrentView('landing')}
                className="btn btn-text"
                style={{ fontSize: '.85rem', color: 'var(--c-text-muted)', marginTop: '.25rem' }}
              >
                ← Voltar para Landing Page
              </button>
            </div>
          </div>
        ) : (
          <div id="register-section" className="register-container">
            <h3>Criar Novo Perfil</h3>
            <p className="subtitle">Preencha os dados para criar sua conta.</p>
            <form id="register-form" onSubmit={onRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="reg-name">Seu Nome</label>
                <input
                  type="text"
                  id="reg-name"
                  required
                  maxLength={30}
                  placeholder="Ex: João Silva"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-email">E-mail</label>
                <input
                  type="email"
                  id="reg-email"
                  required
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-password">Senha (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  id="reg-password"
                  required
                  minLength={6}
                  placeholder="••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  id="btn-reg-cancel"
                  className="btn btn-text"
                  onClick={() => { setErrorMsg(''); setAuthSection('login'); }}
                >
                  Já tenho conta
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Registrar'}
                </button>
              </div>
              {errorMsg && <p id="reg-error-msg" className="error-msg" style={{ display: 'block' }}>{errorMsg}</p>}
            </form>

            <div className="oauth-divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="btn btn-outline oauth-btn"
              id="btn-google-register"
              onClick={onGoogleAuth}
            >
              <i className="fa-brands fa-google"></i> Criar com o Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
