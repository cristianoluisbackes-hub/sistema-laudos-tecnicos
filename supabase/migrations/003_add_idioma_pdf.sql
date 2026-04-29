-- Adicionar coluna idioma_pdf à tabela laudos
ALTER TABLE laudos ADD COLUMN idioma_pdf VARCHAR(10) DEFAULT 'pt-BR';

-- Comentário para documentação
COMMENT ON COLUMN laudos.idioma_pdf IS 'Idioma do PDF do laudo: pt-BR (Português Brasil), en-US (English USA), es-ES (Español), fr-FR (Français)';

-- Índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_laudos_idioma ON laudos(idioma_pdf);
