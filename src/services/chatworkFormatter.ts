/**
 * Chatwork 用メッセージフォーマッター
 * 震度5弱以上で自動的に [toall] メンションを付与するロジックを実装
 */
import { getScaleInfo, isToAllIntensity, translateTsunami, type P2PEarthquakeData } from '../types/earthquake';

export interface FormatOptions {
  customFooter?: string;
  maxPointsPerGroup?: number;
}

export function formatChatworkMessage(
  data: P2PEarthquakeData,
  options?: FormatOptions
): { message: string; isToAll: boolean; title: string; scaleLabel: string } {
  const earthquake = data.earthquake;
  const hypocenter = earthquake.hypocenter;
  const maxScale = earthquake.maxScale;
  const scaleInfo = getScaleInfo(maxScale);
  const isToAll = isToAllIntensity(maxScale);

  // タイトル構築
  const icon = isToAll ? '🚨' : 'ℹ️';
  const headerTag = isToAll ? '【緊急地震速報 / 震度速報】' : '【地震情報】';
  const titleText = `${icon} ${headerTag} 最大${scaleInfo.label} (${hypocenter.name || '震源調査中'})`;

  // 各地の震度情報の集約（震度順に整理）
  const pointsSummary = summarizePoints(data.points, options?.maxPointsPerGroup || 8);

  // 津波情報
  const tsunamiMessage = translateTsunami(earthquake.domesticTsunami);

  // 深さ・マグニチュード表記
  const depthText = hypocenter.depth >= 0 ? `約${hypocenter.depth}km` : 'ごく浅い、または調査中';
  const magnitudeText = hypocenter.magnitude > 0 ? `M${hypocenter.magnitude.toFixed(1)}` : '調査中';
  const timeText = earthquake.time || data.time;

  // メッセージ本文の組み立て
  const lines: string[] = [];

  // 震度5弱以上の場合、最優先で [toall] を付与！
  if (isToAll) {
    lines.push('[toall]');
  }

  lines.push(`[info][title]${titleText}[/title]`);
  lines.push(`■ 発生時刻: ${timeText}`);
  lines.push(`■ 震源地: ${hypocenter.name || '調査中'}`);
  lines.push(`■ 最大震度: ${scaleInfo.label}`);
  lines.push(`■ 規模: マグニチュード ${magnitudeText}`);
  lines.push(`■ 震源の深さ: ${depthText}`);
  lines.push(`■ 津波の影響: ${tsunamiMessage}`);

  // 各地の震度情報
  if (pointsSummary.length > 0) {
    lines.push('[hr]');
    lines.push('【各地の主な震度】');
    for (const group of pointsSummary) {
      lines.push(`・${group.scaleLabel}: ${group.places}`);
    }
  }

  // 震度5弱以上の緊急アナウンスと安否確認指示
  if (isToAll) {
    lines.push('[hr]');
    lines.push('⚠️【安全確保・緊急行動指針】');
    lines.push('1. 落下物に注意し、頭部を保護して身の安全を最優先に確保してください。');
    lines.push('2. 揺れが収まった後、火の元の確認および避難経路（ドア・窓）を確保してください。');
    lines.push('3. 沿岸部や河口付近にお住まいの方は、津波情報に十分警戒してください。');
    lines.push('4. 【安否確認】関係者・メンバーは、落ち着いた後に本チャットへ「無事」または被害状況を返信してください。');
  }

  if (options?.customFooter) {
    lines.push('[hr]');
    lines.push(options.customFooter);
  }

  lines.push('[/info]');

  return {
    message: lines.join('\n'),
    isToAll,
    title: titleText,
    scaleLabel: scaleInfo.label,
  };
}

/**
 * 観測点リストを震度ごとにグルーピングして要約
 */
function summarizePoints(
  points: P2PEarthquakeData['points'],
  maxPerGroup: number = 8
): Array<{ scale: number; scaleLabel: string; places: string }> {
  if (!points || points.length === 0) return [];

  // 震度ごとにマップ
  const map = new Map<number, Set<string>>();

  for (const p of points) {
    if (!map.has(p.scale)) {
      map.set(p.scale, new Set<string>());
    }
    const name = p.addr ? `${p.pref} ${p.addr}` : p.pref;
    map.get(p.scale)!.add(name);
  }

  // 震度高い順にソート (70 -> 10)
  const sortedScales = Array.from(map.keys()).sort((a, b) => b - a);

  const result: Array<{ scale: number; scaleLabel: string; places: string }> = [];

  // 上位3段階程度の震度グループを表示
  for (const scale of sortedScales.slice(0, 4)) {
    const scaleInfo = getScaleInfo(scale);
    const placeList = Array.from(map.get(scale)!);
    const displayedPlaces = placeList.slice(0, maxPerGroup).join('、 ');
    const moreText = placeList.length > maxPerGroup ? ` 他${placeList.length - maxPerGroup}地点` : '';

    result.push({
      scale,
      scaleLabel: scaleInfo.label,
      places: `${displayedPlaces}${moreText}`,
    });
  }

  return result;
}
