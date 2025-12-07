-- =====================================================
-- Amiguei.AI - Sistema de Amigos
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela de amizades (friendships)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que não existam duplicatas
  UNIQUE(user_id, friend_id),

  -- Garantir que user_id != friend_id
  CHECK (user_id != friend_id)
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- Habilitar RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem suas próprias amizades
DROP POLICY IF EXISTS "Usuários veem suas próprias amizades" ON friendships;
CREATE POLICY "Usuários veem suas próprias amizades"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Sistema gerencia amizades via função (não permite insert/delete direto)
DROP POLICY IF EXISTS "Sistema gerencia amizades" ON friendships;
CREATE POLICY "Sistema gerencia amizades"
  ON friendships FOR ALL
  USING (false)
  WITH CHECK (false);


-- 2. Criar tabela de solicitações de amizade (friend_requests)
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que não existam duplicatas
  UNIQUE(sender_id, receiver_id),

  -- Garantir que sender_id != receiver_id
  CHECK (sender_id != receiver_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id, status);

-- Habilitar RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem solicitações enviadas e recebidas
DROP POLICY IF EXISTS "Usuários veem solicitações enviadas e recebidas" ON friend_requests;
CREATE POLICY "Usuários veem solicitações enviadas e recebidas"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Usuários podem enviar solicitações
DROP POLICY IF EXISTS "Usuários podem enviar solicitações" ON friend_requests;
CREATE POLICY "Usuários podem enviar solicitações"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Receptores podem atualizar solicitações
DROP POLICY IF EXISTS "Receptores podem atualizar solicitações" ON friend_requests;
CREATE POLICY "Receptores podem atualizar solicitações"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);


-- 3. Criar função para aceitar solicitação de amizade
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sender_id UUID;
  v_receiver_id UUID;
BEGIN
  -- Buscar e validar solicitação
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND status = 'pending' AND receiver_id = auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou você não tem permissão';
  END IF;

  -- Atualizar status da solicitação
  UPDATE friend_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- Criar amizade bidirecional
  INSERT INTO friendships (user_id, friend_id)
  VALUES
    (v_sender_id, v_receiver_id),
    (v_receiver_id, v_sender_id)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Criar função para remover amizade
CREATE OR REPLACE FUNCTION remove_friendship(friend_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_user UUID;
BEGIN
  v_current_user := auth.uid();

  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Deletar amizade bidirecional
  DELETE FROM friendships
  WHERE (user_id = v_current_user AND friend_id = friend_user_id)
     OR (user_id = friend_user_id AND friend_id = v_current_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- QUERIES DE VERIFICAÇÃO
-- =====================================================
-- Verificar se as tabelas foram criadas:
-- SELECT * FROM friendships;
-- SELECT * FROM friend_requests;

-- Verificar suas amizades:
-- SELECT * FROM friendships WHERE user_id = auth.uid();

-- Verificar solicitações recebidas:
-- SELECT * FROM friend_requests WHERE receiver_id = auth.uid() AND status = 'pending';
