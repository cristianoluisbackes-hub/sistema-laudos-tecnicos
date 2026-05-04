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
    let mounted = true;

    // Garante que o loading nunca fica travado — libera após 6s no máximo
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) await carregarDados();
      } catch (error) {
        console.error('Erro ao obter sessão Supabase:', error);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await carregarDados();
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
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

  async function handleLoginSuccess(loggedUser: User) {
    setUser(loggedUser);
    await carregarDados();
    setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="glass-card px-10 py-8 text-center">
          <p className="text-2xl font-semibold">Carregando painel...</p>
          <p className="mt-2 text-sm text-slate-400">Preparando sua experiência dark futurista.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginSupabase onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent" />
      <nav className="relative mb-6 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_120px_-60px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400/70">Laudos Técnicos</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">Painel de Controle</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-right">
            <span className="text-sm text-slate-400 hidden sm:inline">{user.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:brightness-110"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-4 pb-12 md:px-6">
        <section className="glass-card rounded-[2rem] border-slate-800/90 p-8 shadow-[0_30px_120px_-70px_rgba(56,189,248,0.45)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-400/75">Resumo</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">Controle completo dos seus laudos.</h2>
              <p className="mt-4 max-w-xl text-slate-300/90 leading-7">
                Visualize, filtre e gerencie laudos técnicos com uma interface escura, moderna e intuitiva.
              </p>
            </div>
            <Link
              href="/laudos/novo"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
            >
              + Novo Laudo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-100' },
            { label: 'Aprovados', value: stats.aprovados, color: 'text-emerald-300' },
            { label: 'Reprovados', value: stats.reprovados, color: 'text-rose-300' },
            { label: 'Taxa de aprovação', value: `${stats.taxa}%`, color: 'text-sky-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card rounded-[1.75rem] border-slate-800/80 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
              <p className={`mt-4 text-4xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        <section className="glass-card mt-6 rounded-[2rem] border-slate-800/90 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-3 w-full md:grid-cols-3">
              <input
                type="text"
                placeholder="Buscar cliente"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFiltrar()}
                className="input-dark w-full rounded-2xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="input-dark w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/70"
              >
                <option value="">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Reprovado</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-end">
              <button
                onClick={handleFiltrar}
                className="rounded-full button-primary px-5 py-3 text-sm font-semibold shadow-lg shadow-sky-500/20 transition hover:brightness-110"
              >
                Filtrar
              </button>
              {(filtroStatus || filtroCliente) && (
                <button
                  onClick={handleLimpar}
                  className="rounded-full button-secondary px-5 py-3 text-sm font-semibold text-slate-300 hover:text-slate-100"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </section>

        {loadingLaudos ? (
          <div className="glass-card mt-6 rounded-[2rem] border-slate-800/90 p-12 text-center text-slate-400">
            Carregando registros...
          </div>
        ) : laudos.length === 0 ? (
          <div className="glass-card mt-6 rounded-[2rem] border-slate-800/90 p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/80 text-4xl text-sky-300 shadow-inner shadow-sky-500/10">
              📋
            </div>
            <p className="text-xl font-semibold text-slate-100">Nenhum laudo encontrado</p>
            <p className="mt-2 text-sm text-slate-400">Crie um novo laudo e comece hoje mesmo.</p>
            <Link
              href="/laudos/novo"
              className="mt-6 inline-flex rounded-full button-primary px-6 py-3 text-sm font-semibold shadow-lg shadow-sky-500/25"
            >
              Criar primeiro laudo
            </Link>
          </div>
        ) : (
          <div className="glass-card mt-6 overflow-hidden rounded-[2rem] border-slate-800/90">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  {['Número', 'Cliente', 'Artigo', 'Data', 'Status', 'Ações'].map((heading) => (
                    <th key={heading} className="px-4 py-4 text-left font-semibold tracking-wide">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {laudos.map((laudo) => {
                  const s = STATUS_MAP[laudo.status] ?? STATUS_MAP.draft;
                  return (
                    <tr key={laudo.id} className="border-t border-slate-800/80 transition hover:bg-slate-900/80">
                      <td className="px-4 py-4 font-mono text-sky-300">{laudo.numero}</td>
                      <td className="px-4 py-4 text-slate-200">{laudo.cliente}</td>
                      <td className="px-4 py-4 hidden md:table-cell text-slate-400">{laudo.artigo}</td>
                      <td className="px-4 py-4 hidden lg:table-cell text-slate-400">
                        {new Date(laudo.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          laudo.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : laudo.status === 'rejected'
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-slate-800/70 text-slate-300'
                        }`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-3 text-sm">
                          <Link href={`/laudos/${laudo.id}`} className="text-sky-300 hover:text-sky-200">
                            Abrir
                          </Link>
                          <button onClick={() => handleDuplicar(laudo.id)} className="text-slate-400 hover:text-slate-100">
                            Duplicar
                          </button>
                          <button onClick={() => handleDeletar(laudo.id)} className="text-rose-300 hover:text-rose-200">
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
