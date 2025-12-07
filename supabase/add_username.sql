-- =====================================================
-- Amiguei.AI - Adicionar Username (estilo Instagram)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna username na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Criar índice para buscas rápidas por username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3. Função para gerar username temporário baseado no nome
CREATE OR REPLACE FUNCTION generate_temp_username(user_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  temp_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Remover acentos e caracteres especiais, converter para minúsculo
  base_username := LOWER(
    REGEXP_REPLACE(
      TRANSLATE(
        user_name,
        'àáâãäåèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ',
        'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC'
      ),
      '[^a-z0-9]',
      '',
      'g'
    )
  );

  -- Se ficou vazio, usar 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Adicionar parte do UUID para garantir unicidade
  temp_username := base_username || SUBSTRING(user_id::text, 1, 6);

  RETURN temp_username;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar usuários existentes com username temporário
UPDATE public.users
SET username = generate_temp_username(name, id)
WHERE username IS NULL;

-- 5. Tornar username obrigatório após migração
ALTER TABLE public.users
ALTER COLUMN username SET NOT NULL;

-- 6. Adicionar constraint para garantir formato correto do username
ALTER TABLE public.users
ADD CONSTRAINT username_format_check
CHECK (username ~ '^[a-z0-9._]+$' AND LENGTH(username) >= 3 AND LENGTH(username) <= 30);

-- 7. Atualizar função de sincronização para incluir username
CREATE OR REPLACE FUNCTION sync_user_to_public()
RETURNS TRIGGER AS $$
DECLARE
  temp_username TEXT;
BEGIN
  -- Gerar username temporário se não existir no metadata
  temp_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    generate_temp_username(
      COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
      NEW.id
    )
  );

  INSERT INTO public.users (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    temp_username
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    username = COALESCE(NEW.raw_user_meta_data->>'username', users.username),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Adicionar policy para verificar unicidade do username
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON users;
CREATE POLICY "Usuários podem inserir próprio perfil"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- QUERIES DE VERIFICAÇÃO
-- =====================================================
-- Ver todos os usuários com username:
-- SELECT id, name, username, email FROM users;

-- Buscar usuário por username:
-- SELECT id, name, username FROM users WHERE username = 'exemplo';

-- Verificar se username está disponível:
-- SELECT NOT EXISTS (SELECT 1 FROM users WHERE username = 'nomedeusuario') AS disponivel;
