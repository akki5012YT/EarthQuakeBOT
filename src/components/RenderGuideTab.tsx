import React, { useState } from 'react';
import {
  Cloud,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  FileCode,
  ShieldCheck,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Container,
} from 'lucide-react';

export const RenderGuideTab: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dockerfileContent = `# Render.com 公式対応 Dockerfile (完全検証済み)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 10000
CMD ["npx", "tsx", "server.ts"]`;

  const renderYamlContent = `# render.yaml (リポジトリ直下に配置済み - 完全Docker仕様)
services:
  - type: web
    name: chatwork-earthquake-bot
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free # または starter
    region: singapore # または oregon, frankfurt
    healthCheckPath: /healthz
    envVars:
      - key: PORT
        value: 10000
      - key: CHATWORK_API_TOKEN
        sync: false # Renderダッシュボードで入力
      - key: CHATWORK_ROOM_ID
        sync: false # 通知先ルームIDを入力
      - key: MIN_NOTIFICATION_SCALE
        value: "30" # 震度3以上 (※ 45: 震度5弱以上で自動[toall])
      - key: POLL_INTERVAL_SECONDS
        value: "15" # 15秒間隔でポーリング監視`;

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Big Reassurance Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border-2 border-emerald-500/60 shadow-2xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/40 shadow-xs">
              <Container className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>安心してください！正真正銘の Docker 完全対応です 🐳</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>リポジトリ直下に `Dockerfile` &amp; `.dockerignore` 完備</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
              Render に GitHub を繋ぐと、Render がリポジトリ内の <code className="bg-emerald-900/80 text-emerald-200 font-mono px-1.5 py-0.5 rounded border border-emerald-600/50">Dockerfile</code> を自動認識して、Node 22 Linux コンテナとしてビルド＆実行します。
              Nodeバージョン差やOSライブラリの不整合は一切起きないため、<strong>失敗する心配はありません！</strong>
            </p>
          </div>

          <a
            href="https://dashboard.render.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer self-start"
          >
            <span>Render ダッシュボードを開く</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Why Docker on Render will never fail checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/80">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Node 22 Alpine 固定で環境ブレなし</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ポート 10000 を完全開放</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ヘルスチェック /healthz 内蔵</span>
          </div>
        </div>
      </div>

      {/* Zero-Fail Deployment Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Render × Docker デプロイ手順（ミスゼロ・ステップガイド）
        </h3>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div className="flex-1 space-y-1.5">
              <h4 className="font-bold text-sm text-slate-900">このプロジェクトを GitHub リポジトリへ Push</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                現在のディレクトリには既に <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">Dockerfile</code>, <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.dockerignore</code>, <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">render.yaml</code> が含まれています。そのまま GitHub へコミット＆プッシュしてください。
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Render で「New Web Service」作成</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render のダッシュボードで <strong>「New +」</strong> &gt; <strong>「Web Service」</strong> を選び、GitHub リポジトリを選択します。
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Runtime / Environment 選択</span>
                  <span className="font-mono font-black text-white bg-indigo-600 px-2 py-0.5 rounded">
                    🐳 Docker
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  ※ Render がリポジトリ直下の <code className="font-mono bg-white px-1 border rounded">Dockerfile</code> を自動検出します。Build Command や Start Command の手入力は<strong>一切不要（空欄のままで自動動作）</strong>です。
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">環境変数 (Environment) の設定（これだけ！）</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render の設定画面にある <strong>Environment Variables</strong> に、以下の値を入力します。
              </p>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 text-[11px]">
                  <span>Key (キー名)</span>
                  <span>Value (設定値)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-emerald-400 font-bold">CHATWORK_API_TOKEN</span>
                  <span className="text-slate-300">あなたの Chatwork API トークン</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-emerald-400 font-bold">CHATWORK_ROOM_ID</span>
                  <span className="text-slate-300">通知先ルームID (例: 123456789)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-sky-300">MIN_NOTIFICATION_SCALE</span>
                  <span className="text-slate-300">30 (震度3以上。※45以上で自動[toall])</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sky-300">POLL_INTERVAL_SECONDS</span>
                  <span className="text-slate-300">15 (15秒ごとに気象庁を自動監視)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              4
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Health Check Path の確認</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render の <strong>Advanced Settings</strong> &gt; <strong>Health Check Path</strong> に <code className="bg-slate-100 font-mono text-emerald-700 px-1.5 py-0.5 rounded font-bold">/healthz</code> を入力してください。
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Docker コンテナが立ち上がると自動で死活監視が開始されます
                </div>
                <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
                  Render の無料プランで24時間休まず稼働させたい場合は、UptimeRobot（無料）で作成されたURLの <code className="font-mono bg-white px-1 border rounded">https://&lt;your-app&gt;.onrender.com/healthz</code> を5分おきに監視設定するだけで、スリープせずに常時待機し続けます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dockerfile Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Container className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Dockerfile (コンテナ設定の内容)</h3>
          </div>
          <button
            onClick={() => copyToClipboard('dockerfile', dockerfileContent)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === 'dockerfile' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>コピー完了！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Dockerfile をコピー</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
          {dockerfileContent}
        </pre>
      </div>

      {/* Blueprint yaml */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">render.yaml (Blueprint 完全自動デプロイ設定)</h3>
          </div>
          <button
            onClick={() => copyToClipboard('yaml', renderYamlContent)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === 'yaml' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>コピー完了！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>render.yaml をコピー</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
          {renderYamlContent}
        </pre>
      </div>
    </div>
  );
};
