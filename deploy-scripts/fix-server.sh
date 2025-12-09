#!/bin/bash
set -e

echo "🔧 Corrigindo servidor e fazendo deploy..."
echo "=============================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd /var/www/amiguei

echo -e "${YELLOW}1. Parando aplicação...${NC}"
pm2 stop amiguei || true

echo -e "${YELLOW}2. Fazendo backup do .env.local...${NC}"
cp .env.local /tmp/.env.local.backup 2>/dev/null || echo "Sem .env.local anterior"

echo -e "${YELLOW}3. Puxando últimas mudanças do GitHub...${NC}"
git pull origin main

echo -e "${YELLOW}4. Restaurando .env.local...${NC}"
cp /tmp/.env.local.backup .env.local 2>/dev/null || echo "Usando .env.local do repositório"

echo -e "${YELLOW}5. Limpando cache antigo...${NC}"
rm -rf .next
rm -rf node_modules/.cache

echo -e "${YELLOW}6. Instalando dependências...${NC}"
npm install --legacy-peer-deps

echo -e "${YELLOW}7. Fazendo build da aplicação (pode demorar alguns minutos)...${NC}"
npm run build

echo -e "${YELLOW}8. Iniciando aplicação...${NC}"
pm2 start npm --name "amiguei" -- start || pm2 restart amiguei

echo -e "${YELLOW}9. Salvando configuração PM2...${NC}"
pm2 save

echo ""
echo -e "${GREEN}✅ Servidor corrigido e aplicação deployada com sucesso!${NC}"
echo ""
echo "Status da aplicação:"
pm2 status
echo ""
echo "Últimas 30 linhas de log:"
pm2 logs amiguei --lines 30 --nostream
