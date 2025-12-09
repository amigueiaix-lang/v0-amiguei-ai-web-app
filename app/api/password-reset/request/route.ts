import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_PASSWORD

    if (!supabaseUrl || !supabaseServiceKey || !gmailUser || !gmailPassword) {
      return NextResponse.json(
        { error: "Variáveis de ambiente não configuradas" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Configurar transporte de email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Verificar se o usuário existe no Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      // Não revelar se email existe ou não (segurança)
      return NextResponse.json({
        message: "Se o email existe em nossa base, um link de recuperação será enviado.",
      })
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    // Salvar token no banco de dados
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert([{ user_id: user.id, token, expires_at: expiresAt }])

    if (insertError) {
      console.error("Erro ao salvar token:", insertError)
      return NextResponse.json({ error: "Erro ao gerar link" }, { status: 500 })
    }

    // Gerar link de reset
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    // Enviar email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF69B4 0%, #E91E63 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
        .content p { margin: 15px 0; font-size: 16px; }
        .button-container { text-align: center; margin: 30px 0; }
        .reset-button { display: inline-block; background: linear-gradient(135deg, #FF69B4 0%, #E91E63 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
        .link-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        .link-section p { font-size: 14px; color: #666; }
        .link-section a { color: #FF69B4; text-decoration: none; word-break: break-all; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Redefinir sua Senha</h1>
        </div>
        <div class="content">
            <p>Olá! 👋</p>
            <p>Você solicitou a redefinição de senha para sua conta no <strong>Amiguei.AI</strong>.</p>
            <p>Clique no botão abaixo para criar uma nova senha segura:</p>

            <div class="button-container">
                <a href="${resetLink}" class="reset-button">Redefinir Senha</a>
            </div>

            <div class="link-section">
                <p>Ou copie e cole este link no navegador:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
            </div>

            <p style="margin-top: 30px; color: #666;">
                <strong>⚠️ Importante:</strong> Este link expira em <strong>7 dias</strong>. Se você não solicitou esta redefinição, ignore este email.
            </p>

            <p style="margin-top: 20px;">Qualquer dúvida? Estamos aqui para ajudar! 💕</p>

            <div class="footer">
                <p>Atenciosamente,<br><strong>Equipe Amiguei.AI</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
    `

    await transporter.sendMail({
      from: gmailUser,
      to: email,
      subject: "🔐 Redefinir senha - Amiguei.AI",
      html: htmlContent,
    })

    return NextResponse.json({
      message: "Se o email existe em nossa base, um link de recuperação será enviado.",
    })
  } catch (error: any) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
