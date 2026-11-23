export const HTTP_METHODS=["GET","POST","PUT","PATCH","DELETE"] as const;
export type HttpMethod=typeof HTTP_METHODS[number];
export interface ApiRequestRecord{id:string;timestamp:string;method:HttpMethod;endpoint:string;status:number;duration:number;responseSize:number;requestHeaders:Record<string,string>;responseHeaders:Record<string,string>;requestBody?:unknown;responseBody?:unknown;errorMessage?:string}
export type DataSource="demo"|"api";
export type DashboardView="Overview"|"API Explorer"|"Performance"|"Anomalies"|"Settings";
export interface RequestMetrics{total:number;successful:number;failed:number;successRate:number;errorRate:number;averageLatency:number;medianLatency:number;p95Latency:number;p99Latency:number;totalTrafficBytes:number}
export interface AnomalyRules{slowRequestMs:number;criticalRequestMs:number;maxErrorRate:number;minimumRequestsForRateAlert:number}
export interface AnomalyFinding{id:string;endpoint:string;severity:"warning"|"critical";type:string;message:string;timestamp?:string}
