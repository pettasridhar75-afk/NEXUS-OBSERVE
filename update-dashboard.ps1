$file = "src/App.tsx"
$content = Get-Content $file -Raw

$content = $content.Replace(
'import { useMemo, useState } from "react";',
'import { useMemo, useState } from "react";' + "`r`n" +
'import AnomalySettings from "./components/AnomalySettings";' + "`r`n" +
'import { detectAnomalies, detectHighErrorRate, defaultRules } from "./utils/anomalyDetection";'
)

$content = $content.Replace(
'const [refreshCount, setRefreshCount] = useState(0);',
'const [refreshCount, setRefreshCount] = useState(0);' + "`r`n" +
'  const [rules, setRules] = useState(defaultRules);' + "`r`n" +
'  const [monitoringEnabled, setMonitoringEnabled] = useState(true);' + "`r`n" +
'  const [showRules, setShowRules] = useState(false);'
)

$content = $content.Replace(
'const average = Math.round(requests.reduce((sum, r) => sum + r.duration, 0) / requests.length);',
'const average = Math.round(requests.reduce((sum, r) => sum + r.duration, 0) / requests.length);' + "`r`n" +
'  const anomalies = monitoringEnabled ? [...requests.flatMap(r => detectAnomalies(r, rules)), ...detectHighErrorRate(requests, rules.maxErrorRate)] : [];'
)

$content = $content.Replace(
'onClick={()=>setActiveNav("Settings")}',
'onClick={()=>setShowRules(true)}'
)

$content = $content.Replace(
'<span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded-full">3 Active</span>',
'<span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded-full">{anomalies.length} Active</span>'
)

$content = $content.Replace(
'<p className="text-xs text-slate-400 mt-2 leading-relaxed">Customize response time and error-rate thresholds for your APIs.</p>',
'<p className="text-xs text-slate-400 mt-2 leading-relaxed">Customize response time and error-rate thresholds for your APIs.</p>' + "`r`n" +
'<p className="text-[11px] text-violet-300 mt-2">{anomalies.length} rule alerts currently detected from the demo requests.</p>'
)

$content = $content.Replace(
'{selected && (',
'{showRules && <AnomalySettings rules={rules} setRules={setRules} enabled={monitoringEnabled} setEnabled={setMonitoringEnabled} onClose={() => setShowRules(false)} />}' + "`r`n" +
'      {selected && ('
)

Set-Content -Path $file -Value $content -Encoding utf8

Write-Host "Dashboard connected to anomaly settings!" -ForegroundColor Green
npm.cmd run test -- --run
