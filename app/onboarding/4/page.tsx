"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const options = [
  "Sofisticada",
  "Minimalista",
  "Criativa trendy",
  "Romântica",
  "Sexy marcante",
  "Executiva poderosa",
  "Natural confortável",
  "Street esportiva",
  "Clássica tradicional",
  "Modesta discreta",
]

export default function OnboardingQuestion4() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [other, setOther] = useState("")

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option))
    } else if (selected.length < 2) {
      setSelected([...selected, option])
    }
  }

  const handleFinish = () => {
    if (selected.length > 0 || other) {
      const finalSelection = other ? [...selected, other] : selected
      localStorage.setItem("onboarding_q4", JSON.stringify(finalSelection))

      // Compile all onboarding data
      const onboardingData = {
        user: JSON.parse(localStorage.getItem("user") || "{}"),
        onboarding: {
          cor_raca: localStorage.getItem("onboarding_q1"),
          cabelo_cor: localStorage.getItem("onboarding_q2"),
          estilo_corpo: localStorage.getItem("onboarding_q3"),
          imagem_dia_a_dia: finalSelection,
        },
      }

      console.log("Dados para salvar:", onboardingData)

      router.push("/finalizing")
    }
  }

  const handlePrevious = () => {
    router.push("/onboarding/3")
  }

  const handleSkip = () => {
    localStorage.setItem("onboarding_skipped", "true")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Logo />
          <button onClick={handleSkip} className="text-sm text-[#666666] hover:underline">
            Pular por agora
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#FF69B4] font-semibold">Pergunta 4 de 4</span>
            <span className="text-sm text-gray-600">100%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] transition-all duration-300"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2">Pergunta 4</h2>
        <p className="text-base text-gray-700 mb-2">Que imagem você quer transmitir no dia a dia?</p>
        <p className="text-sm text-gray-500 mb-8">(escolha até 2 opções)</p>

        <div className="space-y-4 mb-6">
          {options.map((option) => {
            const isSelected = selected.includes(option)
            const isDisabled = !isSelected && selected.length >= 2

            return (
              <button
                key={option}
                onClick={() => handleToggle(option)}
                disabled={isDisabled}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[#FF69B4] bg-[#FFE4E1]"
                    : isDisabled
                      ? "border-gray-300 opacity-50 cursor-not-allowed"
                      : "border-black hover:bg-[#FFE4E1]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? "border-[#FF69B4] bg-[#FF69B4]" : "border-black"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-base">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mb-8">
          <Input
            type="text"
            placeholder="Outro (escreva aqui)"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
          />
        </div>

        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="border-2 border-black rounded-xl px-8 py-3 text-base font-semibold hover:bg-gray-50 bg-transparent transition-all duration-200"
          >
            ← Anterior
          </Button>
          <Button
            onClick={handleFinish}
            disabled={selected.length === 0 && !other}
            className="bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Finalizar →
          </Button>
        </div>
      </div>
    </div>
  )
} 