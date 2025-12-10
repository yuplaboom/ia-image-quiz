# 🔧 Résoudre l'erreur SSL `ERR_SSL_PROTOCOL_ERROR`

Votre domaine : **itschristmas.lesgrappes.com**

## 🎯 Solutions rapides

### Solution 1 : Tester en HTTP d'abord (Recommandé) ⚡

Désactivons temporairement HTTPS pour vérifier que l'application fonctionne :

```bash
./switch-ssl.sh http
```

Attendez 30 secondes, puis testez :
- ✅ **http://itschristmas.lesgrappes.com** (devrait fonctionner)

Si ça marche, passez à la solution 2.

---

### Solution 2 : Activer HTTPS avec Let's Encrypt 🔒

Une fois que HTTP fonctionne :

```bash
./switch-ssl.sh https
```

Attendez 2-3 minutes et testez :
- ✅ **https://itschristmas.lesgrappes.com**

---

## 🔍 Diagnostic

Pour voir ce qui ne va pas :

```bash
# Se connecter au serveur
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159

# Voir les logs
cd ~/ia-image-quiz
docker compose -f docker-compose.prod-mysql.yml logs -f backend

# Chercher les erreurs ACME/TLS
docker compose -f docker-compose.prod-mysql.yml logs backend | grep -i "acme\|tls\|certificate"
```

---

## ❓ Pourquoi cette erreur ?

Le problème vient généralement de :

1. **Port 443 fermé** - Le firewall bloque HTTPS
2. **Let's Encrypt rate limit** - Trop de tentatives en peu de temps
3. **DNS pas encore propagé** - Le domaine ne pointe pas encore sur le bon serveur
4. **Configuration Caddy incorrecte** - Syntaxe du Caddyfile

---

## 🛠️ Solutions détaillées

### A) Vérifier que les ports sont ouverts

```bash
# Se connecter au serveur
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159

# Vérifier le firewall (si UFW est actif)
sudo ufw status

# Si le firewall bloque, ouvrir les ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### B) Vérifier la configuration DNS

```bash
# Vérifier que le domaine pointe bien vers le serveur
nslookup itschristmas.lesgrappes.com

# Devrait répondre: 51.254.143.159
```

### C) Forcer le renouvellement du certificat

Si vous avez déjà essayé plusieurs fois, Let's Encrypt peut vous avoir rate-limité.

**Solution temporaire** : Utilisez HTTP uniquement
```bash
./switch-ssl.sh http
```

**Attendez 1 heure** puis réessayez :
```bash
./switch-ssl.sh https
```

### D) Vérifier les logs en détail

```bash
# Connexion au serveur
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159
cd ~/ia-image-quiz

# Logs complets
docker compose -f docker-compose.prod-mysql.yml logs backend | grep -A 5 -B 5 "error"

# Chercher les erreurs ACME
docker compose -f docker-compose.prod-mysql.yml logs backend | grep "acme"
```

---

## 🚀 Démarrage recommandé

1. **D'abord, tester en HTTP** :
   ```bash
   ./switch-ssl.sh http
   ```
   → Vérifiez que http://itschristmas.lesgrappes.com fonctionne

2. **Ensuite, activer HTTPS** :
   ```bash
   ./switch-ssl.sh https
   ```
   → Attendez 2 minutes
   → Testez https://itschristmas.lesgrappes.com

---

## 📋 Checklist de débogage

- [ ] DNS pointe vers 51.254.143.159 ?
  ```bash
  nslookup itschristmas.lesgrappes.com
  ```

- [ ] Port 80 accessible ?
  ```bash
  curl -I http://itschristmas.lesgrappes.com
  ```

- [ ] Port 443 ouvert sur le serveur ?
  ```bash
  sudo ufw status
  ```

- [ ] Conteneurs en cours d'exécution ?
  ```bash
  docker compose -f docker-compose.prod-mysql.yml ps
  ```

- [ ] Logs sans erreur ACME ?
  ```bash
  docker compose -f docker-compose.prod-mysql.yml logs backend | grep acme
  ```

---

## 🆘 En cas de blocage

### Option 1 : Utiliser HTTP uniquement (pas de SSL)

C'est suffisant pour tester et développer :

```bash
./switch-ssl.sh http
```

Votre site sera accessible sur **http://itschristmas.lesgrappes.com**

### Option 2 : Utiliser un certificat auto-signé

Si Let's Encrypt ne fonctionne vraiment pas, on peut générer un certificat auto-signé (le navigateur affichera un avertissement, mais ça fonctionnera).

### Option 3 : Utiliser un proxy inverse (Cloudflare)

Cloudflare peut gérer le SSL à votre place gratuitement.

---

## 📞 Commandes utiles

```bash
# Passer en HTTP
./switch-ssl.sh http

# Passer en HTTPS
./switch-ssl.sh https

# Se connecter au serveur
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159

# Voir les logs
cd ~/ia-image-quiz
docker compose -f docker-compose.prod-mysql.yml logs -f backend

# Redémarrer l'application
docker compose -f docker-compose.prod-mysql.yml restart backend

# Tout reconstruire
export $(cat .env.prod | grep -v '^#' | xargs)
docker compose -f docker-compose.prod-mysql.yml up -d --build
```

---

## ✅ Test final

Une fois que tout est configuré :

1. **HTTP** : http://itschristmas.lesgrappes.com
2. **HTTPS** : https://itschristmas.lesgrappes.com

Les deux devraient fonctionner (HTTPS redirige automatiquement).

---

## 💡 Conseil

**Commencez toujours par HTTP** pour vérifier que l'application fonctionne, puis activez HTTPS.

```bash
# Étape 1
./switch-ssl.sh http
# Vérifiez que ça marche

# Étape 2
./switch-ssl.sh https
# Attendez 2 minutes
```

C'est la méthode la plus sûre ! 🎯