import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatChatworkMessage } from './src/services/chatworkFormatter.ts';
import { sendChatworkMessage, verifyChatworkToken, fetchChatworkRooms } from './src/services/chatworkClient.ts';
import { fetchLatestEarthquakes, generateSimulatedEarthquake } from './src/services/earthquakeService.ts';
import {
  getScaleInfo,
  isToAllIntensity,
  type BotSettings,
  type NotificationLog,
  type P2PEarthquakeData,
} from './src/types/earthquake.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json());

// ボット内部状態
const botState = {
  settings: {
    chatworkApiToken: process.env.CHATWORK_API_TOKEN || '',
    chatworkRoomId: process.env.CHATWORK_ROOM_ID || '',
    minScale: process.env.MIN_NOTIFICATION_SCALE ? parseInt(process.env.MIN_NOTIFICATION_SCALE, 10) : 30, // デフォルト: 震度3
    pollIntervalSeconds: process.env.POLL_INTERVAL_SECONDS ? parseInt(process.env.POLL_INTERVAL_SECONDS, 10) : 15,
    enabled: true,
    customMessage: '',
    emergencyToAllScale: 45, // 震度5弱以上で [toall]
  } as BotSettings,
  isRunning: true,
  lastPollTime: null as string | null,
  lastProcessedId: null as string | null,
  processedIds: new Set<string>(),
  totalChecks: 0,
  totalAlertsSent: 0,
  totalToAllAlerts: 0,
  startedAt: new Date().toISOString(),
  logs: [] as NotificationLog[],
  recentEarthquakes: [] as P2PEarthquakeData[],
};

// ログ記録ヘルパー (最大100件保持)
function addLog(log: NotificationLog) {
  botState.logs.unshift(log);
  if (botState.logs.length > 100) {
    botState.logs.pop();
  }
}

// 初回ポーリング時に過去ログで通知が爆発しないよう最新IDを初期化
let isFirstPoll = true;

// 地震ポーリング実行関数
async function pollEarthquakes(isManual = false): Promise<{ count: number; newAlerts: number }> {
  botState.lastPollTime = new Date().toISOString();
  botState.totalChecks++;

  try {
    const list = await fetchLatestEarthquakes(15);
    if (list && list.length > 0) {
      botState.recentEarthquakes = list;
    }

    if (!list || list.length === 0) {
      return { count: 0, newAlerts: 0 };
    }

    // 初回起動時: 過去の地震に対して通知しないよう、直近のIDをセット
    if (isFirstPoll) {
      isFirstPoll = false;
      for (const eq of list) {
        botState.processedIds.add(eq.id);
      }
      botState.lastProcessedId = list[0].id;
      console.log(`[EarthquakeWatcher] Initialized baseline with ${list.length} existing earthquakes. Latest ID: ${list[0].id}`);
      return { count: list.length, newAlerts: 0 };
    }

    let newAlerts = 0;
    // リストは新しい順 (index 0 が最新) なので逆順で古いものから処理
    const candidates = [...list].reverse();

    for (const eq of candidates) {
      if (botState.processedIds.has(eq.id)) {
        continue;
      }

      // 未処理の新しい地震を検知！
      botState.processedIds.add(eq.id);
      botState.lastProcessedId = eq.id;

      const maxScale = eq.earthquake.maxScale;
      const scaleInfo = getScaleInfo(maxScale);
      const isToAll = isToAllIntensity(maxScale);

      // フォーマット済みメッセージ作成
      const formatted = formatChatworkMessage(eq, {
        customFooter: botState.settings.customMessage,
      });

      // 設定震度未満の場合はスキップ
      if (maxScale < botState.settings.minScale) {
        addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          earthquakeId: eq.id,
          timestamp: new Date().toISOString(),
          hypocenterName: eq.earthquake.hypocenter.name || '不明',
          maxScale,
          scaleLabel: scaleInfo.label,
          magnitude: eq.earthquake.hypocenter.magnitude,
          depth: eq.earthquake.hypocenter.depth,
          isToAll,
          status: 'skipped_below_threshold',
          renderedMessage: formatted.message,
          domesticTsunami: eq.earthquake.domesticTsunami,
        });
        continue;
      }

      // 震度基準を満たしている場合、Chatwork へ通知
      console.log(`[EarthquakeWatcher] Detected new earthquake: ${eq.id} ${scaleInfo.label} (toall: ${isToAll})`);

      if (botState.settings.enabled && botState.settings.chatworkApiToken && botState.settings.chatworkRoomId) {
        const sendResult = await sendChatworkMessage(
          botState.settings.chatworkApiToken,
          botState.settings.chatworkRoomId,
          formatted.message
        );

        if (sendResult.success) {
          botState.totalAlertsSent++;
          if (isToAll) botState.totalToAllAlerts++;

          addLog({
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            earthquakeId: eq.id,
            timestamp: new Date().toISOString(),
            hypocenterName: eq.earthquake.hypocenter.name || '不明',
            maxScale,
            scaleLabel: scaleInfo.label,
            magnitude: eq.earthquake.hypocenter.magnitude,
            depth: eq.earthquake.hypocenter.depth,
            isToAll,
            status: 'sent',
            chatworkMessageId: sendResult.messageId,
            renderedMessage: formatted.message,
            domesticTsunami: eq.earthquake.domesticTsunami,
          });
          newAlerts++;
        } else {
          addLog({
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            earthquakeId: eq.id,
            timestamp: new Date().toISOString(),
            hypocenterName: eq.earthquake.hypocenter.name || '不明',
            maxScale,
            scaleLabel: scaleInfo.label,
            magnitude: eq.earthquake.hypocenter.magnitude,
            depth: eq.earthquake.hypocenter.depth,
            isToAll,
            status: 'error',
            errorMessage: sendResult.error,
            renderedMessage: formatted.message,
            domesticTsunami: eq.earthquake.domesticTsunami,
          });
        }
      } else {
        // トークン未設定または一時停止中のためドライラン
        addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          earthquakeId: eq.id,
          timestamp: new Date().toISOString(),
          hypocenterName: eq.earthquake.hypocenter.name || '不明',
          maxScale,
          scaleLabel: scaleInfo.label,
          magnitude: eq.earthquake.hypocenter.magnitude,
          depth: eq.earthquake.hypocenter.depth,
          isToAll,
          status: 'dry_run',
          errorMessage: !botState.settings.chatworkApiToken ? 'Chatworkトークン未設定' : '通知設定がOFF',
          renderedMessage: formatted.message,
          domesticTsunami: eq.earthquake.domesticTsunami,
        });
      }
    }

    return { count: list.length, newAlerts };
  } catch (err: unknown) {
    console.error('[EarthquakeWatcher] Polling error:', err);
    return { count: 0, newAlerts: 0 };
  }
}

// 定期監視タイマー
let pollTimer: NodeJS.Timeout | null = null;

function startPollingLoop() {
  if (pollTimer) clearInterval(pollTimer);
  const intervalMs = Math.max(5, botState.settings.pollIntervalSeconds) * 1000;
  console.log(`[EarthquakeWatcher] Starting polling every ${intervalMs / 1000} seconds...`);
  pollEarthquakes(); // 初回即時実行
  pollTimer = setInterval(() => {
    if (botState.settings.enabled) {
      pollEarthquakes();
    }
  }, intervalMs);
}

// ---------------- API ルート ----------------

// Render keep-alive & health check
app.get('/healthz', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    lastPollTime: botState.lastPollTime,
    enabled: botState.settings.enabled,
    checks: botState.totalChecks,
    alertsSent: botState.totalAlertsSent,
  });
});

// ステータス取得
app.get('/api/status', (_req: Request, res: Response) => {
  const token = botState.settings.chatworkApiToken;
  const maskedToken = token
    ? `${token.slice(0, 4)}...${token.slice(-4)}`
    : '';

  res.json({
    isRunning: botState.isRunning,
    enabled: botState.settings.enabled,
    lastPollTime: botState.lastPollTime,
    lastEarthquakeId: botState.lastProcessedId,
    pollIntervalSeconds: botState.settings.pollIntervalSeconds,
    minScale: botState.settings.minScale,
    emergencyToAllScale: botState.settings.emergencyToAllScale,
    customMessage: botState.settings.customMessage || '',
    hasApiToken: Boolean(token && token.trim()),
    hasRoomId: Boolean(botState.settings.chatworkRoomId && botState.settings.chatworkRoomId.trim()),
    maskedToken,
    roomId: botState.settings.chatworkRoomId,
    totalChecks: botState.totalChecks,
    totalAlertsSent: botState.totalAlertsSent,
    totalToAllAlerts: botState.totalToAllAlerts,
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0 (Render Ready)',
  });
});

// 設定の更新
app.post('/api/settings', (req: Request, res: Response) => {
  const {
    chatworkApiToken,
    chatworkRoomId,
    minScale,
    pollIntervalSeconds,
    enabled,
    customMessage,
  } = req.body;

  if (chatworkApiToken !== undefined && typeof chatworkApiToken === 'string') {
    botState.settings.chatworkApiToken = chatworkApiToken.trim();
  }
  if (chatworkRoomId !== undefined) {
    botState.settings.chatworkRoomId = String(chatworkRoomId).trim();
  }
  if (minScale !== undefined) {
    botState.settings.minScale = parseInt(String(minScale), 10) || 30;
  }
  if (pollIntervalSeconds !== undefined) {
    const newInterval = Math.max(5, Math.min(300, parseInt(String(pollIntervalSeconds), 10) || 15));
    if (newInterval !== botState.settings.pollIntervalSeconds) {
      botState.settings.pollIntervalSeconds = newInterval;
      startPollingLoop(); // タイマー再起動
    }
  }
  if (enabled !== undefined) {
    botState.settings.enabled = Boolean(enabled);
  }
  if (customMessage !== undefined) {
    botState.settings.customMessage = String(customMessage).trim();
  }

  res.json({
    success: true,
    message: '設定を更新しました。',
    settings: {
      hasApiToken: Boolean(botState.settings.chatworkApiToken),
      roomId: botState.settings.chatworkRoomId,
      minScale: botState.settings.minScale,
      pollIntervalSeconds: botState.settings.pollIntervalSeconds,
      enabled: botState.settings.enabled,
      customMessage: botState.settings.customMessage,
    },
  });
});

// 最新の地震データ一覧取得
app.get('/api/earthquakes', async (_req: Request, res: Response) => {
  try {
    if (botState.recentEarthquakes.length > 0) {
      res.json(botState.recentEarthquakes);
      return;
    }
    const data = await fetchLatestEarthquakes(15);
    botState.recentEarthquakes = data;
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: '地震データの取得に失敗しました', details: String(err) });
  }
});

// 手動即時チェック
app.post('/api/poll-now', async (_req: Request, res: Response) => {
  const result = await pollEarthquakes(true);
  res.json({ success: true, count: result.count, newAlerts: result.newAlerts, timestamp: botState.lastPollTime });
});

// Chatwork API トークンの検証 (アカウント情報取得)
app.post('/api/verify-token', async (req: Request, res: Response) => {
  const token = req.body.token || botState.settings.chatworkApiToken;
  if (!token) {
    res.status(400).json({ success: false, error: 'Chatwork APIトークンが指定されていません。' });
    return;
  }
  const result = await verifyChatworkToken(token);
  res.json(result);
});

// 参加ルーム一覧取得
app.get('/api/chatwork/rooms', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || botState.settings.chatworkApiToken;
  if (!token) {
    res.status(400).json({ success: false, rooms: [], error: 'APIトークンが未設定です。' });
    return;
  }
  const result = await fetchChatworkRooms(token);
  res.json(result);
});

// Chatwork テストメッセージ送信
app.post('/api/test-chatwork', async (req: Request, res: Response) => {
  const token = req.body.token || botState.settings.chatworkApiToken;
  const roomId = req.body.roomId || botState.settings.chatworkRoomId;

  if (!token || !roomId) {
    res.status(400).json({ success: false, error: 'Chatwork APIトークンとルームIDの両方が必要です。' });
    return;
  }

  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const testMessage = [
    '[info][title]🔔 【テスト通知】Chatwork 地震速報 BOT 接続テスト[/title]',
    `送信日時: ${now}`,
    'Chatwork 地震速報BOTとのAPI疎通テストに成功しました。',
    '実際の地震発生時、震度設定に応じた速報がこのチャットに自動投稿されます。',
    '※ 震度5弱以上を感知した場合は [toall] メンションが自動付与されます。',
    '[/info]',
  ].join('\n');

  const result = await sendChatworkMessage(token, roomId, testMessage);
  res.json(result);
});

// 地震シミュレーション (震度5弱以上の [toall] 動作検証用)
app.post('/api/simulate', async (req: Request, res: Response) => {
  const {
    maxScale = 45, // デフォルト: 震度5弱
    hypocenterName = '千葉県北東部',
    magnitude = 5.4,
    depth = 40,
    domesticTsunami = 'None',
    sendToChatwork = false,
  } = req.body;

  const simData = generateSimulatedEarthquake({
    maxScale: parseInt(String(maxScale), 10),
    hypocenterName: String(hypocenterName),
    magnitude: parseFloat(String(magnitude)),
    depth: parseInt(String(depth), 10),
    domesticTsunami: String(domesticTsunami),
  });

  const formatted = formatChatworkMessage(simData, {
    customFooter: botState.settings.customMessage,
  });

  let sendResult = null;
  if (sendToChatwork) {
    const token = botState.settings.chatworkApiToken;
    const roomId = botState.settings.chatworkRoomId;
    if (!token || !roomId) {
      res.status(400).json({
        success: false,
        error: 'Chatwork APIトークンまたはルームIDが設定されていません。まずは設定画面で入力してください。',
      });
      return;
    }
    sendResult = await sendChatworkMessage(token, roomId, formatted.message);
  }

  const logEntry: NotificationLog = {
    id: `sim_${Date.now()}`,
    earthquakeId: simData.id,
    timestamp: new Date().toISOString(),
    hypocenterName: simData.earthquake.hypocenter.name,
    maxScale: simData.earthquake.maxScale,
    scaleLabel: formatted.scaleLabel,
    magnitude: simData.earthquake.hypocenter.magnitude,
    depth: simData.earthquake.hypocenter.depth,
    isToAll: formatted.isToAll,
    status: sendToChatwork ? (sendResult?.success ? 'simulated' : 'error') : 'dry_run',
    chatworkMessageId: sendResult?.messageId,
    errorMessage: sendResult?.error,
    renderedMessage: formatted.message,
    domesticTsunami: simData.earthquake.domesticTsunami,
  };

  addLog(logEntry);

  res.json({
    success: true,
    simData,
    formatted,
    isToAll: formatted.isToAll,
    sendResult,
    log: logEntry,
  });
});

// 通知履歴ログ
app.get('/api/logs', (_req: Request, res: Response) => {
  res.json(botState.logs);
});

// ログクリア
app.post('/api/logs/clear', (_req: Request, res: Response) => {
  botState.logs = [];
  res.json({ success: true, message: 'ログをクリアしました。' });
});

// ---------------- Vite / Static Middleware ----------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chatwork 地震速報 BOT サーバー稼働中: http://0.0.0.0:${PORT}`);
    console.log(`📌 Renderヘルスチェック: http://0.0.0.0:${PORT}/healthz`);
    startPollingLoop();
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
