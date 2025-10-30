import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: `Você é uma assistente de moda especializada chamada Amiguei.AI. 
    Seu papel é ajudar usuários a escolher looks perfeitos baseados em suas preferências, ocasião e clima.
    Seja amigável, criativa e dê sugestões detalhadas sobre combinações de roupas, cores e acessórios.
    Sempre responda em português brasileiro de forma clara e objetiva.`,
    messages,
  })

  return result.toUIMessageStreamResponse()
}
