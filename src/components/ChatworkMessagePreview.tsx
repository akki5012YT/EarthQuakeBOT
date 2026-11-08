import React from 'react';
import { ShieldAlert, AlertTriangle, Users } from 'lucide-react';

interface ChatworkMessagePreviewProps {
  rawText: string;
  isToAll: boolean;
  scaleLabel?: string;
}

export const ChatworkMessagePreview: React.FC<ChatworkMessagePreviewProps> = ({
  rawText,
  isToAll,
  scaleLabel,
}) => {
  // Parse message into parts
  const hasToAll = rawText.includes('[toall]');
  
  // Extract info title and body
  const titleMatch = rawText.match(/\[title\]([\s\S]*?)\[\/title\]/);
  const title = titleMatch ? titleMatch[1] : '';

  let body = rawText
    .replace(/\[toall\]\n?/, '')
    .replace(/\[info\]/, '')
    .replace(/\[\/info\]/, '')
    .replace(/\[title\][\s\S]*?\[\/title\]\n?/, '');

  const sections = body.split('[hr]');

  return (
    <div className="bg-[#24272c] text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-xl font-sans">
      {/* Chatwork Header Simulation */}
      <div className="bg-[#1c1e22] px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">Chatwork 投稿プレビュー</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Room ID: 123456789</span>
        </div>
        {hasToAll ? (
          <span className="inline-flex items-center gap-1 bg-red-600/90 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow">
            <Users className="w-3 h-3" />
            [toall] 全員メンション付与中
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">個別メンションなし (震度4以下)</span>
        )}
      </div>

      {/* Message Content Container */}
      <div className="p-4 bg-[#2b2f36] space-y-3">
        {/* Chatwork Avatar & User Line */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
            🤖 BOT
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-white">地震速報通知 BOT</span>
              <span className="text-[11px] text-slate-400">たった今</span>
            </div>

            {/* If [toall] is included, Chatwork renders it prominently */}
            {hasToAll && (
              <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-red-400" />
                <span className="font-mono bg-red-950/60 text-red-200 px-1.5 py-0.5 rounded border border-red-700/50">[toall]</span>
                <span>すべてのメンバーへ緊急メンション</span>
              </div>
            )}

            {/* Chatwork [info] Box Container */}
            <div className={`rounded-lg border p-4 text-xs md:text-sm leading-relaxed transition-all ${
              hasToAll
                ? 'bg-[#1e2229] border-red-500/50 shadow-lg shadow-red-950/20'
                : 'bg-[#1f232a] border-slate-600/60'
            }`}>
              {/* Title bar of [info] */}
              {title && (
                <div className={`font-bold pb-2.5 mb-3 border-b flex items-center gap-2 ${
                  hasToAll ? 'text-red-400 border-red-500/30 text-sm md:text-base' : 'text-sky-400 border-slate-700'
                }`}>
                  {hasToAll ? <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 animate-bounce" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-sky-400" />}
                  <span>{title}</span>
                </div>
              )}

              {/* Sections separated by [hr] */}
              <div className="space-y-3">
                {sections.map((section, idx) => {
                  const isEmergencySection = section.includes('安全確保') || section.includes('安否確認');
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <div className="border-t border-slate-700/80 my-2.5" />}
                      <div className={`whitespace-pre-wrap font-sans ${
                        isEmergencySection
                          ? 'bg-red-950/30 p-2.5 rounded-md border border-red-900/40 text-red-200 font-medium'
                          : 'text-slate-200'
                      }`}>
                        {section.trim()}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-[#191b1f] px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
        <span>仕様: Chatwork v2 API エンドポイント `POST /rooms/{'{'}room_id{'}'}/messages`</span>
        <span className="font-mono text-emerald-400">Content-Type: application/x-www-form-urlencoded</span>
      </div>
    </div>
  );
};
