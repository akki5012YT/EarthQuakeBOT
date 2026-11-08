/**
 * Render Background Worker 用スタンドアロン起動スクリプト
 * 画面なしでバックグラウンド実行する場合: `npm run worker`
 */
import dotenv from 'dotenv';
import { fetchLatestEarthquakes } from './services/earthquakeService.ts';
import { formatChatworkMessage } from './services/chatworkFormatter.ts';
import { sendChatworkMessage } from './services/chatworkClient.ts';
import { getScaleInfo, isToAllIntensity } from './types/earthquake.ts';

dotenv.config();

const API_TOKEN = process.env.CHATWORK_API_TOKEN || '';
const ROOM_ID = process.env.CHATWORK_ROOM_ID || '';
const MIN_SCALE = process.env.MIN_NOTIFICATION_SCALE ? parseInt(process.env.MIN_NOTIFICATION_SCALE, 10) : 30; // 震度3以上
const POLL_INTERVAL = process.env.POLL_INTERVAL_SECONDS ? parseInt(process.env.POLL_INTERVAL_SECONDS, 10) * 1000 : 15000;

console.log('====================================================');
console.log('🤖 Chatwork 地震速報 Worker 起動 (Render Background Worker)');
console.log(`・Room ID: ${ROOM_ID ? ROOM_ID : '(未設定 - 環境変数 CHATWORK_ROOM_ID を指定してください)'}`);
console.log(`・通知最小震度: ${MIN_SCALE} (${getScaleInfo(MIN_SCALE).label})`);
console.log(`・緊急通知 [toall] 基準: 震度5弱 (45) 以上`);
console.log(`・ポーリング間隔: ${POLL_INTERVAL / 1000}秒`);
console.log('====================================================');

if (!API_TOKEN || !ROOM_ID) {
  console.warn('⚠️ 警告: CHATWORK_API_TOKEN または CHATWORK_ROOM_ID が環境変数に設定されていません。通知はスキップされます。');
}

const processedIds = new Set<string>();
let isFirstRun = true;

async function checkEarthquakes() {
  try {
    const list = await fetchLatestEarthquakes(10);
    if (!list || list.length === 0) return;

    if (isFirstRun) {
      isFirstRun = false;
      for (const eq of list) {
        processedIds.add(eq.id);
      }
      console.log(`[Worker] 初回ベースライン登録完了 (${list.length}件)。最新地震ID: ${list[0].id}`);
      return;
    }

    const candidates = [...list].reverse();

    for (const eq of candidates) {
      if (processedIds.has(eq.id)) continue;
      processedIds.add(eq.id);

      const maxScale = eq.earthquake.maxScale;
      const scaleInfo = getScaleInfo(maxScale);
      const isToAll = isToAllIntensity(maxScale);

      console.log(`[Worker] 新しい地震を感知: ${eq.earthquake.hypocenter.name} ${scaleInfo.label} (toall: ${isToAll})`);

      if (maxScale < MIN_SCALE) {
        console.log(`[Worker] 震度${scaleInfo.label}は設定基準(${getScaleInfo(MIN_SCALE).label})未満のため通知スキップ`);
        continue;
      }

      const formatted = formatChatworkMessage(eq);

      if (API_TOKEN && ROOM_ID) {
        const result = await sendChatworkMessage(API_TOKEN, ROOM_ID, formatted.message);
        if (result.success) {
          console.log(`✅ [Worker] Chatwork通知送信成功! Message ID: ${result.messageId} (toall: ${isToAll})`);
        } else {
          console.error(`❌ [Worker] Chatwork通知送信失敗: ${result.error}`);
        }
      } else {
        console.log(`[Worker] ドライラン通知内容:\n${formatted.message}`);
      }
    }
  } catch (err) {
    console.error('[Worker] ポーリングエラー:', err);
  }
}

// 監視ループ開始
checkEarthquakes();
setInterval(checkEarthquakes, POLL_INTERVAL);
