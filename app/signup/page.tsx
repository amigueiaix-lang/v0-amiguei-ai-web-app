"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Criar entrada na tabela users
        const { error: userInsertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              name: name,
            }
          ])
      
          if (userInsertError) {
            console.error('❌ ERRO COMPLETO AO CRIAR USUÁRIO:')
            console.error('Message:', userInsertError.message)
            console.error('Details:', userInsertError.details)
            console.error('Hint:', userInsertError.hint)
            console.error('Code:', userInsertError.code)
            alert(`Erro ao criar usuário: ${userInsertError.message}`)
          }
      
        // Store user data locally
        localStorage.setItem("user", JSON.stringify({ name, email }))
        
        // Redirect to welcome
        router.push("/welcome")
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-black mb-4 hover:opacity-70"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <Logo />

        <h2 className="text-2xl font-bold text-center mb-8">Crie sua conta</h2>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
            />
          </div>

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

          <div>
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
            />
          </div>

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 text-base font-semibold disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">Já tem conta? </span>
            <a href="/login" className="text-sm text-[#FF69B4] hover:underline font-semibold">
              Entrar
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}