# 🚀 Guia de Deploy - Amiguei.com.br

> Deploy automatizado do Amiguei.AI no VPS Hostinger

---

## 📍 Informações do Servidor

| Item | Valor |
|------|-------|
| **Servidor** | VPS Hostinger Ubuntu 22.04 LTS |
| **IP** | 72.60.48.18 |
| **Domínio** | amiguei.com.br |
| **Acesso SSH** | `ssh root@72.60.48.18` |
| **Recursos** | 1 CPU, 4GB RAM, 50GB disco |

---

## ⚡ Início Rápido - 3 Comandos

### 1️⃣ Transferir Scripts

No seu **Mac** (terminal local):

```bash
cd ~/Documents/v0-amiguei-ai-web-app/deploy-scripts
scp * root@72.60.48.18:/root/
```

### 2️⃣ Conectar ao Servidor

```bash
ssh root@72.60.48.18
```

### 3️⃣ Executar Deploy Automático

No **servidor VPS**:

```bash
cd /root
chmod +x *.sh
./deploy-completo.sh
```

⏱️ **Tempo total: ~1 hora** (incluindo configuração DNS)

---

## 📂 Arquivos Criados

Todos os scripts estão em: `~/Documents/v0-amiguei-ai-web-app/deploy-scripts/`

### Scripts de Execução:
- ✅ **deploy-completo.sh** - Script automatizado completo (recomendado)
- ✅ **01-setup-server.sh** - Configura servidor
- ✅ **02-deploy-app.sh** - Deploy da aplicação
- ✅ **03-configure-nginx.sh** - Configura Nginx
- ✅ **04-configure-ssl.sh** - Configura SSL/HTTPS
- ✅ **05-final-tests.sh** - Testes finais

### Documentação:
- 📖 **README.md** - Documentação completa
- 📖 **COMECE-AQUI.md** - Guia rápido
- 📖 **INSTRUCOES.md** - Instruções detalhadas
- 📖 **DNS-HOSTINGER.md** - Como configurar DNS

---

## 🎯 O que será configurado?

- ✅ Node.js 20 LTS
- ✅ PM2 (gerenciador de processos)
- ✅ Nginx (servidor web)
- ✅ Firewall (UFW)
- ✅ Aplicação Next.js
- ✅ SSL/HTTPS (Let's Encrypt)
- ✅ Renovação automática de certificados
- ✅ Auto-restart da aplicação

---

## 🌐 Configuração DNS (Manual)

**Durante a execução**, o script vai pausar para você configurar o DNS.

### No Painel Hostinger:

1. Acesse: https://hpanel.hostinger.com/
2. Vá em: **Domínios → amiguei.com.br → DNS / Nameservers**
3. Adicione **2 registros tipo A**:

| Tipo | Nome | Aponta para | TTL  |
|------|------|-------------|------|
| A    | @    | 72.60.48.18 | 3600 |
| A    | www  | 72.60.48.18 | 3600 |

4. **Remova** o CNAME de www (se existir)
5. **Aguarde** 15-30 minutos para propagação

### Testar Propagação:

```bash
dig amiguei.com.br
```

Deve mostrar: `72.60.48.18`

---

## ✅ Resultado Final

Após conclusão do deploy:

🌐 **Site no ar:** https://amiguei.com.br

✨ **Recursos ativos:**
- HTTPS com certificado SSL válido
- Redirecionamento automático HTTP → HTTPS
- Auto-restart da aplicação (PM2)
- Renovação automática de SSL
- Firewall configurado

---

## 📊 Comandos Úteis Pós-Deploy

### Gerenciar Aplicação:

```bash
pm2 status              # Ver status
pm2 logs amiguei        # Ver logs
pm2 restart amiguei     # Reiniciar
pm2 stop amiguei        # Parar
pm2 start amiguei       # Iniciar
```

### Ver Logs:

```bash
# Logs da aplicação
pm2 logs amiguei

# Logs do Nginx
tail -f /var/log/nginx/amiguei.error.log
tail -f /var/log/nginx/amiguei.access.log
```

### Atualizar Código:

```bash
cd /var/www/amiguei
git pull origin main
npm install
npm run build
pm2 restart amiguei
```

---

## 🆘 Solução de Problemas

### Site não abre (502 Bad Gateway)

```bash
pm2 status          # Verificar se app está rodando
pm2 logs amiguei    # Ver erros
pm2 restart amiguei # Reiniciar
```

### DNS não propaga

- Aguarde mais tempo (pode levar até 2h)
- Verifique configuração no painel Hostinger
- Teste: `dig amiguei.com.br`
- Limpe cache DNS: `sudo dscacheutil -flushcache` (Mac)

### SSL falha

- Certifique-se que DNS propagou primeiro
- Execute novamente: `./04-configure-ssl.sh`

---

## 📁 Estrutura no Servidor

```
/var/www/amiguei/              # Código da aplicação
├── .env.local                 # Variáveis de ambiente
├── .next/                     # Build do Next.js
├── node_modules/              # Dependências
└── ...

/etc/nginx/
├── sites-available/
│   └── amiguei.com.br        # Configuração do site
└── sites-enabled/
    └── amiguei.com.br        # Link simbólico

/root/
├── 01-setup-server.sh        # Scripts de deploy
├── 02-deploy-app.sh
├── 03-configure-nginx.sh
├── 04-configure-ssl.sh
└── 05-final-tests.sh
```

---

## 🔄 Fluxo de Requisições

```
Usuário
  ↓
amiguei.com.br (DNS)
  ↓
72.60.48.18:443 (Nginx com SSL)
  ↓
localhost:3000 (Next.js via PM2)
  ↓
Supabase (banco de dados)
OpenAI API (chat/IA)
```

---

## 📞 Precisa de Ajuda?

1. Consulte: [INSTRUCOES.md](./deploy-scripts/INSTRUCOES.md)
2. Verifique logs: `pm2 logs amiguei`
3. Verifique DNS: `dig amiguei.com.br`
4. Verifique Nginx: `systemctl status nginx`

---

## 🎉 Pronto para Começar?

1. Leia: [COMECE-AQUI.md](./deploy-scripts/COMECE-AQUI.md)
2. Execute: `./deploy-completo.sh` no servidor
3. Configure DNS quando solicitado
4. Aguarde conclusão

**Tempo estimado: 1 hora**

**Boa sorte! 🚀**

---

*Documentação criada em 07/12/2025*
*Servidor: VPS Hostinger - Ubuntu 22.04 LTS*
*Aplicação: Amiguei.AI - Next.js 16.0.0*
