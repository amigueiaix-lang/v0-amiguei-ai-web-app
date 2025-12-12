-- =====================================================
-- Amiguei.AI - Tabela de Closet Items
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Dropar constraint antiga se existir
ALTER TABLE IF EXISTS closet_items
  DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

-- 2. Criar ou recriar a tabela closet_items
CREATE TABLE IF NOT EXISTS closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);

-- 4. Habilitar Row Level Security
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Usuários só podem ver/modificar seus próprios itens

-- Policy: Usuários podem ver apenas seus próprios itens
DROP POLICY IF EXISTS "Usuários podem ver próprios itens" ON closet_items;
CREATE POLICY "Usuários podem ver próprios itens"
  ON closet_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir seus próprios itens
DROP POLICY IF EXISTS "Usuários podem inserir próprios itens" ON closet_items;
CREATE POLICY "Usuários podem inserir próprios itens"
  ON closet_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios itens
DROP POLICY IF EXISTS "Usuários podem atualizar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem atualizar próprios itens"
  ON closet_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios itens
DROP POLICY IF EXISTS "Usuários podem deletar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem deletar próprios itens"
  ON closet_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Trigger para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION update_closet_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS closet_items_updated_at ON closet_items;
CREATE TRIGGER closet_items_updated_at
  BEFORE UPDATE ON closet_items
  FOR EACH ROW
  EXECUTE FUNCTION update_closet_items_updated_at();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar se a tabela foi criada corretamente:
-- SELECT * FROM closet_items;

-- Verificar se a FK está correta:
-- SELECT conname, contype, confrelid::regclass AS foreign_table
-- FROM pg_constraint
-- WHERE conrelid = 'closet_items'::regclass;

-- =====================================================
-- IMPORTANTE: Storage Bucket
-- =====================================================
-- Certifique-se de que o bucket 'closet-images' existe com estas policies:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('closet-images', 'closet-images', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Usuários podem fazer upload de imagens do closet"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Imagens do closet são publicamente acessíveis"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'closet-images');
--
-- CREATE POLICY "Usuários podem atualizar próprias imagens"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Usuários podem deletar próprias imagens"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
