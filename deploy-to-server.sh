#!/bin/bash

# Script de déploiement automatique vers le serveur
# Usage: ./deploy-to-server.sh

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

# Charger les variables
source .env.deploy

# Vérifier que les variables nécessaires sont définies
if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ] || [ -z "$SERVER_PASSWORD" ]; then
    echo "❌ Variables manquantes dans .env.deploy"
    echo "Vérifiez que SERVER_USER, SERVER_HOST et SERVER_PASSWORD sont définis"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}\n"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass n'est pas installé"
    print_info "Installation sur macOS: brew install hudochenkov/sshpass/sshpass"
    print_info "Installation sur Ubuntu/Debian: sudo apt-get install sshpass"
    exit 1
fi

print_step "ÉTAPE 1/6 - Création de l'archive du projet"
print_info "Exclusion de node_modules, vendor, var, .git..."

tar -czf ia-image-quiz.tar.gz \
  --exclude='node_modules' \
  --exclude='vendor' \
  --exclude='var' \
  --exclude='.git' \
  --exclude='*.tar.gz' \
  .

print_success "Archive créée: ia-image-quiz.tar.gz"

print_step "ÉTAPE 2/6 - Transfert vers le serveur"
print_info "Serveur: $SERVER_HOST"

sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no ia-image-quiz.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

print_success "Fichiers transférés"

print_step "ÉTAPE 3/6 - Installation sur le serveur"

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
set -e

echo "📦 Création du répertoire..."
mkdir -p /home/debian/ia-image-quiz
cd /home/debian/ia-image-quiz

echo "📂 Extraction de l'archive..."
tar -xzf /tmp/ia-image-quiz.tar.gz -C /home/debian/ia-image-quiz
rm /tmp/ia-image-quiz.tar.gz

echo "✅ Installation terminée"
ENDSSH

print_success "Projet extrait sur le serveur"

print_step "ÉTAPE 4/6 - Vérification de Docker"

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker n'est pas installé. Installation..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker debian
    rm get-docker.sh
    echo "✅ Docker installé"
else
    echo "✅ Docker déjà installé"
fi

if ! docker compose version &> /dev/null; then
    echo "⚠️  Docker Compose n'est pas à jour"
    echo "ℹ️  Utilisez 'docker compose' au lieu de 'docker-compose'"
else
    echo "✅ Docker Compose disponible"
fi
ENDSSH

print_success "Docker vérifié"

print_step "ÉTAPE 5/6 - Configuration de l'environnement"

print_info "Création du fichier .env.prod sur le serveur..."

# Demander les informations à l'utilisateur
read -p "Nom de domaine (ex: mondomaine.com) : " DOMAIN_NAME
read -p "Mot de passe root MySQL : " -s MYSQL_ROOT_PWD
echo
read -p "Mot de passe user MySQL : " -s MYSQL_USER_PWD
echo

# Générer les secrets
APP_SECRET=$(openssl rand -hex 32)
MERCURE_KEY=$(openssl rand -base64 32)

print_info "Génération des secrets de sécurité..."

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << ENDSSH
cd /home/debian/ia-image-quiz

cat > .env.prod << EOF
# Configuration Production - Généré automatiquement
APP_SECRET=$APP_SECRET
SERVER_NAME=$DOMAIN_NAME
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PWD
MYSQL_PASSWORD=$MYSQL_USER_PWD
DATABASE_URL=mysql://ia_user:$MYSQL_USER_PWD@mysql:3306/ia_challenge?serverVersion=8.0&charset=utf8mb4
VITE_API_URL=/api
MERCURE_JWT_KEY=$MERCURE_KEY
FRANKENPHP_NUM_THREADS=auto
EOF

chmod 600 .env.prod
echo "✅ Fichier .env.prod créé"
ENDSSH

print_success "Configuration créée"

print_step "ÉTAPE 6/6 - Démarrage de l'application"

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd /home/debian/ia-image-quiz

echo "🔧 Chargement des variables d'environnement..."
export $(cat .env.prod | grep -v '^#' | xargs)

echo "🏗️  Construction des images Docker..."
docker compose -f docker-compose.prod-mysql.yml build --no-cache

echo "🚀 Démarrage des conteneurs..."
docker compose -f docker-compose.prod-mysql.yml up -d

echo "⏳ Attente du démarrage de MySQL (20 secondes)..."
sleep 20

echo "📊 Création de la base de données..."
docker compose -f docker-compose.prod-mysql.yml exec -T backend php bin/console doctrine:database:create --if-not-exists || true

echo "🔄 Application des migrations..."
docker compose -f docker-compose.prod-mysql.yml exec -T backend php bin/console doctrine:migrations:migrate --no-interaction

echo "🧹 Nettoyage du cache..."
docker compose -f docker-compose.prod-mysql.yml exec -T backend php bin/console cache:clear

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📍 Votre application est accessible sur:"
echo "   http://$SERVER_NAME (redirection automatique vers HTTPS)"
echo "   https://$SERVER_NAME"
echo ""
echo "🔍 Pour voir les logs:"
echo "   docker compose -f docker-compose.prod-mysql.yml logs -f backend"
ENDSSH

print_success "Déploiement terminé !"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}║  🎉 Application déployée avec succès !    ║${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
print_info "Accès: https://$DOMAIN_NAME"
print_info "Pour vous connecter au serveur:"
echo "  sshpass -p '$SERVER_PASSWORD' ssh $SERVER_USER@$SERVER_HOST"
echo ""
print_info "Commandes utiles sur le serveur:"
echo "  cd /home/debian/ia-image-quiz"
echo "  docker compose -f docker-compose.prod-mysql.yml logs -f"
echo "  docker compose -f docker-compose.prod-mysql.yml ps"
echo "  docker compose -f docker-compose.prod-mysql.yml restart"
echo ""

# Cleanup
rm ia-image-quiz.tar.gz
print_success "Archive locale nettoyée"