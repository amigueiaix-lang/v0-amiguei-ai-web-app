# Correção do Erro 401 (Unauthorized)

## Problema Identificado

As API routes estavam retornando erro **401 (Unauthorized)** porque estavam usando o cliente Supabase **client-side** nas rotas do servidor.

## O que causava o erro:

```typescript
// ❌ ERRADO - Cliente sem acesso aos cookies de sessão
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser() // ❌ Não consegue ler a sessão
}
```

O cliente criado em `lib/supabase.ts` é um cliente **client-side** que não tem acesso aos cookies HTTP onde o Supabase armazena o token de autenticação do usuário.

## Solução Implementada

### 1. Instalado o pacote `@supabase/ssr`
```bash
npm install @supabase/ssr --legacy-peer-deps
```

### 2. Criado cliente server-side
Arquivo: `lib/supabase-server.ts`

Este cliente tem acesso aos cookies de sessão através da API `cookies()` do Next.js.

```typescript
// ✅ CORRETO - Cliente com acesso aos cookies
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient() // ✅ Cria cliente com cookies
  const { data: { user } } = await supabase.auth.getUser() // ✅ Consegue ler a sessão
}
```

### 3. Atualizadas todas as API routes

**Arquivos corrigidos:**
- ✅ `app/api/friends/route.ts`
- ✅ `app/api/friends/requests/route.ts`
- ✅ `app/api/friends/requests/[id]/route.ts`
- ✅ `app/api/users/search/route.ts`

## Como funciona agora:

1. **Frontend:** Quando o usuário faz login, o Supabase armazena o token de sessão em cookies HTTP
2. **Next.js:** Quando uma API route é chamada, os cookies são automaticamente enviados
3. **createClient():** Lê os cookies e cria um cliente autenticado
4. **auth.getUser():** Consegue validar o usuário através do token nos cookies

## Teste Novamente

Agora você pode:

1. Fazer login normalmente
2. Acessar `/amigos`
3. Todas as abas devem funcionar sem erro 401:
   - ✅ Meus Amigos
   - ✅ Solicitações
   - ✅ Buscar

## Diferença entre os clientes:

### `lib/supabase.ts` (Client-side)
- ✅ Use em: Componentes React, páginas client-side
- ❌ NÃO use em: API routes, Server Components
- Acesso: localStorage, sessionStorage

### `lib/supabase-server.ts` (Server-side)
- ✅ Use em: API routes, Server Components, Server Actions
- ❌ NÃO use em: Componentes client-side
- Acesso: Cookies HTTP (secure, httpOnly)

---

**🎉 Problema resolvido! O sistema de amigos agora deve funcionar corretamente.**
