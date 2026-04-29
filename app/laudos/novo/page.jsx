'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { criarLaudo, adicionarAnalise, listarTemplates, obterTemplate } from '@/lib/laudosServiceSupabase';

const BLANK_ANALISE = { nome: '', norma: '', specification: '', tipo_foto: 'optional' };

const TIPO_FOTO_LABEL = {
  required: 'Foto obrigatória',
  optional: 'Foto opcional',
  none: 'Sem foto',
};

const COR_MAP = {
  blue: { card: 'border-blue-400 bg-blue-50', badge: 'bg-blue-100 text-blue-800', btn: 'ring-blue-500' },
  green: { card: 'border-green-400 bg-green-50', badge: 'bg-green-100 text-green-800', btn: 'ring-green-500' },
  gray: { card: 'border-gray-300 bg-gray-50', badge: 'bg-gray-100 text-gray-700', btn: 'ring-gray-400' },
};

export default function NovoLaudo() {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [carregandoTemplates, setCarregandoTemplates] = useState(true);
  const [templates, setTemplates] = useState([]);

  // Passo 1 — dados básicos
  const [info, setInfo] = useState({
    cliente: '', artigo: '', cor: '', op: '', responsavel: '', observacoes: '',
  });

  // Passo 2 — template + análises
  const [templateId, setTemplateId] = useState('');
  const [analises, setAnalises] = useState([]);
  const [adicionando, setAdicionando] = useState(false);
  const [novaAnalise, setNovaAnalise] = useState(BLANK_ANALISE);

  // ── Carregar templates dinâmicos ──
  useEffect(() => {
    async function carregarTemplates() {
      setCarregandoTemplates(true);
      try {
        const dados = await listarTemplates();
        setTemplates(dados);
      } catch (err) {
        setErro(err.message || 'Erro ao carregar templates');
      } finally {
        setCarregandoTemplates(false);
      }
    }

    carregarTemplates();
  }, []);

  // ── Passo 1 ──────────────────────────────────────────────────
  function handleInfoChange(field, value) {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }

  function avancar() {
    if (!info.cliente.trim() || !info.artigo.trim()) {
      setErro('Cliente e Artigo são obrigatórios.');
      return;
    }
    setErro('');
    setPasso(2);
  }

  // ── Passo 2 — templates ──────────────────────────────────────
  async function selecionarTemplate(tpl) {
    setTemplateId(tpl.id);
    
    // Obter template completo com análises do banco
    try {
      const templateCompleto = await obterTemplate(tpl.id);
      
      // Mapear análises do banco para o formato esperado
      const analisesFormatadas = templateCompleto.analises.map((a) => ({
        id: a.id,
        nome: a.nome,
        norma: a.norma?.codigo || '',
        specification: a.specification || '',
        tipo_foto: a.tipo_foto || 'optional',
      }));
      
      setAnalises(analisesFormatadas);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar template');
      setTemplateId('');
    }
  }

  function handleAnaliseChange(idx, field, value) {
    setAnalises((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  function removerAnalise(idx) {
    setAnalises((prev) => prev.filter((_, i) => i !== idx));
  }

  function adicionarLinha() {
    if (!novaAnalise.nome.trim()) return;
    setAnalises((prev) => [...prev, { ...novaAnalise }]);
    setNovaAnalise(BLANK_ANALISE);
    setAdicionando(false);
  }

  // ── Criar laudo ──────────────────────────────────────────────
  async function handleCriar() {
    if (!templateId) {
      setErro('Selecione um template.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const laudo = await criarLaudo(info);

      await Promise.all(
        analises.map((a) =>
          adicionarAnalise(laudo.id, {
            nome: a.nome,
            norma: a.norma,
            specification: a.specification,
            tipo_foto: a.tipo_foto,
            resultado: null,
            status_analise: null,
            foto_url: null,
          })
        )
      );

      router.push(`/laudos/${laudo.id}`);
    } catch (err) {
      setErro(err.message || 'Erro ao criar laudo.');
      setSalvando(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">Dashboard</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">Novo Laudo</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[
            { n: 1, label: 'Dados do Produto' },
            { n: 2, label: 'Template e Análises' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  passo >= n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {n}
              </div>
              <span className={`text-sm hidden sm:block ${passo >= n ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
              {n < 2 && <span className="text-gray-300 mx-1">›</span>}
            </div>
          ))}
        </div>

        {erro && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* ── PASSO 1 ── */}
        {passo === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">Dados do Produto</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { field: 'cliente',     label: 'Cliente *',     req: true  },
                { field: 'artigo',      label: 'Artigo *',      req: true  },
                { field: 'cor',         label: 'Cor',           req: false },
                { field: 'op',          label: 'OP',            req: false },
                { field: 'responsavel', label: 'Responsável',   req: false },
              ].map(({ field, label }) => (
                <label key={field} className="block">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <input
                    value={info[field]}
                    onChange={(e) => handleInfoChange(field, e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Observações</span>
              <textarea
                value={info.observacoes}
                onChange={(e) => handleInfoChange('observacoes', e.target.value)}
                rows={2}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={avancar}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-lg"
              >
                Próximo →
              </button>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 self-center">
                Cancelar
              </Link>
            </div>
          </div>
        )}

        {/* ── PASSO 2 ── */}
        {passo === 2 && (
          <div className="space-y-5">
            {/* Template selector */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Selecione o Template</h2>
              
              {carregandoTemplates ? (
                <p className="text-sm text-gray-500 text-center py-6">Carregando templates...</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Nenhum template disponível</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {templates.map((tpl) => {
                    const c = COR_MAP[tpl.cor] || COR_MAP.blue;
                    const ativo = templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => selecionarTemplate(tpl)}
                        className={`text-left p-4 rounded-xl border-2 transition ${
                          ativo ? `${c.card} ${c.btn} ring-2` : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className="font-semibold text-sm text-gray-900">{tpl.nome}</p>
                        <p className="text-xs text-gray-500 mt-1">{tpl.descricao}</p>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 font-medium bg-gray-100 text-gray-700`}>
                          ⚙️ Gerenciar
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Botão para criar novo template */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-600 mb-2">Não encontrou o template que precisa?</p>
                <Link 
                  href="/admin/templates" 
                  className="inline-block text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  + Criar Novo Template
                </Link>
              </div>
            </div>

            {/* Analyses list */}
            {templateId && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">
                    Análises ({analises.length})
                  </h2>
                  {!adicionando && (
                    <button
                      onClick={() => setAdicionando(true)}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      + Adicionar
                    </button>
                  )}
                </div>

                {analises.length === 0 && !adicionando && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Nenhuma análise. Clique em "+ Adicionar" para incluir.
                  </p>
                )}

                {/* Analysis rows */}
                <div className="space-y-2">
                  {analises.map((a, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <input
                        value={a.nome}
                        onChange={(e) => handleAnaliseChange(idx, 'nome', e.target.value)}
                        placeholder="Nome *"
                        className="col-span-3 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        value={a.norma}
                        onChange={(e) => handleAnaliseChange(idx, 'norma', e.target.value)}
                        placeholder="Norma"
                        className="col-span-3 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        value={a.specification}
                        onChange={(e) => handleAnaliseChange(idx, 'specification', e.target.value)}
                        placeholder="Spec. (ex: >3.5)"
                        className="col-span-3 border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={a.tipo_foto}
                        onChange={(e) => handleAnaliseChange(idx, 'tipo_foto', e.target.value)}
                        className="col-span-2 border border-gray-300 rounded px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="required">Foto obrig.</option>
                        <option value="optional">Opcional</option>
                        <option value="none">Sem foto</option>
                      </select>
                      <button
                        onClick={() => removerAnalise(idx)}
                        className="col-span-1 text-red-400 hover:text-red-600 text-xs text-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new analysis form */}
                {adicionando && (
                  <div className="mt-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-2">Nova análise</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        autoFocus
                        value={novaAnalise.nome}
                        onChange={(e) => setNovaAnalise({ ...novaAnalise, nome: e.target.value })}
                        placeholder="Nome *"
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        value={novaAnalise.norma}
                        onChange={(e) => setNovaAnalise({ ...novaAnalise, norma: e.target.value })}
                        placeholder="Norma (ex: ISO 5470-2)"
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        value={novaAnalise.specification}
                        onChange={(e) => setNovaAnalise({ ...novaAnalise, specification: e.target.value })}
                        placeholder="Especificação (ex: >3.5)"
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={novaAnalise.tipo_foto}
                        onChange={(e) => setNovaAnalise({ ...novaAnalise, tipo_foto: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="required">Foto obrigatória</option>
                        <option value="optional">Foto opcional</option>
                        <option value="none">Sem foto</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={adicionarLinha}
                        disabled={!novaAnalise.nome.trim()}
                        className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded-lg font-semibold"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => { setAdicionando(false); setNovaAnalise(BLANK_ANALISE); }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPasso(1)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-300 rounded-lg"
              >
                ← Voltar
              </button>
              <button
                onClick={handleCriar}
                disabled={salvando || !templateId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold px-8 py-2 rounded-lg"
              >
                {salvando ? 'Criando...' : 'Criar Laudo'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
