# 🚀 APLIQUE O PROMPT CORRIGIDO AGORA

## ⚠️ Problema Identificado

O AI Agent estava retornando **texto de placeholder** ("id-do-topo-aqui") em vez de **IDs reais** porque:

1. ❌ O prompt antigo tinha exemplos com "uuid-here" (placeholder)
2. ❌ A IA estava COPIANDO o exemplo em vez de EXTRAIR IDs reais
3. ❌ Não havia instruções explícitas de COMO extrair os UUIDs do closetData

---

## ✅ Solução

Criei um **novo prompt** que:

1. ✅ Instrui EXPLICITAMENTE a IA a NÃO usar placeholders
2. ✅ Explica o formato do closetData: `Category: "Name" (ID: uuid) - Colors: x`
3. ✅ Mostra exemplo CONCRETO de como extrair IDs
4. ✅ Adiciona checklist de validação antes da IA retornar
5. ✅ Remove todos os placeholders dos exemplos

---

## 📋 PASSO A PASSO (Siga Agora)

### 1. Abra o N8N

Acesse: https://amiguei.app.n8n.cloud

### 2. Abra o Workflow

- Localize o workflow "Amiguei AI Look Generator" (ou nome similar)
- Clique para abrir

### 3. Abra o Node AI Agent

- Procure o node chamado **"AI Agent"**
- Clique nele para abrir as configurações

### 4. Copie o Novo Prompt

- Abra o arquivo: [N8N-PROMPT-CORRIGIDO-FINAL.md](N8N-PROMPT-CORRIGIDO-FINAL.md)
- Role até a seção **"PROMPT COMPLETO (Cole no AI Agent)"**
- Copie TODO o conteúdo entre as ``` (excluindo as próprias ```)
- O prompt começa com: `You are a fashion AI assistant for Amiguei.AI...`
- O prompt termina com: `...and return ONLY the JSON response.`

### 5. Cole no AI Agent

- No N8N, no node AI Agent, localize o campo **"Prompt"** ou **"Instructions"**
- **SELECIONE TODO** o texto atual (Ctrl+A ou Cmd+A)
- **DELETE** o texto antigo
- **COLE** o novo prompt (Ctrl+V ou Cmd+V)

### 6. Salve e Ative

- Clique em **"Save"** (Salvar) no canto superior direito
- Se o workflow estiver desativado, clique em **"Activate"** (Ativar)

### 7. Teste Imediatamente

- Clique em **"Execute Workflow"** (Executar Workflow)
- OU configure um webhook de teste e acione via API

---

## 🧪 Como Verificar se Funcionou

### Teste 1: Verificar Logs do Node Code

1. Após executar, clique no node **"Code"**
2. Veja a aba **"Output"** ou **"Logs"**
3. Procure por:
   ```
   ✅ Look COM VESTIDO detectado
   ```
   ou
   ```
   ✅ Look TRADICIONAL detectado
   ```

4. Verifique se aparece:
   ```json
   {
     "dress_item_id": "7d9653b1-25a0-469c-9c50-753feba1cfd3",  // ✅ UUID real
     "shoes_item_id": "xyz-abc-123",  // ✅ UUID real
     "reasoning": "Este look é perfeito porque..."
   }
   ```

### Teste 2: Verificar que NÃO aparece placeholders

❌ Se ainda aparecer isso, o prompt não foi aplicado:
```json
{
  "id": "uuid-here",  // ❌ ERRADO
  "id": "id-do-topo-aqui",  // ❌ ERRADO
  "id": "ACTUAL-UUID-FROM-CLOSET-DATA"  // ❌ ERRADO (esse é do exemplo)
}
```

✅ Deve aparecer isso:
```json
{
  "id": "7d9653b1-25a0-469c-9c50-753feba1cfd3",  // ✅ CORRETO (UUID real)
}
```

---

## 🐛 Se Ainda Não Funcionar

### Opção A: Verificar Input do AI Agent

1. No N8N, clique no node **"Prepare Data for AI"**
2. Veja a aba **"Output"**
3. Verifique se `closetData` contém:
   ```
   Vestido: "Nome Real" (ID: uuid-real-aqui) - Colors: vermelho - Style: elegante
   ```

4. Se NÃO tiver esse formato, o problema está no node anterior

### Opção B: Verificar Modelo de IA

1. No node AI Agent, verifique qual modelo está configurado
2. Modelos recomendados (em ordem de preferência):
   - Claude 3.5 Sonnet
   - GPT-4 Turbo
   - GPT-4
   - GPT-3.5 Turbo

3. Se estiver usando modelo muito antigo/simples, pode não seguir instruções complexas

### Opção C: Adicionar Temperatura Baixa

1. No node AI Agent, procure configuração **"Temperature"**
2. Configure para **0.1** ou **0.2** (baixa criatividade = mais obediência)
3. Isso faz a IA seguir instruções mais fielmente

---

## 📸 Me Envie se Continuar com Problema

Se após aplicar o novo prompt ainda houver erro, me envie:

1. **Screenshot do output do node "AI Agent"**
   - Mostra o que a IA retornou

2. **Screenshot do input do node "AI Agent"**
   - Mostra o que foi enviado para a IA (incluindo closetData)

3. **Screenshot dos logs do node "Code"**
   - Mostra o erro exato

Com essas 3 informações, posso identificar exatamente onde está o problema.

---

## ✅ Resultado Esperado

Após aplicar o novo prompt, você deve ver:

1. ✅ AI Agent retorna JSON válido com UUIDs reais
2. ✅ Node Code processa sem erros
3. ✅ Node "Create a row" insere no Supabase com sucesso
4. ✅ Frontend mostra o look corretamente
5. ✅ Feedback system funciona
6. ✅ Sistema de compartilhamento funciona

---

## 🎉 Quando Funcionar

Após confirmar que está funcionando:

1. Teste com **ocasião formal** → deve retornar VESTIDO + SAPATOS
2. Teste com **ocasião casual** → deve retornar TOP + BOTTOM + SAPATOS
3. Teste **feedback negativo** → deve gerar look diferente
4. Teste **compartilhar look** → deve criar link funcionando

---

**👉 COMECE AGORA: Vá para o N8N e aplique o novo prompt!**
