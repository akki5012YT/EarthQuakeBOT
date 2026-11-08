import React, { useState } from 'react';
import {
  Play,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';
import { ChatworkMessagePreview } from './ChatworkMessagePreview';
import { formatChatworkMessage } from '../services/chatworkFormatter';
import { generateSimulatedEarthquake } from '../services/earthquakeService';
import { getScaleInfo, isToAllIntensity } from '../types/earthquake';

interface SimulatorTabProps {
  hasApiToken: boolean;
  hasRoomId: boolean;
  customFooter?: string;
  onRefreshLogs?: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  hasApiToken,
  hasRoomId,
  customFooter,
  onRefreshLogs,
}) => {
  // Preset or custom state
  const [selectedScale, setSelectedScale] = useState<number>(45); // default 震度5弱
  const [hypocenter, setHypocenter] = useState<string>('能登半島沖');
  const [magnitude, setMagnitude] = useState<number>(5.6);
  const [depth, setDepth] = useState<number>(10);
  const [tsunami, setTsunami] = useState<string>('None');

  const [sendToChatwork, setSendToChatwork] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; messageId?: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate simulated earthquake object
  const simulatedData = generateSimulatedEarthquake({
    maxScale: selectedScale,
    hypocenterName: hypocenter,
    magnitude,
    depth,
    domesticTsunami: tsunami,
  });

  // Format message live
  const formatted = formatChatworkMessage(simulatedData, {
    customFooter,
  });

  const scaleInfo = getScaleInfo(selectedScale);
  const isToAll = isToAllIntensity(selectedScale);

  // Quick preset selector
  const applyPreset = (preset: {
    scale: number;
    hypo: string;
    mag: number;
    depth: number;
    tsunami: string;
  }) => {
    setSelectedScale(preset.scale);
    setHypocenter(preset.hypo);
    setMagnitude(preset.mag);
    setDepth(preset.depth);
    setTsunami(preset.tsunami);
    setFeedback(null);
  };

  const handleExecuteSimulation = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxScale: selectedScale,
          hypocenterName: hypocenter,
          magnitude,
          depth,
          domesticTsunami: tsunami,
          sendToChatwork,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'シミュレーション送信に失敗しました');
      }

      if (sendToChatwork) {
        if (data.sendResult?.success) {
          setFeedback({
            type: 'success',
            message: `Chatworkへのテスト送信に成功しました！${isToAll ? ' (震度5弱以上のため [toall] が付与されました)' : ''}`,
            messageId: data.sendResult.messageId,
          });
        } else {
          setFeedback({
            type: 'error',
            message: `Chatwork送信失敗: ${data.sendResult?.error || 'エラーが発生しました'}`,
          });
        }
      } else {
        setFeedback({
          type: 'success',
          message: `シミュレーション生成完了！ ${isToAll ? '🚨 震度5弱以上を検知したため [toall] が先頭に付与されています。' : 'ℹ️ 震度4以下のため [toall] は付与されません。'}`,
        });
      }

      if (onRefreshLogs) onRefreshLogs();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(formatted.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Alert Rule Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isToAll
          ? 'bg-gradient-to-r from-red-950/80 via-red-900/60 to-rose-950/70 border-red-500/80 text-white shadow-lg'
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isToAll ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">
                {isToAll ? '🚨 震度5弱以上検知中: [toall] 自動メンションが発動します' : 'ℹ️ 震度4以下: 通常通知（[toall] なし）'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isToAll ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                現在選択: {scaleInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isToAll
                ? '「震度5弱以上で[toall]もつける」要件に基づき、メッセージ最上部に [toall] を挿入し、安全確保および安否確認のアナウンスを追加します。'
                : '震度4以下の地震は平常時の情報共有のため、全員メンション [toall] は付与されず静かに通知されます。'}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-stretch md:self-auto flex items-center justify-center bg-black/30 px-3 py-2 rounded-lg border border-white/10 text-xs font-mono">
          [toall] 状態: <span className={`ml-1 font-bold ${isToAll ? 'text-red-400' : 'text-slate-400'}`}>{isToAll ? 'ON (付与)' : 'OFF (非付与)'}</span>
        </div>
      </div>

      {/* Preset Quick Selection Buttons */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          クイックテストプリセット（震度をクリックして即時切り替え）
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <button
            onClick={() => applyPreset({ scale: 30, hypo: '茨城県南部', mag: 3.8, depth: 50, tsunami: 'None' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedScale === 30 ? 'border-yellow-400 bg-yellow-50/80 ring-2 ring-yellow-400/40' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-700">震度3</span>
              <span className="text-[10px] text-slate-400">toall なし</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 truncate">茨城県南部 (M3.8)</div>
          </button>

          <button
            onClick={() => applyPreset({ scale: 40, hypo: '千葉県北東部', mag: 4.7, depth: 35, tsunami: 'None' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedScale === 40 ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/40' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">震度4</span>
              <span className="text-[10px] text-slate-400">toall なし</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 truncate">千葉県北東部 (M4.7)</div>
          </button>

          <button
            onClick={() => applyPreset({ scale: 45, hypo: '能登半島沖', mag: 5.4, depth: 10, tsunami: 'None' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
              selectedScale === 45 ? 'border-red-500 bg-red-50 ring-2 ring-red-500/40 shadow-sm' : 'border-red-200 bg-red-50/30 hover:bg-red-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                震度5弱
              </span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-1 rounded">[toall]</span>
            </div>
            <div className="text-xs text-slate-700 font-medium mt-1 truncate">能登半島沖 (M5.4)</div>
          </button>

          <button
            onClick={() => applyPreset({ scale: 50, hypo: '岩手県沿岸北部', mag: 6.0, depth: 60, tsunami: 'None' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedScale === 50 ? 'border-red-600 bg-red-100 ring-2 ring-red-600/40 shadow-sm' : 'border-red-200 bg-red-50/30 hover:bg-red-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800">震度5強</span>
              <span className="text-[10px] bg-red-600 text-white font-bold px-1 rounded">[toall]</span>
            </div>
            <div className="text-xs text-slate-700 font-medium mt-1 truncate">岩手県沖 (M6.0)</div>
          </button>

          <button
            onClick={() => applyPreset({ scale: 60, hypo: '南海トラフ沖', mag: 7.3, depth: 25, tsunami: 'Watch' })}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedScale === 60 ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/40 shadow-sm' : 'border-purple-200 bg-purple-50/30 hover:bg-purple-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">震度6強</span>
              <span className="text-[10px] bg-purple-700 text-white font-bold px-1 rounded">[toall]</span>
            </div>
            <div className="text-xs text-slate-700 font-medium mt-1 truncate">津波注意報付き (M7.3)</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600" />
            シミュレーション パラメータ調整
          </h3>

          {/* Scale Slider / Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">最大震度</label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${scaleInfo.bgColor} ${scaleInfo.color}`}>
                {scaleInfo.label} {isToAll ? '🔥 [toall]発動' : ''}
              </span>
            </div>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(parseInt(e.target.value, 10))}
              className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value={10}>震度1 (scale: 10) - [toall] なし</option>
              <option value={20}>震度2 (scale: 20) - [toall] なし</option>
              <option value={30}>震度3 (scale: 30) - [toall] なし</option>
              <option value={40}>震度4 (scale: 40) - [toall] なし</option>
              <option value={45}>🚨 震度5弱 (scale: 45) - 【[toall] 自動付与】</option>
              <option value={50}>🚨 震度5強 (scale: 50) - 【[toall] 自動付与】</option>
              <option value={55}>🚨 震度6弱 (scale: 55) - 【[toall] 自動付与】</option>
              <option value={60}>🚨 震度6強 (scale: 60) - 【[toall] 自動付与】</option>
              <option value={70}>🚨 震度7 (scale: 70) - 【[toall] 自動付与】</option>
            </select>
          </div>

          {/* Hypocenter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">震源地名</label>
            <input
              type="text"
              value={hypocenter}
              onChange={(e) => setHypocenter(e.target.value)}
              placeholder="例: 能登半島沖, 千葉県北東部"
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Magnitude & Depth */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">規模 (M)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="9.5"
                value={magnitude}
                onChange={(e) => setMagnitude(parseFloat(e.target.value) || 1.0)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">震源の深さ (km)</label>
              <input
                type="number"
                min="0"
                max="700"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tsunami */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">津波の心配</label>
            <select
              value={tsunami}
              onChange={(e) => setTsunami(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="None">なし (この地震による津波の心配はありません)</option>
              <option value="NonEffective">若干の海面変動 (被害の心配なし)</option>
              <option value="Watch">津波注意報発表中</option>
              <option value="Warning">大津波警報・津波警報発表中</option>
              <option value="Checking">調査中</option>
            </select>
          </div>

          {/* Chatwork real send toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToChatwork}
                onChange={(e) => setSendToChatwork(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Chatwork の実ルームへ実際に送信する</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  チェックを入れると設定中の Chatwork ルームに本番メッセージが投稿されます。
                  {!hasApiToken && <span className="text-rose-600 block font-semibold">※ 先に「BOT設定」タブでAPIトークンを保存してください</span>}
                </p>
              </div>
            </label>
          </div>

          {/* Run button */}
          <button
            onClick={handleExecuteSimulation}
            disabled={isSubmitting || (sendToChatwork && (!hasApiToken || !hasRoomId))}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
              isToAll
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white ring-2 ring-red-400/40'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : sendToChatwork ? (
              <Send className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? '送信中...'
                : sendToChatwork
                ? `Chatworkへテスト送信実行 (${isToAll ? '[toall] 付き' : '[toall] なし'})`
                : `シミュレーション生成 (${isToAll ? '[toall] 自動付与' : '[toall] なし'})`}
            </span>
          </button>

          {/* Feedback display */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{feedback.message}</p>
                {feedback.messageId && (
                  <p className="font-mono text-[10px] text-slate-500 mt-1">Message ID: {feedback.messageId}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Preview: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Chatwork 生成メッセージ（実機レンダリング）</span>
              {isToAll ? (
                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  [toall] 自動挿入済み
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  メンションなし
                </span>
              )}
            </h3>

            <button
              onClick={handleCopyRaw}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'コピーしました！' : '本文テキストをコピー'}</span>
            </button>
          </div>

          {/* Interactive Chatwork Bubble Preview */}
          <ChatworkMessagePreview
            rawText={formatted.message}
            isToAll={isToAll}
            scaleLabel={scaleInfo.label}
          />

          {/* Raw Text Output Accordion / Inspector */}
          <details className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <summary className="font-semibold text-slate-700 cursor-pointer select-none">
              Chatwork API 送信パラメータ (body) の生のテキストを確認
            </summary>
            <pre className="mt-2.5 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {formatted.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};
