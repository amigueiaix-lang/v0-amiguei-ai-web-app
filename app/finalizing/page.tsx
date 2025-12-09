"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"

export default function FinalizingPage() {
  const router = useRouter()

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        // Pegar o usuário autenticado
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Marcar onboarding como completado no banco de dados
          const { error } = await supabase
            .from("users")
            .update({ onboarding_completed: true })
            .eq("id", user.id)

          if (error) {
            console.error("Error updating onboarding status:", error)
          }
        }

        // Clear onboarding data from localStorage
        localStorage.removeItem("onboarding_q1")
        localStorage.removeItem("onboarding_q2")
        localStorage.removeItem("onboarding_q3")
        localStorage.removeItem("onboarding_q4")

        // Wait a bit for the animation, then redirect
        setTimeout(() => {
          router.push("/closet")
        }, 3000)
      } catch (error) {
        console.error("Error in onboarding completion:", error)
        // Even if there's an error, redirect to avoid getting stuck
        setTimeout(() => {
          router.push("/closet")
        }, 3000)
      }
    }

    completeOnboarding()
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[500px] text-center">
        <Logo />

        <div className="mt-12 space-y-6">
          <div className="text-2xl">✨</div>
          <h2 className="text-xl font-semibold">Preparando tudo para você...</h2>

          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-[#FF69B4] animate-spin" />
          </div>

          <p className="text-base text-gray-600">Estamos conhecendo seu estilo</p>
        </div>
      </div>
    </div>
  )
}