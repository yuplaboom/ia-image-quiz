# 🚀 Guide de Déploiement en Production

## Option 1 : Déploiement sur un serveur (VPS, Serveur dédié)

### 1. Préparer le fichier de configuration

```bash
# Créez votre fichier .env.prod
cp .env.prod.example .env.prod
```

Éditez `.env.prod` avec vos valeurs :

```bash
# Application - Générez un secret sécurisé
APP_SECRET=$(openssl rand -hex 32)

# Votre domaine (HTTPS automatique avec Let's Encrypt)
SERVER_NAME=votredomaine.com

# Base de données MySQL
DATABASE_URL=mysql://ia_user:votre_mot_de_passe_securise@mysql:3306/ia_challenge?serverVersion=8.0&charset=utf8mb4

# Clé OpenAI pour Puter.js (déjà intégré dans le frontend)
# OPENAI_API_KEY=sk-votre-clé (optionnel si vous utilisez Puter.js uniquement)

# URL de l'API pour le frontend
VITE_API_URL=https://votredomaine.com/api

# Mercure JWT Key (gardez la même ou générez une nouvelle)
MERCURE_JWT_KEY=p1KoDtEqxReAuVphusSuYJk2nZ0tOmVs/aVHpp+t8RY=
```

### 2. Créer le docker-compose pour la production avec MySQL

Créez `docker-compose.prod-mysql.yml` :

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ia-challenge-mysql-prod
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=ia_challenge
      - MYSQL_USER=ia_user
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    restart: always
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: ia-challenge-backend-prod
    ports:
      - "80:80"       # HTTP
      - "443:443"     # HTTPS
      - "443:443/udp" # HTTP/3
    volumes:
      - backend-var:/app/var
      - caddy-data:/data
      - caddy-config:/config
    environment:
      - APP_ENV=prod
      - APP_SECRET=${APP_SECRET}
      - DATABASE_URL=mysql://ia_user:${MYSQL_PASSWORD}@mysql:3306/ia_challenge?serverVersion=8.0&charset=utf8mb4
      - SERVER_NAME=${SERVER_NAME:-:80}
      - FRANKENPHP_CONFIG=worker ./public/index.php
      - PHP_OPCACHE_ENABLE=1
      - PHP_OPCACHE_MEMORY_CONSUMPTION=256
      - PHP_OPCACHE_MAX_ACCELERATED_FILES=20000
      - PHP_OPCACHE_VALIDATE_TIMESTAMPS=0
      - MERCURE_URL=http://mercure/.well-known/mercure
      - MERCURE_PUBLIC_URL=https://${SERVER_NAME}/.well-known/mercure
      - MERCURE_JWT_SECRET=${MERCURE_JWT_KEY}
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mercure:
    image: dunglas/mercure:latest
    container_name: ia-challenge-mercure-prod
    environment:
      - SERVER_NAME=:80
      - MERCURE_PUBLISHER_JWT_KEY=${MERCURE_JWT_KEY}
      - MERCURE_SUBSCRIBER_JWT_KEY=${MERCURE_JWT_KEY}
      - "MERCURE_EXTRA_DIRECTIVES=anonymous\ncors_origins https://${SERVER_NAME}"
    restart: always
    command: /usr/bin/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_URL=${VITE_API_URL}
    container_name: ia-challenge-frontend-prod
    restart: always
    depends_on:
      - backend

volumes:
  mysql-data:
  backend-var:
  caddy-data:
  caddy-config:
```

### 3. Déployer sur votre serveur

```bash
# 1. Transférez les fichiers sur votre serveur
scp -r . user@votre-serveur:/path/to/ia-challenge

# 2. Connectez-vous au serveur
ssh user@votre-serveur

# 3. Allez dans le répertoire
cd /path/to/ia-challenge

# 4. Créez le fichier .env.prod et remplissez-le
nano .env.prod

# 5. Chargez les variables d'environnement
export $(cat .env.prod | xargs)

# 6. Construisez et démarrez les conteneurs
docker-compose -f docker-compose.prod-mysql.yml up -d --build

# 7. Créez la base de données
docker-compose -f docker-compose.prod-mysql.yml exec backend \
    php bin/console doctrine:migrations:migrate --no-interaction

# 8. Vérifiez les logs
docker-compose -f docker-compose.prod-mysql.yml logs -f
```

### 4. Configuration DNS

Pointez votre domaine vers l'IP de votre serveur :
- Type A : `votredomaine.com` → `IP_DE_VOTRE_SERVEUR`
- Type A : `www.votredomaine.com` → `IP_DE_VOTRE_SERVEUR`

FrankenPHP obtiendra automatiquement un certificat HTTPS Let's Encrypt !

---

## Option 2 : Déploiement sur un hébergeur cloud (AWS, DigitalOcean, Scaleway...)

### DigitalOcean App Platform

1. Créez une nouvelle app sur DigitalOcean
2. Connectez votre repository GitHub
3. Configurez les services :
   - **Backend** : Dockerfile : `backend/Dockerfile.prod`
   - **Frontend** : Dockerfile : `frontend/Dockerfile.prod`
   - **Database** : MySQL 8.0 Managed Database

### AWS (EC2 + RDS)

1. Créez une instance EC2 (Ubuntu 22.04 recommandé)
2. Créez une base de données RDS MySQL 8.0
3. Suivez les étapes du déploiement serveur (Option 1)

---

## Option 3 : Déploiement simple avec MySQL local

Si vous voulez déployer rapidement sur un serveur sans docker-compose complexe :

```bash
# Sur votre serveur
git clone <votre-repo>
cd ia-challenge

# Build du backend
cd backend
composer install --no-dev --optimize-autoloader
APP_ENV=prod php bin/console cache:clear
php bin/console doctrine:migrations:migrate --no-interaction

# Build du frontend
cd ../frontend
npm install
npm run build

# Configurez un serveur web (Nginx ou Apache) pour servir :
# - frontend/dist → /
# - backend/public → /api
```

---

## Commandes utiles

### Voir les logs
```bash
docker-compose -f docker-compose.prod-mysql.yml logs -f backend
docker-compose -f docker-compose.prod-mysql.yml logs -f frontend
docker-compose -f docker-compose.prod-mysql.yml logs -f mysql
```

### Redémarrer un service
```bash
docker-compose -f docker-compose.prod-mysql.yml restart backend
```

### Accéder au conteneur
```bash
docker-compose -f docker-compose.prod-mysql.yml exec backend sh
docker-compose -f docker-compose.prod-mysql.yml exec mysql mysql -u root -p
```

### Sauvegarder la base de données
```bash
docker-compose -f docker-compose.prod-mysql.yml exec mysql mysqldump \
  -u root -p ia_challenge > backup_$(date +%Y%m%d).sql
```

### Restaurer la base de données
```bash
cat backup.sql | docker-compose -f docker-compose.prod-mysql.yml exec -T mysql \
  mysql -u root -p ia_challenge
```

---

## Sécurité en Production

✅ **Checklist de sécurité :**

- [ ] Changé APP_SECRET (généré aléatoirement)
- [ ] HTTPS activé (Let's Encrypt automatique avec FrankenPHP)
- [ ] Mot de passe MySQL fort et sécurisé
- [ ] Firewall configuré (ports 80, 443 uniquement ouverts)
- [ ] Sauvegardes automatiques de la base de données
- [ ] Variables d'environnement protégées (pas dans le repo Git)
- [ ] Clé Mercure JWT unique et sécurisée

---

## Monitoring et Performance

### Vérifier la santé de l'application
```bash
curl https://votredomaine.com/health
```

### Statistiques Docker
```bash
docker stats
```

### Performance FrankenPHP (Worker Mode activé en prod)
- ⚡ **10x plus rapide** que PHP-FPM classique
- 🚀 **HTTP/2 et HTTP/3** natifs
- 🔒 **HTTPS automatique** avec Let's Encrypt
- 💾 **Symfony en mémoire** (pas de rechargement à chaque requête)

---

## En cas de problème

### Le site ne se charge pas
```bash
# Vérifiez les conteneurs
docker-compose -f docker-compose.prod-mysql.yml ps

# Vérifiez les logs
docker-compose -f docker-compose.prod-mysql.yml logs backend
```

### Erreur de base de données
```bash
# Vérifiez que MySQL est bien démarré
docker-compose -f docker-compose.prod-mysql.yml ps mysql

# Recréez la base si nécessaire
docker-compose -f docker-compose.prod-mysql.yml exec backend \
    php bin/console doctrine:database:create --if-not-exists
docker-compose -f docker-compose.prod-mysql.yml exec backend \
    php bin/console doctrine:migrations:migrate --no-interaction
```

### HTTPS ne fonctionne pas
- Vérifiez que le port 443 est ouvert dans votre firewall
- Vérifiez que votre DNS pointe bien vers votre serveur
- Attendez quelques minutes (Let's Encrypt peut prendre du temps)

---

## Mise à jour de l'application

```bash
# Sur votre serveur
cd /path/to/ia-challenge

# Pull les dernières modifications
git pull origin main

# Rebuild et redémarrage
docker-compose -f docker-compose.prod-mysql.yml up -d --build

# Migration de base de données si nécessaire
docker-compose -f docker-compose.prod-mysql.yml exec backend \
    php bin/console doctrine:migrations:migrate --no-interaction
```

---

## Contact et Support

Pour toute question sur le déploiement, consultez la documentation de FrankenPHP :
https://frankenphp.dev/docs/