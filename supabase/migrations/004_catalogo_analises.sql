-- Catálogo de análises padrão reutilizáveis
-- Cada análise tem nome, norma, specification e tipo de foto.
-- Ao montar uma base de análises, o usuário seleciona do catálogo.
CREATE TABLE IF NOT EXISTS catalogo_analises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(200) NOT NULL,
  norma_id        UUID REFERENCES normas(id) ON DELETE SET NULL,
  specification   TEXT,
  tipo_foto       VARCHAR(20) DEFAULT 'optional',
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_analises_ativo ON catalogo_analises(ativo);
CREATE INDEX IF NOT EXISTS idx_catalogo_analises_norma ON catalogo_analises(norma_id);
