"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

interface Question {
  id: number
  question: string
  type: "radio" | "textarea"
  options?: string[]
  placeholder?: string
  subtitle?: string
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Qual é a ocasião?",
    type: "radio",
    options: ["Trabalho", "Casual", "Festa", "Esporte", "Encontro romântico"],
  },
  {
    id: 2,
    question: "Como está o clima?",
    type: "radio",
    options: ["Quente", "Frio", "Ameno", "Chuvoso"],
  },
  {
    id: 3,
    question: "Qual estilo você prefere hoje?",
    type: "radio",
    options: ["Elegante", "Confortável", "Moderno", "Clássico", "Despojado"],
  },
  {
    id: 4,
    question: "Qual cor você está com vontade de usar?",
    type: "radio",
    options: ["Neutras (preto, branco, bege)", "Cores vibrantes", "Pastéis", "Estampas", "Sem preferência"],
  },
  {
    id: 5,
    question: "Você gostaria de adicionar alguma informação extra sobre o look?",
    type: "textarea",
    subtitle: "Resposta opcional",
    placeholder: "Ex: quero algo que combine com sapato vermelho",
  },
]

export default function QuizPage() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer })
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Save answers to localStorage and navigate to results
      localStorage.setItem("amiguei-quiz-answers", JSON.stringify(answers))
      router.push("/quiz/resultado")
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const currentAnswer = answers[currentQuestion]
  const currentQ = QUESTIONS[currentQuestion]
  const canProceed = currentAnswer !== undefined || currentQ.type === "textarea"

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
      <main className="flex-1 flex items-center justify-center px-4 pt-8 pb-8">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Pergunta {currentQuestion + 1} de {QUESTIONS.length}
              </span>
              <span className="text-sm font-medium text-[#FF69B4]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#FF69B4] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6">
            <p className="text-sm text-[#FF69B4] font-medium mb-2">Pergunta {currentQuestion + 1}</p>
            <h2 className="text-2xl font-semibold mb-2">{currentQ.question}</h2>
            {currentQ.subtitle && <p className="text-sm text-gray-500 mb-6">{currentQ.subtitle}</p>}

            {currentQ.type === "textarea" ? (
              <textarea
                value={currentAnswer || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={currentQ.placeholder}
                className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
              />
            ) : (
              <div className="space-y-3">
                {currentQ.options?.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#FF69B4] hover:bg-pink-50 transition-all cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-4 h-4 text-[#FF69B4] focus:ring-[#FF69B4]"
                    />
                    <span className="flex-1 text-base">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF69B4] text-white rounded-lg font-medium hover:bg-[#FF1493] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestion === QUESTIONS.length - 1 ? "Enviar" : "Próxima"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
