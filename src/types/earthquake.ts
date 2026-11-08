/**
 * 地震情報・Chatwork BOT 型定義
 */

export interface Hypocenter {
  name: string;
  latitude: number;
  longitude: number;
  depth: number; // km (-1 if unknown)
  magnitude: number; // -1 if unknown
}

export interface EarthquakePoint {
  pref: string;
  addr: string;
  isArea: boolean;
  scale: number; // 10, 20, 30, 40, 45, 50, 55, 60, 70
}

export interface P2PEarthquakeData {
  id: string;
  time: string;
  code: number;
  issue: {
    source: string;
    time: string;
    type: string;
    correct?: string;
  };
  earthquake: {
    time: string;
    hypocenter: Hypocenter;
    maxScale: number; // 10: 震度1, 20: 震度2, 30: 震度3, 40: 震度4, 45: 震度5弱, 50: 震度5強, 55: 震度6弱, 60: 震度6強, 70: 震度7
    domesticTsunami: string; // None, Unknown, Checking, NonEffective, Watch, Warning
    foreignTsunami?: string;
  };
  points?: EarthquakePoint[];
}

export interface BotSettings {
  chatworkApiToken: string;
  chatworkRoomId: string;
  minScale: number; // default: 30 (震度3以上)
  pollIntervalSeconds: number; // default: 15
  enabled: boolean;
  customMessage?: string;
  emergencyToAllScale: number; // default: 45 (震度5弱以上)
}

export interface NotificationLog {
  id: string;
  earthquakeId: string;
  timestamp: string;
  hypocenterName: string;
  maxScale: number;
  scaleLabel: string;
  magnitude: number;
  depth: number;
  isToAll: boolean;
  status: 'sent' | 'skipped_below_threshold' | 'error' | 'simulated' | 'dry_run';
  chatworkMessageId?: string;
  errorMessage?: string;
  renderedMessage: string;
  domesticTsunami?: string;
}

export interface ChatworkRoom {
  room_id: number;
  name: string;
  type: string;
  role: string;
  sticky: boolean;
  unread_num: number;
  mention_num: number;
  icon_path?: string;
}

export interface ChatworkUser {
  account_id: number;
  room_id: number;
  name: string;
  chatwork_id: string;
  organization_id: number;
  organization_name: string;
  department: string;
  title: string;
  url: string;
  introduction: string;
  mail: string;
  avatar_image_url: string;
}

export interface BotStatusResponse {
  isRunning: boolean;
  enabled: boolean;
  lastPollTime: string | null;
  lastEarthquakeId: string | null;
  pollIntervalSeconds: number;
  minScale: number;
  emergencyToAllScale?: number;
  customMessage?: string;
  hasApiToken: boolean;
  hasRoomId: boolean;
  maskedToken: string;
  roomId: string;
  totalChecks: number;
  totalAlertsSent: number;
  totalToAllAlerts: number;
  uptimeSeconds: number;
  version: string;
}

// 震度スケール変換マップ
export const SCALE_MAP: Record<number, { label: string; short: string; color: string; bgColor: string; borderColor: string; isHigh: boolean }> = {
  10: { label: '震度1', short: '1', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', isHigh: false },
  20: { label: '震度2', short: '2', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', isHigh: false },
  30: { label: '震度3', short: '3', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', isHigh: false },
  40: { label: '震度4', short: '4', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-400', isHigh: false },
  45: { label: '震度5弱', short: '5弱', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-500', isHigh: true },
  50: { label: '震度5強', short: '5強', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-500', isHigh: true },
  55: { label: '震度6弱', short: '6弱', color: 'text-rose-800', bgColor: 'bg-rose-100', borderColor: 'border-rose-600', isHigh: true },
  60: { label: '震度6強', short: '6強', color: 'text-purple-800', bgColor: 'bg-purple-100', borderColor: 'border-purple-600', isHigh: true },
  70: { label: '震度7', short: '7', color: 'text-violet-950', bgColor: 'bg-purple-200', borderColor: 'border-purple-800', isHigh: true },
};

export function getScaleInfo(scale: number) {
  return SCALE_MAP[scale] || {
    label: scale >= 45 ? `震度(${scale})` : `震度不明(${scale})`,
    short: `${scale}`,
    color: scale >= 45 ? 'text-red-700' : 'text-slate-600',
    bgColor: scale >= 45 ? 'bg-red-50' : 'bg-slate-50',
    borderColor: scale >= 45 ? 'border-red-300' : 'border-slate-200',
    isHigh: scale >= 45,
  };
}

export function isToAllIntensity(scale: number): boolean {
  // 震度5弱 (45) 以上で [toall]
  return scale >= 45;
}

export function translateTsunami(domesticTsunami: string): string {
  switch (domesticTsunami) {
    case 'None':
      return 'この地震による津波の心配はありません。';
    case 'NonEffective':
      return '若干の海面変動が予想されますが、被害の心配はありません。';
    case 'Watch':
      return '【津波注意報発表中】海岸や河口付近から直ちに離れてください！';
    case 'Warning':
      return '🚨【大津波警報・津波警報発表中】沿岸部の方は直ちに高台や避難ビルへ避難してください！';
    case 'Checking':
      return '津波の有無については現在気象庁で調査中です。';
    default:
      return '津波情報は気象庁の発表を確認してください。';
  }
}
