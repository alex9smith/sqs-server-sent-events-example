FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
