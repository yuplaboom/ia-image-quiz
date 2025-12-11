#!/bin/bash

# Script de déploiement IA Challenge
# Usage: ./deploy.sh [init|start|stop|restart|logs|migrate|backup]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod-mysql.yml"
ENV_FILE=".env.prod"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Le fichier $ENV_FILE n'existe pas!"
        print_info "Créez-le à partir de .env.prod.example:"
        echo "  cp .env.prod.example .env.prod"
        echo "  nano .env.prod"
        exit 1
    fi
}

load_env() {
    print_info "Chargement des variables d'environnement..."
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
    print_success "Variables d'environnement chargées"
}

# Commands
cmd_init() {
    print_info "Initialisation de l'application en production..."

    # Check if .env.prod exists
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Création du fichier de configuration..."
        cp .env.prod.example .env.prod
        print_success "Fichier .env.prod créé"
        print_info "Veuillez éditer .env.prod avec vos valeurs:"
        echo "  nano .env.prod"
        echo ""
        print_info "Ensuite, relancez: ./deploy.sh start"
        exit 0
    fi

    load_env

    # Build and start containers
    print_info "Construction des images Docker..."
    docker compose -f $COMPOSE_FILE build
    print_success "Images construites"

    print_info "Démarrage des conteneurs..."
    docker compose -f $COMPOSE_FILE up -d
    print_success "Conteneurs démarrés"

    # Wait for database
    print_info "Attente du démarrage de MySQL..."
    sleep 10

    # Run migrations
    print_info "Exécution des migrations de base de données..."
    docker compose -f $COMPOSE_FILE exec -T backend php bin/console doctrine:migrations:migrate --no-interaction
    print_success "Migrations appliquées"

    # Clear cache
    print_info "Nettoyage du cache..."
    docker compose -f $COMPOSE_FILE exec -T backend php bin/console cache:clear
    print_success "Cache nettoyé"

    print_success "Déploiement terminé!"
    echo ""
    print_info "Votre application est disponible sur:"
    echo "  https://${SERVER_NAME:-localhost}"
    echo ""
    print_info "Pour voir les logs: ./deploy.sh logs"
}

cmd_start() {
    check_env
    load_env

    print_info "Démarrage des conteneurs..."
    docker compose -f $COMPOSE_FILE up -d
    print_success "Conteneurs démarrés"

    print_info "Application disponible sur: https://${SERVER_NAME:-localhost}"
}

cmd_stop() {
    print_info "Arrêt des conteneurs..."
    docker compose -f $COMPOSE_FILE down
    print_success "Conteneurs arrêtés"
}

cmd_restart() {
    print_info "Redémarrage des conteneurs..."
    docker compose -f $COMPOSE_FILE restart
    print_success "Conteneurs redémarrés"
}

cmd_logs() {
    SERVICE=${2:-backend}
    print_info "Affichage des logs de $SERVICE (Ctrl+C pour quitter)..."
    docker compose -f $COMPOSE_FILE logs -f $SERVICE
}

cmd_migrate() {
    check_env
    print_info "Exécution des migrations..."
    docker compose -f $COMPOSE_FILE exec backend php bin/console doctrine:migrations:migrate --no-interaction
    print_success "Migrations appliquées"
}

cmd_backup() {
    check_env
    load_env

    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Création d'une sauvegarde de la base de données..."

    docker compose -f $COMPOSE_FILE exec -T mysql mysqldump \
        -u root -p${MYSQL_ROOT_PASSWORD:-root_password_change_me} ia_challenge > "$BACKUP_FILE"

    print_success "Sauvegarde créée: $BACKUP_FILE"
}

cmd_update() {
    check_env
    load_env

    print_info "Mise à jour de l'application..."

    # Pull latest changes
    print_info "Récupération des dernières modifications..."
    git pull origin main
    print_success "Code mis à jour"

    # Rebuild containers
    print_info "Reconstruction des images..."
    docker compose -f $COMPOSE_FILE up -d --build
    print_success "Images reconstruites"

    # Run migrations
    print_info "Application des migrations..."
    docker compose -f $COMPOSE_FILE exec -T backend php bin/console doctrine:migrations:migrate --no-interaction
    print_success "Migrations appliquées"

    # Clear cache
    print_info "Nettoyage du cache..."
    docker compose -f $COMPOSE_FILE exec -T backend php bin/console cache:clear
    print_success "Cache nettoyé"

    print_success "Mise à jour terminée!"
}

cmd_rebuild_frontend() {
    check_env
    print_info "Reconstruction complète du frontend..."

    # Force rebuild without cache
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    print_success "Image frontend reconstruite"

    # Recreate container
    docker compose -f $COMPOSE_FILE up -d --force-recreate frontend
    print_success "Container frontend redémarré"

    print_success "Rebuild du frontend terminé!"
}

cmd_status() {
    print_info "Statut des conteneurs:"
    docker compose -f $COMPOSE_FILE ps
}

cmd_shell() {
    SERVICE=${2:-backend}
    print_info "Accès au shell de $SERVICE..."
    docker compose -f $COMPOSE_FILE exec $SERVICE sh
}

cmd_help() {
    echo "Script de déploiement IA Challenge"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commandes disponibles:"
    echo "  init             - Initialiser et déployer l'application (première fois)"
    echo "  start            - Démarrer les conteneurs"
    echo "  stop             - Arrêter les conteneurs"
    echo "  restart          - Redémarrer les conteneurs"
    echo "  logs             - Afficher les logs (ex: ./deploy.sh logs backend)"
    echo "  migrate          - Exécuter les migrations de base de données"
    echo "  backup           - Créer une sauvegarde de la base de données"
    echo "  update           - Mettre à jour l'application (git pull + rebuild)"
    echo "  rebuild-frontend - Reconstruire le frontend sans cache"
    echo "  status           - Afficher le statut des conteneurs"
    echo "  shell            - Accéder au shell d'un conteneur (ex: ./deploy.sh shell backend)"
    echo "  help             - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  ./deploy.sh init              # Premier déploiement"
    echo "  ./deploy.sh logs backend      # Voir les logs du backend"
    echo "  ./deploy.sh backup            # Sauvegarder la base de données"
    echo "  ./deploy.sh update            # Mettre à jour l'application"
    echo "  ./deploy.sh rebuild-frontend  # Rebuilder le frontend"
}

# Main
case "${1:-help}" in
    init)
        cmd_init
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs "$@"
        ;;
    migrate)
        cmd_migrate
        ;;
    backup)
        cmd_backup
        ;;
    update)
        cmd_update
        ;;
    status)
        cmd_status
        ;;
    shell)
        cmd_shell "$@"
        ;;
    help)
        cmd_help
        ;;
    *)
        print_error "Commande inconnue: $1"
        echo ""
        cmd_help
        exit 1
        ;;
esac