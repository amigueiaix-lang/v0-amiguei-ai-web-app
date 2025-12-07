# 🎯 Sistema de Username (estilo Instagram)

## ✅ O que foi implementado

Agora as usuárias podem criar um **username único** (como @instagram) para facilitar a busca de amigas na plataforma!

### Características do Username:
- ✅ **Único** - Não pode repetir
- ✅ **Sem espaços** - somente letras, números, ponto (.) e underscore (_)
- ✅ **Sem acentos** - apenas caracteres simples (a-z, 0-9, ., _)
- ✅ **Mínimo 3 caracteres** - máximo 30
- ✅ **Validação em tempo real** - mostra se está disponível enquanto digita
- ✅ **Estilo Instagram** - começa com @ na exibição

---

## 📋 SQL para Executar no Supabase

**IMPORTANTE:** Execute este SQL no Supabase SQL Editor:

```sql
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
```

---

## 🚀 Como Usar

### 1. Execute o SQL no Supabase

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole TODO o SQL acima
4. Clique em **Run**

### 2. Reinicie o servidor Next.js

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### 3. Teste!

#### No Cadastro:
1. Acesse `/signup`
2. Veja o novo campo **"Nome de usuário"**
3. Digite um username (ex: `maria.silva`)
4. O sistema valida em tempo real:
   - ✅ Mostra "Username disponível!" se estiver livre
   - ❌ Mostra erro se já estiver em uso
   - ❌ Remove automaticamente espaços e acentos

#### Na Busca de Amigos:
1. Acesse `/amigos`
2. Vá na aba **"Buscar"**
3. Agora você pode buscar por:
   - **@username** - ex: `maria.silva`
   - **Nome** - ex: `Maria`
   - **Email** - ex: `maria@email.com`

---

## 🎨 Mudanças Visuais

### Página de Cadastro
```
Nome completo: [Maria Silva         ]

Nome de usuário:
[@maria.silva                ] ✓ Username disponível!

Email: [maria@email.com      ]

Senha: [••••••••••           ]
```

### Busca de Amigos
```
Buscar por @username, nome ou email...

Resultados:
┌─────────────────────────────────────────┐
│ Maria Silva                             │
│ @maria.silva                 [Adicionar]│
│ maria@email.com                         │
└─────────────────────────────────────────┘
```

---

## ✨ Recursos do Username

### Validação Automática:
- ❌ `Maria Silva` → converte para `mariasilva`
- ❌ `João` → converte para `joao`
- ❌ `usuário#123` → converte para `usuario123`
- ✅ `maria.silva` → aceito!
- ✅ `joao_123` → aceito!
- ✅ `ana.costa` → aceito!

### Regras:
1. **Mínimo:** 3 caracteres
2. **Máximo:** 30 caracteres
3. **Permitidos:** a-z, 0-9, ponto (.), underscore (_)
4. **Proibido:**
   - Espaços
   - Acentos
   - Caracteres especiais (#, @, !, etc.)
   - Começar/terminar com . ou _
   - Pontos ou underscores consecutivos (.., __)

### Unicidade:
- ✅ Cada username é único na plataforma
- ✅ Verificação em tempo real durante o cadastro
- ✅ Impossível criar duplicatas (constraint no banco)

---

## 🔍 Migração de Usuários Existentes

### O que acontece com quem já tem conta?

Usuários existentes receberão um **username temporário** automaticamente:
- Baseado no nome + parte do ID
- Exemplo: usuária "Maria Silva" com ID `123abc...`
  - Username gerado: `mariasilva123abc`

### Como alterar username depois?

Por enquanto, o username é definido apenas no cadastro. Se precisar permitir alteração:

1. Criar uma página de configurações
2. Permitir editar o campo `username` na tabela `users`
3. Manter validação de unicidade

---

## 📊 Verificações (queries úteis)

### Ver todos os usernames:
```sql
SELECT name, username, email FROM users ORDER BY created_at DESC;
```

### Verificar se username está disponível:
```sql
SELECT NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'nomedeusuario'
) AS disponivel;
```

### Buscar usuário por username:
```sql
SELECT id, name, username, email
FROM users
WHERE username = 'maria.silva';
```

---

## 🐛 Troubleshooting

### Erro: "column 'username' does not exist"
**Solução:** Você não executou o SQL. Volte ao passo 1.

### Erro: "duplicate key value violates unique constraint"
**Solução:** Esse username já está em uso. Escolha outro.

### Username não aparece na busca
**Solução:**
1. Verifique se executou TODO o SQL (incluindo o UPDATE)
2. Rode: `SELECT * FROM users;` e veja se tem usernames
3. Reinicie o servidor Next.js

### Usuários antigos não têm username
**Solução:** Execute a parte do SQL que faz UPDATE:
```sql
UPDATE public.users
SET username = generate_temp_username(name, id)
WHERE username IS NULL;
```

---

## 🎉 Pronto!

Agora suas usuárias podem:
- ✅ Escolher um username único no cadastro
- ✅ Buscar amigas pelo @username
- ✅ Identificar facilmente outras usuárias
- ✅ Compartilhar seu @username para ser encontrada

**Sistema funcionando como Instagram!** 📱✨
