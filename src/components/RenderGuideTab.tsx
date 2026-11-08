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
} from 'lucide-react';

export const RenderGuideTab: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderYamlContent = `# render.yaml (リポジトリ直下に配置済み)
services:
  - type: web
    name: chatwork-earthquake-bot
    runtime: node
    plan: free # または starter
    region: singapore
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: CHATWORK_API_TOKEN
        sync: false # RenderダッシュボードのEnvironmentで入力
      - key: CHATWORK_ROOM_ID
        sync: false # 通知先ルームIDを入力
      - key: MIN_NOTIFICATION_SCALE
        value: "30" # 震度3以上 (※ 45: 震度5弱以上で自動[toall])
      - key: POLL_INTERVAL_SECONDS
        value: "15" # 15秒間隔でポーリング監視`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Intro Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              Render.com クラウドデプロイ完全ガイド
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Render にデプロイして 24時間365日 地震を自動監視
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              本プロジェクトには、Render への自動デプロイ設定（<code className="text-indigo-300 font-mono">render.yaml</code>, <code className="text-indigo-300 font-mono">server.ts</code>, <code className="text-indigo-300 font-mono">Dockerfile</code>）がすべて同梱されています。GitHub に push して数クリックで本番稼働させることができます。
            </p>
          </div>

          <a
            href="https://dashboard.render.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer self-start"
          >
            <span>Render ダッシュボードを開く</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Step by Step Deploy Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          デプロイ手順 (最短3分)
        </h3>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="flex-1 space-y-1.5">
              <h4 className="font-bold text-sm text-slate-900">コードを GitHub リポジトリへ Push</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                現在のプロジェクトコード一式を、ご自身の GitHub プライベート（またはパブリック）リポジトリにコミット＆プッシュします。
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">Render で新しい Web Service を作成</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render ダッシュボードで <strong>「New +」</strong> &gt; <strong>「Web Service」</strong> をクリックし、上記 GitHub リポジトリを選択します。以下の設定値を入力してください。
              </p>

              {/* Table of commands */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <div className="p-3">
                    <span className="text-[11px] text-slate-500 font-semibold block">Runtime</span>
                    <span className="font-mono font-bold text-slate-800">Node</span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold block">Build Command</span>
                      <button
                        onClick={() => copyToClipboard('build_cmd', 'npm install && npm run build')}
                        className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {copiedKey === 'build_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <code className="font-mono text-slate-800 text-[11px] block mt-1">npm install && npm run build</code>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold block">Start Command</span>
                      <button
                        onClick={() => copyToClipboard('start_cmd', 'npm run start')}
                        className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {copiedKey === 'start_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <code className="font-mono text-slate-800 text-[11px] block mt-1">npm run start</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">環境変数 (Environment Variables) を追加</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render の <strong>Environment</strong> タブにて、以下の変数を登録します。
              </p>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 text-[11px]">
                  <span>キー名 (Key)</span>
                  <span>設定内容 (Value)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-emerald-400 font-bold">CHATWORK_API_TOKEN</span>
                  <span className="text-slate-300">取得したChatwork APIトークン</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-emerald-400 font-bold">CHATWORK_ROOM_ID</span>
                  <span className="text-slate-300">通知先ルームID (例: 123456789)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-sky-300">MIN_NOTIFICATION_SCALE</span>
                  <span className="text-slate-300">30 (震度3以上) ※45以上で自動[toall]</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sky-300">POLL_INTERVAL_SECONDS</span>
                  <span className="text-slate-300">15 (15秒おきに気象庁APIチェック)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">ヘルスチェック設定 & 常時稼働 (重要)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render の <strong>Advanced</strong> 設定 &gt; <strong>Health Check Path</strong> に <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">/healthz</code> を設定してください。
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <strong>💡 Render 無料プラン (Free Tier) のスリープ対策:</strong>
                <p className="mt-1 text-slate-700 leading-relaxed">
                  Render の無料 Web Service は 15分間アクセスがないと自動スリープします。無料枠で24時間休まず地震を検知したい場合は、<strong>UptimeRobot</strong> などの無料監視サービスに <code className="font-mono bg-white px-1 border border-slate-200 rounded">https://&lt;your-app&gt;.onrender.com/healthz</code> を登録（5分おきにHTTP GET）しておくと、スリープせずに常時監視を維持できます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blueprint yaml section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">render.yaml (Blueprint 仕様)</h3>
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

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          {renderYamlContent}
        </pre>
      </div>

      {/* Background Worker alternative */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-sm text-slate-900">代替方式: Render Background Worker (画面なし軽量起動)</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          ダッシュボード画面が不要で、純粋なデーモンプロセスとして Render の Background Worker で動かしたい場合は、Start Command に <code className="bg-slate-100 font-mono text-indigo-700 px-1 py-0.5 rounded">npm run worker</code> を指定するだけで、超軽量に稼働します（<code className="font-mono text-slate-700">src/worker.ts</code> を実行）。
        </p>
      </div>
    </div>
  );
};
