import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Inicializar Supabase com Service Role Key (do servidor)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Credenciais do Supabase não configuradas" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Enviar email de reset de senha
    const { error } = await supabase.auth.resendPasswordRecoveryEmail(email)

    if (error) {
      console.error("Erro ao enviar email:", error)
      return NextResponse.json(
        { error: error.message || "Erro ao enviar email" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email de teste enviado para ${email}. Verifique a caixa de entrada e spam!`,
    })
  } catch (error: any) {
    console.error("Erro:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
