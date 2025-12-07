"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      setError("Email e senha são obrigatórios")
      setLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Login error:", signInError)
        throw signInError
      }

      if (data.user) {
        // Login bem-sucedido, redireciona para onboarding
        router.push("/onboarding/1")
        router.refresh()
      }
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao fazer login"
      console.error("Login exception:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <Logo />

        <h2 className="text-2xl font-bold text-center mb-8">Bem-vinda de volta!</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="text-center">
            <a href="#" className="text-sm text-[#FF69B4] hover:underline">
              Esqueceu a senha?
            </a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">Não tem conta? </span>
            <a href="/signup" className="text-sm text-[#FF69B4] hover:underline font-semibold">
              Criar conta
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}