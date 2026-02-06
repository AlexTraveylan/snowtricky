# 🚀 Guide de Déploiement - SnowTricky

## Option 1 : Railway (Recommandé - Le plus rapide) ⚡

Railway est parfait pour ce projet car il supporte Docker, WebSockets et déploie en quelques minutes.

### Étapes :

1. **Créer un compte Railway**
   - Allez sur [railway.app](https://railway.app)
   - Connectez-vous avec GitHub

2. **Déployer le projet**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repo `snowtricky-main`
   - Railway détectera automatiquement le `Dockerfile` et `railway.json`

3. **Configurer les variables d'environnement**
   - Dans les paramètres du service, ajoutez :
     ```
     ALLOWED_ORIGINS=https://votre-app.railway.app
     PORT=3000
     NODE_ENV=production
     ```
   - Railway génère automatiquement une URL, utilisez-la pour `ALLOWED_ORIGINS`

4. **Déployer**
   - Railway build et déploie automatiquement
   - Une fois terminé, votre app sera accessible sur `https://votre-app.railway.app`

### Coût :
- **Gratuit** : $5 de crédit par mois (suffisant pour tester)
- **Payant** : À partir de $5/mois pour un usage régulier

---

## Option 2 : Render 🎨

Render est une alternative gratuite avec un plan gratuit généreux.

### Étapes :

1. **Créer un compte Render**
   - Allez sur [render.com](https://render.com)
   - Connectez-vous avec GitHub

2. **Créer un nouveau Web Service**
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repo GitHub
   - Sélectionnez le repo `snowtricky-main`

3. **Configuration**
   - **Name** : `snowtricky`
   - **Environment** : `Docker`
   - **Region** : Choisissez le plus proche (ex: Frankfurt)
   - **Branch** : `main` ou `master`
   - **Root Directory** : `/` (laisser vide)

4. **Variables d'environnement**
   ```
   ALLOWED_ORIGINS=https://snowtricky.onrender.com
   PORT=3000
   NODE_ENV=production
   ```

5. **Déployer**
   - Cliquez sur "Create Web Service"
   - Le build démarre automatiquement
   - Attendez 5-10 minutes pour le premier déploiement

### Coût :
- **Gratuit** : Plan gratuit disponible (peut être lent au démarrage)
- **Starter** : $7/mois pour de meilleures performances

---

## Option 3 : Fly.io 🪰

Fly.io est excellent pour les apps avec WebSockets et offre un plan gratuit généreux.

### Étapes :

1. **Installer Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Se connecter**
   ```bash
   fly auth login
   ```

3. **Créer l'app**
   ```bash
   fly launch
   ```
   - Suivez les prompts
   - Créez un `fly.toml` si nécessaire

4. **Déployer**
   ```bash
   fly deploy
   ```

### Coût :
- **Gratuit** : 3 VMs partagées gratuites
- **Payant** : À partir de $1.94/mois par VM

---

## Option 4 : VPS avec Docker (Plus de contrôle) 🐳

Si vous avez déjà un VPS (Hetzner, OVH, DigitalOcean, etc.) :

### Étapes :

1. **SSH sur votre serveur**
   ```bash
   ssh user@votre-serveur.com
   ```

2. **Installer Docker et Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Cloner le repo**
   ```bash
   git clone https://github.com/votre-user/snowtricky-main.git
   cd snowtricky-main
   ```

4. **Configurer les variables d'environnement**
   ```bash
   export ALLOWED_ORIGINS=https://votre-domaine.com
   export PORT=3000
   export NODE_ENV=production
   ```

5. **Déployer avec Docker**
   ```bash
   docker build -t snowtricky .
   docker run -d \
     -p 3000:3000 \
     -e ALLOWED_ORIGINS=https://votre-domaine.com \
     -e PORT=3000 \
     -e NODE_ENV=production \
     --name snowtricky \
     --restart unless-stopped \
     snowtricky
   ```

6. **Configurer Nginx (optionnel mais recommandé)**
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

---

## 🔧 Variables d'environnement importantes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Origines autorisées pour CORS (séparées par virgules) | `https://snowtricky.railway.app` |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement | `production` |

---

## ✅ Vérification après déploiement

1. **Tester l'URL principale**
   - Ouvrez `https://votre-app.railway.app` dans un navigateur
   - Vous devriez voir l'écran de lobby

2. **Tester les WebSockets**
   - Ouvrez la console du navigateur (F12)
   - Vérifiez qu'il n'y a pas d'erreurs de connexion Socket.io
   - Essayez de rejoindre une partie

3. **Tester le multijoueur**
   - Ouvrez plusieurs onglets/fenêtres
   - Rejoignez avec différents noms
   - Vérifiez que les joueurs se voient mutuellement

---

## 🐛 Dépannage

### Erreur CORS
- Vérifiez que `ALLOWED_ORIGINS` contient bien l'URL de votre app (sans slash final)
- Ajoutez `http://localhost:3000` si vous testez en local

### WebSockets ne fonctionnent pas
- Vérifiez que votre plateforme supporte WebSockets (Railway, Render, Fly.io le font)
- Vérifiez les logs du serveur pour voir les erreurs

### Le client ne se connecte pas au serveur
- Vérifiez que `VITE_SERVER_URL` n'est pas défini (le client utilise `window.location.origin` par défaut)
- En production, le client et le serveur doivent être sur le même domaine

---

## 💡 Recommandation finale

Pour un déploiement **rapide et simple**, utilisez **Railway** :
- ✅ Déploiement en 5 minutes
- ✅ Support Docker natif
- ✅ WebSockets fonctionnent parfaitement
- ✅ HTTPS automatique
- ✅ $5 de crédit gratuit par mois

**Bon déploiement ! 🎿**

