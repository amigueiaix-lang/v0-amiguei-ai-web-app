# 🎀 Guia de Implementação - Suporte a Vestidos

## 📋 Resumo

A Amiguei.AI agora pode sugerir **vestidos** como alternativa a looks tradicionais (top + bottom + shoes). A IA escolhe automaticamente entre:
- **Look com Vestido**: Vestido + Sapatos (para ocasiões formais, festas, eventos elegantes)
- **Look Tradicional**: Top + Bottom + Sapatos (para casual, trabalho, dia a dia)

---

## ✅ O que foi Implementado

### 1. **Frontend (Next.js)**
- ✅ Interfaces TypeScript atualizadas (`ProcessedLook`, `LookResponse`)
- ✅ Lógica de validação para dress vs traditional looks
- ✅ UI adaptativa (mostra vestido OU top+bottom)
- ✅ Feedback system atualizado para suportar dress_item_id
- ✅ Sistema de compartilhamento atualizado
- ✅ Página de resultado do quiz ([app/quiz/resultado/page.tsx](app/quiz/resultado/page.tsx))
- ✅ Página de look compartilhado ([app/look/[shareCode]/page.tsx](app/look/[shareCode]/page.tsx))

### 2. **Backend (API Routes)**
- ✅ [/api/look-feedback/route.ts](app/api/look-feedback/route.ts) - Suporta dress_item_id
- ✅ [/api/share-look/route.ts](app/api/share-look/route.ts) - Suporta dress_item_id
- ✅ Validação de campos opcionais (top/bottom OU dress)

### 3. **Documentação**
- ✅ [N8N-PROMPT-COM-VESTIDO.md](N8N-PROMPT-COM-VESTIDO.md) - Prompt atualizado para N8N
- ✅ [supabase/UPDATE-TABLES-PARA-VESTIDOS.sql](supabase/UPDATE-TABLES-PARA-VESTIDOS.sql) - SQL para atualizar tabelas

---

## 🚀 Passos para Aplicar

### Passo 1: Atualizar Banco de Dados (Supabase)

1. Acesse seu Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Copie e cole o conteúdo de `supabase/UPDATE-TABLES-PARA-VESTIDOS.sql`
6. Clique em **Run** para executar

**O que este SQL faz:**
- Adiciona coluna `dress_item_id` em `look_feedback` e `shared_looks`
- Torna `top_item_id` e `bottom_item_id` opcionais (nullable)
- Adiciona constraints para garantir integridade (OU dress OU top+bottom)
- Cria índices para melhor performance

### Passo 2: Atualizar Prompt do N8N

1. Acesse seu workflow N8N: https://amiguei.app.n8n.cloud
2. Localize o node **"AI Agent"** no workflow
3. Abra o arquivo `N8N-PROMPT-COM-VESTIDO.md`
4. Copie o prompt completo da seção "Prompt Completo para o N8N AI Agent"
5. Cole no campo de prompt do AI Agent no N8N
6. **Salve** o workflow
7. **Ative** o workflow (se estiver desativado)

**O que o novo prompt faz:**
- Instrui a IA a escolher entre dress look OU traditional look
- Define quando usar cada tipo baseado na ocasião
- Retorna estrutura JSON correta para cada tipo
- Continua respeitando feedback do usuário

### Passo 3: Fazer Deploy do Frontend

Execute os seguintes comandos:

```bash
# 1. Adicionar arquivos ao Git
git add .

# 2. Criar commit
git commit -m "feat: Add dress support to look generation system

- Update TypeScript interfaces to support dress items
- Add conditional rendering for dress vs traditional looks
- Update APIs to handle dress_item_id
- Add dress support to feedback and sharing systems
- Update N8N prompt to choose between dress and traditional looks
- Add SQL migration for database schema updates"

# 3. Fazer push para o repositório
git push origin main

# 4. Fazer deploy (o Vercel vai detectar automaticamente)
# Aguarde 2-3 minutos para o deploy completar
```

**Verificar deploy:**
- Acesse https://vercel.com/dashboard
- Verifique se o deploy foi bem-sucedido
- Teste em https://amiguei.ai

---

## 🧪 Como Testar

### Teste 1: Look com Vestido
1. Faça login em https://amiguei.ai
2. Vá em "Gerar Look"
3. No quiz, escolha:
   - **Ocasião**: "Festa" ou "Casamento" ou "Evento formal"
   - **Clima**: Qualquer
   - **Estilo**: "Elegante" ou "Romântico"
4. Clique em "Gerar Look"
5. ✅ **Resultado esperado**: Deve mostrar um VESTIDO + SAPATOS

### Teste 2: Look Tradicional
1. No quiz, escolha:
   - **Ocasião**: "Trabalho" ou "Casual" ou "Dia a dia"
   - **Clima**: Qualquer
   - **Estilo**: "Profissional" ou "Confortável"
2. Clique em "Gerar Look"
3. ✅ **Resultado esperado**: Deve mostrar TOP + BOTTOM + SAPATOS

### Teste 3: Feedback com Vestido
1. Gere um look com vestido (seguindo Teste 1)
2. Clique em "Gerar outro look"
3. Selecione qualquer feedback (ex: "Não gostei das cores")
4. Clique em "Gerar novo look"
5. ✅ **Resultado esperado**:
   - Deve gerar um look DIFERENTE
   - Pode ser vestido OU tradicional (dependendo da ocasião)
   - Não deve repetir as mesmas peças

### Teste 4: Compartilhar Look com Vestido
1. Gere um look com vestido
2. Clique em "Compartilhar Look"
3. Copie o link gerado
4. Abra em uma aba anônima (ou logout)
5. ✅ **Resultado esperado**:
   - Deve mostrar o vestido + sapatos
   - Deve mostrar o botão "Criar conta grátis"

---

## 📊 Estrutura de Dados

### Look com Vestido
```json
{
  "look": {
    "dress": {
      "id": "uuid",
      "name": "Vestido Floral Rosa",
      "image_url": "https://..."
    },
    "shoes": {
      "id": "uuid",
      "name": "Salto Nude",
      "image_url": "https://..."
    }
  },
  "reasoning": "Este vestido é perfeito para festas..."
}
```

### Look Tradicional
```json
{
  "look": {
    "top": {
      "id": "uuid",
      "name": "Camisa Branca",
      "image_url": "https://..."
    },
    "bottom": {
      "id": "uuid",
      "name": "Calça Preta",
      "image_url": "https://..."
    },
    "shoes": {
      "id": "uuid",
      "name": "Scarpin Preto",
      "image_url": "https://..."
    }
  },
  "reasoning": "Look profissional e elegante..."
}
```

---

## 🔍 Troubleshooting

### Problema: N8N retorna erro "invalid JSON"
**Solução**: Verifique se o prompt do N8N está exatamente como em `N8N-PROMPT-COM-VESTIDO.md`

### Problema: Erro "constraint violation" no Supabase
**Solução**: Execute o SQL `UPDATE-TABLES-PARA-VESTIDOS.sql` novamente

### Problema: Frontend mostra erro TypeScript
**Solução**:
```bash
npm run build
```
Se houver erros, verifique se todas as interfaces foram atualizadas corretamente.

### Problema: Look sempre retorna top+bottom, nunca vestido
**Solução**:
1. Verifique se o prompt do N8N foi atualizado
2. Teste com ocasião claramente formal (ex: "Festa de casamento")
3. Verifique logs do N8N para ver resposta da IA

### Problema: Feedback não está sendo salvo
**Solução**:
1. Abra o console do navegador (F12)
2. Verifique se há erros na aba "Console"
3. Verifique se o SQL foi executado corretamente no Supabase

---

## 📝 Arquivos Modificados

### Frontend
- `app/quiz/resultado/page.tsx` - Página principal de resultados
- `app/look/[shareCode]/page.tsx` - Página de look compartilhado

### Backend
- `app/api/look-feedback/route.ts` - API de feedback
- `app/api/share-look/route.ts` - API de compartilhamento

### Database
- `supabase/UPDATE-TABLES-PARA-VESTIDOS.sql` - Migration SQL

### Documentation
- `N8N-PROMPT-COM-VESTIDO.md` - Prompt atualizado
- `GUIA-IMPLEMENTACAO-VESTIDOS.md` - Este guia

---

## ✨ Próximos Passos (Opcional)

Após implementar e testar, considere:

1. **Analytics**: Adicionar tracking para ver quantos % de looks são vestidos vs tradicionais
2. **A/B Testing**: Testar diferentes critérios para escolher dress vs traditional
3. **Feedback específico**: Adicionar opção "Prefiro vestido" ou "Prefiro separados" no feedback
4. **Acessórios**: Futuramente, adicionar suporte para bolsas, joias, etc.

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Vercel: https://vercel.com/dashboard
2. Verifique os logs do N8N no workflow
3. Verifique o console do navegador (F12)
4. Revise este guia passo a passo

---

## ✅ Checklist Final

- [ ] SQL executado no Supabase sem erros
- [ ] Prompt do N8N atualizado e salvo
- [ ] Frontend deployado com sucesso
- [ ] Teste 1 (look com vestido) passou
- [ ] Teste 2 (look tradicional) passou
- [ ] Teste 3 (feedback) passou
- [ ] Teste 4 (compartilhamento) passou

**Parabéns! 🎉 A Amiguei.AI agora suporta vestidos!**
