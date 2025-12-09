import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Buscar token no banco de dados
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: "Link inválido ou expirado" },
        { status: 400 }
      )
    }

    // Verificar se o token expirou
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Link expirado. Solicite um novo." },
        { status: 400 }
      )
    }

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar senha" },
        { status: 500 }
      )
    }

    // Deletar token após uso
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("token", token)

    return NextResponse.json({
      message: "Senha redefinida com sucesso!",
    })
  } catch (error: any) {
    console.error("Erro:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
