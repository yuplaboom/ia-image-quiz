# IA Challenge - Devinez l'image générée

Application de jeu d'entreprise où les participants créent des descriptions qui sont transformées en images par IA. Les joueurs doivent deviner qui est représenté par chaque image générée.

## Fonctionnalités

- **Gestion des participants**: Ajout de collaborateurs avec descriptions (traits physiques, défaut, qualité, poste)
- **Génération d'images**: Intégration avec DALL-E pour créer des images à partir des descriptions
- **Jeu en temps réel**: Interface hôte pour contrôler le jeu et interface joueur pour soumettre les réponses
- **Statistiques**: Affichage des résultats et classement des joueurs
- **Déploiement simple**: Configuration Docker incluse

## Architecture

- **Backend**: Symfony 7.2 (API REST)
- **Frontend**: React + Vite
- **Base de données**: SQLite (développement) / PostgreSQL ou MySQL (production)
- **API IA**: OpenAI DALL-E 3

## Installation

### Option 1: Avec Docker (Recommandé)

1. Clonez le dépôt:
```bash
git clone <repository-url>
cd ia-image-quiz
```

2. Lancez les conteneurs:
```bash
docker-compose up -d
```

3. Créez la base de données:
```bash
docker-compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

4. Accédez à l'application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

### Option 2: Installation Manuelle

#### Prérequis
- PHP 8.2+
- Composer
- Node.js 18+
- Extension PHP: pdo_sqlite, zip

#### Backend

```bash
cd backend

# Installer les dépendances
composer install

# Configurer l'environnement (optionnel: ajouter clé DALL-E)
cp .env .env.local
# Éditez .env.local et ajoutez: OPENAI_API_KEY=votre_clé

# Créer la base de données
php bin/console doctrine:migrations:migrate --no-interaction

# Lancer le serveur
php -S localhost:8000 -t public
```

#### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'API URL (optionnel)
cp .env .env.local
# Éditez .env.local si nécessaire: VITE_API_URL=http://localhost:8000/api

# Lancer le serveur de développement
npm run dev
```

## Configuration

### Clé API OpenAI (Optionnel)

Pour utiliser la génération d'images réelle avec DALL-E:

1. Obtenez une clé API sur https://platform.openai.com/
2. Ajoutez-la dans `backend/.env.local`:
```
OPENAI_API_KEY=sk-...
```

Sans clé API, le système utilisera des images de placeholder pour le développement.

### Base de données de production

Pour PostgreSQL ou MySQL, modifiez `DATABASE_URL` dans `backend/.env.local`:

PostgreSQL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ia_challenge?serverVersion=16&charset=utf8"
```

MySQL:
```
DATABASE_URL="mysql://user:password@localhost:3306/ia_challenge?serverVersion=8.0.32&charset=utf8mb4"
```

## Utilisation

### 1. Ajouter des Participants

1. Accédez à la page "Participants"
2. Remplissez le formulaire pour chaque collaborateur:
   - Nom complet
   - 2 traits physiques
   - 1 défaut
   - 1 qualité
   - Poste occupé

### 2. Créer une Session de Jeu

1. Allez dans "Configuration Jeu"
2. Donnez un nom à la session
3. Définissez le temps par image (en secondes)
4. Sélectionnez les participants
5. Cliquez sur "Créer le Jeu"

### 3. Lancer le Jeu (Hôte)

1. Vous serez redirigé vers l'interface hôte
2. Copiez l'URL de jeu et partagez-la avec les joueurs
3. Cliquez sur "Démarrer le Jeu"
4. Pour chaque tour:
   - L'image est affichée automatiquement
   - Cliquez sur "Révéler la Réponse" pour voir qui c'était
   - Cliquez sur "Tour Suivant" pour continuer

### 4. Jouer (Joueur)

1. Ouvrez l'URL de jeu partagée par l'hôte
2. Entrez votre nom
3. Pour chaque image:
   - Observez l'image générée
   - Devinez qui est représenté
   - Soumettez votre réponse

### 5. Voir les Résultats

À la fin du jeu, l'interface hôte affiche:
- Statistiques globales
- Classement des joueurs
- Détails des réponses

## Structure du Projet

```
ia-image-quiz/
├── backend/                    # API Symfony
│   ├── src/
│   │   ├── Entity/            # Entités (Participant, GameSession, etc.)
│   │   ├── Repository/        # Repositories Doctrine
│   │   ├── Controller/        # Contrôleurs API
│   │   └── Service/           # Services (GameService, ImageGenerationService)
│   └── config/                # Configuration Symfony
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── services/          # API client
│   │   └── App.jsx           # Composant principal
│   └── public/                # Assets statiques
├── docker-compose.yml         # Configuration Docker
└── README.md                  # Ce fichier
```

## API Endpoints

### Participants
- `GET /api/participants` - Liste des participants
- `POST /api/participants` - Créer un participant
- `GET /api/participants/{id}` - Détails d'un participant
- `PUT /api/participants/{id}` - Mettre à jour un participant
- `DELETE /api/participants/{id}` - Supprimer un participant

### Sessions de Jeu
- `GET /api/game_sessions` - Liste des sessions
- `POST /api/game_sessions` - Créer une session
- `POST /api/game/session/{id}/initialize` - Initialiser avec participants
- `POST /api/game/session/{id}/start` - Démarrer le jeu
- `POST /api/game/session/{id}/next` - Tour suivant
- `GET /api/game/session/{id}/current` - Tour actuel
- `GET /api/game/session/{id}/statistics` - Statistiques

### Tours de Jeu
- `POST /api/game/round/{id}/answer` - Soumettre une réponse
- `GET /api/game/round/{id}/reveal` - Révéler la réponse

## Déploiement en Production

### Option 1: Serveur avec Docker

1. Clonez le projet sur votre serveur
2. Configurez les variables d'environnement dans `docker-compose.yml`
3. Construisez et lancez:
```bash
docker-compose up -d --build
```

### Option 2: Hébergement traditionnel

#### Backend
- Hébergez sur un serveur PHP (Apache/Nginx)
- Configurez la base de données
- Définissez `APP_ENV=prod` dans `.env.local`
- Exécutez `composer install --no-dev --optimize-autoloader`

#### Frontend
```bash
cd frontend
npm run build
```
- Servez le dossier `dist/` avec votre serveur web

### Considérations de Sécurité

- Changez `APP_SECRET` dans `backend/.env`
- Configurez CORS correctement pour votre domaine
- Utilisez HTTPS en production
- Protégez votre clé API OpenAI

## Dépannage

### La base de données ne se crée pas
```bash
# Vérifiez que l'extension SQLite est installée
php -m | grep sqlite

# Créez manuellement la base
cd backend
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### Erreurs CORS
- Vérifiez que le backend est accessible depuis le frontend
- Modifiez `backend/config/packages/nelmio_cors.yaml` si nécessaire

### Images ne se génèrent pas
- Vérifiez que `OPENAI_API_KEY` est configurée
- Sans clé, des images de placeholder seront utilisées

## Développement

### Ajouter des entités
```bash
cd backend
php bin/console make:entity
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

### Tester l'API
```bash
# Avec curl
curl http://localhost:8000/api/participants

# Ou utilisez l'interface API Platform
http://localhost:8000/api
```

## Licence

Ce projet est développé pour un usage interne d'entreprise.

## Support

Pour toute question ou problème, créez une issue sur le dépôt GitHub.
