FROM node:20-slim

# Install build tools needed for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

EXPOSE 3000

# DB lives on Railway persistent volume at /data
ENV DB_PATH=/data/aerozag.db

CMD ["node", "dist/index.js"]
