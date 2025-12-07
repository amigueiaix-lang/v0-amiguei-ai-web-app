# Plano de Ação: Sistema de Amigos - Amiguei.AI

## Visão Geral
Implementar um sistema completo de amigos que permita aos usuários se conectarem, compartilharem looks e interagirem socialmente na plataforma Amiguei.AI.

---

## Fase 1: Infraestrutura de Banco de Dados

### 1.1 Criação de Tabelas no Supabase

#### Tabela: `user_profiles`
Perfis públicos dos usuários com informações visíveis para amigos.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_is_public ON user_profiles(is_public);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis públicos são visíveis para todos"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seus próprios perfis"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### Tabela: `friendships`
Conexões de amizade estabelecidas entre usuários.

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que não existam duplicatas
  UNIQUE(user_id, friend_id),

  -- Garantir que user_id != friend_id
  CHECK (user_id != friend_id)
);

-- Índices para queries rápidas
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias amizades"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Usuários não podem criar amizades diretamente"
  ON friendships FOR INSERT
  WITH CHECK (false); -- Apenas via função trigger de friend_requests
```

#### Tabela: `friend_requests`
Solicitações de amizade pendentes.

```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que não existam duplicatas
  UNIQUE(sender_id, receiver_id),

  -- Garantir que sender_id != receiver_id
  CHECK (sender_id != receiver_id)
);

-- Índices
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender_id ON friend_requests(sender_id, status);

-- RLS Policies
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

#### Tabela: `notifications`
Sistema de notificações para atividades de amigos.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'look_shared', 'look_liked')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas notificações"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem marcar notificações como lidas"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

### 1.2 Funções e Triggers no Supabase

#### Função: Aceitar Solicitação de Amizade
```sql
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sender_id UUID;
  v_receiver_id UUID;
BEGIN
  -- Buscar dados da solicitação
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM friend_requests
  WHERE id = request_id AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  -- Atualizar status da solicitação
  UPDATE friend_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = request_id;

  -- Criar amizade bidirecional
  INSERT INTO friendships (user_id, friend_id)
  VALUES
    (v_sender_id, v_receiver_id),
    (v_receiver_id, v_sender_id);

  -- Criar notificação para o sender
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_sender_id,
    'friend_accepted',
    'Solicitação aceita!',
    'Sua solicitação de amizade foi aceita',
    jsonb_build_object('friend_id', v_receiver_id, 'request_id', request_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Trigger: Notificar ao receber solicitação
```sql
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.receiver_id,
    'friend_request',
    'Nova solicitação de amizade',
    'Você recebeu uma nova solicitação de amizade',
    jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();
```

#### Trigger: Auto-criar user_profile ao cadastrar
```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(REPLACE(NEW.raw_user_meta_data->>'name', ' ', '_')) || '_' || SUBSTRING(NEW.id::text, 1, 6),
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

---

## Fase 2: API Routes (Backend)

### 2.1 `/app/api/friends/route.ts`
Gerenciar lista de amigos.

**Endpoints:**
- `GET /api/friends` - Listar amigos do usuário autenticado
- `DELETE /api/friends/:friendId` - Remover amizade

**Funcionalidades:**
```typescript
// GET: Retornar lista de amigos com perfis
// - Verificar autenticação
// - Buscar friendships do user_id
// - JOIN com user_profiles para trazer avatar, display_name, username
// - Retornar array de amigos

// DELETE: Remover amizade bidirecional
// - Verificar autenticação
// - Deletar as duas entradas em friendships (user->friend e friend->user)
// - Retornar sucesso
```

### 2.2 `/app/api/friends/requests/route.ts`
Gerenciar solicitações de amizade.

**Endpoints:**
- `GET /api/friends/requests` - Listar solicitações pendentes (enviadas e recebidas)
- `POST /api/friends/requests` - Enviar solicitação de amizade
- `PATCH /api/friends/requests/:requestId` - Aceitar/rejeitar solicitação

**Funcionalidades:**
```typescript
// GET: Retornar solicitações pendentes
// - received: solicitações que o usuário recebeu
// - sent: solicitações que o usuário enviou
// - JOIN com user_profiles para trazer dados do sender/receiver

// POST: Enviar solicitação
// - Validar que não existe amizade
// - Validar que não existe solicitação pendente
// - Criar registro em friend_requests
// - Trigger automático criará notificação

// PATCH: Aceitar/rejeitar
// - Se aceitar: chamar função accept_friend_request()
// - Se rejeitar: atualizar status para 'rejected'
```

### 2.3 `/app/api/friends/search/route.ts`
Buscar usuários para adicionar como amigos.

**Endpoints:**
- `GET /api/friends/search?q={query}` - Buscar usuários por username ou display_name

**Funcionalidades:**
```typescript
// GET: Buscar usuários
// - Buscar em user_profiles por username ou display_name (ILIKE)
// - Excluir o próprio usuário
// - Retornar status de relacionamento (amigo, solicitação pendente, nenhum)
// - Limitar a 20 resultados
// - Somente perfis públicos ou amigos
```

### 2.4 `/app/api/profiles/[username]/route.ts`
Visualizar perfil de usuário.

**Endpoints:**
- `GET /api/profiles/:username` - Buscar perfil público
- `PATCH /api/profiles/:username` - Atualizar próprio perfil

**Funcionalidades:**
```typescript
// GET: Retornar perfil
// - Buscar user_profile por username
// - Verificar permissão (público ou amigo)
// - Retornar dados do perfil
// - Incluir contagem de amigos
// - Se for amigo, incluir looks compartilhados

// PATCH: Atualizar perfil
// - Verificar que é o próprio usuário
// - Atualizar display_name, bio, avatar_url, is_public
// - Upload de avatar via Supabase Storage
```

### 2.5 `/app/api/notifications/route.ts`
Gerenciar notificações.

**Endpoints:**
- `GET /api/notifications` - Listar notificações
- `PATCH /api/notifications/:id` - Marcar como lida
- `POST /api/notifications/mark-all-read` - Marcar todas como lidas

---

## Fase 3: Componentes de UI (Frontend)

### 3.1 Componentes de Perfil

#### `components/UserProfile.tsx`
Exibir perfil de usuário (próprio ou de amigo).

**Props:**
- `username: string`
- `isOwnProfile: boolean`

**Funcionalidades:**
- Avatar, display_name, username, bio
- Botão de editar (se for próprio perfil)
- Contador de amigos
- Toggle de perfil público/privado
- Lista de looks compartilhados (se for amigo)

#### `components/EditProfileModal.tsx`
Modal para editar perfil.

**Campos:**
- Upload de avatar
- Display name
- Bio
- Username (somente leitura ou validação de unicidade)
- Toggle perfil público

#### `components/AvatarUpload.tsx`
Componente de upload de avatar.

**Funcionalidades:**
- Preview da imagem
- Cropping (opcional, usar `react-image-crop`)
- Upload para Supabase Storage bucket `avatars/{user_id}/avatar.jpg`
- Compressão de imagem

### 3.2 Componentes de Amigos

#### `components/FriendsList.tsx`
Lista de amigos do usuário.

**Funcionalidades:**
- Grid/lista de amigos com avatares
- Link para perfil de cada amigo
- Botão de remover amigo (com confirmação)
- Estado vazio quando não há amigos

#### `components/FriendRequestsList.tsx`
Lista de solicitações de amizade.

**Funcionalidades:**
- Separar em "Recebidas" e "Enviadas"
- Botões de aceitar/rejeitar para recebidas
- Cancelar para enviadas
- Badge com contador de pendentes

#### `components/UserSearchBar.tsx`
Barra de busca de usuários.

**Funcionalidades:**
- Input de busca com debounce (300ms)
- Dropdown com resultados
- Exibir avatar, display_name, username
- Botão de adicionar amigo (se não for amigo)
- Status visual (amigo, pendente, não conectado)

#### `components/AddFriendButton.tsx`
Botão contextual de adicionar amigo.

**Props:**
- `userId: string`
- `currentStatus: 'none' | 'pending' | 'friends'`

**Estados:**
- "Adicionar Amigo" (none)
- "Solicitação Enviada" (pending)
- "Amigos ✓" (friends)

### 3.3 Componentes de Notificação

#### `components/NotificationBell.tsx`
Ícone de sino com contador no Header.

**Funcionalidades:**
- Badge com número de notificações não lidas
- Dropdown com últimas 5 notificações
- Link "Ver todas" para página de notificações
- Real-time updates via Supabase subscriptions

#### `components/NotificationItem.tsx`
Item individual de notificação.

**Funcionalidades:**
- Ícone baseado no tipo
- Título e mensagem
- Timestamp relativo (ex: "5 min atrás")
- Link para ação (perfil, solicitação, etc.)
- Marcar como lida ao clicar

### 3.4 Atualização de Componentes Existentes

#### `components/Header.tsx` - ATUALIZAR
Adicionar:
- NotificationBell component
- Link para "Meu Perfil"
- Link para "Amigos"

---

## Fase 4: Páginas (Routes)

### 4.1 `/app/perfil/[username]/page.tsx`
Página de perfil de usuário.

**Funcionalidades:**
- Exibir UserProfile component
- Breadcrumb de navegação
- Botão de compartilhar perfil
- Se for amigo, mostrar looks compartilhados

### 4.2 `/app/amigos/page.tsx`
Página de gerenciamento de amigos.

**Seções:**
- UserSearchBar no topo
- Tabs:
  - "Meus Amigos" - FriendsList
  - "Solicitações" - FriendRequestsList (com badge de contador)
- Sugestões de amigos (opcional - Fase 5)

### 4.3 `/app/notificacoes/page.tsx`
Página de todas as notificações.

**Funcionalidades:**
- Lista completa de notificações
- Filtros: Todas / Não lidas
- Marcar todas como lidas
- Paginação (20 por página)

### 4.4 `/app/configuracoes/page.tsx` (NOVA)
Página de configurações do usuário.

**Seções:**
- Editar perfil
- Configurações de privacidade
- Gerenciar notificações

---

## Fase 5: Tipos TypeScript

### 5.1 Criar `/types/social.ts`

```typescript
export interface UserProfile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend_profile?: UserProfile
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender_profile?: UserProfile
  receiver_profile?: UserProfile
}

export interface Notification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'look_shared' | 'look_liked'
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: Record<string, any> | null
  created_at: string
}

export interface FriendshipStatus {
  isFriend: boolean
  hasPendingRequest: boolean
  sentByMe: boolean
  requestId?: string
}
```

---

## Fase 6: Hooks Personalizados

### 6.1 `/hooks/useFriends.ts`
Hook para gerenciar amigos.

```typescript
export function useFriends() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFriends = async () => { /* ... */ }
  const removeFriend = async (friendId: string) => { /* ... */ }

  return { friends, loading, fetchFriends, removeFriend }
}
```

### 6.2 `/hooks/useFriendRequests.ts`
Hook para gerenciar solicitações.

```typescript
export function useFriendRequests() {
  const [requests, setRequests] = useState({ received: [], sent: [] })
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => { /* ... */ }
  const sendRequest = async (userId: string) => { /* ... */ }
  const acceptRequest = async (requestId: string) => { /* ... */ }
  const rejectRequest = async (requestId: string) => { /* ... */ }

  return { requests, loading, sendRequest, acceptRequest, rejectRequest }
}
```

### 6.3 `/hooks/useNotifications.ts`
Hook para notificações com real-time.

```typescript
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Supabase real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, handleNewNotification)
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
```

### 6.4 `/hooks/useUserProfile.ts`
Hook para perfil de usuário.

```typescript
export function useUserProfile(username: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const updateProfile = async (data: Partial<UserProfile>) => { /* ... */ }

  return { profile, loading, updateProfile }
}
```

---

## Fase 7: Integrações e Features Extras

### 7.1 Sistema de Compartilhamento de Looks (Integração)

Aproveitar o botão de compartilhar recentemente adicionado nos commits.

**Tabela adicional:**
```sql
CREATE TABLE shared_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  look_data JSONB NOT NULL, -- { top_id, bottom_id, shoes_id, occasion, score, feedback }
  caption TEXT,
  is_public BOOLEAN DEFAULT false,
  shared_with_friends_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_looks_user_id ON shared_looks(user_id);
```

**Funcionalidades:**
- Compartilhar look com amigos
- Mural de looks dos amigos
- Likes em looks compartilhados
- Comentários (opcional)

### 7.2 Sugestões de Amigos (Algoritmo Simples)

**Lógica:**
- Amigos de amigos que não são amigos
- Usuários com estilo semelhante (baseado em quiz/onboarding)
- Usuários da mesma região (se tivermos dados)

### 7.3 Real-time Updates

**Usar Supabase Realtime para:**
- Notificações instantâneas
- Status online de amigos (opcional)
- Atualização de contador de solicitações
- Novos looks compartilhados no feed

---

## Fase 8: Segurança e Validação

### 8.1 Validações no Backend
- Validar que usuários existem antes de criar solicitações
- Prevenir spam de solicitações (rate limiting)
- Validar ownership em todas operações de update/delete
- Sanitizar inputs (especialmente bio e display_name)

### 8.2 RLS Policies - Checklist
- ✅ user_profiles: somente próprio usuário pode editar
- ✅ friendships: somente participantes veem
- ✅ friend_requests: somente sender e receiver veem
- ✅ notifications: somente dono vê e edita

### 8.3 Privacidade
- Configuração de perfil público/privado
- Compartilhamento de looks apenas com amigos
- Bloqueio de usuários (Fase futura)

---

## Fase 9: Testes e Qualidade

### 9.1 Testes Manuais - Checklist
- [ ] Criar perfil ao cadastrar
- [ ] Editar perfil (nome, bio, avatar)
- [ ] Buscar usuários
- [ ] Enviar solicitação de amizade
- [ ] Receber notificação de solicitação
- [ ] Aceitar solicitação
- [ ] Rejeitar solicitação
- [ ] Cancelar solicitação enviada
- [ ] Ver lista de amigos
- [ ] Remover amigo
- [ ] Ver perfil de amigo
- [ ] Ver perfil de não-amigo (público)
- [ ] Não conseguir ver perfil privado de não-amigo
- [ ] Compartilhar look com amigos
- [ ] Ver looks de amigos

### 9.2 Edge Cases a Considerar
- Usuário deleta conta: CASCADE deve funcionar
- Solicitação duplicada: UNIQUE constraint deve prevenir
- Usuário tenta adicionar a si mesmo: CHECK constraint deve prevenir
- Upload de avatar muito grande: validar tamanho (max 5MB)
- Username duplicado: UNIQUE constraint + validação frontend
- Solicitações simultâneas cruzadas (A->B e B->A ao mesmo tempo)

---

## Fase 10: Deploy e Monitoramento

### 10.1 Migrations do Supabase
- Criar script de migração com todas as tabelas, índices, triggers
- Testar em ambiente de desenvolvimento primeiro
- Executar em produção

### 10.2 Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (para funções server-side)
```

### 10.3 Monitoramento
- Logs de erros (Sentry ou similar)
- Analytics de uso de features sociais
- Métricas: taxa de aceitação de solicitações, amigos por usuário
- Performance de queries (pg_stat_statements no Supabase)

---

## Ordem de Implementação Recomendada

### Sprint 1: Fundação (1-2 dias)
1. Criar schema do banco de dados (Fase 1)
2. Criar tipos TypeScript (Fase 5)
3. Trigger para auto-criar user_profile

### Sprint 2: API de Perfis (1 dia)
4. Implementar `/api/profiles/[username]/route.ts`
5. Criar componente UserProfile
6. Criar página `/app/perfil/[username]`

### Sprint 3: Sistema de Amizade (2-3 dias)
7. Implementar `/api/friends/requests/route.ts`
8. Implementar `/api/friends/route.ts`
9. Criar hooks useFriendRequests e useFriends
10. Criar componentes FriendsList e FriendRequestsList
11. Criar página `/app/amigos`

### Sprint 4: Busca e Descoberta (1 dia)
12. Implementar `/api/friends/search/route.ts`
13. Criar componente UserSearchBar
14. Integrar busca na página de amigos

### Sprint 5: Notificações (1-2 dias)
15. Implementar `/api/notifications/route.ts`
16. Criar hook useNotifications com real-time
17. Criar componentes NotificationBell e NotificationItem
18. Atualizar Header com NotificationBell
19. Criar página `/app/notificacoes`

### Sprint 6: Polimento e Testes (1-2 dias)
20. Adicionar loading states e error handling
21. Melhorar UI/UX com animações
22. Testes manuais completos
23. Correções de bugs

### Sprint 7: Features Extras (Opcional - 2-3 dias)
24. Sistema de compartilhamento de looks
25. Sugestões de amigos
26. Feed de atividades

---

## Estimativa Total de Tempo
- **Mínimo viável (Sprints 1-6):** 7-10 dias de desenvolvimento
- **Com features extras (Sprint 7):** 9-13 dias de desenvolvimento

---

## Dependências e Bibliotecas Adicionais

### Instalar:
```bash
npm install date-fns  # Para formatação de datas
npm install react-image-crop  # Para cropping de avatar (opcional)
npm install use-debounce  # Para debounce na busca
```

### Já instaladas (verificadas):
- ✅ @supabase/supabase-js
- ✅ react-hook-form
- ✅ zod
- ✅ lucide-react (ícones)
- ✅ sonner (toasts)

---

## Considerações Finais

### Escalabilidade
- Índices no banco estão otimizados para queries frequentes
- RLS garante segurança sem lógica adicional no código
- Real-time subscriptions podem ser desativadas em caso de alto volume

### Futuras Melhorias
- Sistema de bloqueio de usuários
- Grupos de amigos
- Mensagens diretas entre amigos
- Feed algorítmico de looks
- Gamificação (badges por número de amigos, etc.)
- Integração com redes sociais (compartilhar perfil)

### Documentação
- Documentar APIs no formato OpenAPI/Swagger
- Criar guia de contribuição
- Adicionar comentários JSDoc nos componentes principais

---

## Próximos Passos

1. **Revisar este plano** com a equipe/stakeholders
2. **Priorizar sprints** conforme necessidade de negócio
3. **Criar branch de desenvolvimento** `feature/friends-system`
4. **Começar pelo Sprint 1** (fundação do banco de dados)
5. **Testar incrementalmente** após cada sprint

---

**Criado em:** 2025-12-06
**Autor:** Claude (Amiguei.AI Team)
**Versão:** 1.0
