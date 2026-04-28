-- ============================================================
-- MIGRATION 001 — Schema + RLS completo para laudos/analises
-- Execute no: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. Colunas que podem estar faltando em analises ────────
ALTER TABLE analises ADD COLUMN IF NOT EXISTS norma     TEXT;
ALTER TABLE analises ADD COLUMN IF NOT EXISTS tipo_foto TEXT DEFAULT 'optional';
ALTER TABLE analises ADD COLUMN IF NOT EXISTS foto_url  TEXT;

-- ── 2. Habilitar RLS nas tabelas ───────────────────────────
ALTER TABLE laudos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;

-- ── 3. Políticas RLS para tabela: laudos ───────────────────
DROP POLICY IF EXISTS "laudos_select_own" ON laudos;
DROP POLICY IF EXISTS "laudos_insert_own" ON laudos;
DROP POLICY IF EXISTS "laudos_update_own" ON laudos;
DROP POLICY IF EXISTS "laudos_delete_own" ON laudos;

CREATE POLICY "laudos_select_own"
  ON laudos FOR SELECT TO authenticated
  USING (criador_id = auth.uid());

CREATE POLICY "laudos_insert_own"
  ON laudos FOR INSERT TO authenticated
  WITH CHECK (criador_id = auth.uid());

CREATE POLICY "laudos_update_own"
  ON laudos FOR UPDATE TO authenticated
  USING (criador_id = auth.uid())
  WITH CHECK (criador_id = auth.uid());

CREATE POLICY "laudos_delete_own"
  ON laudos FOR DELETE TO authenticated
  USING (criador_id = auth.uid());

-- ── 4. Políticas RLS para tabela: analises ─────────────────
-- Remove qualquer política anterior (incluindo a do último commit)
DROP POLICY IF EXISTS "analises_select_own"                 ON analises;
DROP POLICY IF EXISTS "analises_insert_own"                 ON analises;
DROP POLICY IF EXISTS "analises_update_own"                 ON analises;
DROP POLICY IF EXISTS "analises_delete_own"                 ON analises;
DROP POLICY IF EXISTS "users can insert their own analises" ON analises;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON analises;

CREATE POLICY "analises_select_own"
  ON analises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM laudos
      WHERE laudos.id = analises.laudo_id
        AND laudos.criador_id = auth.uid()
    )
  );

CREATE POLICY "analises_insert_own"
  ON analises FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM laudos
      WHERE laudos.id = analises.laudo_id
        AND laudos.criador_id = auth.uid()
    )
  );

CREATE POLICY "analises_update_own"
  ON analises FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM laudos
      WHERE laudos.id = analises.laudo_id
        AND laudos.criador_id = auth.uid()
    )
  );

CREATE POLICY "analises_delete_own"
  ON analises FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM laudos
      WHERE laudos.id = analises.laudo_id
        AND laudos.criador_id = auth.uid()
    )
  );

-- ── 5. Políticas RLS para tabela: users ────────────────────
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_select_own"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── 6. Políticas de storage para bucket: fotos-laudos ──────
-- (o bucket deve existir e estar marcado como Public no Dashboard)
DROP POLICY IF EXISTS "auth_upload_fotos" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_fotos"   ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_fotos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_fotos" ON storage.objects;

-- Upload: só usuários autenticados
CREATE POLICY "auth_upload_fotos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos-laudos');

-- Leitura autenticada (acesso interno)
CREATE POLICY "auth_read_fotos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fotos-laudos');

-- Delete: só usuários autenticados
CREATE POLICY "auth_delete_fotos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos-laudos');

-- Leitura pública (necessária para <img src="..."> funcionar no browser)
CREATE POLICY "public_read_fotos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'fotos-laudos');
