# 🚀 Déploiement sur votre serveur

## Option 1 : Déploiement automatique (Recommandé) ⚡

### Prérequis

1. Installez `sshpass` sur votre Mac :
```bash
brew install hudochenkov/sshpass/sshpass
```

2. Créez votre fichier de configuration :
```bash
cp .env.deploy.example .env.deploy
nano .env.deploy
```

Remplissez vos informations de serveur dans `.env.deploy`

### Déploiement en une commande
```bash
./deploy-to-server.sh
```

Le script va :
1. ✅ Créer une archive du projet
2. ✅ Transférer vers le serveur
3. ✅ Installer Docker si nécessaire
4. ✅ Configurer l'environnement
5. ✅ Builder et lancer l'application
6. ✅ Créer la base de données

**Vous devrez fournir :**
- Votre nom de domaine
- Mot de passe MySQL root
- Mot de passe MySQL user

---

## Option 2 : Déploiement manuel 🔧

### 1. Se connecter au serveur
```bash
# Utilisez vos identifiants du fichier .env.deploy
sshpass -p 'VOTRE_MOT_DE_PASSE' ssh VOTRE_USER@VOTRE_SERVER_IP
```

### 2. Installer Docker (si pas déjà fait)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker debian
```

Déconnectez-vous et reconnectez-vous pour que les changements prennent effet.

### 3. Transférer les fichiers

Sur votre Mac (dans le dossier du projet) :
```bash
tar -czf ia-image-quiz.tar.gz \
  --exclude='node_modules' \
  --exclude='vendor' \
  --exclude='var' \
  --exclude='.git' \
  .

# Utilisez vos identifiants du fichier .env.deploy
sshpass -p 'VOTRE_MOT_DE_PASSE' scp ia-image-quiz.tar.gz VOTRE_USER@VOTRE_SERVER_IP:/tmp/
```

### 4. Sur le serveur, extraire et configurer

```bash
# Extraire
mkdir -p ~/ia-image-quiz
cd ~/ia-image-quiz
tar -xzf /tmp/ia-image-quiz.tar.gz

# Créer .env.prod
nano .env.prod
```

Copiez ce contenu et modifiez les valeurs :
```bash
APP_SECRET=$(openssl rand -hex 32)
SERVER_NAME=votre-domaine.com
MYSQL_ROOT_PASSWORD=votre_mot_de_passe_root_securise
MYSQL_PASSWORD=votre_mot_de_passe_user_securise
DATABASE_URL=mysql://ia_user:votre_mot_de_passe_user_securise@mysql:3306/ia_challenge?serverVersion=8.0&charset=utf8mb4
VITE_API_URL=/api
MERCURE_JWT_KEY=$(openssl rand -base64 32)
FRANKENPHP_NUM_THREADS=auto
```

### 5. Lancer l'application

```bash
cd ~/ia-image-quiz

# Charger les variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Build
docker compose -f docker-compose.prod-mysql.yml build

# Lancer
docker compose -f docker-compose.prod-mysql.yml up -d

# Attendre que MySQL démarre
sleep 20

# Créer la base
docker compose -f docker-compose.prod-mysql.yml exec backend \
  php bin/console doctrine:database:create --if-not-exists

# Migrations
docker compose -f docker-compose.prod-mysql.yml exec backend \
  php bin/console doctrine:migrations:migrate --no-interaction

# Clear cache
docker compose -f docker-compose.prod-mysql.yml exec backend \
  php bin/console cache:clear
```

---

## 🔍 Vérification

### Voir les logs
```bash
docker compose -f docker-compose.prod-mysql.yml logs -f backend
```

### Voir le statut
```bash
docker compose -f docker-compose.prod-mysql.yml ps
```

### Tester l'API
```bash
curl http://localhost/health
```

---

## 🌐 Configuration DNS

Pointez votre domaine vers l'IP de votre serveur

Type A record :
- `votredomaine.com` → `VOTRE_IP_SERVEUR`
- `www.votredomaine.com` → `VOTRE_IP_SERVEUR`

FrankenPHP obtiendra automatiquement un certificat HTTPS Let's Encrypt !

---

## 🔄 Mettre à jour l'application

Sur le serveur :
```bash
cd ~/ia-image-quiz

# Pull les changements (si Git configuré)
git pull origin main

# Ou re-transférer l'archive et extraire

# Rebuild et redémarrer
export $(cat .env.prod | grep -v '^#' | xargs)
docker compose -f docker-compose.prod-mysql.yml up -d --build

# Migrations si nécessaire
docker compose -f docker-compose.prod-mysql.yml exec backend \
  php bin/console doctrine:migrations:migrate --no-interaction
```

---

## 💾 Sauvegarder la base de données

```bash
docker compose -f docker-compose.prod-mysql.yml exec mysql mysqldump \
  -u root -p ia_challenge > backup_$(date +%Y%m%d).sql
```

---

## 🛑 Arrêter l'application

```bash
docker compose -f docker-compose.prod-mysql.yml down
```

---

## 🐛 Dépannage

### Les conteneurs ne démarrent pas
```bash
docker compose -f docker-compose.prod-mysql.yml ps
docker compose -f docker-compose.prod-mysql.yml logs backend
```

### Erreur de permissions
```bash
docker compose -f docker-compose.prod-mysql.yml exec backend \
  chown -R www-data:www-data /app/var
```

### Réinitialiser tout
```bash
docker compose -f docker-compose.prod-mysql.yml down -v
# Puis relancer les étapes de déploiement
```

---

## 📞 Accès rapide

```bash
# SSH (utilisez vos identifiants du fichier .env.deploy)
sshpass -p 'VOTRE_MOT_DE_PASSE' ssh VOTRE_USER@VOTRE_SERVER_IP

# Logs
docker compose -f docker-compose.prod-mysql.yml logs -f backend

# Shell dans le conteneur
docker compose -f docker-compose.prod-mysql.yml exec backend sh

# MySQL shell
docker compose -f docker-compose.prod-mysql.yml exec mysql \
  mysql -u root -p ia_challenge
```