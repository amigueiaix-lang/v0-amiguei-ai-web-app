# 🚀 Comandos para Executar no Servidor

Você já está conectado ao servidor. **Copie e cole estes comandos na sua sessão SSH:**

```bash
cd /var/www/amiguei

# Parar a aplicação
pm2 stop amiguei

# Fazer backup do .env.local
cp .env.local /tmp/.env.local.backup

# Puxar as últimas mudanças
git pull origin main

# Restaurar .env.local
cp /tmp/.env.local.backup .env.local

# Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# Instalar dependências
npm install --legacy-peer-deps

# Fazer build (vai demorar alguns minutos)
npm run build

# Reiniciar aplicação
pm2 restart amiguei

# Ver status e logs
pm2 status
pm2 logs amiguei --lines 30
```

---

## ✅ O que isso vai fazer:

1. Para a aplicação para evitar conflitos
2. Faz backup das variáveis de ambiente
3. Baixa o código novo com as correções de login
4. Restaura as variáveis de ambiente
5. Limpa cache antigo
6. Instala dependências (incluindo @supabase/ssr)
7. **Faz o build de produção** (resolve o erro principal)
8. Reinicia a aplicação
9. Mostra os logs

---

## 🎯 Resultado Esperado:

Depois de executar, você deve ver nos logs:

```
✓ Ready in XXXms
```

E o site deve funcionar em: **https://amiguei.com.br**

---

## 🆘 Se der erro no build:

Copie a mensagem de erro completa e me mostre!
