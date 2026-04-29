-- ============================================
-- TABELA: normas
-- ============================================
CREATE TABLE IF NOT EXISTS normas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID, -- Null por enquanto (futuro: multi-empresa)
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Index para busca por código
CREATE INDEX IF NOT EXISTS idx_normas_codigo ON normas(codigo);
CREATE INDEX IF NOT EXISTS idx_normas_ativo ON normas(ativo);

-- ============================================
-- TABELA: templates (dinâmica)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20) DEFAULT 'blue',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Index para busca
CREATE INDEX IF NOT EXISTS idx_templates_nome ON templates(nome);
CREATE INDEX IF NOT EXISTS idx_templates_ativo ON templates(ativo);

-- ============================================
-- TABELA: template_analises (relação)
-- ============================================
CREATE TABLE IF NOT EXISTS template_analises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  norma_id UUID REFERENCES normas(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  specification VARCHAR(50),
  tipo_foto VARCHAR(20) DEFAULT 'optional',
  ordem INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Index para buscas
CREATE INDEX IF NOT EXISTS idx_template_analises_template_id ON template_analises(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analises_norma_id ON template_analises(norma_id);
CREATE INDEX IF NOT EXISTS idx_template_analises_ordem ON template_analises(template_id, ordem);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir normas padrão
INSERT INTO normas (codigo, descricao) VALUES
  ('ISO 5470-2', 'Abrasion Test'),
  ('ISO 105-X12', 'Color Fastness to Rubbing'),
  ('ISO 6775', 'Tearing Strength'),
  ('ISO 105-B02', 'Color Fastness to Light'),
  ('ISO 3071', 'pH Test')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir templates padrão
INSERT INTO templates (nome, descricao, cor) VALUES
  ('Laudo Completo Couro', '5 análises — bateria padrão para couro acabado', 'blue'),
  ('Teste Rápido', '2 análises essenciais — aprovação rápida', 'green'),
  ('Custom – Montar do Zero', 'Sem análises pré-configuradas', 'gray')
ON CONFLICT DO NOTHING;

-- Inserir análises para "Laudo Completo Couro"
INSERT INTO template_analises (template_id, norma_id, nome, specification, tipo_foto, ordem)
SELECT 
  t.id,
  n.id,
  a.nome,
  a.specification,
  a.tipo_foto,
  a.ordem
FROM templates t
CROSS JOIN LATERAL (
  VALUES
    ('Abrasion Wet', 'ISO 5470-2', '>3.5', 'required', 1),
    ('Crocking Wet', 'ISO 105-X12', '>3', 'optional', 2),
    ('Tearing Strength', 'ISO 6775', '>15', 'none', 3),
    ('Tensile Strength', 'ISO 6775', '>100', 'none', 4),
    ('Color Fastness Light', 'ISO 105-B02', '>4', 'optional', 5)
) AS a(nome, norma_codigo, specification, tipo_foto, ordem)
LEFT JOIN normas n ON n.codigo = a.norma_codigo
WHERE t.nome = 'Laudo Completo Couro'
ON CONFLICT DO NOTHING;

-- Inserir análises para "Teste Rápido"
INSERT INTO template_analises (template_id, norma_id, nome, specification, tipo_foto, ordem)
SELECT 
  t.id,
  n.id,
  a.nome,
  a.specification,
  a.tipo_foto,
  a.ordem
FROM templates t
CROSS JOIN LATERAL (
  VALUES
    ('Abrasion Wet', 'ISO 5470-2', '>3.5', 'required', 1),
    ('Tearing Strength', 'ISO 6775', '>15', 'none', 2)
) AS a(nome, norma_codigo, specification, tipo_foto, ordem)
LEFT JOIN normas n ON n.codigo = a.norma_codigo
WHERE t.nome = 'Teste Rápido'
ON CONFLICT DO NOTHING;
