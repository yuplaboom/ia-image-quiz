# 🎯 DÉMARRAGE RAPIDE - Déploiement Production

## ⚡ Déploiement automatique (Le plus simple)

### 1. Installez sshpass
```bash
brew install hudochenkov/sshpass/sshpass
```

### 2. Lancez le déploiement
```bash
./deploy-to-server.sh
```

**C'est tout !** Le script fait tout automatiquement. ✨

---

## 📝 Ce que vous devrez fournir

Quand le script vous le demande :

1. **Nom de domaine** : `mondomaine.com`
2. **Mot de passe MySQL root** : Choisissez un mot de passe fort
3. **Mot de passe MySQL user** : Choisissez un autre mot de passe fort

Le script génère automatiquement les autres secrets de sécurité.

---

## 🌐 Configuration DNS (Important !)

Après le déploiement, configurez votre DNS :

**Type A :**
- `votredomaine.com` → `51.254.143.159`
- `www.votredomaine.com` → `51.254.143.159`

**Attendez 5-10 minutes** que la propagation DNS se fasse.

FrankenPHP obtiendra automatiquement un certificat HTTPS Let's Encrypt.

---

## ✅ Vérifier que ça marche

Après 10 minutes (temps de propagation DNS) :

1. Ouvrez `https://votredomaine.com`
2. Vous devriez voir votre application ! 🎉

---

## 📚 Documentation complète

- **[DEPLOY-SERVER.md](./DEPLOY-SERVER.md)** - Guide détaillé
- **[QUICKSTART.md](./QUICKSTART.md)** - Guide de démarrage rapide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture technique

---

## 🆘 Problème ?

### Le site ne charge pas

1. Vérifiez que Docker tourne sur le serveur :
```bash
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159
cd ~/ia-image-quiz
docker compose -f docker-compose.prod-mysql.yml ps
```

2. Vérifiez les logs :
```bash
docker compose -f docker-compose.prod-mysql.yml logs -f backend
```

### HTTPS ne fonctionne pas

- Attendez 10-15 minutes après avoir configuré le DNS
- Vérifiez que votre domaine pointe bien vers `51.254.143.159` :
  ```bash
  nslookup votredomaine.com
  ```

### Erreur lors du build

Le Caddyfile a été corrigé. Si vous aviez déjà essayé de build :
```bash
# Sur le serveur
cd ~/ia-image-quiz
docker compose -f docker-compose.prod-mysql.yml down
docker compose -f docker-compose.prod-mysql.yml build --no-cache
docker compose -f docker-compose.prod-mysql.yml up -d
```

---

## 🔄 Mettre à jour l'application plus tard

Relancez simplement :
```bash
./deploy-to-server.sh
```

---

## 📊 Commandes utiles

### Se connecter au serveur
```bash
sshpass -p '5LegS7G7njN3dHjM' ssh debian@51.254.143.159
```

### Voir les logs en direct
```bash
cd ~/ia-image-quiz
docker compose -f docker-compose.prod-mysql.yml logs -f backend
```

### Redémarrer l'application
```bash
docker compose -f docker-compose.prod-mysql.yml restart
```

### Sauvegarder la base de données
```bash
docker compose -f docker-compose.prod-mysql.yml exec mysql mysqldump \
  -u root -p ia_challenge > backup.sql
```

---

## 🎉 C'est parti !

Lancez maintenant :
```bash
./deploy-to-server.sh
```

Et profitez de votre application en production ! 🚀