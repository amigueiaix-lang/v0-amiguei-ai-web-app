# 🔧 RESOLVER ERRO DO CLOSET - VERSÃO CORRIGIDA

## ❌ Novo Erro Encontrado
```
ERROR: 23505: duplicate key value violates unique constraint "users_email_key"
DETAIL: Key (email)=(terres.nina@gmail.com) already exists.
```

## ✅ SOLUÇÃO CORRIGIDA

Execute estes comandos **EM ORDEM** no **Supabase SQL Editor**:

### PASSO 1: Sincronizar usuários corretamente (SEM duplicar emails)

```sql
-- Sincronizar TODOS os usuários de auth.users para public.users
-- Usando UPSERT baseado no ID (não no email)
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

### PASSO 2: Verificar se a constraint da tabela users está correta

```sql
-- Ver todas as constraints da tabela users
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;
```

### PASSO 3: REMOVER constraint de email único (SE EXISTIR e estiver causando problema)

```sql
-- Apenas execute isso se a constraint users_email_key existir
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Manter apenas a constraint de ID único (que é a primary key)
-- E criar um índice (não unique) para email para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
```

### PASSO 4: Corrigir tabela closet_items

```sql
-- Dropar constraint antiga se existir
ALTER TABLE IF EXISTS closet_items DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

-- Verificar se a tabela existe, se não existir, criar
CREATE TABLE IF NOT EXISTS closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar a foreign key correta para public.users
ALTER TABLE closet_items
  DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

ALTER TABLE closet_items
  ADD CONSTRAINT closet_items_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);
```

### PASSO 5: Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

-- Policy: Ver próprios itens
DROP POLICY IF EXISTS "Usuários podem ver próprios itens" ON closet_items;
CREATE POLICY "Usuários podem ver próprios itens"
  ON closet_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Inserir próprios itens
DROP POLICY IF EXISTS "Usuários podem inserir próprios itens" ON closet_items;
CREATE POLICY "Usuários podem inserir próprios itens"
  ON closet_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Atualizar próprios itens
DROP POLICY IF EXISTS "Usuários podem atualizar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem atualizar próprios itens"
  ON closet_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Deletar próprios itens
DROP POLICY IF EXISTS "Usuários podem deletar próprios itens" ON closet_items;
CREATE POLICY "Usuários podem deletar próprios itens"
  ON closet_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### PASSO 6: Trigger para atualizar updated_at

```sql
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
```

### PASSO 7: Configurar Storage Bucket

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

## 🧪 VERIFICAÇÃO FINAL

```sql
-- 1. Verificar usuários em public.users
SELECT COUNT(*) as total_usuarios FROM public.users;

-- 2. Verificar constraints da tabela users
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- 3. Verificar se a FK do closet_items está correta
SELECT
  conname as constraint_name,
  confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conrelid = 'closet_items'::regclass AND contype = 'f';

-- 4. Verificar se SEU usuário específico existe
SELECT id, email, name, username
FROM public.users
WHERE email = 'terres.nina@gmail.com';

-- 5. Testar se você consegue buscar seu próprio perfil
SELECT id, email, name
FROM public.users
WHERE id = auth.uid();
```

## 🎯 Ordem de Execução

Execute os passos EXATAMENTE nesta ordem:
1. ✅ PASSO 1 - Sincronizar usuários
2. ✅ PASSO 2 - Verificar constraints
3. ✅ PASSO 3 - Remover constraint problemática
4. ✅ PASSO 4 - Corrigir closet_items
5. ✅ PASSO 5 - RLS policies
6. ✅ PASSO 6 - Trigger updated_at
7. ✅ PASSO 7 - Storage bucket
8. ✅ VERIFICAÇÃO FINAL

## 📱 Teste Final

Depois de executar tudo:
1. Acesse https://amiguei.com.br
2. Faça login com terres.nina@gmail.com
3. Vá para "Meu Closet"
4. Clique em "Adicionar Peça"
5. ✅ Deve funcionar!
