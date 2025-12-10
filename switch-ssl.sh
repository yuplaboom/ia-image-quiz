#!/bin/bash

# Script pour activer/désactiver SSL sur le serveur
# Usage: ./switch-ssl.sh [http|https]

set -e

# Charger la configuration de déploiement
if [ ! -f .env.deploy ]; then
    echo "❌ Fichier .env.deploy introuvable !"
    echo ""
    echo "Créez-le à partir du modèle :"
    echo "  cp .env.deploy.example .env.deploy"
    echo "  nano .env.deploy"
    echo ""
    exit 1
fi

source .env.deploy

# Vérifier que les variables nécessaires sont définies
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ] || [ -z "$SERVER_PASSWORD" ] || [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Variables manquantes dans .env.deploy"
    echo "Vérifiez que SERVER_USER, SERVER_HOST, SERVER_PASSWORD et DOMAIN_NAME sont définis"
    exit 1
fi

MODE="${1:-https}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "$MODE" != "http" ] && [ "$MODE" != "https" ]; then
    echo "Usage: ./switch-ssl.sh [http|https]"
    echo ""
    echo "  http   - Désactiver SSL (HTTP uniquement sur port 80)"
    echo "  https  - Activer SSL (HTTPS automatique avec Let's Encrypt)"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$MODE" = "https" ]; then
    echo -e "${GREEN}🔒 Activation du mode HTTPS${NC}"
    CADDYFILE="Caddyfile.prod.https"
else
    echo -e "${YELLOW}⚠️  Passage en mode HTTP uniquement${NC}"
    CADDYFILE="Caddyfile.prod.http"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📤 Transfert du Caddyfile..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
    $CADDYFILE $SERVER_USER@$SERVER_HOST:/tmp/Caddyfile.prod

echo "🔄 Application de la nouvelle configuration..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << ENDSSH
cd ~/ia-image-quiz

# Copier le nouveau Caddyfile
cp /tmp/Caddyfile.prod Caddyfile.prod

echo "🏗️  Reconstruction de l'image..."
export \$(cat .env.prod | grep -v '^#' | xargs)
docker compose -f docker-compose.prod-mysql.yml build backend

echo "🔄 Redémarrage du conteneur..."
docker compose -f docker-compose.prod-mysql.yml up -d --force-recreate backend

echo ""
echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10

echo ""
echo "📊 Statut des conteneurs:"
docker compose -f docker-compose.prod-mysql.yml ps

echo ""
echo "📋 Derniers logs:"
docker compose -f docker-compose.prod-mysql.yml logs --tail=20 backend

ENDSSH

echo ""
echo -e "${GREEN}✅ Configuration appliquée !${NC}"
echo ""

if [ "$MODE" = "https" ]; then
    echo -e "${GREEN}🔒 Mode HTTPS activé${NC}"
    echo ""
    echo "Votre site devrait être accessible via:"
    echo "  • https://$DOMAIN_NAME"
    echo ""
    echo "⚠️  Note: Le certificat Let's Encrypt peut prendre 1-2 minutes"
    echo "   Attendez un peu et actualisez la page."
    echo ""
    echo "Si ça ne fonctionne toujours pas après 5 minutes:"
    echo "  1. Vérifiez que le port 443 est ouvert"
    echo "  2. Vérifiez les logs: ./switch-ssl.sh logs"
else
    echo -e "${YELLOW}⚠️  Mode HTTP uniquement${NC}"
    echo ""
    echo "Votre site est accessible via:"
    echo "  • http://$DOMAIN_NAME"
    echo "  • http://$SERVER_HOST"
    echo ""
    echo "Pour activer HTTPS:"
    echo "  ./switch-ssl.sh https"
fi

echo ""
echo "Pour voir les logs en direct:"
echo "  sshpass -p '\$SERVER_PASSWORD' ssh \$SERVER_USER@\$SERVER_HOST"
echo "  cd ~/ia-image-quiz"
echo "  docker compose -f docker-compose.prod-mysql.yml logs -f backend"