# 🔐 Plano de Correção: Erro "Não autenticado" na página de Amigos

## 🎯 Problema Identificado

A página `/amigos` mostra erro **"Não autenticado"** porque:

1. ❌ O `.env.local` tem a **chave errada** (service_role em vez de anon)
2. ❌ O cliente Supabase não consegue autenticar usuários
3. ❌ As APIs retornam 401 Unauthorized

---

## 🔍 FASE 1: Diagnóstico (Faça Isso Primeiro!)

### Passo 1.1: Verificar no navegador

Abra `/amigos` e pressione **F12** (DevTools). No **Console**, cole:

```javascript
// Verificar se tem cookies de autenticação
document.cookie

// Verificar localStorage
Object.keys(localStorage).filter(k => k.includes('supabase'))
```

**O que você deve ver:**
- ✅ Cookies começando com `sb-kqmfvzwxlmujsvjgekvz-auth-token`
- ✅ Items no localStorage com `supabase.auth.token`

Se não aparecer: você não está logado ou a sessão expirou.

### Passo 1.2: Testar API direto

No **Console** do navegador:

```javascript
const res = await fetch('/api/friends', { credentials: 'include' })
const data = await res.json()
console.log('Status:', res.status, 'Data:', data)
```

**Resultados esperados:**
- `401` + `"Não autenticado"` → Confirma problema de autenticação ✅
- `200` + array de amigos → API funciona, problema na UI ❌

### Passo 1.3: Verificar Network Tab

1. Pressione **F12** → aba **Network**
2. Recarregue `/amigos`
3. Clique na requisição `friends`
4. Vá em **Headers** → procure por **Cookie**

**O que procurar:**
- ✅ Cookie presente com nome `sb-kqmfvzwxlmujsvjgekvz-auth-token`
- ❌ Sem cookie → Sessão não está sendo enviada

---

## 🔧 FASE 2: Pegar a Chave Correta do Supabase

### Passo 2.1: Acessar Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto: `kqmfvzwxlmujsvjgekvz`

### Passo 2.2: Ir para Configurações de API

1. No menu lateral, clique em **⚙️ Project Settings** (ícone de engrenagem)
2. Clique na aba **API**
3. Role até **Project API keys**

### Passo 2.3: Identificar as Chaves

Você verá **DUAS** chaves:

#### ✅ **anon / public** (ESTA é a correta!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```
- Aparece como: **"anon public"**
- Tem role: `"anon"`
- **COPIE ESTA!**

#### ❌ **service_role** (Esta é a que você tem agora - ERRADA!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```
- Aparece como: **"service_role secret"**
- Tem role: `"service_role"`
- **NÃO use esta!**

### Passo 2.4: Verificar qual você tem agora

Visite: https://jwt.io/

Cole sua chave atual (do `.env.local`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbWZ2end4bG11anN2amdla3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc5NDkzNywiZXhwIjoyMDc3MzcwOTM3fQ.U6gfpAre7NI2Zpih7ThXSY4nTSIutdugeyNrPqyrGw4
```

**Decodificado mostra:**
```json
{
  "role": "service_role"  ← PROBLEMA AQUI!
}
```

**Deve ser:**
```json
{
  "role": "anon"  ← CORRETO!
}
```

---

## ✅ FASE 3: Correção Principal

### Passo 3.1: Atualizar .env.local

**Abra o arquivo:** `.env.local`

**Substitua a linha:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbWZ2end4bG11anN2amdla3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc5NDkzNywiZXhwIjoyMDc3MzcwOTM3fQ.U6gfpAre7NI2Zpih7ThXSY4nTSIutdugeyNrPqyrGw4
```

**Por:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COLE_A_CHAVE_ANON_DO_SUPABASE_AQUI>
```

**Salve o arquivo!**

### Passo 3.2: Reiniciar o Servidor

**MUITO IMPORTANTE:** Variáveis de ambiente só são lidas ao iniciar!

```bash
# No terminal onde o servidor está rodando:
# Pressione Ctrl+C para parar

# Depois:
npm run dev
```

Aguarde o servidor iniciar completamente.

### Passo 3.3: Limpar Navegador e Re-logar

1. **Abra DevTools** (F12) → Console
2. **Cole e execute:**
```javascript
// Limpar tudo
localStorage.clear()
sessionStorage.clear()

// Limpar cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
})

console.log('✅ Tudo limpo! Agora faça login novamente.')
```

3. **Vá para:** `http://localhost:3000/login`
4. **Faça login** com suas credenciais
5. **Teste:** Vá para `http://localhost:3000/amigos`

**Resultado esperado:**
- ✅ Página carrega sem erro "Não autenticado"
- ✅ Mostra "Você ainda não tem amigos" ou lista de amigos

---

## 🗄️ FASE 4: Verificar Banco de Dados

### Passo 4.1: Verificar se usuários existem

Acesse: **Supabase Dashboard** → **SQL Editor**

Cole e execute:

```sql
-- Verificar usuários em auth.users
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users
LIMIT 5;

-- Verificar usuários em public.users
SELECT id, email, name, username, created_at
FROM public.users
LIMIT 5;

-- Verificar se as contagens batem
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_count,
  (SELECT COUNT(*) FROM public.users) as public_count;
```

**Resultados esperados:**
- ✅ `auth_count` = `public_count`
- ✅ Seu email aparece nas duas tabelas
- ❌ Se contagens diferentes: trigger não funcionou

### Passo 4.2: Sincronizar usuários manualmente (se necessário)

Se usuários estão faltando em `public.users`:

```sql
-- Sincronizar todos os usuários
INSERT INTO public.users (id, email, name, username)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(
    raw_user_meta_data->>'username',
    generate_temp_username(
      COALESCE(raw_user_meta_data->>'name', 'Usuario'),
      id
    )
  )
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();
```

### Passo 4.3: Verificar RLS (Row Level Security)

```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'friendships', 'friend_requests');

-- Listar políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Esperado:**
- Todas as tabelas com `rowsecurity = true`
- Políticas SELECT existem para `users`

---

## 🧪 FASE 5: Testes

### Teste 5.1: Fluxo de Autenticação

1. ✅ Logout (se logado)
2. ✅ Limpar storage (localStorage + cookies)
3. ✅ Ir para `/login`
4. ✅ Fazer login
5. ✅ Ir para `/amigos`
6. ✅ Verificar: página carrega sem erro

### Teste 5.2: API direta

No terminal:

```bash
# Pegar o cookie de autenticação do navegador (DevTools → Application → Cookies)
# Substituir YOUR_TOKEN_HERE pelo valor do cookie

curl -X GET 'http://localhost:3000/api/friends' \
  -H 'Cookie: sb-kqmfvzwxlmujsvjgekvz-auth-token=YOUR_TOKEN_HERE' \
  -v
```

**Esperado:**
- Status: `200 OK`
- JSON: `{"friends": []}`

### Teste 5.3: Sistema de amigos completo

1. ✅ Criar 2 usuários diferentes
2. ✅ Logar como Usuário A
3. ✅ Ir em `/amigos` → aba **Buscar**
4. ✅ Buscar Usuário B por email
5. ✅ Enviar solicitação
6. ✅ Logar como Usuário B
7. ✅ Ir em `/amigos` → aba **Solicitações**
8. ✅ Aceitar solicitação
9. ✅ Verificar em **Meus Amigos** → Usuário A aparece
10. ✅ Logar como Usuário A
11. ✅ Verificar em **Meus Amigos** → Usuário B aparece

---

## 🆘 FASE 6: Se Ainda Não Funcionar

### Opção 6.1: Adicionar logs de debug

Edite: `app/api/friends/route.ts`

Adicione no início da função `GET`:

```typescript
export async function GET() {
  try {
    const supabase = await createClient()

    console.log('=== DEBUG /api/friends ===')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('User:', user?.id, user?.email)
    console.log('Error:', authError?.message)

    if (authError || !user) {
      console.log('❌ AUTH FAILED')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ... resto do código
  }
}
```

Depois, olhe os logs no terminal onde `npm run dev` está rodando.

### Opção 6.2: Verificar cookies no código

Adicione antes do `getUser()`:

```typescript
import { cookies } from 'next/headers'

// No início da função:
const cookieStore = await cookies()
const allCookies = cookieStore.getAll()
console.log('Cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
```

### Opção 6.3: Testar sem RLS (APENAS TESTE!)

**⚠️ AVISO: Isso remove segurança! Use APENAS para testar!**

No Supabase SQL Editor:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;

-- Teste se /amigos funciona agora
-- Se SIM: problema é nas políticas RLS
-- Se NÃO: problema é outro

-- REABILITE IMEDIATAMENTE!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist de Execução

### Prioridade 1 (FAÇA AGORA) ✅

- [ ] Acessar Supabase Dashboard
- [ ] Ir em Project Settings → API
- [ ] Copiar a chave **anon / public**
- [ ] Colar no jwt.io e verificar `"role":"anon"`
- [ ] Abrir `.env.local`
- [ ] Substituir `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Salvar arquivo
- [ ] Parar servidor (Ctrl+C)
- [ ] Reiniciar (`npm run dev`)
- [ ] Limpar localStorage e cookies (F12 → Console → comandos acima)
- [ ] Fazer login novamente em `/login`
- [ ] Testar `/amigos`

### Prioridade 2 (Se ainda falhar) ✅

- [ ] Executar queries SQL de verificação
- [ ] Verificar se usuários existem em `public.users`
- [ ] Sincronizar usuários manualmente
- [ ] Adicionar logs de debug na API
- [ ] Verificar Network tab por cookies
- [ ] Verificar logs do servidor no terminal

### Prioridade 3 (Último recurso) ✅

- [ ] Testar com RLS desabilitado
- [ ] Verificar triggers no banco
- [ ] Recriar usuário
- [ ] Contactar suporte do Supabase

---

## ✅ Critérios de Sucesso

Você saberá que está funcionando quando:

1. ✅ `/amigos` carrega sem mostrar "Não autenticado"
2. ✅ `/api/friends` retorna status 200
3. ✅ Busca de usuários funciona
4. ✅ Solicitações de amizade são enviadas/recebidas
5. ✅ Cookies aparecem no Network tab
6. ✅ Logs do servidor mostram user ID

---

## 🎯 Resumo: O Que Você Precisa Fazer

1. **Pegar chave correta no Supabase** (5 min)
2. **Atualizar .env.local** (1 min)
3. **Reiniciar servidor** (1 min)
4. **Limpar navegador e re-logar** (2 min)
5. **Testar /amigos** (1 min)

**Tempo total: ~10 minutos**

Se funcionar → ✅ Problema resolvido!
Se não funcionar → Ir para Fase 4 (verificar banco de dados)

---

## 📞 Próximos Passos

Depois que corrigir:

1. Me avise se funcionou ou não
2. Se funcionou: podemos testar o sistema de amigos completo
3. Se não funcionou: me mande:
   - Screenshot do erro
   - Logs do terminal (onde `npm run dev` está rodando)
   - Resultado das queries SQL
   - Status code da API no Network tab

Vamos resolver isso! 💪
