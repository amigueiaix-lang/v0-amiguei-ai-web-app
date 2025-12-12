# 🔧 RESOLVER ERRO DO CLOSET - PRESERVANDO DADOS

## ✅ Esta versão PRESERVA todos os itens do closet existentes

Execute estes comandos **EM ORDEM** no **Supabase SQL Editor**:

---

## PASSO 1: Remover constraint problemática de email único

```sql
-- Remover a constraint de email único que está causando conflito
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Criar um índice (não único) para performance de buscas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
```

---

## PASSO 2: Sincronizar usuários de auth.users para public.users

```sql
-- Sincronizar TODOS os usuários sem erro de email duplicado
INSERT INTO public.users (id, email, name, username)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(au.raw_user_meta_data->>'username', LOWER(REPLACE(SPLIT_PART(au.email, '@', 1), '.', '_')))
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, public.users.name),
  username = COALESCE(EXCLUDED.username, public.users.username),
  updated_at = NOW();

-- Verificar quantos usuários foram sincronizados
SELECT COUNT(*) as total_usuarios FROM public.users;
```

---

## PASSO 3: Corrigir tabela closet_items (SEM DELETAR DADOS)

```sql
-- Criar a tabela SE NÃO EXISTIR (não afeta dados existentes)
CREATE TABLE IF NOT EXISTS closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remover constraint antiga (se existir)
ALTER TABLE closet_items
  DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

-- Adicionar a constraint CORRETA apontando para public.users
ALTER TABLE closet_items
  ADD CONSTRAINT closet_items_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);
```

---

## PASSO 4: Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas antes de criar novas
DROP POLICY IF EXISTS "Usuários podem ver próprios itens" ON closet_items;
DROP POLICY IF EXISTS "Usuários podem inserir próprios itens" ON closet_items;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios itens" ON closet_items;
DROP POLICY IF EXISTS "Usuários podem deletar próprios itens" ON closet_items;

-- Policy: Ver próprios itens
CREATE POLICY "Usuários podem ver próprios itens"
  ON closet_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Inserir próprios itens
CREATE POLICY "Usuários podem inserir próprios itens"
  ON closet_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Atualizar próprios itens
CREATE POLICY "Usuários podem atualizar próprios itens"
  ON closet_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Deletar próprios itens
CREATE POLICY "Usuários podem deletar próprios itens"
  ON closet_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## PASSO 5: Trigger para auto-atualizar updated_at

```sql
-- Criar ou substituir a função
CREATE OR REPLACE FUNCTION update_closet_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger antigo e criar novo
DROP TRIGGER IF EXISTS closet_items_updated_at ON closet_items;
CREATE TRIGGER closet_items_updated_at
  BEFORE UPDATE ON closet_items
  FOR EACH ROW
  EXECUTE FUNCTION update_closet_items_updated_at();
```

---

## PASSO 6: Configurar Storage Bucket para imagens do closet

```sql
-- Criar bucket para imagens do closet
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-images', 'closet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Dropar policies antigas antes de criar novas
DROP POLICY IF EXISTS "Usuários podem fazer upload de imagens do closet" ON storage.objects;
DROP POLICY IF EXISTS "Imagens do closet são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar próprias imagens" ON storage.objects;

-- Policy: Upload de imagens
CREATE POLICY "Usuários podem fazer upload de imagens do closet"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Ver imagens (público)
CREATE POLICY "Imagens do closet são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'closet-images');

-- Policy: Atualizar próprias imagens
CREATE POLICY "Usuários podem atualizar próprias imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Deletar próprias imagens
CREATE POLICY "Usuários podem deletar próprias imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 VERIFICAÇÃO FINAL

Execute estas queries para verificar se tudo está funcionando:

```sql
-- 1. Verificar total de usuários sincronizados
SELECT COUNT(*) as total_usuarios FROM public.users;

-- 2. Verificar se o usuário terres.nina@gmail.com existe
SELECT id, email, name, username
FROM public.users
WHERE email = 'terres.nina@gmail.com';

-- 3. Verificar constraints da tabela closet_items
SELECT
  conname as constraint_name,
  contype as constraint_type,
  confrelid::regclass as foreign_table,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'closet_items'::regclass;

-- 4. Verificar se há itens no closet (PRESERVADOS)
SELECT COUNT(*) as total_itens_closet FROM closet_items;

-- 5. Verificar seus próprios itens do closet
SELECT id, name, category, created_at
FROM closet_items
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 6. Verificar se você consegue buscar seu perfil
SELECT id, email, name, username
FROM public.users
WHERE id = auth.uid();
```

---

## 🎯 O que este SQL faz (SEM DELETAR DADOS):

✅ Remove apenas a constraint problemática de email único
✅ Sincroniza usuários de auth.users → public.users
✅ **PRESERVA todos os itens do closet existentes**
✅ Ajusta apenas a foreign key constraint
✅ Configura RLS para segurança
✅ Configura storage bucket
✅ Cria índices para performance

---

## 📱 Teste Final

Depois de executar todos os passos:

1. Acesse https://amiguei.com.br
2. Faça login com `terres.nina@gmail.com`
3. Vá para "Meu Closet"
4. Verifique se seus itens antigos ainda estão lá ✅
5. Tente adicionar uma nova peça
6. ✅ Deve funcionar sem erros!

---

## ⚠️ Importante

Este SQL **NÃO deleta nenhum dado**. Apenas:
- Ajusta constraints
- Adiciona policies de segurança
- Sincroniza usuários

**Todos os itens do closet serão preservados!** 🎉
