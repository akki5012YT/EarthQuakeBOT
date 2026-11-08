import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Hash,
  Sliders,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  ShieldAlert,
  Save,
  MessageSquare,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { type BotSettings, type ChatworkRoom, getScaleInfo } from '../types/earthquake';

interface SettingsTabProps {
  initialSettings: BotSettings;
  onSaveSuccess: (updated: BotSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  initialSettings,
  onSaveSuccess,
}) => {
  const [apiToken, setApiToken] = useState(initialSettings.chatworkApiToken || '');
  const [roomId, setRoomId] = useState(initialSettings.chatworkRoomId || '');
  const [minScale, setMinScale] = useState(initialSettings.minScale || 30);
  const [pollInterval, setPollInterval] = useState(initialSettings.pollIntervalSeconds || 15);
  const [enabled, setEnabled] = useState(initialSettings.enabled ?? true);
  const [customMessage, setCustomMessage] = useState(initialSettings.customMessage || '');

  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<{
    name: string;
    chatworkId: string;
    organizationName: string;
    avatarUrl: string;
  } | null>(null);

  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomList, setRoomList] = useState<ChatworkRoom[]>([]);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setApiToken(initialSettings.chatworkApiToken || '');
    setRoomId(initialSettings.chatworkRoomId || '');
    setMinScale(initialSettings.minScale || 30);
    setPollInterval(initialSettings.pollIntervalSeconds || 15);
    setEnabled(initialSettings.enabled ?? true);
    setCustomMessage(initialSettings.customMessage || '');
  }, [initialSettings]);

  // トークンの検証 (アカウント情報の取得)
  const handleVerifyToken = async () => {
    if (!apiToken.trim()) {
      setFeedback({ type: 'error', message: 'APIトークンを入力してください' });
      return;
    }
    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiToken }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setVerifiedUser(data.user);
        setFeedback({
          type: 'success',
          message: `認証成功！「${data.user.name}」(${data.user.organizationName || '個人'}) アカウントとして認証されました。`,
        });
        // 自動でルーム一覧も取得
        fetchRooms(apiToken);
      } else {
        setVerifiedUser(null);
        setFeedback({
          type: 'error',
          message: data.error || 'Chatwork APIトークンの認証に失敗しました。',
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: `通信エラー: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ルーム一覧の取得
  const fetchRooms = async (tokenToUse = apiToken) => {
    if (!tokenToUse.trim()) return;
    setIsLoadingRooms(true);
    try {
      const res = await fetch(`/api/chatwork/rooms?token=${encodeURIComponent(tokenToUse)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.rooms)) {
        setRoomList(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // テストメッセージの送信
  const handleTestSend = async () => {
    if (!apiToken.trim() || !roomId.trim()) {
      setFeedback({ type: 'error', message: 'APIトークンとルームIDの両方を設定してください。' });
      return;
    }
    setIsTestingSend(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/test-chatwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiToken, roomId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Chatworkへの疎通テスト成功！(Message ID: ${data.messageId || 'OK'}) チャットを確認してください。`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: `テスト送信失敗: ${data.error || 'エラーが発生しました'}`,
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: `通信エラー: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsTestingSend(false);
    }
  };

  // 設定の保存
  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: BotSettings = {
        chatworkApiToken: apiToken.trim(),
        chatworkRoomId: roomId.trim(),
        minScale,
        pollIntervalSeconds: pollInterval,
        enabled,
        customMessage: customMessage.trim(),
        emergencyToAllScale: 45,
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: '設定を正常に保存し、監視プロセスに反映しました！' });
        onSaveSuccess(payload);
      } else {
        throw new Error(data.error || '保存に失敗しました');
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Alert Rule Banner */}
      <div className="p-4 rounded-xl border border-red-300 bg-red-50/70 text-red-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-red-900 block text-sm">
            【要件対応】震度5弱以上で [toall] 自動メンション
          </span>
          気象庁データで最大震度5弱 (45)
          以上を感知した場合は、メッセージ先頭に必ず「[toall]」が付与され、ルーム参加者全員へ緊急メンションが飛びます。震度4以下はメンションなしの平常通知となります。
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
        {/* Bot Master Switch */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Power className={`w-4 h-4 ${enabled ? 'text-emerald-500' : 'text-slate-400'}`} />
              地震速報 自動監視・通知の有効化
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              OFFにすると気象庁APIのポーリングおよびChatwork通知を一時停止します
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Chatwork API Token */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Chatwork API トークン (CHATWORK_API_TOKEN)
            </label>
            <a
              href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
            >
              <span>API設定画面を開く</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="例: c9b2f48..."
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 pr-9 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleVerifyToken}
              disabled={isVerifying || !apiToken.trim()}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>認証テスト</span>
            </button>
          </div>

          {verifiedUser && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
              {verifiedUser.avatarUrl ? (
                <img src={verifiedUser.avatarUrl} alt={verifiedUser.name} className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  CW
                </div>
              )}
              <div className="text-xs">
                <span className="font-bold text-emerald-950">{verifiedUser.name}</span>
                <span className="text-slate-500 ml-2">ID: {verifiedUser.chatworkId || verifiedUser.name}</span>
                {verifiedUser.organizationName && (
                  <span className="text-slate-400 ml-2 font-medium">({verifiedUser.organizationName})</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chatwork Room ID */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              通知先 ルームID (CHATWORK_ROOM_ID)
            </label>
            <button
              onClick={() => fetchRooms()}
              disabled={isLoadingRooms || !apiToken.trim()}
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              <span>参加中ルーム一覧を読み込む</span>
            </button>
          </div>

          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="例: 123456789 (ChatworkのURL '!rid123456789' の数字部分)"
            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />

          {/* Room quick select cards if available */}
          {roomList.length > 0 && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                参加ルームから選択 (クリックでルームIDを入力):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {roomList.map((room) => (
                  <button
                    key={room.room_id}
                    onClick={() => setRoomId(String(room.room_id))}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition cursor-pointer ${
                      roomId === String(room.room_id)
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="truncate flex-1 mr-2">{room.name}</span>
                    <span className="font-mono text-[10px] opacity-80 shrink-0">ID: {room.room_id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Minimum Scale Threshold */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              通知対象の最小震度
            </label>
            <select
              value={minScale}
              onChange={(e) => setMinScale(parseInt(e.target.value, 10))}
              className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value={10}>震度1以上 (微小地震もすべて通知)</option>
              <option value={20}>震度2以上 (体感地震以上)</option>
              <option value={30}>震度3以上 (一般的なオフィス・企業推奨)</option>
              <option value={40}>震度4以上 (やや強い揺れ以上のみ通知)</option>
              <option value={45}>震度5弱以上のみ (重大災害時のみ通知)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              ※ 現在の設定: <strong className="text-slate-800">{getScaleInfo(minScale).label}</strong>{' '}
              以上の地震でChatworkへ自動投稿します。
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                気象庁API 監視ポーリング間隔
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600">{pollInterval}秒おき</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={pollInterval}
              onChange={(e) => setPollInterval(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>高速 (5秒)</span>
              <span>推奨 (15秒)</span>
              <span>低負荷 (60秒)</span>
            </div>
          </div>
        </div>

        {/* Custom Footer Message */}
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            メッセージ末尾のカスタム連絡先・社内規定（任意）
          </label>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="例: ※ 防災対策本部 (内線: 1234) / 避難集合場所: 本社前庭公園"
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Feedback message */}
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
            <p className="font-semibold">{feedback.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleTestSend}
            disabled={isTestingSend || !apiToken.trim() || !roomId.trim()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isTestingSend ? '送信中...' : 'Chatwork疎通テスト送信'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '保存中...' : '設定を保存して反映'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
