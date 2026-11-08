/**
 * P2P地震情報 API (https://api.p2pquake.net/v2/) クライアント
 * 日本国内のリアルタイム気象庁地震情報 (code: 551) を取得
 */
import type { P2PEarthquakeData } from '../types/earthquake';

const P2P_API_ENDPOINT = 'https://api.p2pquake.net/v2/history?codes=551&limit=20';

export async function fetchLatestEarthquakes(limit = 15): Promise<P2PEarthquakeData[]> {
  const url = `https://api.p2pquake.net/v2/history?codes=551&limit=${Math.min(limit, 30)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Chatwork-Earthquake-Bot/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`P2PQuake API error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as P2PEarthquakeData[];

    // 地震情報 (code 551) かつ有効な earthquake 属性を持つものだけ抽出
    const valid = data.filter((item) => item.code === 551 && item.earthquake && item.earthquake.maxScale > 0);
    return valid;
  } catch (err: unknown) {
    console.error('P2PQuake fetch failed:', err);
    throw err;
  }
}

/**
 * テスト・シミュレーション用のサンプル地震データを生成
 */
export function generateSimulatedEarthquake(params: {
  maxScale: number;
  hypocenterName?: string;
  magnitude?: number;
  depth?: number;
  domesticTsunami?: string;
}): P2PEarthquakeData {
  const now = new Date();
  const timeStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const simId = `sim_${Date.now()}`;

  const scale = params.maxScale;
  let defaultHypo = '千葉県北東部';
  let defaultMag = 4.8;
  let defaultDepth = 40;
  let defaultTsunami = params.domesticTsunami || 'None';

  if (scale >= 60) {
    defaultHypo = '能登半島沖';
    defaultMag = 7.1;
    defaultDepth = 10;
    defaultTsunami = params.domesticTsunami || 'Watch';
  } else if (scale >= 45) {
    // 震度5弱以上
    defaultHypo = '茨城県南部';
    defaultMag = 5.6;
    defaultDepth = 50;
  } else if (scale <= 20) {
    defaultHypo = '福島県沖';
    defaultMag = 3.5;
    defaultDepth = 60;
  }

  const hypocenterName = params.hypocenterName || defaultHypo;
  const magnitude = params.magnitude !== undefined ? params.magnitude : defaultMag;
  const depth = params.depth !== undefined ? params.depth : defaultDepth;

  // 観測点サンプル
  const points = [];
  points.push({ pref: '主要観測地', addr: `${hypocenterName}周辺`, isArea: false, scale });
  if (scale >= 45) {
    points.push({ pref: '隣接地域A', addr: '東部地区', isArea: false, scale: Math.max(10, scale - 10) });
    points.push({ pref: '隣接地域B', addr: '南部地区', isArea: false, scale: Math.max(10, scale - 15) });
  }

  return {
    id: simId,
    time: timeStr,
    code: 551,
    issue: {
      source: '気象庁 (シミュレーション)',
      time: timeStr,
      type: 'ScaleAndDestination',
    },
    earthquake: {
      time: timeStr,
      hypocenter: {
        name: hypocenterName,
        latitude: 35.6,
        longitude: 140.1,
        depth,
        magnitude,
      },
      maxScale: scale,
      domesticTsunami: defaultTsunami,
    },
    points,
  };
}
