#!/bin/bash
set -e

echo "🔄 Atualizando aplicação..."
echo "=============================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /var/www/amiguei

echo -e "${YELLOW}1. Fazendo backup do .env.local...${NC}"
cp .env.local /tmp/.env.local.backup

echo -e "${YELLOW}2. Puxando últimas mudanças do GitHub...${NC}"
git pull origin main

echo -e "${YELLOW}3. Restaurando .env.local...${NC}"
cp /tmp/.env.local.backup .env.local

echo -e "${YELLOW}4. Instalando dependências...${NC}"
npm install --legacy-peer-deps

echo -e "${YELLOW}5. Fazendo build...${NC}"
npm run build

echo -e "${YELLOW}6. Reiniciando aplicação...${NC}"
pm2 restart amiguei

echo -e "${GREEN}✅ Aplicação atualizada com sucesso!${NC}"
pm2 status
