"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

const options = [
  { value: "Magra", description: "linhas retas, poucas curvas" },
  { value: "Média", description: "proporcional, curvas suaves" },
  { value: "Curvilínea", description: "busto e/ou quadril mais marcados" },
  { value: "Plus size", description: "curvas e volumes mais presentes" },
]

export default function OnboardingQuestion3() {
  const router = useRouter()
  const [selected, setSelected] = useState("")

  const handleNext = () => {
    if (selected) {
      localStorage.setItem("onboarding_q3", selected)
      router.push("/onboarding/4")
    }
  }

  const handlePrevious = () => {
    router.push("/onboarding/2")
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
            <span className="text-sm text-[#FF69B4] font-semibold">Pergunta 3 de 4</span>
            <span className="text-sm text-gray-600">75%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] transition-all duration-300"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2">Pergunta 3</h2>
        <p className="text-base text-gray-700 mb-8">Estilo de corpo</p>

        <div className="space-y-4 mb-8">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                selected === option.value ? "border-[#FF69B4] bg-[#FFE4E1]" : "border-black hover:bg-[#FFE4E1]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected === option.value ? "border-[#FF69B4]" : "border-black"
                  }`}
                >
                  {selected === option.value && <div className="w-3 h-3 rounded-full bg-[#FF69B4]"></div>}
                </div>
                <div>
                  <div className="text-base font-medium">{option.value}</div>
                  <div className="text-sm text-gray-600">({option.description})</div>
                </div>
              </div>
            </button>
          ))}
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
            onClick={handleNext}
            disabled={!selected}
            className="bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Próxima →
          </Button>
        </div>
      </div>
    </div>
  )
}