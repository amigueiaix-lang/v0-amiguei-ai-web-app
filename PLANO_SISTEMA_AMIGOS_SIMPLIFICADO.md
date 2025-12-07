# Plano Simplificado: Sistema de Amigos - Amiguei.AI

## Objetivo
Permitir que usuários adicionem uns aos outros como amigos usando a infraestrutura existente de autenticação e tabela `users`.

---

## 📋 O Que Será Implementado

### Funcionalidades Principais
1. ✅ Buscar outros usuários por nome ou email
2. ✅ Enviar solicitação de amizade
3. ✅ Aceitar/rejeitar solicitações recebidas
4. ✅ Ver lista de amigos
5. ✅ Remover amigo

---

## 🗄️ FASE 1: Banco de Dados (Supabase)

### Apenas 2 tabelas novas:

#### 1. Tabela `friendships` (amizades estabelecidas)
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias amizades"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Sistema gerencia amizades via função"
  ON friendships FOR ALL
  USING (false)
  WITH CHECK (false);
```

#### 2. Tabela `friend_requests` (solicitações pendentes)
```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id, status);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem solicitações enviadas e recebidas"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Usuários podem enviar solicitações"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receptores podem atualizar solicitações"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);
```

### Função para aceitar solicitação
```sql
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sender_id UUID;
  v_receiver_id UUID;
BEGIN
  -- Buscar e validar solicitação
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND status = 'pending' AND receiver_id = auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  -- Atualizar status
  UPDATE friend_requests
  SET status = 'accepted'
  WHERE id = request_id;

  -- Criar amizade bidirecional
  INSERT INTO friendships (user_id, friend_id)
  VALUES
    (v_sender_id, v_receiver_id),
    (v_receiver_id, v_sender_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔌 FASE 2: API Routes

### 1. `/app/api/friends/route.ts`
```typescript
// GET - Listar amigos do usuário
// DELETE - Remover amigo
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // 2. Buscar amigos com JOIN na tabela users
  const { data: friends, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      created_at,
      friend:users!friend_id (
        id,
        name,
        email
      )
    `)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ friends })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const friendId = searchParams.get('friendId')

  if (!friendId) return NextResponse.json({ error: 'friendId necessário' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Deletar amizade bidirecional
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

### 2. `/app/api/friends/requests/route.ts`
```typescript
// GET - Listar solicitações (enviadas e recebidas)
// POST - Enviar solicitação
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Solicitações recebidas
  const { data: received } = await supabase
    .from('friend_requests')
    .select(`
      id,
      sender_id,
      created_at,
      sender:users!sender_id (id, name, email)
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  // Solicitações enviadas
  const { data: sent } = await supabase
    .from('friend_requests')
    .select(`
      id,
      receiver_id,
      created_at,
      receiver:users!receiver_id (id, name, email)
    `)
    .eq('sender_id', user.id)
    .eq('status', 'pending')

  return NextResponse.json({ received, sent })
}

export async function POST(request: Request) {
  const { receiverId } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Verificar se já existe solicitação ou amizade
  const { data: existing } = await supabase
    .from('friend_requests')
    .select('id')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Solicitação já existe' }, { status: 400 })
  }

  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', receiverId)
    .single()

  if (friendship) {
    return NextResponse.json({ error: 'Já são amigos' }, { status: 400 })
  }

  // Criar solicitação
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: receiverId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, request: data })
}
```

### 3. `/app/api/friends/requests/[id]/route.ts`
```typescript
// PATCH - Aceitar/rejeitar solicitação
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { action } = await request.json() // 'accept' ou 'reject'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (action === 'accept') {
    // Chamar função do banco
    const { error } = await supabase.rpc('accept_friend_request', {
      request_id: params.id
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'reject') {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', params.id)
      .eq('receiver_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### 4. `/app/api/users/search/route.ts`
```typescript
// GET - Buscar usuários por nome ou email
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query muito curta' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Buscar usuários
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', user.id)
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Para cada usuário, verificar status de amizade
  const usersWithStatus = await Promise.all(users.map(async (u) => {
    // Verificar se é amigo
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', u.id)
      .single()

    if (friendship) return { ...u, status: 'friends' }

    // Verificar solicitação pendente
    const { data: request } = await supabase
      .from('friend_requests')
      .select('id, sender_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
      .eq('status', 'pending')
      .single()

    if (request) {
      return {
        ...u,
        status: 'pending',
        sentByMe: request.sender_id === user.id
      }
    }

    return { ...u, status: 'none' }
  }))

  return NextResponse.json({ users: usersWithStatus })
}
```

---

## 🎨 FASE 3: Componentes de UI

### 1. `components/friends/FriendsList.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserMinus } from 'lucide-react'

interface Friend {
  friend_id: string
  created_at: string
  friend: {
    id: string
    name: string
    email: string
  }
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    const res = await fetch('/api/friends')
    const data = await res.json()
    setFriends(data.friends || [])
    setLoading(false)
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Tem certeza que deseja remover este amigo?')) return

    await fetch(`/api/friends?friendId=${friendId}`, { method: 'DELETE' })
    fetchFriends()
  }

  if (loading) return <div>Carregando...</div>

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Você ainda não tem amigos</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {friends.map((f) => (
        <div key={f.friend_id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-semibold">{f.friend.name}</p>
            <p className="text-sm text-gray-500">{f.friend.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFriend(f.friend_id)}
            className="text-red-500 hover:bg-red-50"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Remover
          </Button>
        </div>
      ))}
    </div>
  )
}
```

### 2. `components/friends/FriendRequestsList.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export function FriendRequestsList() {
  const [requests, setRequests] = useState<any>({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const res = await fetch('/api/friends/requests')
    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    await fetch(`/api/friends/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    fetchRequests()
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-6">
      {/* Solicitações Recebidas */}
      <div>
        <h3 className="font-semibold mb-3">Solicitações Recebidas ({requests.received?.length || 0})</h3>
        {requests.received?.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação</p>
        ) : (
          <div className="space-y-3">
            {requests.received?.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{req.sender.name}</p>
                  <p className="text-sm text-gray-500">{req.sender.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(req.id, 'accept')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(req.id, 'reject')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitações Enviadas */}
      <div>
        <h3 className="font-semibold mb-3">Solicitações Enviadas ({requests.sent?.length || 0})</h3>
        {requests.sent?.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação enviada</p>
        ) : (
          <div className="space-y-3">
            {requests.sent?.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div>
                  <p className="font-semibold">{req.receiver.name}</p>
                  <p className="text-sm text-gray-500">Aguardando resposta...</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3. `components/friends/UserSearch.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, Check } from 'lucide-react'
import { toast } from 'sonner'

export function UserSearch() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const searchUsers = async () => {
    if (query.length < 2) return

    setLoading(true)
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  const sendFriendRequest = async (userId: string) => {
    const res = await fetch('/api/friends/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId })
    })

    if (res.ok) {
      toast.success('Solicitação enviada!')
      searchUsers() // Atualizar lista
    } else {
      const data = await res.json()
      toast.error(data.error || 'Erro ao enviar solicitação')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
          className="flex-1"
        />
        <Button onClick={searchUsers} disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      {users.length > 0 && (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              {user.status === 'friends' && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Amigos</span>
                </div>
              )}

              {user.status === 'pending' && (
                <div className="text-sm text-gray-500">
                  {user.sentByMe ? 'Solicitação enviada' : 'Solicitação recebida'}
                </div>
              )}

              {user.status === 'none' && (
                <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 📱 FASE 4: Página de Amigos

### `/app/amigos/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { FriendsList } from '@/components/friends/FriendsList'
import { FriendRequestsList } from '@/components/friends/FriendRequestsList'
import { UserSearch } from '@/components/friends/UserSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AmigosPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Amigos</h1>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Meus Amigos</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <FriendsList />
          </TabsContent>

          <TabsContent value="requests">
            <FriendRequestsList />
          </TabsContent>

          <TabsContent value="search">
            <UserSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

---

## 🔗 FASE 5: Atualizar Header

### Adicionar link no `components/Header.tsx`
```typescript
// Adicionar este link no menu quando o usuário estiver autenticado:
<a
  href="/amigos"
  className="text-black hover:text-[#FF69B4] transition-colors"
>
  Amigos
</a>
```

---

## 📦 FASE 6: Tipos TypeScript

### `/types/friends.ts`
```typescript
export interface Friend {
  friend_id: string
  created_at: string
  friend: {
    id: string
    name: string
    email: string
  }
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: {
    id: string
    name: string
    email: string
  }
  receiver?: {
    id: string
    name: string
    email: string
  }
}

export interface UserSearchResult {
  id: string
  name: string
  email: string
  status: 'none' | 'pending' | 'friends'
  sentByMe?: boolean
}
```

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Executar SQL para criar tabela `friendships`
- [ ] Executar SQL para criar tabela `friend_requests`
- [ ] Criar função `accept_friend_request()`
- [ ] Testar RLS policies

### API Routes
- [ ] Criar `/app/api/friends/route.ts`
- [ ] Criar `/app/api/friends/requests/route.ts`
- [ ] Criar `/app/api/friends/requests/[id]/route.ts`
- [ ] Criar `/app/api/users/search/route.ts`
- [ ] Testar todos os endpoints

### Componentes
- [ ] Criar `/components/friends/FriendsList.tsx`
- [ ] Criar `/components/friends/FriendRequestsList.tsx`
- [ ] Criar `/components/friends/UserSearch.tsx`
- [ ] Criar `/types/friends.ts`

### Páginas
- [ ] Criar `/app/amigos/page.tsx`
- [ ] Atualizar `components/Header.tsx` com link para amigos

### Testes
- [ ] Buscar usuários
- [ ] Enviar solicitação
- [ ] Aceitar solicitação
- [ ] Rejeitar solicitação
- [ ] Ver lista de amigos
- [ ] Remover amigo

---

## ⏱️ Estimativa de Tempo

- **Banco de Dados:** 30 minutos
- **API Routes:** 2 horas
- **Componentes:** 2 horas
- **Página:** 30 minutos
- **Testes:** 1 hora

**Total:** ~6 horas de desenvolvimento

---

## 🚀 Ordem de Implementação

1. **PRIMEIRO:** Criar tabelas no Supabase SQL Editor
2. **SEGUNDO:** Criar tipos TypeScript
3. **TERCEIRO:** Criar API routes
4. **QUARTO:** Criar componentes
5. **QUINTO:** Criar página
6. **SEXTO:** Atualizar Header
7. **SÉTIMO:** Testar tudo

---

## 🎯 Resultado Final

Após a implementação, os usuários poderão:
- ✅ Buscar outros usuários da plataforma
- ✅ Enviar solicitações de amizade
- ✅ Ver solicitações recebidas e enviadas
- ✅ Aceitar ou rejeitar solicitações
- ✅ Ver lista de todos os amigos
- ✅ Remover amigos

**Tudo isso usando apenas a infraestrutura existente de autenticação e usuários!**
