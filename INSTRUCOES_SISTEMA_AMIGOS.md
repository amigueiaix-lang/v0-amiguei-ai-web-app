# Instruções para Ativar o Sistema de Amigos

## ✅ Implementação Concluída!

Todos os arquivos de código foram criados. Agora você só precisa executar o SQL no Supabase para ativar o sistema.

---

## 🗄️ Passo 1: Executar SQL no Supabase

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor** (no menu lateral esquerdo)
3. Clique em **New Query**
4. Copie TODO o conteúdo do arquivo: `supabase/friends_schema.sql`
5. Cole no editor SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)

**Importante:** Execute TODO o SQL de uma vez. O script inclui:
- ✅ Criação das tabelas `friendships` e `friend_requests`
- ✅ Índices para performance
- ✅ RLS (Row Level Security) policies
- ✅ Função `accept_friend_request()`
- ✅ Função `remove_friendship()`

---

## 📋 Passo 2: Verificar se funcionou

Após executar o SQL, rode estas queries de verificação no mesmo SQL Editor:

```sql
-- Ver tabelas criadas
SELECT * FROM friendships;
SELECT * FROM friend_requests;

-- Ver funções criadas
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('accept_friend_request', 'remove_friendship');
```

Se não houver erros, está tudo pronto! ✅

---

## 🚀 Passo 3: Testar o Sistema

Agora você pode testar o sistema de amigos:

### 1. Acesse a página de amigos
- Entre no app e faça login
- Clique em "Amigos" no header
- Ou acesse diretamente: `http://localhost:3000/amigos`

### 2. Teste o fluxo completo:

**A. Buscar usuários**
1. Vá na aba "Buscar"
2. Digite um nome ou email de outro usuário
3. Clique em "Buscar"

**B. Enviar solicitação de amizade**
1. Nos resultados da busca, clique em "Adicionar" ao lado do usuário
2. Você verá uma mensagem de sucesso
3. O status mudará para "Solicitação enviada"

**C. Ver solicitações (teste com outro usuário)**
1. Faça login com outro usuário
2. Vá em "Amigos" > aba "Solicitações"
3. Você verá a solicitação recebida
4. Clique em "Aceitar" ou "Rejeitar"

**D. Ver lista de amigos**
1. Após aceitar, vá na aba "Meus Amigos"
2. O amigo aparecerá na lista
3. Você pode clicar em "Remover" para desfazer a amizade

---

## 📁 Arquivos Criados

### Backend (APIs)
- ✅ `app/api/friends/route.ts` - Listar e remover amigos
- ✅ `app/api/friends/requests/route.ts` - Enviar e listar solicitações
- ✅ `app/api/friends/requests/[id]/route.ts` - Aceitar/rejeitar solicitações
- ✅ `app/api/users/search/route.ts` - Buscar usuários

### Frontend (Componentes)
- ✅ `components/friends/FriendsList.tsx` - Lista de amigos
- ✅ `components/friends/FriendRequestsList.tsx` - Lista de solicitações
- ✅ `components/friends/UserSearch.tsx` - Busca de usuários

### Páginas
- ✅ `app/amigos/page.tsx` - Página principal de amigos

### Outros
- ✅ `types/friends.ts` - Tipos TypeScript
- ✅ `components/Header.tsx` - Atualizado com link "Amigos"
- ✅ `supabase/friends_schema.sql` - Script SQL

---

## 🎯 Funcionalidades Implementadas

✅ Buscar usuários por nome ou email
✅ Enviar solicitação de amizade
✅ Ver solicitações recebidas
✅ Ver solicitações enviadas
✅ Aceitar solicitações
✅ Rejeitar solicitações
✅ Ver lista de amigos
✅ Remover amigos
✅ Proteção com RLS (segurança)
✅ Loading states
✅ Mensagens de erro e sucesso (toast)
✅ Design responsivo

---

## 🔒 Segurança

O sistema está protegido com:
- ✅ Row Level Security (RLS) - usuários só veem seus próprios dados
- ✅ Validações no backend - previne ações inválidas
- ✅ Checks no banco - evita duplicatas e auto-amizade
- ✅ Autenticação obrigatória em todas as rotas

---

## 🐛 Possíveis Problemas e Soluções

### Erro: "relation 'friendships' does not exist"
**Solução:** Você não executou o SQL no Supabase. Volte ao Passo 1.

### Erro: "function accept_friend_request does not exist"
**Solução:** Execute o SQL completo novamente, incluindo as funções no final.

### Erro: "Users can view their own friendships"
**Solução:** Já existe uma policy com esse nome. Delete as policies antigas antes:
```sql
DROP POLICY IF EXISTS "Usuários veem suas próprias amizades" ON friendships;
DROP POLICY IF EXISTS "Sistema gerencia amizades" ON friendships;
-- Depois execute o SQL completo novamente
```

### Nenhum usuário aparece na busca
**Verificações:**
1. Tem outros usuários cadastrados no sistema?
2. Você está buscando pelo nome ou email correto?
3. Verifique se a tabela `users` tem dados:
```sql
SELECT * FROM users;
```

---

## 🎨 Customizações Futuras

Você pode adicionar facilmente:
- Badge de notificações no header (contador de solicitações)
- Perfis de usuários
- Compartilhamento de looks com amigos
- Feed de atividades dos amigos
- Grupos de amigos
- Mensagens privadas

---

## 📞 Precisa de Ajuda?

Se encontrar algum erro:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase
3. Certifique-se de que executou TODO o SQL
4. Verifique se está autenticado no app

---

**🎉 Parabéns! Seu sistema de amigos está pronto para uso!**
