# 🔧 RESOLVER ERRO DO CLOSET

## ❌ Erro Atual
```
Erro ao adicionar item: insert or update on table "closet_items"
violates foreign key constraint "closet_items_user_id_fkey"
```

## 🎯 Causa do Problema

O erro acontece porque a tabela `closet_items` tem uma foreign key que referencia `public.users(id)`, mas:

1. **Usuário pode não estar em `public.users`**: O trigger de sincronização pode ter falhado
2. **Foreign key pode estar configurada errado**: Apontando para a tabela errada

## ✅ SOLUÇÃO COMPLETA

Execute estes comandos **em ordem** no **Supabase SQL Editor**:

### PASSO 1: Sincronizar TODOS os usuários de auth.users para public.users

```sql
-- Garantir que TODOS os usuários de auth.users estão em public.users
INSERT INTO public.users (id, email, name, username)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(au.raw_user_meta_data->>'username', LOWER(REPLACE(au.email, '@', '_')))
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

### PASSO 2: Corrigir a tabela closet_items

```sql
-- Dropar constraint antiga se existir
ALTER TABLE IF EXISTS closet_items
  DROP CONSTRAINT IF EXISTS closet_items_user_id_fkey;

-- Criar ou recriar a tabela closet_items com a FK correta
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
  ADD CONSTRAINT closet_items_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);
```

### PASSO 3: Configurar RLS (Row Level Security)

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

### PASSO 4: Trigger para atualizar updated_at

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

### PASSO 5: Configurar Storage Bucket (se ainda não existir)

```sql
-- Criar bucket para imagens do closet
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-images', 'closet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Upload de imagens
DROP POLICY IF EXISTS "Usuários podem fazer upload de imagens do closet" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload de imagens do closet"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Ver imagens (público)
DROP POLICY IF EXISTS "Imagens do closet são publicamente acessíveis" ON storage.objects;
CREATE POLICY "Imagens do closet são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'closet-images');

-- Policy: Atualizar próprias imagens
DROP POLICY IF EXISTS "Usuários podem atualizar próprias imagens" ON storage.objects;
CREATE POLICY "Usuários podem atualizar próprias imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Deletar próprias imagens
DROP POLICY IF EXISTS "Usuários podem deletar próprias imagens" ON storage.objects;
CREATE POLICY "Usuários podem deletar próprias imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🧪 VERIFICAÇÃO

Depois de executar todos os passos, rode estas queries para verificar:

```sql
-- 1. Verificar usuários em public.users
SELECT COUNT(*) as total_usuarios FROM public.users;

-- 2. Verificar se a FK está correta
SELECT
  conname as constraint_name,
  confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conrelid = 'closet_items'::regclass
  AND contype = 'f';

-- 3. Verificar itens do closet
SELECT * FROM closet_items LIMIT 10;

-- 4. Verificar se seu usuário existe em public.users
SELECT id, email, name, username
FROM public.users
WHERE id = auth.uid();
```

## 🎉 Pronto!

Depois de executar todos esses comandos SQL, o erro deve estar resolvido e você poderá adicionar peças ao closet normalmente!

## 📱 Como Testar

1. Acesse https://amiguei.com.br
2. Faça login
3. Vá para "Meu Closet"
4. Clique em "Adicionar Peça"
5. Preencha os campos e adicione uma foto
6. Clique em "Adicionar"
7. ✅ Deve funcionar sem erros!
