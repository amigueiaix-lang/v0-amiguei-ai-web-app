# 🗄️ SQL COMPLETO - Resolver Tudo Automaticamente

Execute este SQL **EXATO** no Supabase e pronto! Não precisa fazer mais nada!

---

## ✅ PASSO 1: Abrir SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Amiguei.AI**
3. No menu lateral esquerdo, clique em **SQL Editor** (ícone `{}`)
4. Clique em **"New Query"** (botão azul)

---

## ✅ PASSO 2: Copiar e Colar Este SQL

**COPIE TUDO ABAIXO E COLE NO SUPABASE:**

```sql
-- =====================================================
-- RESOLVER TUDO - Adicionar onboarding_completed
-- =====================================================

-- 1. Adicionar coluna onboarding_completed se não existir
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Atualizar usuários existentes como completados
UPDATE public.users
SET onboarding_completed = TRUE
WHERE created_at IS NOT NULL;

-- 3. Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_users_onboarding
ON public.users(onboarding_completed);

-- 4. Verificar se funcionou
SELECT
  id,
  email,
  name,
  onboarding_completed,
  created_at
FROM public.users
LIMIT 10;
```

---

## ✅ PASSO 3: Executar o SQL

1. **Cole todo o código acima** no editor do Supabase
2. Clique no botão **RUN** (ou pressione **Ctrl+Enter**)
3. Aguarde alguns segundos

---

## ✅ Resultado Esperado

Você deve ver:

```
Query executed successfully
10 rows returned
```

E uma tabela mostrando seus usuários com a coluna `onboarding_completed` = `true`

---

## 🎯 O que este SQL faz:

1. ✅ Adiciona a coluna `onboarding_completed` na tabela `users`
2. ✅ Marca TODOS os usuários existentes como tendo completado o onboarding
3. ✅ Cria um índice para buscas rápidas
4. ✅ Mostra os primeiros 10 usuários para verificar se funcionou

---

## 🚀 Depois que executar:

1. Acesse: https://amiguei.com.br/login
2. Teste **"Esqueceu a senha?"** - deve enviar email
3. Faça login com um usuário existente - deve ir direto para `/closet`
4. Crie uma conta nova - deve pedir onboarding
5. Complete onboarding - depois faça logout e login novamente
6. Deve ir direto para `/closet` (não pede onboarding de novo!)

---

## ⚠️ Se der erro:

Se o SQL retornar algum erro, copie o **mensagem de erro completa** e me mostre!

Mas 99% das vezes funciona na primeira! 🎉

---

**EXECUTE AGORA E ME AVISA QUANDO TERMINAR!**
