# SnowTricky - Jeu de Snowboard Multijoueur
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci

# Copier le reste du code source
COPY . .

# Build du client (Vite)
RUN npm run build

# Exposer le port du serveur
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Lancer le serveur
CMD ["node", "server/index.js"]
