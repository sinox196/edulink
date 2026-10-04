# Job Railway : applique les migrations, charge la démo (si base vide) et vérifie la sécurité RLS.
# Contexte de build = racine du dépôt (RAILWAY_DOCKERFILE_PATH=packages/db/Dockerfile).
FROM node:22-alpine
WORKDIR /app
RUN echo '{"private":true,"workspaces":["packages/shared","packages/db"]}' > package.json
COPY packages/shared packages/shared
COPY packages/db packages/db
RUN npm install --workspace @edulink/db --no-audit --no-fund
CMD ["npm", "run", "setup", "--workspace", "@edulink/db"]
