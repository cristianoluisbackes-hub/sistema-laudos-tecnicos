// lib/laudosServiceSupabase.js
// Serviço para gerenciar laudos no Supabase

import { supabase } from './supabaseClient';

// ============================================
// AUTENTICAÇÃO
// ============================================

export async function registrar(email, senha, nome) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: nome,
        }
      }
    });

    if (error) throw error;

    console.log('✅ Registro bem-sucedido:', email);
    return data; // retorna { user, session } — session é null se email confirmation estiver ativo
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.message);
    throw error;
  }
}
export async function login(email, senha) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) throw error;

    console.log('✅ Login bem-sucedido:', email);
    return data.user;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

export async function loginComGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    console.log('✅ Login Google iniciado');
    return data;
  } catch (error) {
    console.error('❌ Erro ao fazer login com Google:', error.message);
    throw error;
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ Logout realizado');
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error.message);
    throw error;
  }
}

// ============================================
// LAUDOS - CRUD
// ============================================

export async function criarLaudo(laudoData) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    // Gerar número único
    const numero = `LAB-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const { data, error } = await supabase
      .from('laudos')
      .insert({
        numero,
        criador_id: user.id,
        ...laudoData,
        status: 'draft',
      })
      .select();

    if (error) throw error;

    console.log('✅ Laudo criado:', numero);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao criar laudo:', error.message);
    throw error;
  }
}

export async function atualizarLaudo(laudoId, updateData) {
  try {
    const { error } = await supabase
      .from('laudos')
      .update({
        ...updateData,
        atualizado_em: new Date(),
      })
      .eq('id', laudoId);

    if (error) throw error;

    console.log('✅ Laudo atualizado:', laudoId);
  } catch (error) {
    console.error('❌ Erro ao atualizar laudo:', error.message);
    throw error;
  }
}

export async function finalizarLaudo(laudoId, pdfUrl, status = 'approved') {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('laudos')
      .update({
        status,
        pdf_url: pdfUrl,
        finalizado_em: new Date(),
        assinador_por: user.email,
        assinador_em: new Date(),
      })
      .eq('id', laudoId);

    if (error) throw error;

    console.log('✅ Laudo finalizado:', laudoId);
  } catch (error) {
    console.error('❌ Erro ao finalizar laudo:', error.message);
    throw error;
  }
}

export async function meuHistoricoLaudos(filtros = {}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    let query = supabase
      .from('laudos')
      .select('*')
      .eq('criador_id', user.id)
      .order('criado_em', { ascending: false });

    // Aplicar filtros
    if (filtros.cliente) {
      query = query.eq('cliente', filtros.cliente);
    }

    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('✅ Laudos recuperados:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Erro ao recuperar laudos:', error.message);
    return [];
  }
}

export async function getLaudo(laudoId) {
  try {
    const { data, error } = await supabase
      .from('laudos')
      .select('*')
      .eq('id', laudoId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar laudo:', error.message);
    throw error;
  }
}

export async function deletarLaudo(laudoId) {
  try {
    // Primeiro, deletar fotos vinculadas ao laudo
    const { data: analises } = await supabase
      .from('analises')
      .select('foto_url')
      .eq('laudo_id', laudoId);

    if (analises) {
      for (const analise of analises) {
        if (analise.foto_url) {
          // foto_url is a full public URL; storage.remove() needs only the path inside the bucket
          const caminho = analise.foto_url.split('fotos-laudos/')[1];
          if (caminho) await supabase.storage.from('fotos-laudos').remove([caminho]);
        }
      }
    }

    // Deletar PDF
    const { data: laudo } = await supabase
      .from('laudos')
      .select('pdf_url')
      .eq('id', laudoId)
      .single();

    if (laudo?.pdf_url) {
      await supabase.storage.from('pdfs-laudos').remove([laudo.pdf_url]);
    }

    // Deletar laudo (análises serão deletadas automaticamente por CASCADE)
    const { error } = await supabase.from('laudos').delete().eq('id', laudoId);

    if (error) throw error;

    console.log('✅ Laudo deletado:', laudoId);
  } catch (error) {
    console.error('❌ Erro ao deletar laudo:', error.message);
    throw error;
  }
}

export async function duplicarLaudo(laudoOriginalId) {
  try {
    const laudoOriginal = await getLaudo(laudoOriginalId);

    // Remover campos que não devem ser copiados
    const { id, numero, pdf_url, assinador_por, assinador_em, finalizado_em, criado_em, ...laudoDados } =
      laudoOriginal;

    const novoLaudo = await criarLaudo(laudoDados);

    console.log('✅ Laudo duplicado:', novoLaudo.id);

    return novoLaudo;
  } catch (error) {
    console.error('❌ Erro ao duplicar laudo:', error.message);
    throw error;
  }
}

// ============================================
// ANÁLISES
// ============================================

export async function getAnalises(laudoId) {
  try {
    const { data, error } = await supabase
      .from('analises')
      .select('*')
      .eq('laudo_id', laudoId)
      .order('criado_em', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar análises:', error.message);
    throw error;
  }
}

export async function adicionarAnalise(laudoId, analiseData) {
  try {
    const { data, error } = await supabase
      .from('analises')
      .insert({
        laudo_id: laudoId,
        ...analiseData,
      })
      .select();

    if (error) throw error;

    console.log('✅ Análise adicionada');
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao adicionar análise:', error.message);
    throw error;
  }
}

export async function atualizarAnalise(analiseId, updateData) {
  try {
    const { error } = await supabase
      .from('analises')
      .update({
        ...updateData,
        atualizado_em: new Date(),
      })
      .eq('id', analiseId);

    if (error) throw error;

    console.log('✅ Análise atualizada');
  } catch (error) {
    console.error('❌ Erro ao atualizar análise:', error.message);
    throw error;
  }
}

export async function deletarAnalise(analiseId) {
  try {
    const { error } = await supabase.from('analises').delete().eq('id', analiseId);

    if (error) throw error;

    console.log('✅ Análise deletada');
  } catch (error) {
    console.error('❌ Erro ao deletar análise:', error.message);
    throw error;
  }
}

// ============================================
// FOTOS
// ============================================

export async function uploadFoto(laudoId, analiseId, file) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Usuário não autenticado');

    // Validar tamanho (máximo 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Foto muito grande. Máximo 5MB');
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem');
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const caminhoArquivo = `laudos/${user.id}/${laudoId}/analise-${analiseId}-${Date.now()}.${ext}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from('fotos-laudos')
      .upload(caminhoArquivo, file);

    if (uploadError) throw uploadError;

    // Obter URL
    const { data } = supabase.storage.from('fotos-laudos').getPublicUrl(caminhoArquivo);

    console.log('✅ Foto enviada');
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error.message);
    throw error;
  }
}

export async function deletarFoto(caminhoFoto) {
  try {
    const { error } = await supabase.storage.from('fotos-laudos').remove([caminhoFoto]);

    if (error) throw error;

    console.log('✅ Foto deletada');
  } catch (error) {
    console.error('⚠️ Erro ao deletar foto:', error.message);
  }
}

// ============================================
// ESTATÍSTICAS
// ============================================

export async function obterEstatisticas() {
  try {
    const laudos = await meuHistoricoLaudos();

    const total = laudos.length;
    const aprovados = laudos.filter((l) => l.status === 'approved').length;
    const reprovados = laudos.filter((l) => l.status === 'rejected').length;
    const taxa = total > 0 ? Math.round((aprovados / total) * 100) : 0;

    return {
      total,
      aprovados,
      reprovados,
      taxa,
      laudos,
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    return { total: 0, aprovados: 0, reprovados: 0, taxa: 0, laudos: [] };
  }
}

// ============================================
// USUÁRIO
// ============================================

export async function obterDadosUsuario() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      ...data,
    };
  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error.message);
    return null;
  }
}

export async function obterUsuarioLogado() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error('❌ Erro ao obter usuário logado:', error.message);
    return null;
  }
}
