'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  criarLaudo,
  adicionarAnalise,
  obterUsuarioLogado,
} from '@/lib/laudosServiceSupabase';

const TEMPLATES = {
  completo: {
    label: 'Laudo Completo Couro',
    desc: '5 análises pré-configuradas',
    analises: [
      { nome: 'Abrasion Wet', specification: '>3.5', norma: 'ISO 5470-2', tipo_foto: 'required' },
      { nome: 'Colour Fastness to Rubbing', specification: '>4.0', norma: 'ISO 11640', tipo_foto: 'optional' },
      { nome: 'Tensile Strength', specification: '>15', norma: 'ISO 3376', tipo_foto: 'none' },
      { nome: 'Tear Strength', specification: '>20', norma: 'ISO 3377-1', tipo_foto: 'none' },
      { nome: 'Water Resistance', specification: '>3.0', norma: 'ISO 5403', tipo_foto: 'optional' },
    ],
  },
  rapido: {
    label: 'Teste Rápido',
    desc: '2 análises básicas',
    analises: [
      { nome: 'Abrasion Wet', specification: '>3.5', norma: 'ISO 5470-2', tipo_foto: 'optional' },
      { nome: 'Colour Fastness to Rubbing', specification: '>4.0', norma: 'ISO 11640', tipo_foto: 'optional' },
    ],
  },
  custom: {
    label: 'Custom – Do Zero',
    desc: 'Começar sem análises',
    analises: [],
  },
} as const;

type TemplateKey = keyof typeof TEMPLATES;

export default function NovoLaudo() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/');
      else setAuthReady(true);
    });
  }, [router]);
  const [template, setTemplate] = useState<TemplateKey>('completo');
  const [form, setForm] = useState({
    cliente: '',
    artigo: '',
    cor: '',
    op: '',
    responsavel: '',
    observacoes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const usuario = await obterUsuarioLogado();
      const laudo = await criarLaudo({
        ...form,
        responsavel: form.responsavel || usuario?.email || '',
        data: new Date().toISOString(),
      });

      for (const analise of TEMPLATES[template].analises) {
        await adicionarAnalise(laudo.id, analise);
      }

      router.push(`/laudos/${laudo.id}`);
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar laudo');
      setLoading(false);
    }
  }

  const tmpl = TEMPLATES[template];

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            Dashboard
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">Novo Laudo</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {erro && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-sm text-red-800">
              {erro}
            </div>
          )}

          {/* Product info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Informações do Produto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Cliente *</span>
                <input
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                  required
                  placeholder="Nome do cliente"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Artigo (Material) *</span>
                <input
                  name="artigo"
                  value={form.artigo}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Sapato Social"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Cor</span>
                <input
                  name="cor"
                  value={form.cor}
                  onChange={handleChange}
                  placeholder="Ex: Preto"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">OP (Ordem de Produção)</span>
                <input
                  name="op"
                  value={form.op}
                  onChange={handleChange}
                  placeholder="Ex: OP-2024-001"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Responsável Técnico</span>
                <input
                  name="responsavel"
                  value={form.responsavel}
                  onChange={handleChange}
                  placeholder="Deixe vazio para usar seu email"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Observações</span>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observações gerais do laudo"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Template selector */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Template de Análises</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {(Object.entries(TEMPLATES) as [TemplateKey, (typeof TEMPLATES)[TemplateKey]][]).map(
                ([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTemplate(key)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      template === key
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                    {template === key && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">✓ Selecionado</p>
                    )}
                  </button>
                )
              )}
            </div>

            {tmpl.analises.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Análises incluídas:
                </p>
                <ul className="space-y-1">
                  {tmpl.analises.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">{a.nome}</span>
                      <span className="text-gray-400">—</span>
                      <span>Esp: {a.specification}</span>
                      {a.norma && <span className="text-gray-400 text-xs">({a.norma})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-2.5 rounded-lg text-sm transition"
            >
              {loading ? 'Criando...' : 'Criar Laudo'}
            </button>
            <Link
              href="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg text-sm transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
