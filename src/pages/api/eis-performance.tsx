import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Zap, TrendingDown, Activity, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Mock data ────────────────────────────────────────────────────────────
const latencyPercentiles = [
  { hour: "00", p50: 118, p95: 284, p99: 492, max: 1240 },
  { hour: "02", p50: 102, p95: 241, p99: 410, max: 980 },
  { hour: "04", p50: 95,  p95: 219, p99: 388, max: 820 },
  { hour: "06", p50: 128, p95: 298, p99: 518, max: 1400 },
  { hour: "08", p50: 198, p95: 512, p99: 891, max: 3200 },
  { hour: "10", p50: 224, p95: 581, p99: 1042, max: 4800 },
  { hour: "12", p50: 210, p95: 548, p99: 984, max: 4200 },
  { hour: "14", p50: 189, p95: 492, p99: 882, max: 3800 },
  { hour: "16", p50: 176, p95: 458, p99: 820, max: 3200 },
  { hour: "18", p50: 162, p95: 420, p99: 748, max: 2800 },
  { hour: "20", p50: 155, p95: 398, p99: 710, max: 2400 },
  { hour: "22", p50: 148, p95: 374, p99: 668, max: 1900 },
];

const throughputData = [
  { day: "Mon", requests: 82400, eis: 3200, success: 81800 },
  { day: "Tue", requests: 91200, eis: 3820, success: 90600 },
  { day: "Wed", requests: 88600, eis: 3640, success: 88000 },
  { day: "Thu", requests: 104800, eis: 4240, success: 104100 },
  { day: "Fri", requests: 118200, eis: 4880, success: 117400 },
  { day: "Sat", requests: 64200, eis: 2600, success: 63900 },
  { day: "Sun", requests: 48800, eis: 1980, success: 48600 },
];

const endpointPerf = [
  { endpoint: "POST /v2/eis/submit",         p50: 342, p95: 820, rps: 48.2,  errorPct: 0.18 },
  { endpoint: "GET  /v2/eis/status/:id",     p50: 44,  p95: 112, rps: 124.8, errorPct: 0.04 },
  { endpoint: "POST /v2/oauth/token",        p50: 28,  p95: 64,  rps: 22.1,  errorPct: 0.02 },
  { endpoint: "POST /v2/invoices/validate",  p50: 118, p95: 298, rps: 31.4,  errorPct: 0.21 },
  { endpoint: "GET  /v2/invoices",           p50: 86,  p95: 224, rps: 88.6,  errorPct: 0.08 },
  { endpoint: "POST /v2/invoices",           p50: 204, p95: 512, rps: 42.8,  errorPct: 0.14 },
  { endpoint: "PUT  /v2/invoices/:id",       p50: 188, p95: 448, rps: 18.2,  errorPct: 0.11 },
  { endpoint: "GET  /v2/transmissions",      p50: 62,  p95: 148, rps: 28.4,  errorPct: 0.03 },
];

const rateLimitData = [
  { hour: "08", hits: 42, throttled: 38, blocked: 4 },
  { hour: "09", hits: 68, throttled: 61, blocked: 7 },
  { hour: "10", hits: 94, throttled: 84, blocked: 10 },
  { hour: "11", hits: 112, throttled: 100, blocked: 12 },
  { hour: "12", hits: 88, throttled: 79, blocked: 9 },
  { hour: "13", hits: 74, throttled: 66, blocked: 8 },
  { hour: "14", hits: 62, throttled: 55, blocked: 7 },
];

const usageByCredential = [
  { name: "PROD-cred-alpha",  requests: 48200, eis: 1840, rateLimited: 12, version: "v2" },
  { name: "PROD-cred-beta",   requests: 34800, eis: 1320, rateLimited: 8,  version: "v2" },
  { name: "PROD-cred-gamma",  requests: 22100, eis: 880,  rateLimited: 4,  version: "v2" },
  { name: "SANDBOX-dev-01",   requests: 9840,  eis: 380,  rateLimited: 48, version: "v2" },
  { name: "BETA-cred-v3",     requests: 7600,  eis: 290,  rateLimited: 18, version: "v3" },
];

export function EisPerformance() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/api/eis")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">API Performance Dashboard</h1>
          <p className="text-xs text-muted-foreground">Latency percentiles, throughput, rate limiting, usage by credential</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
          <Download className="h-3 w-3" /> Export
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "P50 Latency",    val: "162 ms",   icon: Zap,       color: "text-success" },
          { label: "P95 Latency",    val: "420 ms",   icon: Zap,       color: "text-warning" },
          { label: "P99 Latency",    val: "748 ms",   icon: Zap,       color: "text-warning" },
          { label: "Throughput",     val: "284 req/s", icon: Activity, color: "text-primary" },
          { label: "Rate Limit Hits",val: "312",       icon: Activity, color: "text-destructive" },
          { label: "Error Rate",     val: "0.21%",     icon: TrendingDown, color: "text-destructive" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <k.icon className={cn("h-3.5 w-3.5", k.color)} />
                <span className="text-[10px] text-muted-foreground">{k.label}</span>
              </div>
              <p className={cn("text-lg font-bold tabular-nums", k.color)}>{k.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="latency">
        <TabsList className="h-8">
          <TabsTrigger value="latency" className="text-xs">Latency</TabsTrigger>
          <TabsTrigger value="throughput" className="text-xs">Throughput</TabsTrigger>
          <TabsTrigger value="endpoints" className="text-xs">Endpoints</TabsTrigger>
          <TabsTrigger value="ratelimit" className="text-xs">Rate Limiting</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs">Usage Reports</TabsTrigger>
        </TabsList>

        {/* ── Latency ────────────────────────────────────────────────── */}
        <TabsContent value="latency" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <CardTitle className="text-sm">Latency Percentiles (24h)</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={latencyPercentiles}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" unit="ms" />
                  <Tooltip formatter={(v) => `${v}ms`} />
                  <Legend />
                  <Line dataKey="p50" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="P50" />
                  <Line dataKey="p95" stroke="var(--chart-4)" strokeWidth={2} dot={false} name="P95" />
                  <Line dataKey="p99" stroke="var(--chart-5)" strokeWidth={2} dot={false} name="P99" strokeDasharray="4 2" />
                  <Line dataKey="max" stroke="var(--destructive)" strokeWidth={1} dot={false} name="Max" strokeDasharray="2 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "P50 (median)",         val: "162 ms", target: "< 300 ms",  ok: true },
              { label: "P95",                   val: "420 ms", target: "< 800 ms",  ok: true },
              { label: "P99",                   val: "748 ms", target: "< 2000 ms", ok: true },
            ].map(p => (
              <Card key={p.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">{p.val}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", p.ok ? "bg-success" : "bg-destructive")} />
                    <span className="text-[10px] text-muted-foreground">SLA target: {p.target}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Throughput ─────────────────────────────────────────────── */}
        <TabsContent value="throughput" className="mt-4">
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <CardTitle className="text-sm">Weekly Throughput — Requests & EIS Submissions</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" fill="var(--chart-1)" name="Total Requests" radius={[2,2,0,0]} />
                  <Bar dataKey="eis" fill="var(--chart-2)" name="EIS Submissions" radius={[2,2,0,0]} />
                  <Bar dataKey="success" fill="var(--chart-3)" name="Successful" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Endpoints ──────────────────────────────────────────────── */}
        <TabsContent value="endpoints" className="mt-4">
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <CardTitle className="text-sm">Endpoint Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {["Endpoint","P50","P95","Req/s","Error %","Health"].map(h => (
                        <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {endpointPerf.map(ep => (
                      <tr key={ep.endpoint} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="py-3 pr-4 font-mono text-[11px] text-foreground">{ep.endpoint}</td>
                        <td className="py-3 pr-4 tabular-nums">{ep.p50}ms</td>
                        <td className="py-3 pr-4 tabular-nums">{ep.p95}ms</td>
                        <td className="py-3 pr-4 tabular-nums">{ep.rps}</td>
                        <td className="py-3 pr-4">
                          <span className={cn("font-medium tabular-nums", ep.errorPct > 0.15 ? "text-warning" : "text-success")}>
                            {ep.errorPct}%
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={cn("h-2 w-2 rounded-full inline-block", ep.errorPct <= 0.1 ? "bg-success" : ep.errorPct <= 0.2 ? "bg-warning" : "bg-destructive")} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rate Limiting ───────────────────────────────────────────── */}
        <TabsContent value="ratelimit" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="px-5 pt-4 pb-2">
              <CardTitle className="text-sm">Rate Limit Events — Today</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rateLimitData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hits"      fill="var(--chart-4)" name="Total Hits"  radius={[0,0,0,0]} />
                  <Bar dataKey="throttled" fill="var(--chart-5)" name="Throttled"   radius={[0,0,0,0]} />
                  <Bar dataKey="blocked"   fill="var(--destructive)" name="Blocked" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Limit Type",   header: true },
              { label: "RPM (per min)",     val: "120 req/min",  warning: "90%+ triggers throttle" },
              { label: "RPH (per hour)",    val: "3,000 req/hr", warning: "95%+ triggers block" },
              { label: "RPD (per day)",     val: "50,000 req/d", warning: "Resets at 00:00 PHT" },
            ].filter(r => !r.header).map(r => (
              <Card key={r.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className="text-lg font-bold tabular-nums text-foreground mt-1">{r.val}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{r.warning}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Usage Reports ───────────────────────────────────────────── */}
        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader className="px-5 pt-4 pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">API Usage by Credential</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                <Download className="h-3 w-3" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {["Credential","Environment","Requests","EIS Submissions","Rate Limited","Version","Usage Bar"].map(h => (
                        <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usageByCredential.map(c => {
                      const max = usageByCredential[0].requests;
                      const pct = Math.round(c.requests / max * 100);
                      return (
                        <tr key={c.name} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 pr-4 font-mono text-foreground font-medium">{c.name}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={c.name.startsWith("PROD") ? "default" : c.name.startsWith("SANDBOX") ? "secondary" : "outline"} className="text-[9px]">
                              {c.name.startsWith("PROD") ? "Production" : c.name.startsWith("SANDBOX") ? "Sandbox" : "Beta"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 tabular-nums">{c.requests.toLocaleString()}</td>
                          <td className="py-3 pr-4 tabular-nums">{c.eis.toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <span className={cn("tabular-nums", c.rateLimited > 20 ? "text-warning font-medium" : "text-muted-foreground")}>
                              {c.rateLimited}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="text-[9px] font-mono">{c.version}</Badge>
                          </td>
                          <td className="py-3 w-32">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-chart-1 rounded-full" style={{ width: `${pct}%`, background: "var(--chart-1)" }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
