"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"

export default function FinalizingPage() {
  const router = useRouter()

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      // Clear onboarding data from localStorage
      localStorage.removeItem("onboarding_q1")
      localStorage.removeItem("onboarding_q2")
      localStorage.removeItem("onboarding_q3")
      localStorage.removeItem("onboarding_q4")

      // Redirect to main page
      router.push("/")
    }, 3000)

    return () => clearTimeout(timer)
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