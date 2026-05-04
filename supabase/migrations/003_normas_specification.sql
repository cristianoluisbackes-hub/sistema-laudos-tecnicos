-- Adiciona campo specification à tabela normas
-- Permite cadastrar a especificação padrão de cada norma,
-- que é auto-preenchida ao selecionar a norma em uma base de análises.
ALTER TABLE normas ADD COLUMN IF NOT EXISTS specification TEXT;
