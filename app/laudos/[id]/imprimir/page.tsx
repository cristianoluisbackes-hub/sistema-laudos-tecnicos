'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLaudo, getAnalises } from '@/lib/laudosServiceSupabase';
import { avaliarStatus } from '@/lib/avaliarAnalise';

type Analise = {
  id: string;
  nome: string;
  specification: string;
  norma: string;
  tipo_foto: string;
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

const STATUS_LABEL: Record<string, string> = {
  approved: 'APROVADO',
  rejected: 'REPROVADO',
  draft: 'RASCUNHO',
};

export default function ImprimirLaudo() {
  const { id } = useParams<{ id: string }>();
  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [l, a] = await Promise.all([getLaudo(id), getAnalises(id)]);
      setLaudo(l);
      setAnalises(a);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!loading && laudo) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, laudo]);

  if (loading || !laudo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Preparando documento...</p>
      </div>
    );
  }

  const statusGeral = laudo.status !== 'draft' ? laudo.status : 'draft';
  const aprovados = analises.filter(
    (a) => (a.status_analise ?? avaliarStatus(a.resultado, a.specification)) === 'approved'
  ).length;
  const reprovados = analises.filter(
    (a) => (a.status_analise ?? avaliarStatus(a.resultado, a.specification)) === 'rejected'
  ).length;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      {/* Print trigger button – hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
        >
          Imprimir / Salvar PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
        >
          Fechar
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 text-gray-900" style={{ fontSize: '12px' }}>
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">LAUDO TÉCNICO</h1>
            <p className="text-lg font-mono font-bold text-gray-800 mt-1">{laudo.numero}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Data de emissão</p>
            <p className="font-semibold">
              {new Date(laudo.finalizado_em ?? laudo.criado_em).toLocaleDateString('pt-BR')}
            </p>
            <div
              className={`mt-2 px-3 py-1 rounded font-bold text-sm inline-block ${
                statusGeral === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : statusGeral === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {STATUS_LABEL[statusGeral] ?? 'RASCUNHO'}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Informações do Produto
          </h2>
          <table className="w-full border-collapse">
            <tbody>
              {[
                ['Cliente', laudo.cliente],
                ['Artigo / Material', laudo.artigo],
                ['Cor', laudo.cor],
                ['Ordem de Produção (OP)', laudo.op],
                ['Responsável Técnico', laudo.responsavel],
              ].map(([label, value]) => (
                <tr key={label} className="border border-gray-300">
                  <td className="px-3 py-1.5 bg-gray-50 font-semibold w-48">{label}</td>
                  <td className="px-3 py-1.5">{value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Analyses table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Análises Realizadas
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-3 py-2 text-left font-semibold">Análise</th>
                <th className="px-3 py-2 text-center font-semibold">Especificação</th>
                <th className="px-3 py-2 text-center font-semibold">Resultado</th>
                <th className="px-3 py-2 text-center font-semibold">Norma</th>
                <th className="px-3 py-2 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {analises.map((a, i) => {
                const status =
                  a.status_analise ?? avaliarStatus(a.resultado, a.specification);
                return (
                  <tr
                    key={a.id}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{
                      backgroundColor:
                        status === 'approved'
                          ? '#f0fdf4'
                          : status === 'rejected'
                          ? '#fef2f2'
                          : undefined,
                    }}
                  >
                    <td className="px-3 py-2 border border-gray-200 font-medium">{a.nome}</td>
                    <td className="px-3 py-2 border border-gray-200 text-center font-mono">
                      {a.specification || '—'}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-center font-mono font-bold">
                      {a.resultado || '—'}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">
                      {a.norma || '—'}
                    </td>
                    <td className="px-3 py-2 border border-gray-200 text-center">
                      {status ? (
                        <span
                          className={`font-bold text-xs px-2 py-0.5 rounded ${
                            status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="px-3 py-2 border border-gray-200" colSpan={4}>
                  Resultado Final — {aprovados} aprovada(s), {reprovados} reprovada(s)
                </td>
                <td className="px-3 py-2 border border-gray-200 text-center">
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded ${
                      statusGeral === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : statusGeral === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABEL[statusGeral] ?? 'RASCUNHO'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Photos */}
        {analises.some((a) => a.foto_url) && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              Registro Fotográfico
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {analises
                .filter((a) => a.foto_url)
                .map((a) => (
                  <div key={a.id} className="text-center">
                    <img
                      src={a.foto_url!}
                      alt={a.nome}
                      className="w-full h-36 object-cover rounded border border-gray-200"
                    />
                    <p className="text-xs text-gray-600 mt-1 font-medium">{a.nome}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Observations */}
        {laudo.observacoes && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Observações
            </h2>
            <p className="text-gray-700 border border-gray-200 rounded p-3">{laudo.observacoes}</p>
          </div>
        )}

        {/* Signature */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div>
              <div className="border-b border-gray-400 w-56 mb-1" />
              <p className="text-xs text-gray-600">{laudo.assinador_por ?? laudo.responsavel}</p>
              <p className="text-xs text-gray-400">Responsável Técnico</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="font-mono text-gray-500">{laudo.numero}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
