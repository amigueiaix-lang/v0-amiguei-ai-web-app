# 📧 Configurar Email de Recuperação de Senha no Supabase

Para que o "Esqueci minha senha" funcione, você precisa configurar o envio de emails no Supabase.

---

## 🗄️ PRIMEIRO: Execute o SQL para adicionar onboarding_completed

**Acesse:** https://supabase.com/dashboard → Seu Projeto → SQL Editor

**Cole e execute:**

```sql
-- Adicionar campo onboarding_completed
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Marcar usuários existentes como completados
UPDATE public.users
SET onboarding_completed = TRUE
WHERE created_at < NOW();

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
```

---

## 📧 SEGUNDO: Configurar Email Templates

### 1. Acesse as Configurações de Auth

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral: **Authentication** → **Email Templates**

### 2. Configure o Template "Reset Password"

Clique em **"Reset Password"** e use este template:

**Subject:**
```
Redefinir senha - Amiguei.AI
```

**Body:**
```html
<h2>Redefinir sua senha</h2>
<p>Olá!</p>
<p>Você solicitou a redefinição de senha para sua conta no Amiguei.AI.</p>
<p>Clique no botão abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #FF69B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Redefinir Senha</a></p>
<p>Ou copie e cole este link no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
<br>
<p>Atenciosamente,<br>Equipe Amiguei.AI</p>
```

### 3. Configurar o Redirect URL

1. Vá em: **Authentication** → **URL Configuration**
2. Em **"Redirect URLs"**, adicione:
   ```
   https://amiguei.com.br/reset-password
   http://localhost:3000/reset-password
   ```
3. Clique em **Save**

---

## 🔧 TERCEIRO: Configurar Site URL

1. Vá em: **Authentication** → **URL Configuration**
2. Em **"Site URL"**, coloque:
   ```
   https://amiguei.com.br
   ```
3. Clique em **Save**

---

## ✅ QUARTO: Testar o Fluxo

1. Acesse: https://amiguei.com.br/login
2. Clique em "Esqueceu a senha?"
3. Digite seu email
4. Verifique sua caixa de entrada (e spam!)
5. Clique no link do email
6. Defina uma nova senha

---

## 📝 Observações Importantes

### Por padrão, o Supabase usa:
- **SMTP Rate Limits:** 4 emails/hora (plano gratuito)
- **From:** noreply@mail.app.supabase.com

### Para produção (opcional), configure SMTP customizado:

1. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
2. Configure com seu provedor de email (Gmail, SendGrid, etc.)
3. Isso permite:
   - Mais emails por hora
   - Email personalizado (ex: noreply@amiguei.com.br)
   - Melhor deliverability

---

## 🆘 Troubleshooting

### Email não chega?
1. Verifique a pasta de spam
2. Verifique se o email está correto
3. Tente novamente após alguns minutos (rate limit)
4. Veja os logs em: **Authentication** → **Logs**

### Link expira muito rápido?
1. Vá em: **Authentication** → **Policies**
2. Ajuste "Password Recovery Token Expiry" se necessário

---

**Depois de configurar tudo acima, faça o deploy no servidor!**
