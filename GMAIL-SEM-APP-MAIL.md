# 📧 Gerar Senha de App Gmail SEM App Mail

Se você não tem o "App Mail" listado, pode gerar a senha de app assim mesmo!

---

## ✅ Passo 1: Ativar 2FA (Verificação em Duas Etapas)

1. Acesse: https://myaccount.google.com/
2. No menu esquerdo, clique em **Segurança**
3. Procure por **Verificação em duas etapas**
4. Se não estiver ativado:
   - Clique em **Ativar verificação em duas etapas**
   - Siga o processo (você vai usar seu telefone)

---

## ✅ Passo 2: Acessar Senhas de App Diretamente

Se você já tem 2FA ativado:

1. Acesse: https://myaccount.google.com/apppasswords
2. Se não abrir automaticamente, tente:
   - Vá em: https://myaccount.google.com/
   - Menu esquerdo → **Segurança**
   - Role para baixo até **Senhas de app**

---

## ⚠️ Se "Senhas de app" não aparecer:

Isso significa que 2FA ainda não está 100% ativado. Tente:

1. Acesse: https://myaccount.google.com/
2. Clique em **Segurança**
3. Procure por **"Verificação em duas etapas"**
4. Clique e ative (use seu telefone)
5. Depois de ativar, aguarde 2-3 minutos
6. Acesse novamente: https://myaccount.google.com/apppasswords

---

## ✅ Passo 3: Gerar a Senha

Quando "Senhas de app" aparecer:

1. Selecione:
   - **Selecione o app:** Mail (ou "Email")
   - **Selecione o dispositivo:** Windows Computer (ou sua plataforma)

2. Clique em **Gerar**

3. Uma senha aparecerá na tela (algo como: `xxxx xxxx xxxx xxxx`)

4. **COPIE A SENHA** - Você vai usar no Supabase

---

## 🔧 Passo 4: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Amiguei.AI**
3. No menu esquerdo, vá em: **Project Settings** (engrenagem)
4. Clique na aba **Auth**
5. Procure por **SMTP Settings**
6. Preencha assim:

```
Sender Email: seu-email@gmail.com
Sender Name: Amiguei.AI
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: seu-email@gmail.com
SMTP Password: [COLE A SENHA DE APP GERADA]
```

7. **Clique em "Test Connection"** para verificar
8. Se disser "Connection successful", clique em **Save**

---

## 🆘 Troubleshooting

### "Senhas de app" não aparece mesmo depois de ativar 2FA?

Tente:
1. Sair de todas as abas do Google
2. Fazer login novamente
3. Aguardar 5 minutos
4. Acessar https://myaccount.google.com/apppasswords novamente

### Erro "Invalid credentials" no Supabase?

1. Verifique se copiou a senha corretamente (sem espaços extras)
2. Tente gerar uma NOVA senha de app
3. Use a nova senha no Supabase

---

## ✅ Depois de configurar:

1. Acesse: https://amiguei.com.br/login
2. Clique em **"Esqueceu a senha?"**
3. Digite seu email
4. **Você deve receber um email em 1-2 minutos!**
5. Clique no link do email
6. Redefina sua senha

---

**Me avisa quando configurar tudo! Depois testamos juntos! 🚀**
