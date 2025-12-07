# 🔧 Instruções para Corrigir Erro 404 - Sistema de Amigos

## 🎯 Problema Identificado

O erro 404 acontece porque:
1. ❌ A tabela pública `users` não existe (apenas `auth.users` privada existe)
2. ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` está configurada com role `service_role` (deveria ser `anon`)
3. ❌ `SUPABASE_SERVICE_ROLE_KEY` está ausente

## ✅ Solução (3 Passos Simples)

---

### 📋 **PASSO 1: Executar SQL no Supabase**

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie TODO o conteúdo do arquivo: **`supabase/users_table.sql`**
5. Cole no editor SQL
6. Clique em **Run** (ou Ctrl+Enter)

**O que esse SQL faz:**
- ✅ Cria tabela pública `users` com id, email, name
- ✅ Cria trigger automático que sincroniza `auth.users` → `public.users`
- ✅ Migra todos os usuários existentes
- ✅ Configura RLS (segurança) para permitir busca de usuários

**Verificar se funcionou:**
```sql
-- Cole isso no SQL Editor e execute:
SELECT * FROM users;
```

Se aparecer uma lista de usuários, funcionou! ✅

---

### 🔑 **PASSO 2: Obter as Keys Corretas do Supabase**

#### 2.1. Obter ANON KEY (correta)

1. No Supabase Dashboard, vá em **Settings** (menu lateral)
2. Clique em **API**
3. Na seção **Project API keys**, copie a chave **`anon` `public`** (NÃO a service_role!)

**Como identificar a key correta:**
- ✅ A label deve dizer **"anon"** ou **"public"**
- ❌ NÃO copie a que diz "service_role"

#### 2.2. Obter SERVICE ROLE KEY

1. Na mesma página (**Settings > API**)
2. Na seção **Project API keys**, copie a chave **`service_role`**
3. ⚠️ **ATENÇÃO:** Essa key é secreta! Nunca commite no Git!

---

### 🔧 **PASSO 3: Atualizar .env.local**

1. Abra o arquivo **`.env.local`** na raiz do projeto
2. Substitua o conteúdo com:

```env
# URL do projeto (manter a mesma)
NEXT_PUBLIC_SUPABASE_URL=https://kqmfvzwxlmujsvjgekvz.supabase.co

# SUBSTITUIR - Cole a ANON KEY correta (do passo 2.1)
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_aqui_a_anon_key_do_passo_2_1

# ADICIONAR - Cole a SERVICE ROLE KEY (do passo 2.2)
SUPABASE_SERVICE_ROLE_KEY=cole_aqui_a_service_role_key_do_passo_2_2
```

3. **Salve o arquivo**
4. **Reinicie o servidor Next.js:**
   - Pare o servidor (Ctrl+C no terminal)
   - Rode novamente: `npm run dev`

---

### 🧪 **PASSO 4: Testar**

1. Acesse: `http://localhost:3000/amigos`
2. Vá na aba **"Buscar"**
3. Digite um nome ou email de usuário existente
4. Clique em **"Buscar"**

**Resultado esperado:** ✅
- Deve aparecer lista de usuários
- Não deve ter erro 404
- Você pode clicar em "Adicionar" para enviar solicitação

---

## 🎉 Pronto! Sistema de Amigos Funcionando

Após seguir os 3 passos, tudo deve funcionar:

- ✅ Buscar usuários
- ✅ Enviar solicitações de amizade
- ✅ Ver solicitações recebidas
- ✅ Aceitar/rejeitar solicitações
- ✅ Ver lista de amigos
- ✅ Remover amigos

---

## 🔍 Entendendo o que foi corrigido

### Antes (com erro 404):
```
Frontend busca usuários
    ↓
GET /api/users/search?q=nome
    ↓
SELECT FROM users  ❌ Tabela não existe!
    ↓
Erro 404
```

### Depois (funcionando):
```
Novo usuário faz signup
    ↓
auth.users (Supabase Auth)
    ↓ (trigger automático)
public.users (tabela pública)
    ↓
Frontend busca usuários
    ↓
GET /api/users/search?q=nome
    ↓
SELECT FROM users  ✅ Tabela existe!
    ↓
Retorna lista de usuários
```

---

## 🐛 Troubleshooting

### Problema: "relation 'users' does not exist"
**Solução:** Você não executou o SQL. Volte ao Passo 1.

### Problema: "401 Unauthorized"
**Solução:**
1. Verifique se as keys no `.env.local` estão corretas
2. Certifique-se de copiar a **ANON KEY** (não a service_role)
3. Reinicie o servidor Next.js

### Problema: Nenhum usuário aparece na busca
**Verificações:**
1. Tem usuários cadastrados? Rode no SQL Editor:
   ```sql
   SELECT * FROM users;
   ```
2. Se a tabela estiver vazia, o trigger pode não ter migrado. Execute:
   ```sql
   INSERT INTO public.users (id, email, name)
   SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Usuário')
   FROM auth.users
   ON CONFLICT (id) DO NOTHING;
   ```

### Problema: "function sync_user_to_public does not exist"
**Solução:** Execute TODO o SQL de `users_table.sql` novamente (incluindo as funções no final).

---

## 📝 O que mudou automaticamente

### Arquivo: `app/signup/page.tsx`
O código de signup foi simplificado. Agora o trigger faz tudo automaticamente:

**Antes (manual):**
```typescript
const { error: userInsertError } = await supabase
  .from('users')
  .insert([{ id: data.user.id, email, name }])
```

**Depois (automático via trigger):**
```typescript
// Trigger automático cria registro em public.users
localStorage.setItem("user", JSON.stringify({ name, email }))
router.push("/welcome")
```

---

## 🔒 Segurança

✅ **Row Level Security (RLS) ativado:**
- Usuários autenticados podem **ver** todos os perfis (necessário para busca de amigos)
- Usuários podem **editar** apenas seu próprio perfil
- Dados protegidos por políticas do Supabase

✅ **Keys configuradas corretamente:**
- `ANON_KEY`: Para operações do frontend (público, porém seguro com RLS)
- `SERVICE_ROLE_KEY`: Para operações administrativas do backend (privado, nunca expor!)

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique o console do navegador (F12 > Console)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Certifique-se de ter executado TODO o SQL
4. Verifique se as keys foram copiadas corretamente (sem espaços extras)
5. Reinicie o servidor Next.js

---

**🎊 Sucesso! Agora o sistema de amigos está 100% funcional!**
