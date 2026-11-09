import { useEffect, useMemo, useState } from "react";
import { useApiRequests } from "./hooks/useApiRequests";
import AnomalySettings from "./components/AnomalySettings";
import RequestInspector from "./components/RequestInspector";
import { detectAnomalies, detectHighErrorRate, defaultRules } from "./utils/anomalyDetection";
import { motion } from "framer-motion";
import {
  Activity, LayoutDashboard, Network, Gauge, AlertTriangle,
  Settings, Search, Bell, RefreshCw, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle,
  Clock3, Eye,  Download, Filter, Play, Pause,
  X, Zap, Menu, ChevronDown
} from "lucide-react";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

type Request = {
  id: number;
  time: string;
  method: string;
  endpoint: string;
  status: number;
  duration: number;
  size: string;
  error?: string;
  timestamp?: string;
  responseSize?: number;
  errorMessage?: string;
  requestHeaders?: Record<string, unknown>;
  responseHeaders?: Record<string, unknown>;
  requestBody?: unknown;
  responseBody?: unknown;
};

const initialRequests: Request[] = [
  { id: 1, time: "10:42:31", method: "GET", endpoint: "/api/users", status: 200, duration: 142, size: "12.4 KB" },
  { id: 2, time: "10:42:28", method: "POST", endpoint: "/api/auth/login", status: 200, duration: 318, size: "18.7 KB" },
  { id: 3, time: "10:42:20", method: "GET", endpoint: "/api/products", status: 200, duration: 429, size: "42.9 KB" },
  { id: 4, time: "10:41:58", method: "GET", endpoint: "/api/orders", status: 500, duration: 1240, size: "2.1 KB", error: "Internal Server Error" },
  { id: 5, time: "10:41:40", method: "PUT", endpoint: "/api/cart/123", status: 200, duration: 287, size: "9.8 KB" },
  { id: 6, time: "10:41:12", method: "GET", endpoint: "/api/analytics", status: 200, duration: 642, size: "31.2 KB" },
  { id: 7, time: "10:40:55", method: "POST", endpoint: "/api/payment", status: 503, duration: 1820, size: "1.2 KB", error: "Service Unavailable" },
  { id: 8, time: "10:40:30", method: "GET", endpoint: "/api/profile", status: 200, duration: 185, size: "5.4 KB" },
  { id: 9, time: "10:39:48", method: "DELETE", endpoint: "/api/cart/456", status: 204, duration: 96, size: "0 KB" },
  { id: 10, time: "10:39:20", method: "GET", endpoint: "/api/reports", status: 404, duration: 390, size: "0.8 KB", error: "Resource not found" },
  { id: 11, time: "10:38:56", method: "POST", endpoint: "/api/auth/refresh", status: 200, duration: 211, size: "2.3 KB" },
  { id: 12, time: "10:38:10", method: "GET", endpoint: "/api/products/12", status: 200, duration: 156, size: "8.1 KB" }
];



const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "API Explorer", icon: Network },
  { name: "Performance", icon: Gauge },
  { name: "Anomalies", icon: AlertTriangle },
  { name: "Settings", icon: Settings }
];

function App() {
  const {
    requests: apiRequests,
    loading: apiLoading,
    error: apiError,
    refresh: refreshApiRequests
  } = useApiRequests();
  const [requests, setRequests] = useState(initialRequests);
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [statusFilter, setStatusFilter] = useState(() => new URLSearchParams(window.location.search).get("status") || "All");
  const [methodFilter, setMethodFilter] = useState(() => new URLSearchParams(window.location.search).get("method") || "All");
  const [selected, setSelected] = useState<Request | null>(null);
  const [live, setLive] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [period, setPeriod] = useState("Last 24 hours");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(() => Math.max(1, Number(new URLSearchParams(window.location.search).get("page")) || 1));
  const [pageSize, setPageSize] = useState(() => Number(new URLSearchParams(window.location.search).get("size")) || 6);
  const [rules, setRules] = useState(defaultRules);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (apiRequests.length === 0) return;

    const converted: Request[] = apiRequests.map((item, index) => ({
      id: Number(item.id.replace(/\D/g, "")) || index + 1,
      time: new Date(item.timestamp).toLocaleTimeString("en-US", {
        hour12: false
      }),
      method: item.method,
      endpoint: item.endpoint,
      status: item.status,
      duration: item.duration,
      size: `${(item.responseSize / 1024).toFixed(1)} KB`,
      error: item.errorMessage,
      errorMessage: item.errorMessage,
      timestamp: item.timestamp,
      responseSize: item.responseSize,
      requestHeaders: item.requestHeaders,
      responseHeaders: item.responseHeaders,
      requestBody: item.requestBody,
      responseBody: item.responseBody
    }));

    setRequests(converted);
  }, [apiRequests]);
  const filtered = useMemo(() => {
    return [...requests]
      .filter(r =>
        `${r.endpoint} ${r.method} ${r.status} ${r.error || ""}`
          .toLowerCase().includes(search.toLowerCase())
      )
      .filter(r =>
        statusFilter === "All" ||
        (statusFilter === "Success" && r.status < 400) ||
        (statusFilter === "Failed" && r.status >= 400)
      )
      .filter(r => methodFilter === "All" || r.method === methodFilter)
      .sort((a, b) =>
        sortAsc ? a.duration - b.duration : b.duration - a.duration
      );
  }, [requests, search, statusFilter, methodFilter, sortAsc]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, methodFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRequests = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set("q", search);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (methodFilter !== "All") params.set("method", methodFilter);
    if (currentPage > 1) params.set("page", String(currentPage));
    if (pageSize !== 6) params.set("size", String(pageSize));

    const query = params.toString();
    const nextUrl = window.location.pathname + (query ? "?" + query : "");
    window.history.replaceState({}, "", nextUrl);
  }, [search, statusFilter, methodFilter, currentPage, pageSize]);


  const total = requests.length;
  const failed = requests.filter(r => r.status >= 400).length;
  const successful = total - failed;
  const successRate = total ? ((successful / total) * 100).toFixed(2) : "0.00";
  const failureRate = total ? ((failed / total) * 100).toFixed(2) : "0.00";
  const average = total
    ? Math.round(requests.reduce((sum, r) => sum + r.duration, 0) / total)
    : 0;

  // Build response-time samples from the loaded requests.
  const sortedRequests = [...requests].sort((a, b) => {
    const aTime = a.timestamp ? Date.parse(a.timestamp) : 0;
    const bTime = b.timestamp ? Date.parse(b.timestamp) : 0;
    return (Number.isFinite(aTime) ? aTime : 0) -
      (Number.isFinite(bTime) ? bTime : 0);
  });

  const chartData: { time: string; avg: number; p95: number }[] = [];
  const bucketSize = Math.max(1, Math.ceil(sortedRequests.length / 8));

  for (let i = 0; i < sortedRequests.length; i += bucketSize) {
    const group = sortedRequests.slice(i, i + bucketSize);
    const durations = group.map(r => r.duration).sort((a, b) => a - b);
    const avg = Math.round(
      durations.reduce((sum, value) => sum + value, 0) / durations.length
    );
    const p95 = durations[Math.max(0, Math.ceil(durations.length * 0.95) - 1)];

    chartData.push({
      time: group[0].time || `Sample ${chartData.length + 1}`,
      avg,
      p95
    });
  }

  const statusData = [
    {
      name: "Success",
      value: Number(successRate),
      color: "#10b981"
    },
    {
      name: "Failed",
      value: Number(failureRate),
      color: "#f43f5e"
    }
  ];

  // Calculate average latency for each endpoint.
  const endpointGroups = requests.reduce((groups, request) => {
    if (!groups[request.endpoint]) groups[request.endpoint] = [];
    groups[request.endpoint].push(request.duration);
    return groups;
  }, {} as Record<string, number[]>);

  const endpointAverages = Object.entries(endpointGroups)
    .map(([name, durations]) => ({
      name,
      average: Math.round(
        durations.reduce((sum, value) => sum + value, 0) / durations.length
      )
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const maximumEndpointTime = Math.max(
    1,
    ...endpointAverages.map(item => item.average)
  );

  const slowEndpoints = endpointAverages.map(item => ({
    name: item.name,
    time: item.average >= 1000
      ? `${(item.average / 1000).toFixed(2)} s`
      : `${item.average} ms`,
    value: Math.max(8, (item.average / maximumEndpointTime) * 100),
    color: item.average >= 1000
      ? "bg-rose-400"
      : item.average >= 500
        ? "bg-amber-400"
        : "bg-emerald-400"
  }));

  const anomalies = monitoringEnabled
    ? [
        ...requests.flatMap(r => detectAnomalies(r, rules)),
        ...detectHighErrorRate(requests, rules.maxErrorRate)
      ]
    : [];
  const refresh = () => {
    void refreshApiRequests();
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Time", "Method", "Endpoint", "Status", "Duration", "Size"],
      ...filtered.map(r => [r.id, r.time, r.method, r.endpoint, r.status, r.duration, r.size])
    ];
    const csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-api-requests.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addSample = () => {
    const id = Math.max(...requests.map(r => r.id), 0) + 1;
    setRequests(prev => [{
      id,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      method: "GET",
      endpoint: "/api/health",
      status: 200,
      duration: Math.floor(Math.random() * 500) + 80,
      size: "1.2 KB"
    }, ...prev]);
  };

  const stats = [
    { title: "Total Requests", value: total.toLocaleString("en-IN"), change: "+12.4%", positive: true, icon: Activity, color: "violet", note: "vs previous period" },
    { title: "Success Rate", value: `${successRate}%`, change: "+0.8%", positive: true, icon: CheckCircle2, color: "emerald", note: "vs previous period" },
    { title: "Failure Rate", value: `${failureRate}%`, change: "Live calculation", positive: false, icon: XCircle, color: "rose", note: "vs previous period" },
    { title: "Avg. Response Time", value: `${average} ms`, change: "-14.2%", positive: true, icon: Zap, color: "amber", note: "vs previous period" }
  ];

  return (
    <div className="min-h-screen bg-[#080b16] text-slate-200 flex">

      {mobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setMobileMenu(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[250px] shrink-0 border-r border-white/[0.07] bg-[#0b1020] flex flex-col transition-transform duration-300 ${mobileMenu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-[82px] px-6 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-400/30">
            <Activity className="text-violet-400" size={25} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">Nexus Observe</h1>
            <p className="text-[10px] text-slate-500 tracking-wider">FRONTEND INTELLIGENCE</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileMenu(false)}><X size={19}/></button>
        </div>

        <div className="px-4 pt-7">
          <p className="text-[10px] font-semibold tracking-[2px] text-slate-600 px-3 mb-3">WORKSPACE</p>
          <nav className="space-y-1">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.name}
                  onClick={() => { setActiveNav(item.name); setMobileMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${activeNav === item.name ? "bg-violet-600/20 text-violet-300 border border-violet-500/20" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>
                  <Icon size={18}/>
                  <span>{item.name}</span>
                  {item.name === "Anomalies" && <span className="ml-auto bg-rose-500 text-white text-[10px] rounded-full px-2 py-0.5">3</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-5">
          <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 to-cyan-500/5 p-4">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold mb-2"><Zap size={15}/> OBSERVABILITY TIP</div>
            <p className="text-xs text-slate-400 leading-relaxed">Keep your API response times healthy. Monitor, analyze and optimize.</p>
            <button onClick={() => setActiveNav("Performance")} className="text-xs text-violet-300 mt-3 hover:text-white">Explore performance Ã¢â€ â€™</button>
          </div>
          <div className="border-t border-white/[0.07] pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">M</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Developer</p>
              <p className="text-[11px] text-slate-500">Frontend Engineer</p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400"/>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="h-[76px] px-4 md:px-8 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0b1020]/80 sticky top-0 z-30 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-slate-300" onClick={() => setMobileMenu(true)}><Menu/></button>
            <div className="relative hidden sm:block w-48 md:w-72 xl:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search APIs, endpoints, errors..." className="w-full bg-[#151c30] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-violet-500/60 placeholder:text-slate-600"/>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setLive(!live)} className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${live ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
              <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}/>
              {live ? "Live Monitoring" : "Monitoring Paused"}
            </button>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="hidden md:block bg-[#151c30] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none text-slate-300">
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
            <button onClick={refresh} title="Refresh data" className="p-2.5 bg-[#151c30] border border-white/10 rounded-xl hover:border-violet-500/50 transition"><RefreshCw size={17} className="text-slate-300"/></button>
            <button title="Notifications" onClick={() => setActiveNav("Anomalies")} className="relative p-2.5 bg-[#151c30] border border-white/10 rounded-xl hover:border-violet-500/50"><Bell size={17}/><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"/></button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1700px] mx-auto space-y-7">
            {apiLoading && (
              <div role="status" className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
                <span className="animate-pulse">â—</span> Loading API monitoring data...
              </div>
            )}

            {apiError && (
              <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-rose-300">Unable to load monitoring data</p>
                  <p className="text-xs text-rose-200/70 mt-1">{apiError}</p>
                </div>
                <button onClick={refresh} className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/30">
                  Retry
                </button>
              </div>
            )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-violet-400 font-medium mb-2 tracking-wide">MONITORING / {activeNav.toUpperCase()}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{activeNav}</h2>
              <p className="text-sm text-slate-500 mt-1">Real-time API health, performance and application insights.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLive(!live)} className="sm:hidden flex items-center gap-2 text-xs bg-[#151c30] border border-white/10 rounded-lg px-3 py-2">
                {live ? <Pause size={14}/> : <Play size={14}/>} {live ? "Pause" : "Resume"}
              </button>
              <button onClick={addSample} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl px-4 py-2.5 transition shadow-lg shadow-violet-900/20">
                <Activity size={15}/> Add sample request
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} key={stat.title}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11182a] p-5 hover:border-violet-500/30 transition group">
                  <div className={`absolute -right-8 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 ${stat.color === "violet" ? "bg-violet-500" : stat.color === "emerald" ? "bg-emerald-500" : stat.color === "rose" ? "bg-rose-500" : "bg-amber-500"}`}/>
                  <div className="flex items-center justify-between relative">
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color === "violet" ? "bg-violet-500/15 text-violet-400" : stat.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" : stat.color === "rose" ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`}><Icon size={20}/></div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mt-4 tracking-tight">{stat.value}</h3>
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400"><ArrowDownRight size={14}/>{stat.change}</span>
                    <span className="text-slate-600">{stat.note}</span>
                  </div>
                </motion.div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7 rounded-2xl border border-white/[0.08] bg-[#11182a] p-5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Response Time Trends</h3>
                  <p className="text-xs text-slate-500 mt-1">Average latency and P95 performance</p>
                </div>
                <div className="flex gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-violet-400"/> Average</span>
                  <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-cyan-400"/> P95</span>
                </div>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="purpleFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ffffff0c" vertical={false}/>
                    <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize:10}}/>
                    <YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:12,fontSize:12}}/>
                    <Area type="monotone" dataKey="p95" stroke="#22d3ee" strokeWidth={2} fill="url(#cyanFill)"/>
                    <Area type="monotone" dataKey="avg" stroke="#a78bfa" strokeWidth={2.5} fill="url(#purpleFill)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-white/[0.08] bg-[#11182a] p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-white">Request Status</h3>
              <p className="text-xs text-slate-500 mt-1">Distribution overview</p>
              <div className="h-[175px] relative mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={53} outerRadius={72} paddingAngle={3} stroke="none">
                      {statusData.map(item => <Cell key={item.name} fill={item.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:10,fontSize:11}}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white">{successRate}%</span>
                  <span className="text-[10px] text-slate-500">Success</span>
                </div>
              </div>
              <div className="space-y-3 mt-auto">
                {statusData.map(item => <div key={item.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-400"><i className="w-2 h-2 rounded-full" style={{background:item.color}}/>{item.name}</span><span className="text-white font-medium">{item.value}%</span></div>)}
              </div>
            </div>

            <div className="xl:col-span-3 rounded-2xl border border-white/[0.08] bg-[#11182a] p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Top Slow Endpoints</h3>
                <button onClick={() => {setActiveNav("API Explorer");setStatusFilter("All");}} className="text-[11px] text-violet-400 hover:text-violet-300">View all Ã¢â€ â€™</button>
              </div>
              <div className="space-y-5 mt-6">
                {slowEndpoints.map(item => <div key={item.name}>
                  <div className="flex justify-between text-xs mb-2 gap-2"><span className="text-slate-300 truncate">{item.name}</span><span className="font-semibold text-amber-300 shrink-0">{item.time}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{width:`${item.value}%`}}/></div>
                </div>)}
              </div>
              <div className="mt-7 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-500"><Clock3 size={14}/> Latency threshold: 500 ms</div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-9 rounded-2xl border border-white/[0.08] bg-[#11182a] overflow-hidden">
              <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">API Request Explorer</h3>
                  <p className="text-xs text-slate-500 mt-1">Inspect and investigate application requests</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 text-xs text-slate-300 border border-white/10 rounded-lg px-3 py-2 hover:border-violet-500/40"><Download size={14}/> Export CSV</button>
              </div>

              <div className="p-4 flex flex-col sm:flex-row flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px] sm:hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className="w-full bg-[#0b1020] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-violet-500/50"/>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Filter size={15}/> Filters:</div>
                <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} className="bg-[#0b1020] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none">
                  {["All","GET","POST","PUT","DELETE"].map(x=><option key={x} value={x}>{x === "All" ? "All methods" : x}</option>)}
                </select>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-[#0b1020] border border-white/10 rounded-lg px-3 py-2 text-xs outline-none">
                  {["All","Success","Failed"].map(x=><option key={x}>{x}</option>)}
                </select>
                <button onClick={()=>{setSearch("");setStatusFilter("All");setMethodFilter("All");setPage(1);}} className="text-xs text-violet-400 hover:text-white px-2">Reset filters</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-[#0b1020]/70 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Time</th>
                      <th className="px-3 py-3 font-medium">Method</th>
                      <th className="px-3 py-3 font-medium">Endpoint</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium"><button onClick={()=>setSortAsc(!sortAsc)} className="flex items-center gap-1 hover:text-white">Duration <ChevronDown size={12}/></button></th>
                      <th className="px-3 py-3 font-medium">Size</th>
                      <th className="px-5 py-3 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {pageRequests.map(r=><tr key={r.id} className="hover:bg-violet-500/[0.04] transition group">
                      <td className="px-5 py-4 text-xs text-slate-500">{r.time}</td>
                      <td className="px-3 py-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.method==="GET"?"bg-cyan-500/10 text-cyan-400":r.method==="POST"?"bg-violet-500/10 text-violet-400":r.method==="PUT"?"bg-amber-500/10 text-amber-400":"bg-rose-500/10 text-rose-400"}`}>{r.method}</span></td>
                      <td className="px-3 py-4 text-xs text-slate-300 font-medium">{r.endpoint}</td>
                      <td className="px-3 py-4"><span className={`text-[10px] px-2 py-1 rounded-md font-semibold ${r.status<300?"bg-emerald-500/10 text-emerald-400":r.status<400?"bg-blue-500/10 text-blue-400":"bg-rose-500/10 text-rose-400"}`}>{r.status}</span></td>
                      <td className={`px-3 py-4 text-xs font-semibold ${r.duration>1000?"text-rose-400":r.duration>500?"text-amber-400":"text-slate-300"}`}>{r.duration} ms</td>
                      <td className="px-3 py-4 text-xs text-slate-500">{r.size}</td>
                      <td className="px-5 py-4 text-right"><button onClick={()=>setSelected(r)} className="p-2 rounded-lg text-slate-500 hover:text-violet-300 hover:bg-violet-500/10"><Eye size={16}/></button></td>
                    </tr>)}
                    {filtered.length===0 && <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-500">No requests match your filters.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <span>
                  Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}Ã¢â‚¬â€œ{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} filtered requests
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="pageSize" className="hidden sm:block">Rows:</label>
                  <select id="pageSize" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="bg-[#0b1020] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300">
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg border border-white/10 hover:border-violet-500 disabled:opacity-30 disabled:cursor-not-allowed">Ã¢â€ Â</button>
                  <span className="text-slate-300">{currentPage} / {totalPages}</span>
                  <button aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-lg border border-white/10 hover:border-violet-500 disabled:opacity-30 disabled:cursor-not-allowed">Ã¢â€ â€™</button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-3 space-y-4">
              <div className="rounded-2xl border border-rose-500/15 bg-[#11182a] p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle size={16} className="text-rose-400"/> Anomaly Alerts</h3>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded-full">{anomalies.length} Active</span>
                </div>
                <div className="space-y-4">
                  {[
                    {title:"High error rate",path:"/api/orders",time:"5 min ago",type:"critical"},
                    {title:"Slow response",path:"/api/products",time:"12 min ago",type:"warning"},
                    {title:"Traffic spike",path:"Application traffic",time:"18 min ago",type:"warning"}
                  ].map(item=><button key={item.title} onClick={()=>setActiveNav("Anomalies")} className="w-full text-left flex gap-3 items-start group">
                    <span className={`mt-1 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${item.type==="critical"?"bg-rose-500/10 text-rose-400":"bg-amber-500/10 text-amber-400"}`}><AlertTriangle size={14}/></span>
                    <span className="min-w-0"><span className="block text-xs text-slate-200 font-medium group-hover:text-violet-300">{item.title}</span><span className="block text-[11px] text-slate-500 mt-1">{item.path}</span><span className="block text-[10px] text-slate-600 mt-1">{item.time}</span></span>
                  </button>)}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-[#11182a] p-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 mb-3"><Settings size={21}/></div>
                <h3 className="text-sm font-semibold text-white">Anomaly Configuration</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">Customize response time and error-rate thresholds for your APIs.</p>
<p className="text-[11px] text-violet-300 mt-2">{anomalies.length} rule alerts currently detected from the demo requests.</p>
<p className="text-[11px] text-violet-300 mt-2">{anomalies.length} rule alerts currently detected from the demo requests.</p>
                <button onClick={()=>setShowRules(true)} className="mt-4 w-full rounded-lg bg-violet-600 hover:bg-violet-500 py-2.5 text-xs font-semibold text-white transition">Configure rules <ArrowUpRight className="inline ml-1" size={13}/></button>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#11182a] p-5">
                <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Monitoring status</span><span className={`text-[10px] font-medium ${live?"text-emerald-400":"text-slate-500"}`}>{live?"ACTIVE":"PAUSED"}</span></div>
                <button onClick={()=>setLive(!live)} className={`w-full mt-3 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${live?"bg-rose-500/10 text-rose-400 hover:bg-rose-500/20":"bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>{live?<><Pause size={14}/> Pause monitoring</>:<><Play size={14}/> Resume monitoring</>}</button>
                <p className="text-[10px] text-slate-600 mt-3">Demo mode Ã‚Â· Sample data only</p>
              </div>
            </div>
          </section>

          <footer className="flex flex-col sm:flex-row justify-between gap-2 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600">
            <span>Ã‚Â© 2026 Nexus Observe Ã‚Â· Frontend Observability Platform</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> All systems operational Ã‚Â· {period}</span>
          </footer>
        </div>
      </main>

      {showRules && <AnomalySettings rules={rules} setRules={setRules} enabled={monitoringEnabled} setEnabled={setMonitoringEnabled} onClose={() => setShowRules(false)} />}
      {selected && <RequestInspector request={selected} onClose={() => setSelected(null)} /> }
    </div>
  );
}

export default App;








