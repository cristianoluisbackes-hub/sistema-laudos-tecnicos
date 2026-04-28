'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import LoginSupabase from '@/components/LoginSupabase';
import { obterUsuarioLogado, logout } from '@/lib/laudosServiceSupabase';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const usuario = await obterUsuarioLogado();
      setUser(usuario);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!user) {
   return <LoginSupabase onLoginSuccess={(u: any) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">📊 Laudos Técnicos</h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-700">👋 {user?.email}</p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Bem-vindo!</h2>
          <p className="text-gray-600 mb-6">
            Sistema de Laudos Técnicos conectado ao Supabase com sucesso! ✅
          </p>
          <p className="text-lg font-semibold text-blue-600">
            Seu email: {user?.email}
          </p>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <h3 className="text-xl font-bold text-blue-900 mb-4">🚀 Próximos Passos:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li>✅ Autenticação funcionando</li>
              <li>✅ Banco de dados Supabase conectado</li>
              <li>✅ Publicado no Vercel</li>
              <li>⏳ Implementar Dashboard de laudos</li>
              <li>⏳ Criar tela de novo laudo</li>
              <li>⏳ Upload de fotos</li>
              <li>⏳ Geração de PDF</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}