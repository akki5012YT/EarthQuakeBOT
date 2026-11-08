import React from 'react';
import { Activity, Waves, MapPin, Gauge, ShieldAlert, ArrowRight } from 'lucide-react';
import { getScaleInfo, isToAllIntensity, translateTsunami, type P2PEarthquakeData } from '../types/earthquake';

interface EarthquakeCardProps {
  data: P2PEarthquakeData;
  minScaleThreshold: number;
  onSelectForPreview?: (data: P2PEarthquakeData) => void;
  onSimulateSend?: (data: P2PEarthquakeData) => void;
}

export const EarthquakeCard: React.FC<EarthquakeCardProps> = ({
  data,
  minScaleThreshold,
  onSelectForPreview,
  onSimulateSend,
}) => {
  const earthquake = data.earthquake;
  const maxScale = earthquake.maxScale;
  const scaleInfo = getScaleInfo(maxScale);
  const isToAll = isToAllIntensity(maxScale);
  const isAboveThreshold = maxScale >= minScaleThreshold;

  const tsunamiText = translateTsunami(earthquake.domesticTsunami);
  const isTsunamiWarning = earthquake.domesticTsunami === 'Watch' || earthquake.domesticTsunami === 'Warning';

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 relative overflow-hidden bg-white shadow-sm hover:shadow-md ${
        isToAll
          ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400/30'
          : isAboveThreshold
          ? 'border-amber-300 bg-amber-50/10'
          : 'border-slate-200'
      }`}
    >
      {/* Top Banner for Intensity 5- and above */}
      {isToAll && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-bold px-3 py-1 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            【震度5弱以上】Chatwork [toall] 自動メンション対象
          </span>
          <span className="bg-red-800/80 px-1.5 py-0.2 rounded text-[10px]">一斉発信</span>
        </div>
      )}

      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${isToAll ? 'pt-4' : ''}`}>
        {/* Left: Intensity Badge & Epicenter */}
        <div className="flex items-start sm:items-center gap-3">
          {/* Intensity Badge */}
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 border shadow-xs ${scaleInfo.bgColor} ${scaleInfo.borderColor} ${scaleInfo.color}`}
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">最大</span>
            <span className="text-lg leading-tight font-black">{scaleInfo.short}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-rose-500" />
                {earthquake.hypocenter.name || '震源調査中'}
              </h3>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                {earthquake.time || data.time}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                規模: M{earthquake.hypocenter.magnitude > 0 ? earthquake.hypocenter.magnitude.toFixed(1) : '調査中'}
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                深さ: {earthquake.hypocenter.depth >= 0 ? `約${earthquake.hypocenter.depth}km` : 'ごく浅い'}
              </span>
              {isAboveThreshold ? (
                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  通知基準（{getScaleInfo(minScaleThreshold).label}以上）合致
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  通知基準未満（スキップ対象）
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {onSelectForPreview && (
            <button
              onClick={() => onSelectForPreview(data)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Chatwork文面確認</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onSimulateSend && (
            <button
              onClick={() => onSimulateSend(data)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                isToAll
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <span>テスト通知</span>
            </button>
          )}
        </div>
      </div>

      {/* Tsunami alert indicator */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1.5 ${isTsunamiWarning ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
          <Waves className={`w-3.5 h-3.5 ${isTsunamiWarning ? 'text-red-600 animate-pulse' : 'text-sky-500'}`} />
          <span>{tsunamiText}</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          ID: {data.id.slice(0, 16)}
        </div>
      </div>
    </div>
  );
};
