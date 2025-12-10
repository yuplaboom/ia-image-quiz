# 🚀 Guide de Démarrage Rapide - Production

## Déploiement en 5 minutes

### Prérequis
- Un serveur Ubuntu/Debian avec Docker installé
- Un nom de domaine pointant vers votre serveur
- Ports 80 et 443 ouverts

### Étape 1 : Transférer les fichiers

Sur votre ordinateur local :
```bash
# Créez une archive du projet (exclut node_modules et vendor)
tar -czf ia-image-quiz.tar.gz \
  --exclude='node_modules' \
  --exclude='vendor' \
  --exclude='var' \
  --exclude='.git' \
  .

# Transférez sur votre serveur
scp ia-challenge.tar.gz user@votre-serveur:~/
```

### Étape 2 : Sur le serveur

```bash
# Connectez-vous
ssh user@votre-serveur

# Décompressez
mkdir -p ~/ia-image-quiz
tar -xzf ia-image-quiz.tar.gz -C ~/ia-image-quiz
cd ~/ia-image-quiz

# Rendez le script exécutable
chmod +x deploy.sh
```

### Étape 3 : Configuration

```bash
# Initialisez la configuration
./deploy.sh init
```

Cela va créer le fichier `.env.prod`. Éditez-le :

```bash
nano .env.prod
```

**Valeurs importantes à modifier :**
```bash
# Générez un secret (copiez le résultat)
openssl rand -hex 32

# Modifiez dans .env.prod :
APP_SECRET=le_secret_genere_ci_dessus
SERVER_NAME=votredomaine.com
MYSQL_ROOT_PASSWORD=un_mot_de_passe_securise_root
MYSQL_PASSWORD=un_mot_de_passe_securise_user
VITE_API_URL=/api  # Chemin relatif - tout est sur le même serveur !

# Générez une clé Mercure
openssl rand -base64 32
MERCURE_JWT_KEY=la_cle_generee_ci_dessus
```

### Étape 4 : Déployer

```bash
# Démarrez l'application
./deploy.sh start
```

### Étape 5 : Vérifier

```bash
# Vérifiez que tout fonctionne
./deploy.sh status

# Suivez les logs
./deploy.sh logs backend

# Testez l'application
curl https://votredomaine.com/health
```

---

## 🎉 C'est fait !

Votre application est maintenant accessible sur :
**https://votredomaine.com**

FrankenPHP a automatiquement obtenu un certificat HTTPS Let's Encrypt valide !

---

## Commandes Utiles

### Voir les logs
```bash
./deploy.sh logs backend    # Logs du backend
./deploy.sh logs frontend   # Logs du frontend
./deploy.sh logs mysql      # Logs de la base de données
```

### Sauvegarder la base de données
```bash
./deploy.sh backup
```

### Mettre à jour l'application
```bash
./deploy.sh update
```

### Redémarrer
```bash
./deploy.sh restart
```

### Arrêter
```bash
./deploy.sh stop
```

### Accéder au shell du conteneur
```bash
./deploy.sh shell backend   # Shell du backend
./deploy.sh shell mysql     # Shell MySQL
```

---

## Dépannage Rapide

### Le site ne se charge pas

1. Vérifiez les conteneurs :
```bash
./deploy.sh status
```

2. Vérifiez les logs :
```bash
./deploy.sh logs backend
```

3. Vérifiez le firewall :
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### HTTPS ne fonctionne pas

1. Vérifiez que votre DNS pointe vers le bon serveur :
```bash
nslookup votredomaine.com
```

2. Vérifiez les logs FrankenPHP :
```bash
./deploy.sh logs backend | grep -i "certificate"
```

3. Attendez quelques minutes (Let's Encrypt peut prendre du temps)

### Erreur de base de données

```bash
# Recréez les tables
./deploy.sh migrate
```

---

## Migration depuis SQLite vers MySQL (si besoin)

Si vous avez des données en SQLite à migrer :

```bash
# 1. Exportez depuis SQLite (développement)
docker-compose exec backend php bin/console doctrine:schema:dump --dump-sql > backup.sql

# 2. Importez dans MySQL (production)
cat backup.sql | ./deploy.sh shell mysql mysql -u ia_user -p ia_challenge
```

---

## Monitoring

### Vérifier la santé de l'application
```bash
curl https://votredomaine.com/health
# Devrait retourner: OK
```

### Voir les statistiques des conteneurs
```bash
docker stats
```

### Vérifier l'utilisation disque
```bash
df -h
docker system df
```

---

## Sécurité

### ✅ Checklist de sécurité

- [ ] `APP_SECRET` changé et sécurisé
- [ ] `MYSQL_ROOT_PASSWORD` fort et unique
- [ ] `MYSQL_PASSWORD` fort et unique
- [ ] `MERCURE_JWT_KEY` généré aléatoirement
- [ ] HTTPS activé (automatique avec Let's Encrypt)
- [ ] Firewall configuré (ports 80, 443 uniquement)
- [ ] Sauvegardes automatiques configurées
- [ ] `.env.prod` ne doit PAS être dans Git

### Mettre en place des sauvegardes automatiques

Ajoutez dans crontab :
```bash
crontab -e

# Ajoutez cette ligne (backup tous les jours à 2h du matin)
0 2 * * * cd /path/to/ia-challenge && ./deploy.sh backup
```

---

## Performance

Avec FrankenPHP Worker Mode activé en production :
- ⚡ **10-50x plus rapide** que PHP-FPM
- 🚀 **HTTP/2 et HTTP/3** natifs
- 💾 **Symfony reste en mémoire**
- 🔒 **HTTPS automatique**

---

## Support

Pour plus de détails, consultez :
- [DEPLOY.md](./DEPLOY.md) - Guide de déploiement complet
- [README.md](./README.md) - Documentation complète
- [Documentation FrankenPHP](https://frankenphp.dev)

---

## Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `./deploy.sh logs backend`
2. Vérifiez le statut : `./deploy.sh status`
3. Consultez la documentation : [DEPLOY.md](./DEPLOY.md)