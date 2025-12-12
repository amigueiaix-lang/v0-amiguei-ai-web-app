# N8N JavaScript Code - Versão com Suporte a Vestidos e Debug

Cole este código no node **"Code"** do seu workflow N8N:

```javascript
// Pegar resposta do AI Agent
const aiResponse = $input.first().json;

// DEBUG CRÍTICO: Ver estrutura completa da resposta
console.log('===== DEBUG AIRESPONSE COMPLETO =====');
console.log(JSON.stringify(aiResponse, null, 2));
console.log('===== FIM DEBUG AIRESPONSE =====');

let lookData = null;
let rawResponse = null;

// Tentar diferentes formatos de resposta
if (typeof aiResponse.output === 'string') {
  console.log('Caso 1: aiResponse.output é string');
  rawResponse = aiResponse.output;
} else if (aiResponse.output && typeof aiResponse.output === 'object') {
  console.log('Caso 2: aiResponse.output é objeto');
  lookData = aiResponse.output;
} else if (typeof aiResponse.text === 'string') {
  console.log('Caso 3: aiResponse.text é string');
  rawResponse = aiResponse.text;
} else if (typeof aiResponse.response === 'string') {
  console.log('Caso 4: aiResponse.response é string');
  rawResponse = aiResponse.response;
} else if (typeof aiResponse === 'string') {
  console.log('Caso 5: aiResponse inteiro é string');
  rawResponse = aiResponse;
} else {
  console.log('Caso 6: Tentando usar aiResponse como lookData diretamente');
  lookData = aiResponse;
}

// Se temos uma string, extrair o JSON
if (rawResponse && typeof rawResponse === 'string') {
  console.log('Processando rawResponse como string...');
  try {
    // Remover markdown code blocks
    let cleanedResponse = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('Cleaned response:', cleanedResponse);

    // Tentar parse direto
    try {
      lookData = JSON.parse(cleanedResponse);
      console.log('Parse direto funcionou!');
    } catch (e) {
      console.log('Parse direto falhou, tentando regex...');
      // Tentar extrair JSON com regex
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lookData = JSON.parse(jsonMatch[0]);
        console.log('Parse com regex funcionou!');
      }
    }
  } catch (e) {
    throw new Error('Erro ao fazer parse do JSON: ' + e.message + '. Raw response: ' + rawResponse);
  }
}

// Validar que lookData foi extraído
if (!lookData || typeof lookData !== 'object') {
  throw new Error('Falha ao extrair objeto look da resposta. Tipos detectados: ' +
    'aiResponse.output=' + typeof aiResponse.output + ', ' +
    'aiResponse.text=' + typeof aiResponse.text + ', ' +
    'aiResponse.response=' + typeof aiResponse.response + '. ' +
    'Resposta completa: ' + JSON.stringify(aiResponse));
}

// DEBUG: Log para ver estrutura
console.log('DEBUG - lookData completo:', JSON.stringify(lookData, null, 2));

// Normalizar estrutura: pode vir como { look: {...} } ou diretamente {...}
let look = lookData.look || lookData;

console.log('DEBUG - look após extração:', JSON.stringify(look, null, 2));

// Função auxiliar para extrair ID e nome de diferentes formatos
function extractItem(itemData) {
  if (!itemData) return null;

  // Formato 1: { id: "uuid", name: "Nome" }
  if (itemData.id && itemData.name) {
    return {
      id: String(itemData.id),
      name: String(itemData.name)
    };
  }

  // Formato 2: string direta (apenas ID)
  if (typeof itemData === 'string') {
    return { id: itemData, name: '' };
  }

  return null;
}

// Extrair items de diferentes formatos possíveis
let dress = null;
let top = null;
let bottom = null;
let shoes = null;

// Tentar formato aninhado primeiro: { dress: { id, name }, shoes: { id, name } }
if (look.dress) {
  dress = extractItem(look.dress);
}
if (look.top) {
  top = extractItem(look.top);
}
if (look.bottom) {
  bottom = extractItem(look.bottom);
}
if (look.shoes) {
  shoes = extractItem(look.shoes);
}

// Se não encontrou no formato aninhado, tentar formato flat: { dress_item_id, dress_item_name }
if (!dress && look.dress_item_id) {
  dress = {
    id: String(look.dress_item_id),
    name: String(look.dress_item_name || '')
  };
}
if (!top && look.top_item_id) {
  top = {
    id: String(look.top_item_id),
    name: String(look.top_item_name || '')
  };
}
if (!bottom && look.bottom_item_id) {
  bottom = {
    id: String(look.bottom_item_id),
    name: String(look.bottom_item_name || '')
  };
}
if (!shoes && look.shoes_item_id) {
  shoes = {
    id: String(look.shoes_item_id),
    name: String(look.shoes_item_name || '')
  };
}

console.log('DEBUG - Itens extraídos:', {
  dress: dress,
  top: top,
  bottom: bottom,
  shoes: shoes
});

// Validações
if (!shoes || !shoes.id) {
  throw new Error('Sapatos são obrigatórios. Look recebido: ' + JSON.stringify(look));
}

const hasDress = dress && dress.id;
const hasTraditional = top && top.id && bottom && bottom.id;

if (!hasDress && !hasTraditional) {
  throw new Error('Look deve ter UM VESTIDO OU (TOP + BOTTOM). Recebido: ' + JSON.stringify({
    dress: dress,
    top: top,
    bottom: bottom
  }));
}

// Construir resposta base (apenas campos sempre presentes)
const result = {
  shoes_item_id: shoes.id,
  shoes_item_name: shoes.name,
  reasoning: String(look.reasoning || lookData.reasoning || 'Look sugerido pela Amiguei.AI')
};

if (hasDress) {
  // Look com vestido: adicionar apenas dress, não enviar top/bottom
  result.dress_item_id = dress.id;
  result.dress_item_name = dress.name;
  console.log('✅ Look COM VESTIDO detectado');
} else {
  // Look tradicional: adicionar apenas top/bottom, não enviar dress
  result.top_item_id = top.id;
  result.top_item_name = top.name;
  result.bottom_item_id = bottom.id;
  result.bottom_item_name = bottom.name;
  console.log('✅ Look TRADICIONAL detectado');
}

console.log('DEBUG - Resultado final:', JSON.stringify(result, null, 2));

return [{ json: result }];
```

## O que mudou nesta versão:

1. **Suporte a formatos aninhados**: Agora aceita tanto `{ shoes: { id, name } }` quanto `{ shoes_item_id, shoes_item_name }`

2. **Função auxiliar `extractItem()`**: Normaliza diferentes formatos de resposta

3. **Logs de debug**: Mostra em cada etapa o que está sendo processado

4. **Mensagens de erro mais claras**: Mostra exatamente o que foi recebido quando há erro

5. **Mais tolerante**: Aceita `name` vazio se apenas `id` for fornecido

## Como testar:

1. Cole este código no node JavaScript do N8N
2. Execute o workflow
3. Veja os logs no N8N para entender qual formato a IA está retornando
4. Se ainda houver erro, copie o log "DEBUG - lookData completo" e me envie

## Próximos passos após funcionar:

Depois que o JavaScript estiver funcionando corretamente, você pode remover as linhas `console.log('DEBUG...` para limpar o código.
