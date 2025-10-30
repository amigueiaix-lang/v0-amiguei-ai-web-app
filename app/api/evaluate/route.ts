import { generateText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { description, rating } = await req.json()

  const ratingText =
    rating === 1
      ? "precisa de ajuda"
      : rating === 2
        ? "pode melhorar"
        : rating === 3
          ? "está ok"
          : rating === 4
            ? "gostou bastante"
            : "considera perfeito"

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `Você é uma consultora de moda especializada. Um usuário enviou uma foto do look dele com a seguinte descrição: "${description}". 
    O usuário avaliou o próprio look como ${rating}/5 estrelas (${ratingText}).
    
    Forneça uma avaliação detalhada e construtiva do look, incluindo:
    1. Pontos positivos da combinação
    2. Sugestões de melhoria (se houver)
    3. Dicas de acessórios ou ajustes que poderiam complementar
    4. Comentário sobre a adequação para a ocasião mencionada
    
    Seja amigável, encorajadora e específica. Responda em português brasileiro de forma clara e objetiva, em no máximo 150 palavras.`,
  })

  return Response.json({ evaluation: text })
}
