# 🧹 Comandos para Limpar e Reconstruir o Servidor

Execute estes comandos no servidor SSH para resolver os erros de build:

```bash
cd /var/www/amiguei

# 1. Parar a aplicação
pm2 stop amiguei

# 2. Fazer backup do .env.local
cp .env.local /tmp/.env.local.backup

# 3. Puxar código mais recente
git pull origin main

# 4. Restaurar .env.local
cp /tmp/.env.local.backup .env.local

# 5. LIMPAR TUDO (importante!)
rm -rf .next
rm -rf node_modules/.cache
rm -rf node_modules

# 6. Reinstalar dependências do zero
npm install --legacy-peer-deps

# 7. Build limpo
npm run build

# 8. Reiniciar aplicação
pm2 restart amiguei

# 9. Ver logs
pm2 logs amiguei --lines 50
```

---

## 🔍 Se ainda der erro, execute também:

```bash
# Verificar se o Nginx está configurado corretamente
cat /etc/nginx/sites-available/amiguei

# Ver se há algum erro no Nginx
sudo nginx -t

# Restart do Nginx se necessário
sudo systemctl restart nginx
```

---

## ✅ O que esperar:

Depois do build, você deve ver:
- ✓ Compiled successfully
- ✓ Generating static pages
- ✓ Ready in XXXms

E NO NAVEGADOR não deve mais ter erros de sintaxe no console.
