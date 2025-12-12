# 📧 Configurar SMTP para Envio de Emails no Supabase

O Supabase por padrão NÃO envia emails de verdade no plano gratuito. Você precisa configurar um SMTP externo.

---

## 🔧 OPÇÃO 1: Usar Gmail SMTP (Mais Fácil)

### Passo 1: Ativar 2FA no Gmail

1. Acesse: https://myaccount.google.com/
2. Vá em: **Segurança** → **Verificação em 2 etapas**
3. Configure 2FA com seu telefone

### Passo 2: Gerar Senha de App

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione:
   - **App:** Mail
   - **Device:** Windows Computer (ou seu dispositivo)
3. Clique em **Gerar**
4. **Copie a senha gerada** (será algo como: `xxxx xxxx xxxx xxxx`)

### Passo 3: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Project Settings** (engrenagem no menu)
4. Na aba **Auth** → **SMTP Settings**
5. Preencha:

| Campo | Valor |
|-------|-------|
| **Sender Email** | seu-email@gmail.com |
| **Sender Name** | Amiguei.AI |
| **SMTP Host** | smtp.gmail.com |
| **SMTP Port** | 587 |
| **SMTP User** | seu-email@gmail.com |
| **SMTP Password** | (a senha de app gerada acima) |

6. **Clique em "Test Connection"** para verificar
7. Se OK, clique em **Save**

---

## 🔧 OPÇÃO 2: Usar SendGrid (Recomendado para Produção)

### Passo 1: Criar Conta SendGrid

1. Acesse: https://sendgrid.com
2. Crie uma conta gratuita
3. Verifique seu email

### Passo 2: Gerar API Key

1. Faça login no SendGrid
2. Vá em: **Settings** → **API Keys**
3. Clique em **Create API Key**
4. Escolha "Restricted Access"
5. Em **Mail Send**, marque:
   - ✅ Full Access
6. Clique em **Create & View**
7. **Copie a API Key**

### Passo 3: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
4. Preencha:

| Campo | Valor |
|-------|-------|
| **Sender Email** | noreply@amiguei.com.br |
| **Sender Name** | Amiguei.AI |
| **SMTP Host** | smtp.sendgrid.net |
| **SMTP Port** | 587 |
| **SMTP User** | apikey |
| **SMTP Password** | (sua API Key do SendGrid) |

5. **Clique em "Test Connection"**
6. Se OK, clique em **Save**

---

## 🧪 Testar o Envio de Email

### Teste 1: Pelo Console do Supabase

1. Vá em: **Authentication** → **Users**
2. Clique em um usuário
3. Clique em **Send password reset email**
4. Verifique se o email chegou (incluindo spam!)

### Teste 2: Pelo App

1. Acesse: https://amiguei.com.br/login
2. Clique em **"Esqueceu a senha?"**
3. Digite seu email
4. Clique em **"Enviar link de recuperação"**
5. Verifique sua caixa de entrada

---

## ⚙️ Configurações Importantes no Supabase

### 1. Email Confirmations (Signup)

Vá em: **Authentication** → **Providers** → **Email**

Marque:
- ✅ **Confirm email** (para exigir confirmação)
- ✅ **Double confirm change** (para mudanças de email)

### 2. Redirect URLs

Vá em: **Authentication** → **URL Configuration**

Adicione em **Redirect URLs**:
```
https://amiguei.com.br/reset-password
https://amiguei.com.br/login
http://localhost:3000/reset-password
http://localhost:3000/login
```

### 3. Site URL

Defina:
```
https://amiguei.com.br
```

---

## 🆘 Troubleshooting

### Email não chega depois de configurar SMTP?

1. **Verifique o email que digitou** - Typo comum
2. **Verifique a pasta de SPAM** - GMail costuma marcar como spam
3. **Veja os logs** no Supabase:
   - Vá em: **Authentication** → **Logs**
   - Procure por erros

### Erro de autenticação SMTP?

1. **Gmail:**
   - Verifique se a senha de app está correta
   - Tente gerar uma nova senha

2. **SendGrid:**
   - Verifique se a API Key está correta
   - Verifique se tem acesso "Mail Send"

### Rate Limiting?

Supabase limita:
- **Plano Gratuito:** 4 emails/hora
- **Plano Pago:** Sem limite (depende do SMTP)

Se atingir o limite, espere 1 hora para tentar novamente.

---

## 📋 Resumo Final

Depois de configurar SMTP:

1. ✅ Login funcionará
2. ✅ "Esqueci minha senha" enviará email
3. ✅ Usuário clica no link e redefine senha
4. ✅ Novo onboarding funciona e marca como completado
5. ✅ Login novamente vai direto para /closet

---

**Qual opção você prefere: Gmail (mais fácil) ou SendGrid (melhor para produção)?**

Depois me avisa quando configurar, que vou te guiar nos testes!
