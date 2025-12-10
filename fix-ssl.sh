#!/bin/bash

# Script pour diagnostiquer et corriger les problèmes SSL
# Usage: ./fix-ssl.sh

# Charger la configuration
if [ ! -f .env.deploy ]; then
    echo "❌ Fichier .env.deploy introuvable !"
    echo "Créez-le : cp .env.deploy.example .env.deploy"
    exit 1
fi

source .env.deploy

# Vérifier les variables
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ] || [ -z "$SERVER_PASSWORD" ] || [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Variables manquantes dans .env.deploy"
    exit 1
fi

DOMAIN="$DOMAIN_NAME"

echo "🔍 Diagnostic SSL pour $DOMAIN"
echo ""

echo "1️⃣ Vérification DNS..."
nslookup $DOMAIN

echo ""
echo "2️⃣ Vérification de l'accès HTTP (port 80)..."
curl -I http://$DOMAIN 2>&1 | head -5 || echo "❌ Port 80 non accessible"

echo ""
echo "3️⃣ Connexion au serveur et vérification des logs..."
echo ""

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd ~/ia-image-quiz

echo "📋 Statut des conteneurs:"
docker compose -f docker-compose.prod-mysql.yml ps

echo ""
echo "📄 Logs FrankenPHP (dernières 50 lignes):"
docker compose -f docker-compose.prod-mysql.yml logs --tail=50 backend | grep -i "certificate\|tls\|acme\|error"

echo ""
echo "🔍 Configuration SERVER_NAME actuelle:"
grep SERVER_NAME .env.prod || echo "❌ SERVER_NAME non trouvé dans .env.prod"

echo ""
echo "🌐 Ports ouverts sur le conteneur backend:"
docker compose -f docker-compose.prod-mysql.yml exec backend netstat -tuln 2>/dev/null || echo "ℹ️ netstat non disponible"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Solutions proposées:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Activer HTTPS automatique Let's Encrypt"
echo "  → Nécessite que le port 443 soit ouvert"
echo "  → Lancez: ./fix-ssl.sh enable-https"
echo ""
echo "Option 2: Désactiver HTTPS temporairement (HTTP uniquement)"
echo "  → Pour tester que l'application fonctionne"
echo "  → Lancez: ./fix-ssl.sh disable-https"
echo ""
echo "Option 3: Voir les logs détaillés"
echo "  → Lancez: ./fix-ssl.sh logs"
echo ""