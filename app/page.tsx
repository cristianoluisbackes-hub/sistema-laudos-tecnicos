'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import LoginSupabase from '@/components/LoginSupabase';
import { supabase } from '@/lib/supabaseClient';
import {
  logout,
  obterEstatisticas,
  meuHistoricoLaudos,
  deletarLaudo,
  duplicarLaudo,
} from '@/lib/laudosServiceSupabase';

type Laudo = {
  id: string;
  numero: string;
  cliente: string;
  artigo: string;
  cor: string;
  op: string;
  status: 'draft' | 'approved' | 'rejected';
  criado_em: string;
};

type Stats = {
  total: number;
  aprovados: number;
  reprovados: number;
  taxa: number;
};

const STATUS_MAP = {
  approved: { label: 'APROVADO', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'REPROVADO', cls: 'bg-red-100 text-red-800' },
  draft: { label: 'RASCUNHO', cls: 'bg-gray-100 text-gray-700' },
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, aprovados: 0, reprovados: 0, taxa: 0 });
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loadingLaudos, setLoadingLaudos] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await carregarDados();
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function carregarDados(filtros: Record<string, string> = {}) {
    setLoadingLaudos(true);
    try {
      const [statsData, laudosData] = await Promise.all([
        obterEstatisticas(),
        meuHistoricoLaudos(filtros),
      ]);
      setStats(statsData);
      setLaudos(laudosData);
    } finally {
      setLoadingLaudos(false);
    }
  }

  async function handleFiltrar() {
    const filtros: Record<string, string> = {};
    if (filtroStatus) filtros.status = filtroStatus;
    if (filtroCliente) filtros.cliente = filtroCliente;
    await carregarDados(filtros);
  }

  async function handleLimpar() {
    setFiltroStatus('');
    setFiltroCliente('');
    await carregarDados();
  }

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deletar este laudo permanentemente?')) return;
    await deletarLaudo(id);
    await carregarDados();
  }

  async function handleDuplicar(id: string) {
    const novo = await duplicarLaudo(id);
    window.location.href = `/laudos/${novo.id}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginSupabase onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Laudos Técnicos</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, cls: 'text-gray-900' },
            { label: 'Aprovados', value: stats.aprovados, cls: 'text-green-600' },
            { label: 'Reprovados', value: stats.reprovados, cls: 'text-red-600' },
            { label: 'Taxa Aprovação', value: `${stats.taxa}%`, cls: 'text-blue-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters + New button */}
        <div className="flex flex-wrap gap-3 items-end">
          <Link
            href="/laudos/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm"
          >
            + Novo Laudo
          </Link>
          <input
            type="text"
            placeholder="Cliente..."
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFiltrar()}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Reprovado</option>
          </select>
          <button
            onClick={handleFiltrar}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 text-sm rounded-lg"
          >
            Filtrar
          </button>
          {(filtroStatus || filtroCliente) && (
            <button onClick={handleLimpar} className="text-sm text-gray-500 hover:text-gray-700 underline">
              Limpar
            </button>
          )}
        </div>

        {/* Laudos table */}
        {loadingLaudos ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : laudos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500 mb-6">Nenhum laudo encontrado.</p>
            <Link
              href="/laudos/novo"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
            >
              Criar primeiro laudo
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Número</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Artigo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {laudos.map((laudo) => {
                  const s = STATUS_MAP[laudo.status] ?? STATUS_MAP.draft;
                  return (
                    <tr key={laudo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600">{laudo.numero}</td>
                      <td className="px-4 py-3 text-gray-900">{laudo.cliente}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{laudo.artigo}</td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {new Date(laudo.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link href={`/laudos/${laudo.id}`} className="text-blue-600 hover:underline">
                            Abrir
                          </Link>
                          <button
                            onClick={() => handleDuplicar(laudo.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={() => handleDeletar(laudo.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
