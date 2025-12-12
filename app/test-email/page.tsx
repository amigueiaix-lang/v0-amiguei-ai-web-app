"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Erro ao enviar email",
        })
      } else {
        setMessage({
          type: "success",
          text: data.message,
        })
        setEmail("")
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao enviar email",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-4">
      <div className="w-full max-w-[500px] mx-auto">
        <h1 className="text-3xl font-bold mb-2">Teste de Email</h1>
        <p className="text-gray-600 mb-8">Envie um email de teste para verificar se SendGrid está funcionando.</p>

        <form onSubmit={handleSendTestEmail} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#E91E63] hover:brightness-110 text-white rounded-xl py-6 font-semibold"
          >
            {loading ? "Enviando..." : "Enviar Email de Teste"}
          </Button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Dica:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Digite um email real para receber o teste</li>
            <li>• Verifique a pasta de SPAM</li>
            <li>• Pode levar alguns segundos para chegar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
