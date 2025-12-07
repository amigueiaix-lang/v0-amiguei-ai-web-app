"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UsernameInput } from "@/components/UsernameInput"
import { ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || username.length < 3) {
      setError("Username deve ter no mínimo 3 caracteres")
      return
    }

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
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (existingUser) {
        setError("Esse username já está em uso")
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Trigger automático do Supabase cria registro em public.users
        // (ver supabase/users_table.sql e add_username.sql)

        // Store user data locally
        localStorage.setItem("user", JSON.stringify({ name, email, username }))

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
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:border-[#FF69B4] focus:ring-[#FF69B4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome de usuário
            </label>
            <UsernameInput
              value={username}
              onChange={setUsername}
              required
              disabled={loading}
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