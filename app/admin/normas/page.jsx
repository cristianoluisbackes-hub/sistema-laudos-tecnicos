'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import {
  listarNormas,
  criarNorma,
  atualizarNorma,
  deletarNorma,
} from '@/lib/laudosServiceSupabase';

export default function AdminNormas() {
  const { user, loading } = useAuth();

  const [normas, setNormas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [mostrando, setMostrando] = useState('lista');

  // Estados para criar/editar
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Estados para deletar
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);

  // ────────────────────────────────────────
  // Carregar normas
  // ────────────────────────────────────────
  async function carregarNormas(search = '') {
    setCarregando(true);
    setErro('');
    try {
      const dados = await listarNormas(search);
      setNormas(dados);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar normas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (user) {
      carregarNormas();
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
  // Criar norma
  // ────────────────────────────────────────
  async function handleCriar() {
    if (!codigo.trim()) {
      setErro('Código é obrigatório');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await criarNorma(codigo, descricao);
      setCodigo('');
      setDescricao('');
      setMostrando('lista');
      await carregarNormas(filtro);
    } catch (err) {
      setErro(err.message || 'Erro ao criar norma');
    } finally {
      setSalvando(false);
    }
  }

  // ────────────────────────────────────────
  // Atualizar norma
  // ────────────────────────────────────────
  async function handleAtualizar(id) {
    if (!codigo.trim()) {
      setErro('Código é obrigatório');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await atualizarNorma(id, codigo, descricao);
      setCodigo('');
      setDescricao('');
      setEditandoId(null);
      setMostrando('lista');
      await carregarNormas(filtro);
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar norma');
    } finally {
      setSalvando(false);
    }
  }

  // ────────────────────────────────────────
  // Deletar norma
  // ────────────────────────────────────────
  async function handleDeletar(id) {
    setSalvando(true);
    setErro('');
    try {
      await deletarNorma(id);
      setConfirmandoDelete(null);
      await carregarNormas(filtro);
    } catch (err) {
      setErro(err.message || 'Erro ao deletar norma');
    } finally {
      setSalvando(false);
    }
  }

  // ────────────────────────────────────────
  // Abrir edição
  // ────────────────────────────────────────
  function abrirEdicao(norma) {
    setCodigo(norma.codigo);
    setDescricao(norma.descricao || '');
    setEditandoId(norma.id);
    setMostrando('editar');
    setErro('');
  }

  // ────────────────────────────────────────
  // Buscar
  // ────────────────────────────────────────
  async function handleBuscar(termo) {
    setFiltro(termo);
    await carregarNormas(termo);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* ──── Header ──── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            📋 Gerenciar Normas
          </h1>
          <p className="text-gray-600 mt-2">Adicione, edite ou remova normas de teste</p>
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
            {/* ──── Barra de Busca ──── */}
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                placeholder="Buscar por código ou descrição..."
                value={filtro}
                onChange={(e) => handleBuscar(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setCodigo('');
                  setDescricao('');
                  setEditandoId(null);
                  setMostrando('editar');
                  setErro('');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                + Nova Norma
              </button>
            </div>

            {/* ──── Lista de Normas ──── */}
            {carregando ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando normas...</p>
              </div>
            ) : normas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Nenhuma norma encontrada</p>
                <p className="text-gray-500">Clique em "+ Nova Norma" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {normas.map((norma) => (
                  <div
                    key={norma.id}
                    className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{norma.codigo}</h3>
                      {norma.descricao && (
                        <p className="text-gray-600 text-sm mt-1">{norma.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEdicao(norma)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm font-semibold"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setConfirmandoDelete(norma.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-semibold"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ──── Modo CRIAR/EDITAR ──── */}
        {mostrando === 'editar' && (
          <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editandoId ? '✏️ Editar Norma' : '➕ Nova Norma'}
            </h2>

            <div className="space-y-5">
              {/* Código */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  placeholder="ex: ISO 5470-2"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  placeholder="ex: Abrasion Test"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (editandoId) {
                      handleAtualizar(editandoId);
                    } else {
                      handleCriar();
                    }
                  }}
                  disabled={salvando}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition disabled:opacity-50"
                >
                  {salvando ? '💾 Salvando...' : '💾 Salvar'}
                </button>
                <button
                  onClick={() => {
                    setMostrando('lista');
                    setCodigo('');
                    setDescricao('');
                    setEditandoId(null);
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
              Tem certeza que deseja deletar esta norma? Esta ação não pode ser desfeita.
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
    </div>
  );
}
