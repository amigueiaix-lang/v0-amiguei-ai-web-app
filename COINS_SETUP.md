# 🪙 Amiguei.Coins - Sistema de Moedas Virtuais

Sistema completo de moedas virtuais para o Amiguei.AI. Cada geração de look custa 1 Amiguei.Coin.

## 📋 Índice

- [Arquivos Criados](#arquivos-criados)
- [Configuração do Supabase](#configuração-do-supabase)
- [Como Usar](#como-usar)
- [Testes](#testes)
- [Arquitetura](#arquitetura)
- [Próximos Passos](#próximos-passos)

---

## 📁 Arquivos Criados

### 1. **Database Schema**
- `supabase/schema.sql` - SQL completo para criar tabelas e triggers

### 2. **Backend/Logic**
- `lib/supabase/coins.ts` - Funções de gerenciamento de coins
- `hooks/useCoins.ts` - Hook customizado React para coins

### 3. **UI Components**
- `components/AmigueiCoin.tsx` - Ícone da moeda
- `components/CoinBalance.tsx` - Saldo no header
- `components/CoinStore.tsx` - Modal da loja de coins
- `components/Header.tsx` - Header global com saldo

### 4. **Integrations**
- `app/layout.tsx` - ✅ Atualizado com Header
- `app/quiz/resultado/page.tsx` - ✅ Integrado com validação e dedução de coins

---

## ⚙️ Configuração do Supabase

### Passo 1: Executar SQL no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** (ícone de banco de dados na sidebar)
3. Clique em **New Query**
4. Copie e cole o conteúdo completo do arquivo `supabase/schema.sql`
5. Clique em **Run** (ou pressione `Cmd/Ctrl + Enter`)

**O que será criado:**
- ✅ Tabela `user_credits` (saldo de coins por usuário)
- ✅ Tabela `coin_transactions` (histórico de transações)
- ✅ Índices para performance
- ✅ Triggers automáticos (dar 3 coins para novos usuários)
- ✅ Row Level Security (RLS) configurado
- ✅ Policies de segurança

### Passo 2: Verificar Criação

Execute esta query no SQL Editor para verificar:

```sql
SELECT * FROM user_credits;
SELECT * FROM coin_transactions;
```

Se não houver erros, está tudo certo! 🎉

---

## 🚀 Como Usar

### Para Usuários do App

1. **Novo usuário recebe 3 coins grátis** automaticamente ao se cadastrar
2. **Gerar um look custa 1 coin**
3. **Trocar peças individuais é GRÁTIS** (não custa coins)
4. **Comprar mais coins**: Clicar no saldo no header → Escolher pacote

### Para Desenvolvedores

#### Usar o hook `useCoins`

```tsx
import { useCoins } from "@/hooks/useCoins"

function MyComponent() {
  const { balance, loading, deduct, add, hasEnough, refresh } = useCoins()

  // Verificar saldo
  if (hasEnough(1)) {
    console.log("Pode gerar look!")
  }

  // Deduzir coins
  const result = await deduct(1)
  if (result.success) {
    console.log("Coin deduzido! Novo saldo:", result.balance)
  }

  // Adicionar coins (para pagamentos)
  await add(10, "Compra de 10 coins")

  // Atualizar saldo manualmente
  await refresh()

  return <div>Saldo: {balance} coins</div>
}
```

#### Usar funções diretas

```tsx
import { getBalance, deductCoins, addCoins } from "@/lib/supabase/coins"

// Buscar saldo
const balance = await getBalance(userId)
console.log(balance.balance) // número de coins

// Deduzir coins
const result = await deductCoins(userId, 1)

// Adicionar coins
const result = await addCoins(userId, 10, "purchase")
```

---

## 🧪 Testes

### Teste 1: Verificar Saldo Inicial

1. Crie uma nova conta no app
2. Faça login
3. Verifique o header - deve mostrar **3 coins**

### Teste 2: Gerar Look (Com Coins)

1. Vá para o quiz de looks
2. Responda as perguntas
3. Veja o resultado → **1 coin será deduzido**
4. Verifique o header - deve mostrar **2 coins** agora

### Teste 3: Gerar Look (Sem Coins)

1. Execute no SQL Editor para zerar seus coins:
   ```sql
   UPDATE user_credits
   SET balance = 0
   WHERE user_id = auth.uid();
   ```
2. Tente gerar um look
3. Deve aparecer o modal: **"Ops! Você precisa de mais coins"**
4. Clique em "Comprar Amiguei.Coins" para ver a loja

### Teste 4: Trocar Peça Individual

1. Gere um look normalmente (custa 1 coin)
2. Clique no botão de refresh em qualquer peça (blusa, calça ou tênis)
3. A peça será trocada **SEM CUSTO** (grátis!)
4. Verifique que o saldo não mudou

### Teste 5: Abrir Loja de Coins

1. Clique no saldo de coins no header (canto superior direito)
2. Deve abrir o modal da loja com 4 pacotes:
   - 10 coins - R$ 9,90
   - 25 coins - R$ 19,90 (MAIS POPULAR)
   - 50 coins - R$ 34,90
   - 100 coins - R$ 59,90 (MELHOR VALOR)
3. Clicar em "Comprar Agora" mostra um alert (pagamento ainda não implementado)

### Teste 6: Adicionar Coins Manualmente (Dev)

Para testar, adicione coins manualmente via SQL:

```sql
UPDATE user_credits
SET balance = balance + 100
WHERE user_id = auth.uid();
```

O saldo deve atualizar automaticamente no header! ✨

---

## 🏗️ Arquitetura

### Fluxo de Geração de Look

```mermaid
graph TD
    A[Usuário clica "Gerar Look"] --> B{Tem 1+ coins?}
    B -->|Não| C[Mostrar modal de coins insuficientes]
    B -->|Sim| D[Chamar webhook N8N]
    D --> E{Sucesso?}
    E -->|Sim| F[Deduzir 1 coin]
    E -->|Não| G[Mostrar erro]
    F --> H[Mostrar look gerado]
    C --> I[Usuário compra coins]
    I --> A
```

### Estrutura de Dados

**user_credits**
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES auth.users (UNIQUE)
balance     INTEGER (>= 0, default: 3)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

**coin_transactions**
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
amount           INTEGER
transaction_type VARCHAR (purchase/deduction/bonus/refund)
description      TEXT
created_at       TIMESTAMPTZ
```

### Segurança (Row Level Security)

- ✅ Usuários só podem ver/editar seus próprios coins
- ✅ Não é possível ter saldo negativo (CHECK constraint)
- ✅ Todas as operações são auditadas em `coin_transactions`
- ✅ Triggers automáticos garantem consistência

---

## 📊 Monitoramento

### Ver Saldo de Todos os Usuários (Admin)

```sql
SELECT
  u.email,
  c.balance,
  c.created_at,
  c.updated_at
FROM user_credits c
JOIN auth.users u ON c.user_id = u.id
ORDER BY c.balance DESC;
```

### Ver Transações Recentes

```sql
SELECT
  u.email,
  t.amount,
  t.transaction_type,
  t.description,
  t.created_at
FROM coin_transactions t
JOIN auth.users u ON t.user_id = u.id
ORDER BY t.created_at DESC
LIMIT 50;
```

### Estatísticas

```sql
-- Total de coins em circulação
SELECT SUM(balance) as total_coins FROM user_credits;

-- Média de coins por usuário
SELECT AVG(balance) as avg_coins FROM user_credits;

-- Usuários sem coins
SELECT COUNT(*) as users_without_coins
FROM user_credits
WHERE balance = 0;

-- Total de looks gerados (deductions)
SELECT COUNT(*) as total_looks_generated
FROM coin_transactions
WHERE transaction_type = 'deduction';
```

---

## 🔮 Próximos Passos

### Fase 1: Pagamentos (Recomendado)

Integrar gateway de pagamento para compra de coins:

**Opções:**
- [Stripe](https://stripe.com) - Internacional, cartões
- [Mercado Pago](https://mercadopago.com.br) - Brasil, Pix + cartões
- [PagSeguro](https://pagseguro.uol.com.br) - Brasil, múltiplos métodos

**Implementação:**
1. Criar API route em `app/api/purchase-coins/route.ts`
2. Integrar webhook do gateway para confirmar pagamento
3. Chamar `addCoins(userId, amount, "purchase")` após confirmação
4. Atualizar botão "Comprar Agora" no `CoinStore.tsx`

### Fase 2: Promoções e Bônus

- Coins grátis em datas especiais
- Bônus de referência (convidar amigas)
- Missões diárias (ganhar coins extras)
- Pacotes promocionais limitados

### Fase 3: Gamificação

- Badges por looks gerados
- Streak de uso diário
- Níveis de usuário
- Descontos VIP para usuárias frequentes

### Fase 4: Analytics

- Dashboard de uso de coins
- Métricas de conversão (coins → looks)
- Análise de pacotes mais vendidos
- Lifetime Value (LTV) por usuário

---

## 🐛 Troubleshooting

### Erro: "User balance not found"

**Causa:** Usuário não tem registro na tabela `user_credits`

**Solução:**
```sql
-- Criar manualmente para um usuário específico
INSERT INTO user_credits (user_id, balance)
VALUES ('uuid-do-usuario', 3)
ON CONFLICT (user_id) DO NOTHING;

-- Ou criar para todos os usuários existentes
INSERT INTO user_credits (user_id, balance)
SELECT id, 3 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### Erro: "Insufficient coins" mas tenho saldo

**Causa:** Estado desatualizado no frontend

**Solução:**
```tsx
const { refresh } = useCoins()
await refresh() // Forçar atualização
```

### Coins não atualizam em tempo real

**Causa:** Realtime não habilitado no Supabase

**Solução:**
1. Vá em **Database** → **Replication**
2. Ative replication para a tabela `user_credits`
3. O hook `useCoins` já tem subscription configurada

### Modal de coins não abre

**Causa:** Componente `Dialog` do Radix UI não configurado

**Solução:**
Certifique-se de ter instalado:
```bash
npm install @radix-ui/react-dialog
```

---

## 📞 Suporte

- **Issues do projeto:** [GitHub Issues](https://github.com/seu-usuario/amiguei-ai/issues)
- **Documentação Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Dúvidas sobre coins:** Abra uma issue com tag `coins`

---

## ✅ Checklist de Implementação

- [x] Criar schema SQL no Supabase
- [x] Criar funções de gerenciamento de coins
- [x] Criar hook customizado useCoins
- [x] Criar componente AmigueiCoin
- [x] Criar componente CoinBalance
- [x] Criar componente CoinStore
- [x] Criar Header global
- [x] Integrar validação de coins no quiz
- [x] Testar dedução de coins
- [x] Testar modal de coins insuficientes
- [ ] Integrar gateway de pagamento
- [ ] Implementar webhooks de pagamento
- [ ] Adicionar analytics de coins
- [ ] Deploy em produção

---

**Desenvolvido com ❤️ para Amiguei.AI**

*Última atualização: 21 de Novembro de 2025*
