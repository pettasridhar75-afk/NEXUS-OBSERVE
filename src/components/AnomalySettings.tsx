import { X, ShieldCheck, Clock, AlertTriangle, RotateCcw } from "lucide-react";
import type { AnomalyRules } from "../utils/anomalyDetection";

interface Props {
  rules: AnomalyRules;
  setRules: (rules: AnomalyRules) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  onClose: () => void;
}

export default function AnomalySettings({
  rules, setRules, enabled, setEnabled, onClose
}: Props) {
  const update = (key: keyof AnomalyRules, value: number) => {
    setRules({ ...rules, [key]: value });
  };

  const reset = () => {
    setRules({
      slowRequestMs: 1000,
      criticalRequestMs: 3000,
      maxErrorRate: 5
    });
    setEnabled(true);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-violet-400">
              <ShieldCheck size={20}/>
              <span className="text-xs font-semibold tracking-widest">MONITORING CONFIGURATION</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">Anomaly Detection Rules</h2>
            <p className="text-xs text-slate-500 mt-1">Customize how your application detects performance issues.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300" aria-label="Close settings"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-[#0b1020] border border-white/10 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Anomaly monitoring</p>
              <p className="text-xs text-slate-500 mt-1">Enable or disable automatic rule evaluation</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              role="switch"
              aria-checked={enabled}
              className={`w-12 h-6 rounded-full p-1 transition ${enabled ? "bg-emerald-500" : "bg-slate-600"}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`}/>
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Clock size={16} className="text-amber-400"/> Slow request threshold
            </label>
            <p className="text-xs text-slate-500">Flag requests that take longer than this value.</p>
            <div className="flex items-center gap-3">
              <input type="number" min="1" max="60000" value={rules.slowRequestMs}
                onChange={e => update("slowRequestMs", Math.max(1, Math.min(60000, Number(e.target.value))))}
                className="flex-1 bg-[#0b1020] border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-violet-500"/>
              <span className="text-xs text-slate-500">milliseconds</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <AlertTriangle size={16} className="text-rose-400"/> Critical latency threshold
            </label>
            <p className="text-xs text-slate-500">Flag requests requiring immediate investigation.</p>
            <div className="flex items-center gap-3">
              <input type="number" min="1" max="60000" value={rules.criticalRequestMs}
                onChange={e => update("criticalRequestMs", Math.max(1, Math.min(60000, Number(e.target.value))))}
                className="flex-1 bg-[#0b1020] border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-violet-500"/>
              <span className="text-xs text-slate-500">milliseconds</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Maximum acceptable error rate</label>
            <p className="text-xs text-slate-500">Trigger an alert when the error rate exceeds this percentage.</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" max="100" step="0.1" value={rules.maxErrorRate}
                onChange={e => update("maxErrorRate", Math.max(0, Math.min(100, Number(e.target.value))))}
                className="flex-1 bg-[#0b1020] border border-white/10 rounded-lg px-3 py-3 text-white outline-none focus:border-violet-500"/>
              <span className="text-xs text-slate-500">percent (%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-slate-400">
            Critical latency must be greater than or equal to the slow request threshold.
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex justify-between gap-3">
          <button onClick={reset} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white">
            <RotateCcw size={14}/> Reset defaults
          </button>
          <button
            onClick={onClose}
            disabled={rules.criticalRequestMs < rules.slowRequestMs}
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold"
          >
            Save configuration
          </button>
        </div>
      </div>
    </div>
  );
}
