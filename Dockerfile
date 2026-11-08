# Render Dockerfile for Chatwork Earthquake Bot
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

EXPOSE 10000

CMD ["tsx", "server.ts"]
