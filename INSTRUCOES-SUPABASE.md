# 🗄️ Instruções para Configurar o Supabase

## ⚠️ IMPORTANTE: Execute este SQL ANTES de fazer o deploy!

Você precisa adicionar um campo `onboarding_completed` na tabela `users` do Supabase.

---

## 📋 Passo a Passo:

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto do Amiguei.AI

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **SQL Editor**
- Ou clique no ícone de **{}** (SQL)

### 3. Cole e Execute o SQL

Copie e cole este código SQL completo:

```sql
-- =====================================================
-- Adicionar campo onboarding_completed na tabela users
-- =====================================================

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
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public';

-- Ver usuários e status de onboarding:
SELECT id, name, email, onboarding_completed, created_at FROM users;
```

### 4. Clique em RUN (ou pressione Ctrl+Enter)

Você deve ver uma mensagem de sucesso indicando que as queries foram executadas.

### 5. Verificar se funcionou

Execute esta query para verificar:

```sql
SELECT id, name, email, onboarding_completed, created_at
FROM public.users
LIMIT 10;
```

Você deve ver a coluna `onboarding_completed` com valor `true` para usuários existentes.

---

## ✅ Pronto!

Agora você pode fazer o deploy das mudanças no servidor.

---

## 🚀 Deploy no Servidor

Depois de executar o SQL acima, faça o deploy:

```bash
ssh root@72.60.48.18

cd /var/www/amiguei
git pull origin main
npm run build
pm2 restart amiguei
pm2 logs amiguei --lines 30
```

---

## 🧪 Como Testar

### Testar "Esqueci minha senha":
1. Acesse https://amiguei.com.br/login
2. Clique em "Esqueceu a senha?"
3. Digite seu email
4. Verifique o email (pode ir para spam)
5. Clique no link do email
6. Defina uma nova senha

### Testar Onboarding:
1. Faça login com um usuário que JÁ completou o onboarding
2. Deve ir direto para `/closet` (não pede onboarding de novo!)
3. Crie uma conta nova
4. Deve pedir o onboarding
5. Depois de completar, faça logout e login novamente
6. Deve ir direto para `/closet` (não pede onboarding de novo!)

---

## 📝 Arquivos Criados

- `/app/forgot-password/page.tsx` - Página de recuperação de senha
- `/app/reset-password/page.tsx` - Página de redefinição de senha
- `/supabase/add_onboarding_field.sql` - Migration SQL
- Atualizações em:
  - `/app/login/page.tsx` - Verifica onboarding_completed
  - `/app/finalizing/page.tsx` - Marca onboarding como completado

---

**Commit:** `df24269` - "feat: Add forgot password flow and fix onboarding redirect logic"
