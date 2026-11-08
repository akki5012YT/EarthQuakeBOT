import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Flame,
  Radio,
  Sliders,
  FileText,
  Cloud,
  RefreshCw,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
} from 'lucide-react';
import { EarthquakeCard } from './components/EarthquakeCard';
import { SimulatorTab } from './components/SimulatorTab';
import { SettingsTab } from './components/SettingsTab';
import { LogsTab } from './components/LogsTab';
import { RenderGuideTab } from './components/RenderGuideTab';
import { ChatworkMessagePreview } from './components/ChatworkMessagePreview';
import { formatChatworkMessage } from './services/chatworkFormatter';
import type {
  P2PEarthquakeData,
  BotStatusResponse,
  BotSettings,
  NotificationLog,
} from './types/earthquake';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'simulator' | 'settings' | 'logs' | 'render'>('live');

  // Status & Data
  const [status, setStatus] = useState<BotStatusResponse | null>(null);
  const [earthquakes, setEarthquakes] = useState<P2PEarthquakeData[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(15);

  // Filter for live feed
  const [intensityFilter, setIntensityFilter] = useState<'all' | 'min' | 'toall'>('all');

  // Preview modal for a selected earthquake
  const [previewEarthquake, setPreviewEarthquake] = useState<P2PEarthquakeData | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.pollIntervalSeconds) {
          setCountdown((prev) => (prev > data.pollIntervalSeconds ? data.pollIntervalSeconds : prev));
        }
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  }, []);

  // Fetch earthquakes
  const fetchEarthquakes = useCallback(async () => {
    try {
      const res = await fetch('/api/earthquakes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEarthquakes(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch earthquakes', err);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStatus(), fetchEarthquakes(), fetchLogs()]);
    setIsRefreshing(false);
    setIsLoading(false);
  }, [fetchStatus, fetchEarthquakes, fetchLogs]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Countdown timer & periodic sync
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchEarthquakes();
          fetchStatus();
          fetchLogs();
          return status?.pollIntervalSeconds || 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status?.pollIntervalSeconds, fetchEarthquakes, fetchStatus, fetchLogs]);

  // Manual immediate poll trigger
  const handlePollNow = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/poll-now', { method: 'POST' });
      await refreshAll();
      setCountdown(status?.pollIntervalSeconds || 15);
    } catch (err) {
      console.error('Manual poll failed', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (confirm('すべての通知履歴をクリアしますか？')) {
      await fetch('/api/logs/clear', { method: 'POST' });
      fetchLogs();
    }
  };

  // Current settings adapter
  const currentSettings: BotSettings = {
    chatworkApiToken: status?.maskedToken ? '********' : '',
    chatworkRoomId: status?.roomId || '',
    minScale: status?.minScale || 30,
    pollIntervalSeconds: status?.pollIntervalSeconds || 15,
    enabled: status?.enabled ?? true,
    customMessage: '',
    emergencyToAllScale: 45,
  };

  // Filter earthquakes
  const minScaleThreshold = status?.minScale || 30;
  const filteredEarthquakes = earthquakes.filter((eq) => {
    const scale = eq.earthquake.maxScale;
    if (intensityFilter === 'toall') return scale >= 45; // 震度5弱以上
    if (intensityFilter === 'min') return scale >= minScaleThreshold;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-950/40 text-white font-black text-lg">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base md:text-lg tracking-tight">
                    Chatwork 地震速報通知 BOT
                  </h1>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    Render Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  気象庁・P2P地震情報 リアルタイム監視 / 震度5弱以上 [toall] 自動メンション
                </p>
              </div>
            </div>

            {/* Live Status Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Polling countdown badge */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300">監視中:</span>
                <span className="font-mono font-bold text-emerald-400">{countdown}s</span>
              </div>

              {/* Chatwork Status */}
              <div
                onClick={() => setActiveTab('settings')}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                  status?.hasApiToken && status?.hasRoomId
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                }`}
                title="クリックで設定を開く"
              >
                {status?.hasApiToken && status?.hasRoomId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Chatwork 連携中</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chatwork 未設定</span>
                  </>
                )}
              </div>

              {/* Manual refresh button */}
              <button
                onClick={handlePollNow}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="気象庁APIを今すぐチェック"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden sm:inline">今すぐ確認</span>
              </button>

              {/* Render Deploy Quick Link */}
              <button
                onClick={() => setActiveTab('render')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Render デプロイ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'live' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>リアルタイム地震速報</span>
              {earthquakes.length > 0 && (
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full">
                  {earthquakes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>シミュレーター &amp; [toall] 検証</span>
              <span className="text-[10px] bg-red-900/80 text-red-200 border border-red-500 px-1.5 py-0.2 rounded font-bold">
                5弱〜
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>BOT設定 (Chatwork &amp; 閾値)</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>通知履歴ログ</span>
              {logs.length > 0 && (
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full">
                  {logs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('render')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'render' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Render デプロイ手順書</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Core Requirement Highlight Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 rounded-2xl p-4 md:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm md:text-base tracking-wide">
                  【実装済み】震度5弱以上で Chatwork の [toall] メンションを自動付与
                </span>
                <span className="bg-white text-red-700 text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  要求仕様
                </span>
              </div>
              <p className="text-xs text-red-100 leading-relaxed">
                P2P地震情報（気象庁）の最大震度が「震度5弱」「震度5強」「震度6弱」「震度6強」「震度7」の重大地震を感知した場合、Chatwork投稿の先頭に必ず
                <code className="bg-black/40 text-yellow-300 font-mono px-1.5 py-0.5 rounded mx-1 font-bold">[toall]</code>
                を自動挿入し、全メンバーへ一斉緊急通知を発信します。
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('simulator')}
            className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow-md transition shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-red-600" />
            <span>[toall] の動作をシミュレーターで試す</span>
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">気象庁API 監視状態</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-sm text-slate-900">
                {status?.enabled ? 'リアルタイム稼働中' : '一時停止中'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">チェック実行回数</span>
            <span className="font-mono font-bold text-sm text-slate-900 block mt-1">
              {status?.totalChecks ?? 0} 回
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Chatwork 通知送信数</span>
            <span className="font-mono font-bold text-sm text-slate-900 block mt-1">
              {status?.totalAlertsSent ?? 0} 件
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              [toall] 緊急メンション発動
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="w-4 h-4 text-red-600" />
              <span className="font-mono font-bold text-sm text-red-600">
                {status?.totalToAllAlerts ?? 0} 件
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Monitor */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Filter and Headline */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  日本国内の直近地震情報 (P2P地震情報 API / 気象庁速報)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  自動ポーリングにより新しい地震を自動検知してChatworkへ通知します。
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
                <button
                  onClick={() => setIntensityFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    intensityFilter === 'all'
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  すべて ({earthquakes.length})
                </button>
                <button
                  onClick={() => setIntensityFilter('min')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    intensityFilter === 'min'
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  通知対象のみ
                </button>
                <button
                  onClick={() => setIntensityFilter('toall')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    intensityFilter === 'toall'
                      ? 'bg-red-600 font-bold text-white shadow-xs'
                      : 'text-red-700 hover:text-red-900 font-semibold'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>震度5弱以上 ([toall])</span>
                </button>
              </div>
            </div>

            {/* List of Earthquakes */}
            {filteredEarthquakes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
                <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm">該当する地震情報はありません</p>
                <p className="text-xs text-slate-400 mt-1">フィルター条件を変更するか、しばらくお待ちください。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredEarthquakes.map((eq) => (
                  <EarthquakeCard
                    key={eq.id}
                    data={eq}
                    minScaleThreshold={minScaleThreshold}
                    onSelectForPreview={(item) => setPreviewEarthquake(item)}
                    onSimulateSend={async (item) => {
                      if (!status?.hasApiToken || !status?.hasRoomId) {
                        alert('ChatworkのAPIトークンとルームIDを「BOT設定」タブで設定してください。');
                        setActiveTab('settings');
                        return;
                      }
                      if (confirm(`この地震(${item.earthquake.hypocenter.name} ${item.earthquake.maxScale})の通知文をChatworkへ送信しますか？`)) {
                        const formatted = formatChatworkMessage(item);
                        const res = await fetch('/api/test-chatwork', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            body: formatted.message,
                          }),
                        });
                        const resJson = await res.json();
                        if (resJson.success) {
                          alert('Chatworkへ送信成功しました！');
                          fetchLogs();
                        } else {
                          alert(`送信失敗: ${resJson.error}`);
                        }
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Simulator & toall Verification */}
        {activeTab === 'simulator' && (
          <SimulatorTab
            hasApiToken={status?.hasApiToken ?? false}
            hasRoomId={status?.hasRoomId ?? false}
            customFooter={status?.customMessage}
            onRefreshLogs={fetchLogs}
          />
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <SettingsTab
            initialSettings={currentSettings}
            onSaveSuccess={() => {
              fetchStatus();
            }}
          />
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <LogsTab
            logs={logs}
            onClearLogs={handleClearLogs}
            onRefreshLogs={fetchLogs}
          />
        )}

        {/* Tab 5: Render Deployment Guide */}
        {activeTab === 'render' && <RenderGuideTab />}
      </main>

      {/* Preview Modal for Live Earthquakes */}
      {previewEarthquake && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {previewEarthquake.earthquake.hypocenter.name} 地震のChatworkメッセージプレビュー
                </span>
              </div>
              <button
                onClick={() => setPreviewEarthquake(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 py-0.5 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {(() => {
                const formatted = formatChatworkMessage(previewEarthquake);
                return (
                  <ChatworkMessagePreview
                    rawText={formatted.message}
                    isToAll={formatted.isToAll}
                    scaleLabel={formatted.scaleLabel}
                  />
                );
              })()}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewEarthquake(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Chatwork 地震速報通知 BOT (Render 対応) / 気象庁地震情報 (P2P地震情報 API v2 連携)
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            仕様: 震度5弱以上 = <strong className="text-red-600">[toall]</strong> 自動メンション付与
          </span>
        </div>
      </footer>
    </div>
  );
}
