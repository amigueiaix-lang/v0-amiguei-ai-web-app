-- =====================================================
-- Amiguei.AI - Atualização para Suporte a Vestidos
-- =====================================================
-- Execute este SQL em seu Supabase SQL Editor
-- Atualiza as tabelas look_feedback e shared_looks para suportar vestidos

-- 1. Atualizar tabela look_feedback
-- Adicionar coluna dress_item_id
ALTER TABLE look_feedback
ADD COLUMN IF NOT EXISTS dress_item_id UUID REFERENCES closet_items(id) ON DELETE CASCADE;

-- Tornar top_item_id e bottom_item_id opcionais (remover NOT NULL)
ALTER TABLE look_feedback
ALTER COLUMN top_item_id DROP NOT NULL;

ALTER TABLE look_feedback
ALTER COLUMN bottom_item_id DROP NOT NULL;

-- Adicionar constraint para garantir que OU (dress) OU (top + bottom) estejam presentes
ALTER TABLE look_feedback
ADD CONSTRAINT look_feedback_items_check
CHECK (
  (dress_item_id IS NOT NULL AND top_item_id IS NULL AND bottom_item_id IS NULL) OR
  (dress_item_id IS NULL AND top_item_id IS NOT NULL AND bottom_item_id IS NOT NULL)
);

-- Criar índice para dress_item_id
CREATE INDEX IF NOT EXISTS idx_look_feedback_dress_item_id ON look_feedback(dress_item_id);

-- Adicionar foreign key name para permitir joins nomeados
-- Nota: A foreign key já foi criada acima, mas vamos nomear explicitamente
-- para facilitar os joins no código

COMMENT ON COLUMN look_feedback.dress_item_id IS 'Item de vestido (opcional, mutuamente exclusivo com top/bottom)';
COMMENT ON COLUMN look_feedback.top_item_id IS 'Item de cima (opcional se dress_item_id estiver presente)';
COMMENT ON COLUMN look_feedback.bottom_item_id IS 'Item de baixo (opcional se dress_item_id estiver presente)';

-- 2. Atualizar tabela shared_looks
-- Adicionar coluna dress_item_id
ALTER TABLE shared_looks
ADD COLUMN IF NOT EXISTS dress_item_id UUID REFERENCES closet_items(id) ON DELETE CASCADE;

-- Tornar top_item_id e bottom_item_id opcionais
ALTER TABLE shared_looks
ALTER COLUMN top_item_id DROP NOT NULL;

ALTER TABLE shared_looks
ALTER COLUMN bottom_item_id DROP NOT NULL;

-- Adicionar constraint para garantir que OU (dress) OU (top + bottom) estejam presentes
ALTER TABLE shared_looks
ADD CONSTRAINT shared_looks_items_check
CHECK (
  (dress_item_id IS NOT NULL AND top_item_id IS NULL AND bottom_item_id IS NULL) OR
  (dress_item_id IS NULL AND top_item_id IS NOT NULL AND bottom_item_id IS NOT NULL)
);

-- Criar índice para dress_item_id
CREATE INDEX IF NOT EXISTS idx_shared_looks_dress_item_id ON shared_looks(dress_item_id);

-- Adicionar comentários
COMMENT ON COLUMN shared_looks.dress_item_id IS 'Item de vestido (opcional, mutuamente exclusivo com top/bottom)';
COMMENT ON COLUMN shared_looks.top_item_id IS 'Item de cima (opcional se dress_item_id estiver presente)';
COMMENT ON COLUMN shared_looks.bottom_item_id IS 'Item de baixo (opcional se dress_item_id estiver presente)';

-- =====================================================
-- VERIFICAÇÃO (execute depois de aplicar o script acima)
-- =====================================================

-- Verificar estrutura da tabela look_feedback
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'look_feedback'
-- AND column_name IN ('dress_item_id', 'top_item_id', 'bottom_item_id');

-- Verificar estrutura da tabela shared_looks
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'shared_looks'
-- AND column_name IN ('dress_item_id', 'top_item_id', 'bottom_item_id');

-- Verificar constraints
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name IN ('look_feedback', 'shared_looks')
-- AND constraint_type = 'CHECK';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Este script é seguro de executar múltiplas vezes (idempotente)
-- 2. Não afeta dados existentes nas tabelas
-- 3. Os constraints garantem integridade dos dados:
--    - Look com vestido: dress_item_id preenchido, top/bottom NULL
--    - Look tradicional: top_item_id e bottom_item_id preenchidos, dress NULL
-- 4. Após aplicar, teste criando:
--    - Um look com vestido
--    - Um look tradicional
--    - Tente criar um look inválido (deve falhar)
