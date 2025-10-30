"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Sparkles } from "lucide-react"
import { Logo } from "@/components/logo"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  look?: {
    top?: ClothingItem
    bottom?: ClothingItem
    shoes?: ClothingItem
    explanation: string
  }
}

interface ClothingItem {
  id: string
  name: string
  category: string
  imageUrl: string
}

export default function QuizResultPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load quiz answers from localStorage
    const stored = localStorage.getItem("amiguei-quiz-answers")
    if (stored) {
      const parsedAnswers = JSON.parse(stored)
      setAnswers(parsedAnswers)
      generateLookFromCloset(parsedAnswers)
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const generateLookFromCloset = (quizAnswers: Record<number, string>) => {
    // Load closet items
    const closetStored = localStorage.getItem("amiguei-closet")
    if (!closetStored) {
      // No items in closet, show generic message
      const genericMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Percebi que seu closet ainda está vazio! Adicione algumas peças ao seu closet primeiro para que eu possa montar looks personalizados para você. 😊",
      }
      setMessages([genericMessage])
      return
    }

    const closetItems: ClothingItem[] = JSON.parse(closetStored)

    // Filter items by category
    const topItems = closetItems.filter((item) =>
      ["Camiseta", "Blusa", "Camisa", "Jaqueta", "Casaco"].includes(item.category),
    )
    const bottomItems = closetItems.filter((item) => ["Calça", "Short", "Saia", "Vestido"].includes(item.category))
    const shoesItems = closetItems.filter((item) => ["Sapato", "Tênis", "Sandália"].includes(item.category))

    // Select random pieces (in a real app, this would be based on quiz answers)
    const selectedTop = topItems.length > 0 ? topItems[Math.floor(Math.random() * topItems.length)] : undefined
    const selectedBottom =
      bottomItems.length > 0 ? bottomItems[Math.floor(Math.random() * bottomItems.length)] : undefined
    const selectedShoes = shoesItems.length > 0 ? shoesItems[Math.floor(Math.random() * shoesItems.length)] : undefined

    if (!selectedTop && !selectedBottom && !selectedShoes) {
      const noItemsMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Não encontrei peças suficientes no seu closet para montar um look completo. Adicione mais peças (blusas, calças, tênis) para que eu possa criar sugestões personalizadas! 😊",
      }
      setMessages([noItemsMessage])
      return
    }

    // Generate explanation based on quiz answers
    const occasion = quizAnswers[1] || "seu dia"
    const formality = quizAnswers[2] || "casual"
    const style = quizAnswers[3] || "confortável"

    let explanation = `Para ${occasion}, montei este look que combina ${formality} e ${style}. `

    if (selectedTop) {
      explanation += `A ${selectedTop.name} traz um toque elegante e versátil. `
    }
    if (selectedBottom) {
      explanation += `A ${selectedBottom.name} complementa perfeitamente o visual. `
    }
    if (selectedShoes) {
      explanation += `O ${selectedShoes.name} finaliza o look com estilo e conforto. `
    }

    explanation += "Esse conjunto reflete sua personalidade e é perfeito para a ocasião!"

    const lookMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Baseado no seu quiz, montei este look para você:",
      look: {
        top: selectedTop,
        bottom: selectedBottom,
        shoes: selectedShoes,
        explanation,
      },
    }

    setMessages([lookMessage])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Mock AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Obrigada pela sua pergunta! Como assistente de moda, posso ajudar você a encontrar o look perfeito. No momento, estou em modo de demonstração, mas em breve terei respostas ainda mais personalizadas! 😊",
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 h-[60px] flex items-center px-6">
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-black hover:text-[#FF69B4] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <div className="max-w-[150px]">
            <Logo />
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-8 pb-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Seu Look Perfeito</h1>
            <p className="text-gray-600">Baseado nas suas preferências, aqui está nossa sugestão</p>
          </div>

          {/* Chat Interface */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            {/* Messages */}
            <div className="min-h-[500px] max-h-[600px] overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Montando seu look perfeito...</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" ? (
                      <div className="max-w-[85%]">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-[#FF69B4]" />
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-2xl px-5 py-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>

                        {message.look && (
                          <div className="ml-13 bg-gray-50 rounded-xl p-4">
                            {/* Stacked outfit images */}
                            <div className="flex flex-col items-center max-w-[280px] mx-auto bg-white rounded-xl overflow-hidden shadow-sm">
                              {message.look.top && (
                                <div className="w-full">
                                  <img
                                    src={message.look.top.imageUrl || "/placeholder.svg"}
                                    alt={message.look.top.name}
                                    className="w-full h-auto object-cover"
                                  />
                                  <div className="px-3 py-2 bg-white border-b border-gray-100">
                                    <p className="text-sm font-medium text-center">{message.look.top.name}</p>
                                  </div>
                                </div>
                              )}
                              {message.look.bottom && (
                                <div className="w-full">
                                  <img
                                    src={message.look.bottom.imageUrl || "/placeholder.svg"}
                                    alt={message.look.bottom.name}
                                    className="w-full h-auto object-cover"
                                  />
                                  <div className="px-3 py-2 bg-white border-b border-gray-100">
                                    <p className="text-sm font-medium text-center">{message.look.bottom.name}</p>
                                  </div>
                                </div>
                              )}
                              {message.look.shoes && (
                                <div className="w-full">
                                  <img
                                    src={message.look.shoes.imageUrl || "/placeholder.svg"}
                                    alt={message.look.shoes.name}
                                    className="w-full h-auto object-cover"
                                  />
                                  <div className="px-3 py-2 bg-white">
                                    <p className="text-sm font-medium text-center">{message.look.shoes.name}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Explanation */}
                            <div className="mt-4 px-2">
                              <p className="text-sm font-semibold mb-2">Por que escolhi essas peças:</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{message.look.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // User message
                      <div className="max-w-[80%] bg-gradient-to-r from-[#FF69B4] to-[#E91E63] text-white rounded-2xl px-5 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-[#FF69B4]" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-5 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input section */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-sm">💬 Converse com o Amiguei.AI</h3>
                <p className="text-xs text-gray-600">Faça perguntas ou peça mais sugestões</p>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-[#FF69B4] text-white rounded-lg hover:bg-[#FF1493] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link href="/quiz" className="flex-1">
              <button className="w-full px-6 py-3 border-2 border-black rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Refazer Quiz
              </button>
            </Link>
            <Link href="/" className="flex-1">
              <button className="w-full px-6 py-3 bg-[#FF69B4] text-white rounded-lg font-medium hover:bg-[#FF1493] transition-colors">
                Voltar ao Início
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
