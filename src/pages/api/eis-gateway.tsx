import { useNavigate } from "react-router-dom";
import {
  Shield, Activity, Zap, XCircle, AlertTriangle,
  Clock, RefreshCw, Globe, Lock, Key,
  TrendingUp, ArrowUpRight, ArrowDownRight, Wifi,
  ChevronRight, BarChart3, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Mock data ────────────────────────────────────────────────────────────
const uptimeData = [
  { time: "00:00", latency: 142, requests: 1200, errors: 8 },
  { time: "02:00", latency: 118, requests: 680, errors: 3 },
  { time: "04:00", latency: 110, requests: 420, errors: 1 },
  { time: "06:00", latency: 128, requests: 890, errors: 5 },
  { time: "08:00", latency: 198, requests: 3200, errors: 22 },
  { time: "10:00", latency: 224, requests: 4800, errors: 31 },
  { time: "12:00", latency: 210, requests: 5100, errors: 28 },
  { time: "14:00", latency: 189, requests: 4600, errors: 19 },
  { time: "16:00", latency: 176, requests: 3900, errors: 14 },
  { time: "18:00", latency: 162, requests: 2800, errors: 11 },
  { time: "20:00", latency: 155, requests: 2100, errors: 9 },
  { time: "22:00", latency: 148, requests: 1600, errors: 6 },
];

const eisStatusData = [
  { hour: "08:00", submitted: 284, ack: 278, rejected: 4, failed: 2 },
  { hour: "09:00", submitted: 412, ack: 405, rejected: 5, failed: 2 },
  { hour: "10:00", submitted: 539, ack: 530, rejected: 6, failed: 3 },
  { hour: "11:00", submitted: 618, ack: 608, rejected: 7, failed: 3 },
  { hour: "12:00", submitted: 502, ack: 494, rejected: 5, failed: 3 },
  { hour: "13:00", submitted: 447, ack: 441, rejected: 4, failed: 2 },
  { hour: "14:00", submitted: 581, ack: 572, rejected: 6, failed: 3 },
];

const versionUsage = [
  { version: "v3 (beta)", pct: 8,  requests: 9800,   color: "var(--chart-3)" },
  { version: "v2",        pct: 85, requests: 104200,  color: "var(--chart-1)" },
  { version: "v1 (depr)", pct: 7,  requests: 8600,    color: "var(--chart-5)" },
];

const SERVICES = [
  { name: "EIS Gateway",         status: "operational", latency: 142, uptime: 99.98 },
  { name: "OAuth2 Token Service",status: "operational", latency: 28,  uptime: 100   },
  { name: "JWT Validator",       status: "operational", latency: 11,  uptime: 100   },
  { name: "Rate Limiter",        status: "operational", latency: 4,   uptime: 100   },
  { name: "BIR EIS Endpoint",    status: "degraded",    latency: 843, uptime: 98.12 },
  { name: "Retry Queue Worker",  status: "operational", latency: 88,  uptime: 99.91 },
  { name: "Duplicate Detector",  status: "operational", latency: 16,  uptime: 100   },
  { name: "Ack Processor",       status: "operational", latency: 54,  uptime: 99.95 },
];

const RECENT_INCIDENTS = [
  { id: "INC-042", title: "BIR EIS elevated latency", severity: "warning", started: "10:24", resolved: null,       duration: "ongoing" },
  { id: "INC-041", title: "JWT service cold-start delay", severity: "minor", started: "08:11", resolved: "08:19", duration: "8 min"   },
  { id: "INC-040", title: "Rate limiter sync lag", severity: "minor", started: "yesterday", resolved: "yesterday", duration: "4 min"  },
];

type ServiceStatus = "operational" | "degraded" | "down";
const STATUS_DOT: Record<ServiceStatus, string> = {
  operational: "bg-success",
  degraded:    "bg-warning",
  down:        "bg-destructive",
};
const STATUS_TEXT: Record<ServiceStatus, string> = {
  operational: "text-success",
  degraded:    "text-warning",
  down:        "text-destructive",
};

export function EisGateway() {
  const navigate = useNavigate();
  const overallStatus: ServiceStatus = SERVICES.some(s => s.status === "down")
    ? "down" : SERVICES.some(s => s.status === "degraded") ? "degraded" : "operational";

  const KPIs = [
    { label: "API Uptime (30d)",       value: "99.94%",   delta: "+0.02%",  up: true,  icon: Wifi },
    { label: "Requests Today",         value: "122,600",  delta: "+8.4%",   up: true,  icon: Activity },
    { label: "EIS Submissions Today",  value: "4,381",    delta: "+12.1%",  up: true,  icon: Send },
    { label: "Avg Latency (p50)",      value: "162 ms",   delta: "+14 ms",  up: false, icon: Zap },
    { label: "Error Rate",             value: "0.21%",    delta: "-0.05%",  up: true,  icon: XCircle },
    { label: "Active Credentials",     value: "847",      delta: "+23",     up: true,  icon: Key },
    { label: "Rate Limit Hits",        value: "312",      delta: "-18%",    up: true,  icon: Shield },
    { label: "Pending Retries",        value: "7",        delta: "-3",      up: true,  icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">BIR EIS API Gateway</h1>
            <Badge
              variant={overallStatus === "operational" ? "default" : overallStatus === "degraded" ? "outline" : "destructive"}
              className={cn("gap-1.5 text-xs", overallStatus === "degraded" && "border-warning text-warning")}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[overallStatus])} />
              {overallStatus === "operational" ? "All Systems Operational" : overallStatus === "degraded" ? "Partial Degradation" : "System Down"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Module 2 — Enterprise Integration Platform connecting taxpayers and BIR EIS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/eis/transmissions")}>
            <Send className="h-3.5 w-3.5" /> EIS Transmissions
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/api/eis/performance")}>
            <BarChart3 className="h-3.5 w-3.5" /> Performance
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/api/eis/errors")}>
            <AlertTriangle className="h-3.5 w-3.5" /> Error Monitor
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIs.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{k.value}</p>
              <div className={cn("flex items-center gap-0.5 mt-1 text-xs", k.up ? "text-success" : "text-destructive")}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.delta} vs yesterday
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">API Traffic & Latency — Today</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="req" orientation="left" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis yAxisId="lat" orientation="right" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area yAxisId="req" dataKey="requests" stroke="var(--chart-1)" fill="url(#gReq)" strokeWidth={2} name="Requests" />
                <Area yAxisId="lat" dataKey="latency" stroke="var(--chart-2)" fill="url(#gLat)" strokeWidth={2} name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">API Version Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {versionUsage.map(v => (
              <div key={v.version} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{v.version}</span>
                  <span className="tabular-nums text-muted-foreground">{v.requests.toLocaleString()} req/day</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${v.pct}%`, background: v.color }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{v.pct}% of traffic</p>
              </div>
            ))}
            <Separator />
            <div className="space-y-1 text-[10px] text-muted-foreground">
              <p className="font-medium text-foreground text-xs">Version Lifecycle</p>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" /> v3 — Beta</div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> v2 — Active</div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> v1 — Deprecated (EOL: Dec 2026)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* EIS Submission Chart */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">EIS Submission Results — Today</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={eisStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="ack" stackId="a" fill="var(--chart-2)" name="Acknowledged" radius={[0,0,0,0]} />
                <Bar dataKey="rejected" stackId="a" fill="var(--chart-4)" name="Rejected" />
                <Bar dataKey="failed" stackId="a" fill="var(--chart-5)" name="Failed" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Health Grid */}
        <Card>
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">Service Health</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2">
              {SERVICES.map(s => (
                <div key={s.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", STATUS_DOT[s.status as ServiceStatus])} />
                    <span className="text-xs text-foreground font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] tabular-nums">
                    <span className="text-muted-foreground">{s.latency} ms</span>
                    <span className={cn("font-medium", s.uptime >= 99.9 ? "text-success" : s.uptime >= 99 ? "text-warning" : "text-destructive")}>
                      {s.uptime}%
                    </span>
                    <span className={cn("font-semibold capitalize text-xs", STATUS_TEXT[s.status as ServiceStatus])}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents + Auth Overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active & Recent Incidents</CardTitle>
            <Badge variant="outline" className="text-[10px]">{RECENT_INCIDENTS.filter(i => !i.resolved).length} active</Badge>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {RECENT_INCIDENTS.map(inc => (
              <div key={inc.id} className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                !inc.resolved ? "bg-warning/5 border-warning/30" : "border-border"
              )}>
                <AlertTriangle className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", inc.severity === "warning" ? "text-warning" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{inc.title}</p>
                    <Badge variant="outline" className="text-[9px]">{inc.id}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Started {inc.started} • {inc.resolved ? `Resolved ${inc.resolved}` : "Ongoing"} • {inc.duration}
                  </p>
                </div>
                <Badge variant={!inc.resolved ? "outline" : "secondary"} className={cn("text-[9px]", !inc.resolved && "border-warning text-warning")}>
                  {!inc.resolved ? "Active" : "Resolved"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-sm font-semibold">Security & Auth Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "OAuth2 Tokens Issued",   val: "18,420", icon: Key,      color: "text-chart-1" },
                { label: "JWT Validations",         val: "122,600", icon: Lock,    color: "text-chart-2" },
                { label: "Auth Failures",           val: "43",     icon: XCircle,  color: "text-destructive" },
                { label: "IP Allowlist Blocks",     val: "12",     icon: Shield,   color: "text-warning" },
                { label: "Expired Token Rejects",   val: "281",    icon: Clock,    color: "text-muted-foreground" },
                { label: "Scope Violations",        val: "7",      icon: Globe,    color: "text-destructive" },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2">
                  <m.icon className={cn("h-4 w-4 flex-shrink-0", m.color)} />
                  <div>
                    <p className="text-sm font-bold text-foreground tabular-nums">{m.val}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">OAuth2 Grant Type</span>
                <span className="font-medium text-foreground">client_credentials (98.4%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">JWT Algorithm</span>
                <span className="font-mono text-foreground">RS256</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Token Expiry</span>
                <span className="font-medium text-foreground">3600s (1 hour)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active API Versions</span>
                <div className="flex gap-1">
                  <Badge variant="default" className="text-[9px]">v2</Badge>
                  <Badge variant="outline" className="text-[9px]">v3 beta</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick nav cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "EIS Transmissions", desc: "Submit, monitor, retry BIR transmissions", icon: Send, href: "/eis/transmissions", badge: "7 pending" },
          { title: "Performance",       desc: "Latency, throughput, P99 analysis",         icon: TrendingUp, href: "/api/eis/performance", badge: null },
          { title: "Error Monitor",     desc: "Real-time error tracking and alerting",     icon: AlertTriangle, href: "/api/eis/errors", badge: "31 errors" },
          { title: "Usage Reports",     desc: "API usage analytics and billing reports",   icon: BarChart3, href: "/api/eis/performance", badge: null },
        ].map(c => (
          <button
            key={c.title}
            onClick={() => navigate(c.href)}
            className="flex items-start gap-3 p-4 border rounded-lg text-left hover:bg-muted/30 transition-colors"
          >
            <c.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground">{c.title}</p>
                {c.badge && <Badge variant="destructive" className="text-[9px] h-4">{c.badge}</Badge>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
