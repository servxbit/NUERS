import {
  Activity, AlertCircle, CheckCircle2, Clock, Zap, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const trafficData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  requests: Math.floor(Math.random() * 50000) + 20000,
  errors: Math.floor(Math.random() * 300) + 50,
}));

const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: Math.floor(Math.random() * 10) + 8,
  p95: Math.floor(Math.random() * 30) + 30,
  p99: Math.floor(Math.random() * 50) + 60,
}));

const trafficConfig: ChartConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--destructive)" },
};

const latencyConfig: ChartConfig = {
  p50: { label: "P50", color: "var(--chart-2)" },
  p95: { label: "P95", color: "var(--chart-1)" },
  p99: { label: "P99", color: "var(--destructive)" },
};

const endpoints = [
  { method: "POST", path: "/api/v1/receipts", calls: "2.4M", latency: "12ms", p99: "48ms", errorRate: "0.01%", status: "healthy" },
  { method: "GET", path: "/api/v1/receipts/:id", calls: "1.8M", latency: "8ms", p99: "32ms", errorRate: "0.00%", status: "healthy" },
  { method: "POST", path: "/api/v1/verify", calls: "890K", latency: "15ms", p99: "55ms", errorRate: "0.02%", status: "healthy" },
  { method: "GET", path: "/api/v1/merchants/:id/stats", calls: "450K", latency: "22ms", p99: "78ms", errorRate: "0.03%", status: "healthy" },
  { method: "POST", path: "/api/v1/transactions/batch", calls: "120K", latency: "45ms", p99: "180ms", errorRate: "0.12%", status: "degraded" },
  { method: "POST", path: "/api/v1/z-readings", calls: "18K", latency: "38ms", p99: "120ms", errorRate: "0.00%", status: "healthy" },
];

const alerts = [
  { id: "a1", severity: "warning", message: "POST /api/v1/transactions/batch — P99 latency elevated (180ms vs 100ms SLA)", time: "35 mins ago" },
  { id: "a2", severity: "info", message: "Rate limit reached for business account MCH-2024-089 — throttling applied", time: "2 hours ago" },
  { id: "a3", severity: "info", message: "Scheduled maintenance window: Sun 02:00–04:00 PHT", time: "1 day ago" },
];

export function ApiMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">API Monitoring</h1>
        <p className="text-sm text-muted-foreground">Real-time performance and health metrics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total API Calls", value: "284M", sub: "This month", icon: Zap, trend: "+12%" },
          { label: "Avg Response Time", value: "14ms", sub: "P95: 45ms", icon: Clock, trend: "-3ms" },
          { label: "Error Rate", value: "0.03%", sub: "Below 0.1% SLA", icon: AlertCircle, trend: "stable" },
          { label: "Uptime (30d)", value: "99.99%", sub: "2.6 min downtime", icon: Activity, trend: "✓" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">{s.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                <span className="text-[10px] text-success font-medium">{s.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traffic chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Traffic — Last 24 Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trafficConfig} className="min-h-[200px] w-full">
            <LineChart data={trafficData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="requests" stroke="var(--color-requests)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="errors" stroke="var(--color-errors)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Latency chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Response Latency Percentiles</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={latencyConfig} className="min-h-[200px] w-full">
            <LineChart data={latencyData} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} unit="ms" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="p50" stroke="var(--color-p50)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95" stroke="var(--color-p95)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99" stroke="var(--color-p99)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Endpoint table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Endpoint Health (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {["Endpoint", "Calls", "Avg Latency", "P99", "Error Rate", "Status"].map((h) => (
                    <th key={h} className="pb-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={ep.path} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={ep.method === "POST" ? "default" : "secondary"} className="text-[10px] font-mono w-10 justify-center">
                          {ep.method}
                        </Badge>
                        <span className="font-mono text-foreground">{ep.path}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground font-mono">{ep.calls}</td>
                    <td className="py-3 text-foreground font-mono">{ep.latency}</td>
                    <td className="py-3 text-foreground font-mono">{ep.p99}</td>
                    <td className="py-3 font-mono">
                      <span className={parseFloat(ep.errorRate) > 0.05 ? "text-destructive" : "text-success"}>
                        {ep.errorRate}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={ep.status === "healthy" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {ep.status === "healthy" ? (
                          <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                        ) : (
                          <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                        )}
                        {ep.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Alerts</CardTitle>
          <CardDescription>Recent performance and operational alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${alert.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
              {alert.severity === "warning" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-foreground">{alert.message}</p>
                <p className="mt-0.5 text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
