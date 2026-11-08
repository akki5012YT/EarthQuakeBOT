import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { ChatworkMessagePreview } from './ChatworkMessagePreview';
import type { NotificationLog } from '../types/earthquake';

interface LogsTabProps {
  logs: NotificationLog[];
  onClearLogs: () => void;
  onRefreshLogs: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onClearLogs, onRefreshLogs }) => {
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'sent' && log.status !== 'sent') return false;
    if (filter === 'toall' && !log.isToAll) return false;
    if (filter === 'error' && log.status !== 'error') return false;
    if (filter === 'sim' && log.status !== 'simulated' && log.status !== 'dry_run') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.hypocenterName.toLowerCase().includes(q) ||
        log.scaleLabel.toLowerCase().includes(q) ||
        (log.chatworkMessageId && log.chatworkMessageId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            すべて ({logs.length})
          </button>
          <button
            onClick={() => setFilter('toall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
              filter === 'toall' ? 'bg-red-600 text-white' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>[toall] 付与 ({logs.filter((l) => l.isToAll).length})</span>
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'sent' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            送信成功 ({logs.filter((l) => l.status === 'sent').length})
          </button>
          <button
            onClick={() => setFilter('sim')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filter === 'sim' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            シミュレーション / テスト
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="震源地等で検索..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition disabled:opacity-30 cursor-pointer"
            title="ログをクリア"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log Items */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">通知履歴がありません</p>
          <p className="text-xs text-slate-400 mt-1">
            地震が検知されるか、「シミュレーター」タブからテスト実行を行うとここに記録されます。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`bg-white border rounded-xl p-3.5 flex items-center justify-between gap-3 hover:shadow-xs transition cursor-pointer ${
                  log.isToAll ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {log.status === 'sent' && (
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    )}
                    {log.status === 'error' && (
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </span>
                    )}
                    {(log.status === 'simulated' || log.status === 'dry_run') && (
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        SIM
                      </span>
                    )}
                    {log.status === 'skipped_below_threshold' && (
                      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs">
                        SKIP
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{log.hypocenterName}</span>
                      <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.scaleLabel}
                      </span>
                      {log.isToAll && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded">
                          <Users className="w-3 h-3" />
                          [toall]
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ja-JP')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      M{log.magnitude.toFixed(1)} / 深さ{log.depth}km
                      {log.chatworkMessageId ? ` / CW MsgID: ${log.chatworkMessageId}` : ''}
                      {log.errorMessage ? ` / エラー: ${log.errorMessage}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">文面詳細</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-slate-900">通知メッセージ詳細</span>
                {selectedLog.isToAll && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    [toall] 付与済み (震度5弱以上)
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 py-0.5 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <ChatworkMessagePreview
                rawText={selectedLog.renderedMessage}
                isToAll={selectedLog.isToAll}
                scaleLabel={selectedLog.scaleLabel}
              />

              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 text-slate-600 border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">イベントメタデータ</div>
                <div>検知日時: {new Date(selectedLog.timestamp).toLocaleString('ja-JP')}</div>
                <div>地震ID: {selectedLog.earthquakeId}</div>
                <div>ステータス: {selectedLog.status}</div>
                {selectedLog.chatworkMessageId && <div>Chatwork Message ID: {selectedLog.chatworkMessageId}</div>}
                {selectedLog.errorMessage && <div className="text-rose-600">エラー詳細: {selectedLog.errorMessage}</div>}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
