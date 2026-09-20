FROM node:24-alpine AS base

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Ensure data directory exists with appropriate permissions
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
