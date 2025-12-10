# 🏗️ Architecture de Production

## Architecture Simplifiée - Tout dans un Conteneur

```
┌─────────────────────────────────────────────────────┐
│              Serveur Production                      │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │   Conteneur "backend" (FrankenPHP)         │    │
│  │                                             │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Frontend (React - Build statique)   │  │    │
│  │  │  Servi depuis /app/public/frontend   │  │    │
│  │  │                                       │  │    │
│  │  │  Accessible via: /*                   │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  │                                             │    │
│  │  ┌──────────────────────────────────────┐  │    │
│  │  │  Backend API (Symfony)               │  │    │
│  │  │  Worker Mode activé                  │  │    │
│  │  │                                       │  │    │
│  │  │  Accessible via: /api/*               │  │    │
│  │  └──────────────────────────────────────┘  │    │
│  │                                             │    │
│  │  Ports: 80 (HTTP), 443 (HTTPS)            │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │   Conteneur "mysql"                        │    │
│  │   MySQL 8.0                                │    │
│  │   Port: 3306 (interne uniquement)         │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │   Conteneur "mercure"                      │    │
│  │   Real-time updates                        │    │
│  │   Port: 80 (interne uniquement)           │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Flux des Requêtes

### 1. Requête Frontend (ex: https://votredomaine.com)
```
Client → FrankenPHP:443
         ↓
         Caddyfile.prod vérifie le path
         ↓
         Path = /* → Servir fichiers statiques depuis /app/public/frontend
                     (avec fallback sur index.html pour React Router)
```

### 2. Requête API (ex: https://votredomaine.com/api/participants)
```
Client → FrankenPHP:443
         ↓
         Caddyfile.prod vérifie le path
         ↓
         Path = /api/* → php_server (Symfony)
                         ↓
                         Symfony Controller
                         ↓
                         MySQL Database
```

### 3. WebSocket Mercure (temps réel)
```
Client → FrankenPHP:443/.well-known/mercure
         ↓
         Proxy vers conteneur mercure:80
         ↓
         Mercure Hub
```

## Avantages de cette Architecture

### ✅ Simplicité
- **Un seul conteneur** pour le frontend et le backend
- **Pas de proxy inverse** complexe à configurer
- **Pas de CORS** car tout est sur le même domaine

### ✅ Performance
- **Zero latency** entre frontend et backend (même serveur)
- **FrankenPHP Worker Mode** : Symfony reste en mémoire
- **HTTP/2 et HTTP/3** natifs
- **Compression automatique** (Zstd, Gzip)

### ✅ Sécurité
- **HTTPS automatique** avec Let's Encrypt
- **Headers de sécurité** préconfigurés
- **Isolation des services** via Docker networks

### ✅ Déploiement
- **Build en une fois** : `docker-compose build`
- **Un seul port** à ouvrir (80/443)
- **Scaling facile** avec docker-compose scale

## Structure des Fichiers

```
ia-image-quiz/
├── frontend/                      # Code source React
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                       # Code source Symfony
│   ├── src/
│   ├── public/
│   │   └── index.php             # Entry point Symfony
│   ├── composer.json
│   └── config/
│
├── Dockerfile.prod                # Build multi-stage
│   ├── Stage 1: Build frontend (npm run build)
│   └── Stage 2: Backend + Frontend build
│
├── Caddyfile.prod                # Configuration FrankenPHP
│   ├── Route /* → Frontend statique
│   └── Route /api/* → Backend Symfony
│
├── docker-compose.prod-mysql.yml # Orchestration production
│   ├── Service: backend (frontend + backend)
│   ├── Service: mysql
│   └── Service: mercure
│
└── deploy.sh                     # Script de déploiement
```

## Process de Build

### 1. Build du Frontend
```dockerfile
# Dans Dockerfile.prod - Stage 1
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/ ./
RUN npm ci
RUN npm run build
# Génère: /frontend/dist/
```

### 2. Build du Backend + Intégration Frontend
```dockerfile
# Dans Dockerfile.prod - Stage 2
FROM dunglas/frankenphp:latest-php8.3
WORKDIR /app

# Install backend
COPY backend/ ./
RUN composer install --no-dev --optimize-autoloader

# Copy frontend build
COPY --from=frontend-builder /frontend/dist /app/public/frontend

# Configure routing
COPY Caddyfile.prod /etc/caddy/Caddyfile
```

### 3. Résultat Final
```
/app/public/
├── frontend/              ← Build React (index.html, assets/, etc.)
│   ├── index.html
│   ├── assets/
│   │   ├── main.js
│   │   └── main.css
│   └── ...
└── index.php             ← Entry point Symfony
```

## Configuration Caddyfile

Le `Caddyfile.prod` gère le routing :

```caddyfile
:80, :443 {
    root * /app/public

    # Health check
    @health { path /health }
    handle @health { php_server }

    # API Symfony
    @api { path /api/* }
    handle @api { php_server }

    # Frontend React (SPA)
    handle {
        root * /app/public/frontend
        try_files {path} /index.html
        file_server
    }
}
```

**Explication :**
- `/health` → Symfony (health check)
- `/api/*` → Symfony (API REST)
- `/*` → Fichiers statiques React avec fallback sur `index.html` pour le routing côté client

## Variables d'Environnement

### Frontend Build Time
```bash
VITE_API_URL=/api
```
- URL relative car frontend et backend sur le même domaine
- Compilé dans le build JavaScript

### Backend Runtime
```bash
APP_ENV=prod
APP_SECRET=...
DATABASE_URL=mysql://...
MERCURE_URL=http://mercure/...
```

## Scaling et Performance

### Pour augmenter les performances

1. **Plus de workers PHP** :
```bash
# Dans .env.prod
FRANKENPHP_NUM_THREADS=8
```

2. **Plus de RAM pour Opcache** :
```bash
PHP_OPCACHE_MEMORY_CONSUMPTION=512
```

3. **Scaling horizontal** :
```bash
docker-compose -f docker-compose.prod-mysql.yml up -d --scale backend=3
```

### Monitoring

```bash
# Voir les stats en temps réel
docker stats

# Logs structurés JSON
./deploy.sh logs backend | jq

# Health check
curl https://votredomaine.com/health
```

## Comparaison avec Architecture Séparée

| Critère | Architecture Unifiée | Architecture Séparée |
|---------|---------------------|---------------------|
| Conteneurs | 3 (backend+frontend, mysql, mercure) | 4 (frontend, backend, mysql, mercure) |
| Ports exposés | 2 (80, 443) | 3+ (80, 443, 5173) |
| CORS | ❌ Pas besoin | ✅ Requis |
| Latency | 0ms (même serveur) | 1-5ms (proxy) |
| Complexité | ⭐⭐ Simple | ⭐⭐⭐⭐ Complexe |
| Déploiement | ⭐⭐⭐⭐⭐ Très facile | ⭐⭐⭐ Moyen |
| Ressources | 🟢 Optimales | 🟡 Plus élevées |

## Sécurité

### Headers Automatiques
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS Let's Encrypt
FrankenPHP gère automatiquement :
- Obtention du certificat
- Renouvellement automatique
- Redirection HTTP → HTTPS

### Isolation
- Services dans un network Docker privé
- Seul le backend expose les ports 80/443
- MySQL et Mercure inaccessibles de l'extérieur

## Conclusion

Cette architecture unifiée offre :
- ✅ **Simplicité maximale** de déploiement et maintenance
- ✅ **Performance optimale** (pas de proxy, worker mode)
- ✅ **Sécurité renforcée** (HTTPS auto, headers)
- ✅ **Coût réduit** (moins de ressources)

Parfait pour des déploiements de production simples et performants !