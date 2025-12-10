"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUserName(user.name)
    }
  }, [])

  const handleStartOnboarding = () => {
    router.push("/onboarding/1")
  }

  const handleSkip = () => {
    router.push("/closet")
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4 flex flex-col">
      <div className="w-full max-w-[600px] mx-auto flex flex-col items-center justify-center min-h-screen">
        <Logo />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Parabéns, {userName || "Bem-vinda"}! 🎉
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Sua conta foi criada com sucesso!
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FF69B4]/10 to-[#E91E63]/10 border border-[#FF69B4]/20 rounded-2xl p-8 mb-8 max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Personalize suas recomendações! 👗
            </h2>
            <p className="text-gray-700 mb-6">
              Responda um quiz rápido para personalizarmos as recomendações de looks, ocasiões e entendermos melhor o seu estilo.
            </p>

            <div className="space-y-3 text-left bg-white/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold text-gray-900">Looks personalizados</p>
                  <p className="text-sm text-gray-600">Recomendações de acordo com seu estilo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="font-semibold text-gray-900">Entenda seu estilo</p>
                  <p className="text-sm text-gray-600">Descubra cores e peças ideais para você</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-semibold text-gray-900">Sugestões inteligentes</p>
                  <p className="text-sm text-gray-600">Ocasiões e combinações perfeitas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md space-y-3">
          <Button
            onClick={handleStartOnboarding}
            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold"
          >
            Responder quiz rápido
          </Button>

          <Button
            onClick={handleSkip}
            variant="outline"
            className="w-full border-2 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4]/5 rounded-xl py-6 text-base font-semibold"
          >
            Pular por enquanto
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Leva menos de 2 minutos e você pode responder quando quiser!
        </p>
      </div>
    </div>
  )
}
