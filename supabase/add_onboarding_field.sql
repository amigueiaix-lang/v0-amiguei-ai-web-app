-- =====================================================
-- Adicionar campo onboarding_completed na tabela users
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna onboarding_completed
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Marcar usuários existentes como tendo completado onboarding
-- (assumindo que se já estão no sistema, já fizeram onboarding)
UPDATE public.users
SET onboarding_completed = TRUE
WHERE created_at < NOW();

-- 3. Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);

-- =====================================================
-- QUERIES DE VERIFICAÇÃO
-- =====================================================
-- Ver estrutura da tabela:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND table_schema = 'public';

-- Ver usuários e status de onboarding:
-- SELECT id, name, email, onboarding_completed, created_at FROM users;
