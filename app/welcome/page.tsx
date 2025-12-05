"use client"

import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()

  const handleStart = () => {
    router.push("/onboarding/1")
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <Logo />

        <div className="mt-12 text-center space-y-6">
          <div className="flex justify-center">
            <Sparkles className="w-16 h-16 text-[#FF69B4]" />
          </div>

          <h2 className="text-3xl font-bold">Bem-vinda ao Amiguei.AI! 🎉</h2>

          <p className="text-base text-gray-600 leading-relaxed">
            Estamos muito felizes em ter você aqui! Vamos começar conhecendo um pouco mais sobre você para
            personalizar sua experiência.
          </p>

          <div className="mt-8 p-6 border-2 border-[#FF69B4] rounded-xl bg-gradient-to-br from-pink-50 to-purple-50">
            <h3 className="font-semibold text-lg mb-3 text-[#FF69B4]">O que vem a seguir:</h3>
            <ul className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">1.</span>
                <span>Conte-nos sobre seu estilo e preferências</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">2.</span>
                <span>Responda algumas perguntas rápidas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF69B4] font-bold">3.</span>
                <span>Comece a descobrir looks perfeitos!</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold"
            >
              Vamos começar! ✨
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}