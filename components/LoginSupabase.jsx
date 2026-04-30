// components/LoginSupabase.jsx
'use client';

import { useState } from 'react';
import { registrar, login, loginComGoogle } from '../lib/laudosServiceSupabase';

export default function LoginSupabase({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [modo, setModo] = useState('login'); // 'login' | 'registrar' | 'confirmar'

  // Login com Email/Senha
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const user = await login(email, senha);
      console.log('✅ Login bem-sucedido:', user.email);
      onLoginSuccess(user);
    } catch (error) {
      setErro(error.message || 'Erro ao fazer login');
      console.error('❌ Erro ao fazer login:', error);
    } finally {
      setLoading(false);
    }
  };

  // Registrar novo usuário
  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const { user, session } = await registrar(email, senha, nome);
      if (session) {
        onLoginSuccess(user);
      } else {
        // Supabase com confirmação de email obrigatória
        setModo('confirmar');
      }
    } catch (error) {
      setErro(error.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const handleLoginGoogle = async () => {
    setLoading(true);
    setErro('');

    try {
      await loginComGoogle();
      console.log('✅ Login Google iniciado');
      // Supabase redireciona automaticamente
    } catch (error) {
      setErro(error.message || 'Erro ao fazer login com Google');
      console.error('❌ Erro ao fazer login com Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 text-slate-100">
      <div className="glass-card w-full max-w-xl rounded-[2rem] p-8 shadow-[0_30px_120px_-80px_rgba(56,189,248,0.55)]">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="inline-flex rounded-full bg-sky-500/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-sky-300">
            Interface profissional
          </span>
          <h1 className="text-4xl font-semibold text-white">Laudos Técnicos</h1>
          <p className="mx-auto max-w-xl text-slate-400">
            Plataforma segura para criar, revisar e finalizar laudos técnicos com um visual escuro e futurista.
          </p>
        </div>

        {erro && (
          <div className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {erro}
          </div>
        )}

        {modo === 'confirmar' ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-4xl text-sky-300">📧</div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Confirme seu email</h2>
              <p className="mt-2 text-slate-400">
                Enviamos um link para <strong>{email}</strong>. Abra o email e confirme sua conta.
              </p>
            </div>
            <button
              onClick={() => setModo('login')}
              className="rounded-full button-secondary px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/80"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={modo === 'login' ? handleLogin : handleRegistro} className="space-y-5">
            {modo === 'registrar' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  className="input-dark w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input-dark w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="input-dark w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                required
                minLength={modo === 'registrar' ? 6 : 1}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full button-primary px-6 py-3 text-sm font-semibold shadow-lg shadow-sky-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (modo === 'login' ? 'Entrando...' : 'Registrando...') : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        )}

        {modo !== 'confirmar' && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/80" />
              <p className="relative mx-auto inline-block bg-slate-950 px-3 text-xs uppercase tracking-[0.25em] text-slate-500">ou</p>
            </div>

            <button
              onClick={handleLoginGoogle}
              disabled={loading}
              className="w-full rounded-full bg-slate-900/90 border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800/90 disabled:opacity-60"
            >
              🔵 Entrar com Google
            </button>

            <div className="mt-6 text-center text-sm text-slate-400">
              {modo === 'login' ? 'Não tem conta?' : 'Já possui conta?'}{' '}
              <button
                type="button"
                onClick={() => setModo(modo === 'login' ? 'registrar' : 'login')}
                className="text-sky-300 hover:text-sky-200 font-semibold"
              >
                {modo === 'login' ? 'Crie uma agora' : 'Faça login'}
              </button>
            </div>
          </>
        )}

        <div className="mt-8 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4 text-center text-xs text-slate-500">
          🔒 Dados protegidos por Supabase com segurança TLS e PostgreSQL seguro.
        </div>
      </div>
    </div>
  );
}
