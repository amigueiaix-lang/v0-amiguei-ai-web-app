-- =====================================================
-- Amiguei.AI - Tabela Pública de Usuários
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela pública de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- 3. Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Todos podem ver perfis de outros usuários (necessário para busca de amigos)
DROP POLICY IF EXISTS "Usuários podem ver perfis públicos" ON users;
CREATE POLICY "Usuários podem ver perfis públicos"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON users;
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Trigger para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 6. Função para sincronizar auth.users -> public.users
CREATE OR REPLACE FUNCTION sync_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', users.name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_public();

-- 8. Migrar usuários existentes de auth.users para public.users
INSERT INTO public.users (id, email, name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Usuário')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- QUERIES DE VERIFICAÇÃO
-- =====================================================
-- Verificar se a tabela foi criada:
-- SELECT * FROM users;

-- Ver quantos usuários foram migrados:
-- SELECT COUNT(*) FROM users;

-- Testar busca de usuários (como o sistema de amigos faz):
-- SELECT id, name, email FROM users WHERE name ILIKE '%nome%' OR email ILIKE '%email%';
