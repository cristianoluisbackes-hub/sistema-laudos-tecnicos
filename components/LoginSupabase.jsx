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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Laudos Técnicos</h1>
        <p className="text-gray-600 mb-6">Sistema seguro de gestão de qualidade</p>

        {erro && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded">
            <p className="text-red-800 text-sm">{erro}</p>
          </div>
        )}

        {modo === 'confirmar' ? (
          <div className="text-center space-y-4">
            <p className="text-5xl">📧</p>
            <h2 className="text-lg font-semibold text-gray-800">Confirme seu email</h2>
            <p className="text-gray-600 text-sm">
              Enviamos um link de confirmação para <strong>{email}</strong>.<br/>
              Clique no link do email para ativar sua conta.
            </p>
            <button
              onClick={() => setModo('login')}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline"
            >
              Voltar para o login
            </button>
          </div>
        ) : modo === 'login' ? (
          // FORMULÁRIO DE LOGIN
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          // FORMULÁRIO DE REGISTRO
          <form onSubmit={handleRegistro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João Silva"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha (mínimo 6 caracteres)</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Criar Conta'}
            </button>
          </form>
        )}

        {modo !== 'confirmar' && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            {/* Login Google */}
            <button
              onClick={handleLoginGoogle}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              🔵 Google
            </button>

            {/* Toggle entre Login e Registro */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {modo === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
                <button
                  type="button"
                  onClick={() => setModo(modo === 'login' ? 'registrar' : 'login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {modo === 'login' ? 'Registre-se' : 'Faça login'}
                </button>
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 Seus dados são protegidos por Supabase<br/>
            PostgreSQL encriptado + HTTPS/TLS 1.2+
          </p>
        </div>
      </div>
    </div>
  );
}
