'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  getLaudo,
  getAnalises,
  atualizarLaudo,
  adicionarAnalise,
  atualizarAnalise,
  deletarAnalise,
  finalizarLaudo,
  IDIOMAS_DISPONIVEIS,
  // uploadFoto, — REMOVIDO: fotos desabilitadas temporariamente
} from '@/lib/laudosServiceSupabase';
import { avaliarStatus, calcularStatusGeral } from '@/lib/avaliarAnalise';

type Analise = {
  id: string;
  nome: string;
  specification: string;
  norma: string;
  tipo_foto: 'required' | 'optional' | 'none';
  resultado: string;
  status_analise: string | null;
  foto_url: string | null;
};

type Laudo = {
  id: string;
  numero: string;
  cliente: string;
  artigo: string;
  cor: string;
  op: string;
  responsavel: string;
  status: string;
  observacoes: string;
  criado_em: string;
  finalizado_em: string | null;
  assinador_por: string | null;
};

const FOTO_LABELS = {
  required: { label: 'Obrigatória', cls: 'text-red-600' },
  optional: { label: 'Opcional', cls: 'text-yellow-600' },
  none: { label: 'Sem foto', cls: 'text-gray-400' },
};

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-700',
};

const STATUS_LABEL = {
  approved: 'APROVADO',
  rejected: 'REPROVADO',
  draft: 'RASCUNHO',
};

const BLANK_ANALISE = {
  nome: '',
  specification: '',
  norma: '',
  tipo_foto: 'optional' as 'required' | 'optional' | 'none',
};

export default function LaudoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [idiomaSelecionado, setIdiomaSelecionado] = useState('pt-BR');

  // Inline laudo edit
  const [editandoInfo, setEditandoInfo] = useState(false);
  const [infoForm, setInfoForm] = useState<Partial<Laudo>>({});

  // New analysis form
  const [showAddAnalise, setShowAddAnalise] = useState(false);
  const [novaAnalise, setNovaAnalise] = useState(BLANK_ANALISE);
  const [adicionando, setAdicionando] = useState(false);

  // Removed: Photo upload state per analysis id
  // const [uploading, setUploading] = useState<Record<string, boolean>>({});
  // const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/');
      else if (id) carregar();
    });
  }, [id, router]);

  async function carregar() {
    setLoading(true);
    try {
      const [l, a] = await Promise.all([getLaudo(id), getAnalises(id)]);
      setLaudo(l);
      setAnalises(a);
      setInfoForm(l);
    } finally {
      setLoading(false);
    }
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  }

  // ── Laudo info ──────────────────────────────────────────────
  async function handleSalvarInfo() {
    if (!laudo) return;
    setSalvando(true);
    try {
      await atualizarLaudo(laudo.id, {
        cliente: infoForm.cliente,
        artigo: infoForm.artigo,
        cor: infoForm.cor,
        op: infoForm.op,
        responsavel: infoForm.responsavel,
        observacoes: infoForm.observacoes,
      });
      setLaudo({ ...laudo, ...infoForm } as Laudo);
      setEditandoInfo(false);
      flash('Informações salvas.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Análises ─────────────────────────────────────────────────
  async function handleAddAnalise() {
    if (!novaAnalise.nome.trim()) return;
    setAdicionando(true);
    try {
      const criada = await adicionarAnalise(id, {
        ...novaAnalise,
        resultado: null,
        status_analise: null,
        foto_url: null,
      });
      setAnalises((prev) => [...prev, criada]);
      setNovaAnalise(BLANK_ANALISE);
      setShowAddAnalise(false);
    } finally {
      setAdicionando(false);
    }
  }

  async function handleResultadoChange(analise: Analise, valor: string) {
    const status = avaliarStatus(valor, analise.specification);
    const updated = { ...analise, resultado: valor, status_analise: status };

    setAnalises((prev) => prev.map((a) => (a.id === analise.id ? updated : a)));

    await atualizarAnalise(analise.id, { resultado: valor, status_analise: status });
  }

  async function handleDeletarAnalise(analiseId: string) {
    if (!confirm('Remover esta análise?')) return;
    await deletarAnalise(analiseId);
    setAnalises((prev) => prev.filter((a) => a.id !== analiseId));
  }

  // ── Foto ────────────────────────────────────────────────────── [DESABILITADO]
  // async function handleFotoChange(analise: Analise, file: File) {
  //   setUploading((prev) => ({ ...prev, [analise.id]: true }));
  //   try {
  //     const url = await uploadFoto(id, analise.id, file);
  //     await atualizarAnalise(analise.id, { foto_url: url });
  //     setAnalises((prev) => prev.map((a) => (a.id === analise.id ? { ...a, foto_url: url } : a)));
  //     flash('Foto enviada.');
  //   } catch (err: any) {
  //     flash(`Erro: ${err.message}`);
  //   } finally {
  //     setUploading((prev) => ({ ...prev, [analise.id]: false }));
  //   }
  // }

  // ── Finalizar ─────────────────────────────────────────────────
  async function handleFinalizar() {
    if (!laudo) return;

    // DESABILITADO: Validação de fotos obrigatórias
    // const faltamFotos = analises.filter(
    //   (a) => a.tipo_foto === 'required' && !a.foto_url
    // );
    // if (faltamFotos.length > 0) {
    //   alert(
    //     `Faltam fotos obrigatórias em:\n${faltamFotos.map((a) => `• ${a.nome}`).join('\n')}`
    //   );
    //   return;
    // }

    const statusGeral = calcularStatusGeral(
      analises.map((a) => ({
        resultado: a.resultado,
        specification: a.specification,
        status_analise: a.status_analise,
      }))
    );

    if (
      !confirm(
        `Finalizar laudo com status: ${STATUS_LABEL[statusGeral]}?\n\nEsta ação registra o responsável e a data de finalização.`
      )
    )
      return;

    setSalvando(true);
    try {
      await finalizarLaudo(laudo.id, null, statusGeral, idiomaSelecionado);
      await carregar();
      flash('Laudo finalizado.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!laudo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Laudo não encontrado.</p>
      </div>
    );
  }

  const statusGeral =
    laudo.status === 'draft'
      ? calcularStatusGeral(
          analises.map((a) => ({
            resultado: a.resultado,
            specification: a.specification,
            status_analise: a.status_analise,
          }))
        )
      : (laudo.status as 'approved' | 'rejected' | 'draft');

  const finalizado = laudo.status !== 'draft';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-mono font-semibold text-gray-800">{laudo.numero}</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/laudos/${id}/imprimir`}
              target="_blank"
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
            >
              Imprimir / PDF
            </Link>
            {!finalizado && (
              <button
                onClick={handleFinalizar}
                disabled={salvando}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded-lg font-semibold"
              >
                Finalizar Laudo
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Flash message */}
      {msg && (
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-sm text-green-800">
            {msg}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Número do Laudo</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{laudo.numero}</p>
              <p className="text-xs text-gray-400 mt-1">
                Criado em {new Date(laudo.criado_em).toLocaleDateString('pt-BR')}
                {laudo.finalizado_em &&
                  ` · Finalizado em ${new Date(laudo.finalizado_em).toLocaleDateString('pt-BR')}`}
                {laudo.assinador_por && ` por ${laudo.assinador_por}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${STATUS_BADGE[statusGeral]}`}
              >
                {STATUS_LABEL[statusGeral]}
              </span>
              {!finalizado && !editandoInfo && (
                <button
                  onClick={() => setEditandoInfo(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Informações do Produto
          </h2>

          {editandoInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ['cliente', 'Cliente'],
                    ['artigo', 'Artigo'],
                    ['cor', 'Cor'],
                    ['op', 'OP'],
                    ['responsavel', 'Responsável'],
                  ] as [keyof Laudo, string][]
                ).map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <input
                      value={(infoForm[field] as string) ?? ''}
                      onChange={(e) => setInfoForm({ ...infoForm, [field]: e.target.value })}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Observações</span>
                <textarea
                  value={(infoForm.observacoes as string) ?? ''}
                  onChange={(e) => setInfoForm({ ...infoForm, observacoes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <div className="flex gap-3">
                <button
                  onClick={handleSalvarInfo}
                  disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold px-5 py-2 rounded-lg"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setInfoForm(laudo);
                    setEditandoInfo(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                ['Cliente', laudo.cliente],
                ['Artigo', laudo.artigo],
                ['Cor', laudo.cor],
                ['OP', laudo.op],
                ['Responsável', laudo.responsavel],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{value || '—'}</dd>
                </div>
              ))}
              {laudo.observacoes && (
                <div className="col-span-2 md:col-span-3">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Observações</dt>
                  <dd className="text-gray-700 mt-0.5">{laudo.observacoes}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Analyses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Análises ({analises.length})
            </h2>
            {!finalizado && (
              <button
                onClick={() => setShowAddAnalise(!showAddAnalise)}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {showAddAnalise ? 'Cancelar' : '+ Adicionar análise'}
              </button>
            )}
          </div>

          {/* Add analysis form */}
          {showAddAnalise && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-3">Nova Análise</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Nome da análise *"
                  value={novaAnalise.nome}
                  onChange={(e) => setNovaAnalise({ ...novaAnalise, nome: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Especificação (ex: >3.5)"
                  value={novaAnalise.specification}
                  onChange={(e) =>
                    setNovaAnalise({ ...novaAnalise, specification: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Norma (ex: ISO 5470-2)"
                  value={novaAnalise.norma}
                  onChange={(e) => setNovaAnalise({ ...novaAnalise, norma: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={novaAnalise.tipo_foto}
                  onChange={(e) =>
                    setNovaAnalise({
                      ...novaAnalise,
                      tipo_foto: e.target.value as 'required' | 'optional' | 'none',
                    })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="required">Foto obrigatória</option>
                  <option value="optional">Foto opcional</option>
                  <option value="none">Sem foto</option>
                </select>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleAddAnalise}
                  disabled={adicionando || !novaAnalise.nome.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold px-5 py-2 rounded-lg"
                >
                  {adicionando ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}

          {analises.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhuma análise ainda. Adicione a primeira acima.
            </p>
          ) : (
            <div className="space-y-4">
              {analises.map((analise) => {
                const statusCalc =
                  avaliarStatus(analise.resultado, analise.specification) ?? analise.status_analise;
                const fotoInfo = FOTO_LABELS[analise.tipo_foto];

                return (
                  <div
                    key={analise.id}
                    className={`border rounded-xl p-4 ${
                      statusCalc === 'approved'
                        ? 'border-green-200 bg-green-50'
                        : statusCalc === 'rejected'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      {/* Left: name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{analise.nome}</p>
                          {statusCalc && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[statusCalc as keyof typeof STATUS_BADGE]}`}
                            >
                              {STATUS_LABEL[statusCalc as keyof typeof STATUS_LABEL]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Esp: <span className="font-mono font-semibold">{analise.specification || '—'}</span>
                          {analise.norma && ` · ${analise.norma}`}
                          {' · '}
                          <span className={fotoInfo.cls}>{fotoInfo.label}</span>
                        </p>
                      </div>

                      {/* Right: result input + delete */}
                      <div className="flex items-center gap-3">
                        {!finalizado ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Resultado:</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={analise.resultado ?? ''}
                              onChange={(e) => handleResultadoChange(analise, e.target.value)}
                              placeholder="0.0"
                              className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <p className="text-sm font-mono font-semibold text-gray-800">
                            {analise.resultado || '—'}
                          </p>
                        )}

                        {!finalizado && (
                          <button
                            onClick={() => handleDeletarAnalise(analise.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Photo section — DESABILITADO TEMPORARIAMENTE */}
                    {/* {analise.tipo_foto !== 'none' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 flex-wrap">
                        {analise.foto_url ? (
                          <a
                            href={analise.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={analise.foto_url}
                              alt="Foto da análise"
                              className="h-20 w-28 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition"
                            />
                          </a>
                        ) : (
                          <div className="h-20 w-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center">
                            Sem foto
                          </div>
                        )}

                        {!finalizado && (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              ref={(el) => {
                                fileInputRefs.current[analise.id] = el;
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFotoChange(analise, file);
                              }}
                            />
                            <button
                              onClick={() => fileInputRefs.current[analise.id]?.click()}
                              disabled={uploading[analise.id]}
                              className="text-sm bg-white border border-gray-300 hover:border-blue-400 text-gray-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              {uploading[analise.id]
                                ? 'Enviando...'
                                : analise.foto_url
                                ? 'Trocar foto'
                                : analise.tipo_foto === 'required'
                                ? 'Adicionar foto *'
                                : 'Adicionar foto'}
                            </button>
                            <p className={`text-xs mt-1 ${fotoInfo.cls}`}>
                              {analise.tipo_foto === 'required' ? 'Necessária para finalizar' : 'Opcional'}
                            </p>
                          </div>
                        )}
                      </div>
                    )} */}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Result summary */}
        {analises.length > 0 && (
          <>
            {/* Seletor de Idioma */}
            {!finalizado && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Idioma do Laudo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {IDIOMAS_DISPONIVEIS.map((idioma) => (
                    <button
                      key={idioma.codigo}
                      onClick={() => setIdiomaSelecionado(idioma.codigo)}
                      className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                        idiomaSelecionado === idioma.codigo
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {idioma.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Selecione o idioma para o PDF do laudo
                </p>
              </div>
            )}

            {/* Resultado Final */}
            <div
              className={`rounded-xl p-6 text-center ${
                statusGeral === 'approved'
                  ? 'bg-green-600'
                  : statusGeral === 'rejected'
                  ? 'bg-red-600'
                  : 'bg-gray-200'
              }`}
            >
              <p
                className={`text-3xl font-bold ${
                  statusGeral === 'draft' ? 'text-gray-600' : 'text-white'
                }`}
              >
                {statusGeral === 'approved'
                  ? '✅ LAUDO APROVADO'
                  : statusGeral === 'rejected'
                  ? '❌ LAUDO REPROVADO'
                  : '⏳ AGUARDANDO RESULTADOS'}
              </p>
              {!finalizado && statusGeral !== 'draft' && (
                <button
                  onClick={handleFinalizar}
                  disabled={salvando}
                  className="mt-4 bg-white text-gray-900 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  {salvando ? 'Finalizando...' : 'Finalizar e Registrar'}
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
