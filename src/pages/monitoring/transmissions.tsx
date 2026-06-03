import { useState } from "react";
import {
  Activity, CheckCircle2, XCircle, Clock, RefreshCw,
  Wifi, TrendingUp, TrendingDown, Zap, AlertCircle, Bell, Download,
  ChevronDown, ChevronRight, Eye, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const liveData = [
  { t: "14:30", tx: 2840, success: 2831, failed: 9 },
  { t: "14:31", tx: 3120, success: 3109, failed: 11 },
  { t: "14:32", tx: 2980, success: 2973, failed: 7 },
  { t: "14:33", tx: 3240, success: 3229, failed: 11 },
  { t: "14:34", tx: 3080, success: 3071, failed: 9 },
  { t: "14:35", tx: 2920, success: 2914, failed: 6 },
  { t: "14:36", tx: 3400, success: 3388, failed: 12 },
  { t: "14:37", tx: 3280, success: 3271, failed: 9 },
  { t: "14:38", tx: 3140, success: 3132, failed: 8 },
  { t: "14:39", tx: 2860, success: 2854, failed: 6 },
  { t: "14:40", tx: 3520, success: 3509, failed: 11 },
  { t: "14:41", tx: 3180, success: 3172, failed: 8 },
];

const slaData = [
  { hour: "08", met: 98.2, breached: 1.8 },
  { hour: "09", met: 97.8, breached: 2.2 },
  { hour: "10", met: 99.1, breached: 0.9 },
  { hour: "11", met: 98.9, breached: 1.1 },
  { hour: "12", met: 97.4, breached: 2.6 },
  { hour: "13", met: 98.8, breached: 1.2 },
  { hour: "14", met: 99.3, breached: 0.7 },
];

const retryQueue = [
  { id: "RTX-001842", taxpayer: "Metro Pacific Corp.", attempt: 3, error: "BIR-ERR-5001 Connection Timeout", nextRetry: "2 min", amount: "₱284,200" },
  { id: "RTX-001841", taxpayer: "Robinsons Land Corp.", attempt: 2, error: "BIR-ERR-4002 Invalid TIN Format", nextRetry: "5 min", amount: "₱98,400" },
  { id: "RTX-001840", taxpayer: "San Miguel Corp.", attempt: 1, error: "BIR-ERR-5003 Rate Limit Exceeded", nextRetry: "30 sec", amount: "₱1,840,000" },
  { id: "RTX-001839", taxpayer: "Ayala Corp.", attempt: 4, error: "BIR-ERR-5001 Connection Timeout", nextRetry: "10 min", amount: "₱480,600" },
  { id: "RTX-001838", taxpayer: "First Pacific Co.", attempt: 2, error: "BIR-ERR-4008 Schema Validation Error", nextRetry: "3 min", amount: "₱128,400" },
];

const incidents = [
  { id: "INC-2026-0084", title: "Acknowledgement Handler Latency Spike", severity: "medium", status: "investigating", time: "14:22", affected: "2,840 txns" },
  { id: "INC-2026-0083", title: "BIR EIS Rate Limit Threshold Reached", severity: "low", status: "resolved", time: "12:15", affected: "312 txns" },
  { id: "INC-2026-0082", title: "Certificate Renewal Warning - 45 Days", severity: "low", status: "monitoring", time: "09:00", affected: "0 txns" },
  { id: "INC-2026-0081", title: "Transmission Queue Spike - 10K pending", severity: "high", status: "resolved", time: "Yesterday", affected: "10,240 txns" },
];

const serviceHealth = [
  { name: "BIR EIS API", health: 99.8, status: "ok" },
  { name: "Queue Engine", health: 99.9, status: "ok" },
  { name: "Retry Engine", health: 98.2, status: "ok" },
  { name: "Ack Handler", health: 92.4, status: "degraded" },
  { name: "Archive Svc", health: 99.7, status: "ok" },
  { name: "Compliance", health: 99.5, status: "ok" },
];

const liveConfig: ChartConfig = {
  tx: { label: "Total", color: "var(--chart-1)" },
  success: { label: "Success", color: "var(--chart-4)" },
  failed: { label: "Failed", color: "var(--chart-5)" },
};

const slaConfig: ChartConfig = {
  met: { label: "SLA Met (%)", color: "var(--chart-4)" },
  breached: { label: "SLA Breached (%)", color: "var(--chart-5)" },
};

function SeverityBadge({ sev }: { sev: string }) {
  if (sev === "high") return <Badge variant="destructive" className="text-xs">High</Badge>;
  if (sev === "medium") return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Medium</Badge>;
  return <Badge variant="secondary" className="text-xs">Low</Badge>;
}

function IncidentStatusBadge({ status }: { status: string }) {
  if (status === "investigating") return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">Investigating</Badge>;
  if (status === "monitoring") return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Monitoring</Badge>;
  if (status === "resolved") return <Badge className="bg-success/15 text-success border-success/30 text-xs">Resolved</Badge>;
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

export function TransmissionMonitoringCenter() {
  const [expandedRetry, setExpandedRetry] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transmission Monitoring Center</h1>
          <p className="text-sm text-muted-foreground">Real-time visibility into all EIS transmission pipelines and service health</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-success/15 text-success border-success/30">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
            Live Monitoring
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-3.5 w-3.5" /> Configure Alerts
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Live TPS", value: "3,180", delta: "+420", up: true, icon: Activity, color: "text-primary" },
          { label: "Success Rate", value: "99.87%", delta: "+0.02%", up: true, icon: CheckCircle2, color: "text-success" },
          { label: "Failure Rate", value: "0.13%", delta: "-0.02%", up: false, icon: XCircle, color: "text-destructive" },
          { label: "Queue Depth", value: "1,847", delta: "+203", up: true, icon: Clock, color: "text-warning" },
          { label: "API Latency", value: "142ms", delta: "-8ms", up: false, icon: Zap, color: "text-success" },
          { label: "BIR Uptime", value: "99.98%", delta: "0.00%", up: true, icon: Wifi, color: "text-success" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground leading-tight mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                  <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${kpi.up ? "text-success" : "text-success"}`}>
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.delta}
                  </p>
                </div>
                <kpi.icon className={`h-5 w-5 shrink-0 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="live">
        <TabsList className="h-9">
          <TabsTrigger value="live" className="text-xs">Live Feed</TabsTrigger>
          <TabsTrigger value="retry" className="text-xs">
            Retry Queue
            <Badge variant="destructive" className="ml-1.5 h-4 text-[10px]">5</Badge>
          </TabsTrigger>
          <TabsTrigger value="sla" className="text-xs">SLA Monitor</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs">
            Incidents
            <Badge className="ml-1.5 h-4 text-[10px] bg-warning/15 text-warning-foreground border-warning/30">1</Badge>
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="text-xs">Exceptions</TabsTrigger>
          <TabsTrigger value="health" className="text-xs">Service Health</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Live Transaction Feed (per minute)
                  <Badge variant="secondary" className="text-xs">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success animate-pulse inline-block" />
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={liveConfig} className="h-52">
                  <AreaChart data={liveData}>
                    <defs>
                      <linearGradient id="tx-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="s-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="var(--border)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="tx" stroke="var(--chart-1)" fill="url(#tx-g)" strokeWidth={2} />
                    <Area type="monotone" dataKey="success" stroke="var(--chart-4)" fill="url(#s-g)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">SLA Compliance by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={slaConfig} className="h-52">
                  <BarChart data={slaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--border)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" unit="%" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="met" fill="var(--chart-4)" radius={[3, 3, 0, 0]} stackId="sla" />
                    <Bar dataKey="breached" fill="var(--chart-5)" radius={[0, 0, 0, 0]} stackId="sla" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent live events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live Event Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 max-h-64 overflow-y-auto">
                {[
                  { time: "14:41:32", event: "TX-2026-848291 → BIR-EIS-2026-0481923 ACCEPTED", type: "success" },
                  { time: "14:41:31", event: "TX-2026-848290 → BIR-EIS-2026-0481922 ACCEPTED", type: "success" },
                  { time: "14:41:28", event: "TX-2026-848289 REJECTED - BIR-ERR-4012 VAT Rate Mismatch", type: "error" },
                  { time: "14:41:25", event: "TX-2026-848288 → BIR-EIS-2026-0481920 ACCEPTED", type: "success" },
                  { time: "14:41:22", event: "RTX-001842 Retry Attempt 3 - Queued for retry in 2 min", type: "warn" },
                  { time: "14:41:18", event: "TX-2026-848287 Submitted to BIR EIS - Awaiting ACK", type: "info" },
                  { time: "14:41:14", event: "TX-2026-848286 → BIR-EIS-2026-0481919 ACCEPTED", type: "success" },
                  { time: "14:41:10", event: "Certificate Authority: CRL Updated Successfully", type: "info" },
                  { time: "14:41:05", event: "Rate Limit: 284,080/300,000 daily limit (94.7% used)", type: "warn" },
                  { time: "14:41:00", event: "TX-2026-848285 → BIR-EIS-2026-0481918 ACCEPTED", type: "success" },
                ].map((ev, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-2.5 border-b last:border-0 text-xs ${ev.type === "error" ? "bg-destructive/5" : ev.type === "warn" ? "bg-warning/5" : ""}`}>
                    <span className="font-mono text-muted-foreground shrink-0">{ev.time}</span>
                    <span className={`font-mono ${ev.type === "error" ? "text-destructive" : ev.type === "warn" ? "text-warning-foreground" : ev.type === "success" ? "text-success" : "text-foreground"}`}>
                      {ev.event}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retry" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                Retry Queue
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-8 px-4 py-2.5" />
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Retry ID</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Taxpayer</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Attempt #</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Error</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Next Retry</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {retryQueue.map((r) => (
                    <>
                      <tr key={r.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedRetry(expandedRetry === r.id ? null : r.id)}>
                        <td className="px-4 py-3">
                          {expandedRetry === r.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-primary">{r.id}</td>
                        <td className="px-4 py-3 font-medium">{r.taxpayer}</td>
                        <td className="px-4 py-3">
                          <Badge variant={r.attempt >= 4 ? "destructive" : "secondary"} className="text-xs">
                            {r.attempt} / 5
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-destructive font-mono max-w-[200px] truncate">{r.error}</td>
                        <td className="px-4 py-3 text-warning-foreground font-medium">{r.nextRetry}</td>
                        <td className="px-4 py-3 text-right font-medium">{r.amount}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => e.stopPropagation()}>
                            <RefreshCw className="h-3 w-3" /> Retry
                          </Button>
                        </td>
                      </tr>
                      {expandedRetry === r.id && (
                        <tr className="bg-muted/20 border-b">
                          <td colSpan={8} className="px-8 py-3">
                            <p className="text-xs text-muted-foreground mb-1">Full Error Details:</p>
                            <p className="font-mono text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/20">{r.error}<br />Stack: transmission_queue.retry_processor:248 → bir_eis_client.submit:102 → connection_pool.acquire:58</p>
                            <p className="text-xs text-muted-foreground mt-2">Exponential backoff: {r.attempt === 1 ? "30s" : r.attempt === 2 ? "2m" : r.attempt === 3 ? "5m" : r.attempt === 4 ? "15m" : "30m"} delay between attempts</p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "SLA Target", value: "< 500ms", desc: "EIS submission response" },
              { label: "Current P95", value: "252ms", desc: "Within SLA target" },
              { label: "SLA Breaches", value: "14", desc: "Last 24 hours" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">SLA Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { svc: "Invoice Submission", target: "< 500ms", actual: "142ms", met: 99.8 },
                  { svc: "Acknowledgement Processing", target: "< 2000ms", actual: "680ms", met: 99.1 },
                  { svc: "Digital Signature", target: "< 200ms", actual: "45ms", met: 100 },
                  { svc: "Compliance Validation", target: "< 300ms", actual: "92ms", met: 99.9 },
                  { svc: "Archive Storage", target: "< 1000ms", actual: "156ms", met: 100 },
                ].map((s) => (
                  <div key={s.svc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.svc}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">Target: {s.target}</span>
                        <span className="font-medium text-success">{s.actual}</span>
                        <span className="font-bold">{s.met}%</span>
                      </div>
                    </div>
                    <Progress value={s.met} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-4">
          {/* Incident Tracking */}
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Card key={inc.id} className={inc.status === "investigating" ? "border-warning/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${inc.status === "investigating" ? "text-warning" : inc.status === "resolved" ? "text-success" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold">{inc.title}</span>
                        <SeverityBadge sev={inc.severity} />
                        <IncidentStatusBadge status={inc.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>ID: {inc.id}</span>
                        <span>Time: {inc.time}</span>
                        <span>Affected: {inc.affected}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 gap-1">
                        <Eye className="h-3.5 w-3.5" /> RCA
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0 gap-1">
                        Create Ticket
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Root Cause Analysis */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Root Cause Analysis — INC-2026-0084</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Root Cause", value: "ACK handler thread pool exhausted under peak load (14:20–14:25 PHT)" },
                  { label: "Contributing Factor", value: "Insufficient thread pool sizing for >3,000 TPS sustained load" },
                  { label: "Impact", value: "2,840 transactions delayed avg 340ms; 0 transactions lost" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-muted/30 border border-border/60">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xs text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Corrective Actions</p>
                <div className="space-y-1.5">
                  {[
                    { action: "Increase ACK handler thread pool from 128 → 512", owner: "Platform Ops", status: "in-progress", due: "Jun 1" },
                    { action: "Add horizontal pod autoscaling for ACK handler service", owner: "DevOps", status: "planned", due: "Jun 5" },
                    { action: "Implement circuit breaker on BIR EIS connection pool", owner: "Backend", status: "planned", due: "Jun 10" },
                  ].map((a) => (
                    <div key={a.action} className="flex items-center gap-3 text-xs">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === "in-progress" ? "bg-warning" : "bg-muted-foreground/40"}`} />
                      <span className="flex-1">{a.action}</span>
                      <span className="text-muted-foreground">{a.owner}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.due}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticketing System */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Ticketing System</CardTitle>
                <Button size="sm" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> New Ticket</Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">Ticket</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">Title</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">Priority</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">Assignee</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">Status</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[10px] uppercase">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "TKT-0284", title: "ACK Handler Thread Pool Exhaustion", priority: "high", assignee: "Platform Ops", status: "in-progress", sla: "2h remaining" },
                    { id: "TKT-0283", title: "BIR Rate Limit Daily Quota Breach", priority: "medium", assignee: "Integration Team", status: "resolved", sla: "Met" },
                    { id: "TKT-0282", title: "Certificate Renewal Task Scheduling", priority: "low", assignee: "Crypto Team", status: "open", sla: "8h remaining" },
                    { id: "TKT-0281", title: "Transmission Queue Spike — Root Cause", priority: "high", assignee: "Backend", status: "resolved", sla: "Met" },
                  ].map((t, i) => (
                    <tr key={t.id} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-primary">{t.id}</td>
                      <td className="px-4 py-2.5 font-medium">{t.title}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-[10px] border ${t.priority === "high" ? "bg-destructive/15 text-destructive border-destructive/30" : t.priority === "medium" ? "bg-warning/15 text-warning-foreground border-warning/30" : "bg-muted text-muted-foreground border-border"}`}>{t.priority}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.assignee}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-[10px] border ${t.status === "resolved" ? "bg-success/15 text-success border-success/30" : t.status === "in-progress" ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.sla}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Escalation Workflow */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Escalation Workflow</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                {[
                  { trigger: "API Downtime > 5min", l1: "On-call Ops (SMS)", l2: "Platform Lead (Call)", l3: "CTO (Call)", timing: "0 → +5min → +15min" },
                  { trigger: "Failure Rate > 5%", l1: "Ops Team (Teams)", l2: "BIR Lead (Email)", l3: "ESP Manager (SMS)", timing: "0 → +10min → +30min" },
                  { trigger: "Security Incident", l1: "SOC Team (SMS)", l2: "CISO (Call)", l3: "CEO (Call)", timing: "0 → +5min → +10min" },
                ].map((e) => (
                  <div key={e.trigger} className="p-3 rounded-lg border border-border/60 bg-muted/20">
                    <p className="text-xs font-semibold text-foreground mb-2">{e.trigger}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      {[e.l1, e.l2, e.l3].map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`px-2 py-0.5 rounded border ${i === 0 ? "bg-primary/10 border-primary/30 text-primary" : i === 1 ? "bg-warning/10 border-warning/30 text-warning-foreground" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                            L{i + 1}: {l}
                          </div>
                          {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      ))}
                      <span className="text-muted-foreground ml-1">({e.timing})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exceptions" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Exceptions", value: "142", delta: "-18%", up: false, cls: "text-destructive" },
              { label: "BIR Schema Errors", value: "63", delta: "-24%", up: false, cls: "text-destructive" },
              { label: "Timeout Errors", value: "48", delta: "-8%", up: false, cls: "text-warning-foreground" },
              { label: "Auto-Resolved", value: "112", delta: "+5%", up: true, cls: "text-success" },
            ].map((k) => (
              <Card key={k.label} className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.cls}`}>{k.value}</p>
                  <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${k.up ? "text-success" : "text-destructive"}`}>
                    {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {k.delta} vs yesterday
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Exception Monitor — Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Error Code</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Description</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Count</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Resolved</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Last Seen</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: "BIR-ERR-5001", desc: "Connection Timeout", cat: "Network", count: 48, resolved: 41, last: "14:41", trend: "down" },
                    { code: "BIR-ERR-4002", desc: "Invalid TIN Format", cat: "Schema", count: 31, resolved: 28, last: "14:38", trend: "down" },
                    { code: "BIR-ERR-4012", desc: "VAT Rate Mismatch", cat: "Validation", count: 24, resolved: 22, last: "14:41", trend: "stable" },
                    { code: "BIR-ERR-5003", desc: "Rate Limit Exceeded", cat: "Throttle", count: 18, resolved: 18, last: "12:15", trend: "down" },
                    { code: "BIR-ERR-4008", desc: "Schema Validation Error", cat: "Schema", count: 12, resolved: 9, last: "14:31", trend: "up" },
                    { code: "BIR-ERR-4021", desc: "Duplicate Invoice Submission", cat: "Business", count: 9, resolved: 9, last: "13:45", trend: "stable" },
                  ].map((e, i) => (
                    <tr key={e.code} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-destructive">{e.code}</td>
                      <td className="px-4 py-2.5 font-medium">{e.desc}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{e.cat}</Badge></td>
                      <td className="px-4 py-2.5 text-right font-semibold">{e.count}</td>
                      <td className="px-4 py-2.5 text-right text-success">{e.resolved}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{e.last}</td>
                      <td className="px-4 py-2.5">
                        {e.trend === "down" ? <TrendingDown className="h-3.5 w-3.5 text-success" /> : e.trend === "up" ? <TrendingUp className="h-3.5 w-3.5 text-destructive" /> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceHealth.map((svc) => (
              <Card key={svc.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">{svc.name}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${svc.status === "ok" ? "bg-success animate-pulse" : "bg-warning"}`} />
                  </div>
                  <Progress value={svc.health} className="h-3 mb-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Health Score</span>
                    <span className={`font-bold ${svc.health >= 99 ? "text-success" : svc.health >= 95 ? "text-warning-foreground" : "text-destructive"}`}>
                      {svc.health}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
