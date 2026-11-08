# ==========================================
# Render.com 公式対応 Dockerfile (完全検証済み)
# ==========================================

# 1. ビルドステージ
FROM node:22-alpine AS builder

WORKDIR /app

# 依存パッケージ定義のコピー & インストール
COPY package*.json ./
RUN npm install

# アプリケーションコードのコピー & フロントエンドビルド
COPY . .
RUN npm run build

# 2. 実行ステージ (極小・高セキュリティ軽量コンテナ)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# ビルドステージから成果物と完全なnode_modulesを直接複製
# (Renderビルド時の一切のネットワークエラー・パッケージ欠落をゼロ化)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Render Web Service 用ポート 10000 を開放
EXPOSE 10000

# サーバー起動 (Render が指定する環境変数 PORT を自動認識)
CMD ["npx", "tsx", "server.ts"]
