# Utilise l'image officielle Node.js
FROM node:18-alpine

# Définit le répertoire de travail
WORKDIR /app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installe les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copie tout le code source
COPY . .

# Build le projet TypeScript
RUN npm run build

# Copie les vues EJS dans le répertoire dist
RUN cp -r src/views dist/

# Copie le package.json dans dist (pour les métadonnées si nécessaire)
RUN cp package.json dist/

# Supprime les devDependencies pour réduire la taille
RUN npm ci --only=production && npm cache clean --force

# Crée le répertoire pour la base de données persistante
RUN mkdir -p /app/data

# Expose le port (ajuste selon ton .env, par défaut 3000)
EXPOSE 3000

# Variable d'environnement pour indiquer qu'on est en production
ENV NODE_ENV=prod

# Commande pour démarrer l'application
CMD ["node", "dist/Server.js"]