-- =====================================================
-- SQL COMPLETO - RESOLVER CLOSET
-- Execute este arquivo COMPLETO de uma vez
-- =====================================================

-- PASSO 1: Remover constraints problemáticas
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS email_unique;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_unique;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS unique_email;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS unique_username;

-- Criar índices (não únicos) para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- PASSO 2: Sincronizar usuários
INSERT INTO public.users (id, email, name, username)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(
    au.raw_user_meta_data->>'username',
    LOWER(REPLACE(SPLIT_PART(au.email, '@', 1), '.', '_'))
  )
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, public.users.name),
  username = COALESCE(EXCLUDED.username, public.users.username),
  updated_at = NOW();

-- PASSO 3: Corrigir closet_items
CREATE TABLE IF NOT EXISTS closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE closet_items DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

ALTER TABLE closet_items
  ADD CONSTRAINT closet_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);

-- PASSO 4: RLS Policies
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprios itens" ON closet_items;
CREATE POLICY "Usuários podem ver próprios itens"
  ON closet_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir próprios itens" ON closet_items;
CREATE POLICY "Usuários podem inserir próprios itens"
  ON closet_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem atualizar próprios itens"
  ON closet_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem deletar próprios itens"
  ON closet_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PASSO 5: Trigger updated_at
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
  FOR EACH ROW EXECUTE FUNCTION update_closet_items_updated_at();

-- PASSO 6: Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-images', 'closet-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Usuários podem fazer upload de imagens do closet" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de imagens do closet"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Imagens do closet são publicamente acessíveis" ON storage.objects;
CREATE POLICY "Imagens do closet são publicamente acessíveis"
ON storage.objects FOR SELECT USING (bucket_id = 'closet-images');

DROP POLICY IF EXISTS "Usuários podem atualizar próprias imagens" ON storage.objects;
CREATE POLICY "Usuários podem atualizar próprias imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários podem deletar próprias imagens" ON storage.objects;
CREATE POLICY "Usuários podem deletar próprias imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
