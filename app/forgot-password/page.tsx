"use client"

import type React from "react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (!email) {
      setError("Email é obrigatório")
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        console.error("Reset password error:", resetError)
        throw resetError
      }

      setSuccess(true)
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao enviar email de recuperação"
      console.error("Reset password exception:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <Logo />

        <h2 className="text-2xl font-bold text-center mb-2">Esqueceu sua senha?</h2>
        <p className="text-center text-gray-600 mb-8">
          Não se preocupe! Digite seu email e enviaremos um link para redefinir sua senha.
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-green-700 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Email enviado!</h3>
              <p className="text-sm">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de
                entrada e spam.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold">
                Voltar para o login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
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
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-[#FF69B4] hover:underline font-semibold">
                ← Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
