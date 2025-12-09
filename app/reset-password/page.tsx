"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Verificar se há uma sessão válida de recuperação
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true)
      } else {
        setError("Link inválido ou expirado. Por favor, solicite um novo link de recuperação.")
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Update password error:", updateError)
        throw updateError
      }

      // Senha atualizada com sucesso, redirecionar para login
      alert("Senha atualizada com sucesso! Faça login com sua nova senha.")
      router.push("/login")
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao atualizar senha"
      console.error("Update password exception:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession && !error) {
    return (
      <div className="min-h-screen bg-white px-6 py-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF69B4] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <Logo />

        <h2 className="text-2xl font-bold text-center mb-2">Redefinir senha</h2>
        <p className="text-center text-gray-600 mb-8">Digite sua nova senha abaixo.</p>

        {!isValidSession ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            <p className="mb-4">{error}</p>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold"
            >
              Solicitar novo link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold disabled:opacity-50"
            >
              {loading ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
