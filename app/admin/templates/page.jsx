'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import {
  listarTemplates,
  criarTemplate,
  deletarTemplate,
  clonarTemplate,
} from '@/lib/laudosServiceSupabase';

const COR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100' },
  green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-100' },
};

export default function AdminTemplates() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrando, setMostrando] = useState('lista');

  // Estados para criar novo template
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cor, setCor] = useState('blue');
  const [salvando, setSalvando] = useState(false);

  // Estados para clonar
  const [clonarId, setClonarId] = useState(null);
  const [clonarNome, setClonarNome] = useState('');

  // Estados para deletar
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);

  // ────────────────────────────────────────
  // Carregar templates
  // ────────────────────────────────────────
  async function carregarTemplates() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await listarTemplates();
      setTemplates(dados);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar templates');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (user) {
      carregarTemplates();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null; // useAuth já redireciona
  }

  // ────────────────────────────────────────
  // Criar novo template
  // ────────────────────────────────────────
  async function handleCriar() {
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await criarTemplate(nome, descricao, cor);
      setNome('');
      setDescricao('');
      setCor('blue');
      setMostrando('lista');
      await carregarTemplates();
    } catch (err) {
      setErro(err.message || 'Erro ao criar template');
    } finally {
      setSalvando(false);
    }
  }

  // ────────────────────────────────────────
  // Clonar template
  // ────────────────────────────────────────
  async function handleClonar(id) {
    const nome = clonarNome.trim();
    if (!nome) {
      setErro('Nome é obrigatório');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await clonarTemplate(id, nome);
      setClonarId(null);
      setClonarNome('');
      await carregarTemplates();
    } catch (err) {
      setErro(err.message || 'Erro ao clonar template');
    } finally {
      setSalvando(false);
    }
  }

  // ────────────────────────────────────────
  // Deletar template
  // ────────────────────────────────────────
  async function handleDeletar(id) {
    setSalvando(true);
    setErro('');
    try {
      await deletarTemplate(id);
      setConfirmandoDelete(null);
      await carregarTemplates();
    } catch (err) {
      setErro(err.message || 'Erro ao deletar template');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ──── Header ──── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            📋 Gerenciar Templates
          </h1>
          <p className="text-gray-600 mt-2">Crie, edite e organize seus templates de laudo</p>
        </div>

        {/* ──── Erro ──── */}
        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ❌ {erro}
          </div>
        )}

        {/* ──── Modo LISTA ──── */}
        {mostrando === 'lista' && (
          <>
            {/* ──── Botão Novo ──── */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setNome('');
                  setDescricao('');
                  setCor('blue');
                  setMostrando('criar');
                  setErro('');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2"
              >
                + Novo Template
              </button>
            </div>

            {/* ──── Lista de Templates ──── */}
            {carregando ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 text-lg">Nenhum template encontrado</p>
                <p className="text-gray-500">Clique em "+ Novo Template" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((tpl) => {
                  const cores = COR_MAP[tpl.cor] || COR_MAP.blue;
                  return (
                    <div
                      key={tpl.id}
                      className={`p-6 rounded-lg border-2 ${cores.border} ${cores.bg} hover:shadow-lg transition`}
                    >
                      {/* Nome */}
                      <h3 className={`text-xl font-bold ${cores.text} mb-2`}>{tpl.nome}</h3>

                      {/* Descrição */}
                      {tpl.descricao && (
                        <p className="text-gray-600 text-sm mb-4">{tpl.descricao}</p>
                      )}

                      {/* Badge de cor */}
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${cores.badge}`}>
                          Cor: {tpl.cor}
                        </span>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/admin/templates/${tpl.id}/edit`}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold"
                        >
                          ✏️ Editar
                        </Link>
                        <button
                          onClick={() => {
                            setClonarId(tpl.id);
                            setClonarNome(`${tpl.nome} (cópia)`);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold"
                        >
                          📋 Clonar
                        </button>
                        <button
                          onClick={() => setConfirmandoDelete(tpl.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ──── Modo CRIAR ──── */}
        {mostrando === 'criar' && (
          <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ Novo Template</h2>

            <div className="space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  placeholder="ex: Laudo Completo Couro"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  placeholder="ex: 5 análises — bateria padrão para couro acabado"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cor
                </label>
                <div className="flex gap-3">
                  {['blue', 'green', 'gray'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCor(c)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        cor === c
                          ? `ring-2 ring-offset-2 ${COR_MAP[c].bg} ${COR_MAP[c].border}`
                          : `${COR_MAP[c].bg} ${COR_MAP[c].border}`
                      }`}
                    >
                      {c === 'blue' && '🔵'}
                      {c === 'green' && '🟢'}
                      {c === 'gray' && '⚪'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCriar}
                  disabled={salvando}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
                >
                  {salvando ? '💾 Salvando...' : '💾 Salvar'}
                </button>
                <button
                  onClick={() => {
                    setMostrando('lista');
                    setNome('');
                    setDescricao('');
                    setCor('blue');
                    setErro('');
                  }}
                  disabled={salvando}
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition disabled:opacity-50"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──── Modal de Confirmação Delete ──── */}
      {confirmandoDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ⚠️ Confirmar Deleção
            </h3>
            <p className="text-gray-700 mb-6">
              Tem certeza que deseja deletar este template? Todas as suas análises também serão removidas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeletar(confirmandoDelete)}
                disabled={salvando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50"
              >
                {salvando ? '⏳ Deletando...' : '🗑️ Deletar'}
              </button>
              <button
                onClick={() => setConfirmandoDelete(null)}
                disabled={salvando}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal de Clonar ──── */}
      {clonarId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📋 Clonar Template
            </h3>
            <input
              type="text"
              placeholder="Nome do novo template"
              value={clonarNome}
              onChange={(e) => setClonarNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleClonar(clonarId)}
                disabled={salvando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
              >
                {salvando ? '⏳ Clonando...' : '📋 Clonar'}
              </button>
              <button
                onClick={() => {
                  setClonarId(null);
                  setClonarNome('');
                }}
                disabled={salvando}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
