import {
  Shield, CheckCircle2, Clock, RefreshCw,
  Database, Zap, Eye,
  Download, Play, Server,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const bcdrStats = [
  { label: "RTO Target", value: "4 Hours", sub: "Current: 2.3 hrs actual", icon: Clock, color: "text-success" },
  { label: "RPO Target", value: "1 Hour", sub: "Current: 22 min actual", icon: Database, color: "text-success" },
  { label: "Backup Health", value: "100%", sub: "All systems backed up", icon: CheckCircle2, color: "text-success" },
  { label: "DR Readiness", value: "96.8%", sub: "Last tested: May 28", icon: Shield, color: "text-success" },
];

const backupJobs = [
  { name: "NUERS Database — Full Backup", type: "Full", schedule: "Daily 02:00", lastRun: "2026-05-29 02:00", size: "284 GB", status: "success", duration: "1h 48m" },
  { name: "Invoice Repository — Incremental", type: "Incremental", schedule: "Every 4 hrs", lastRun: "2026-05-29 12:00", size: "8.4 GB", status: "success", duration: "12m" },
  { name: "Audit Log Archive", type: "Incremental", schedule: "Every 2 hrs", lastRun: "2026-05-29 14:00", size: "1.2 GB", status: "success", duration: "4m" },
  { name: "Application Config Backup", type: "Full", schedule: "Weekly Sun 03:00", lastRun: "2026-05-25 03:00", size: "128 MB", status: "success", duration: "8m" },
  { name: "BIR EIS Integration Config", type: "Full", schedule: "Daily 03:00", lastRun: "2026-05-29 03:00", size: "24 MB", status: "success", duration: "2m" },
  { name: "PKI Certificate Store", type: "Full", schedule: "Daily 01:00", lastRun: "2026-05-29 01:00", size: "48 MB", status: "success", duration: "3m" },
];

const drSites = [
  { site: "Primary DC", location: "Mandaluyong, NCR", status: "active", latency: "0ms", capacity: "100%", services: "All" },
  { site: "DR Site A", location: "Cebu City, Central Visayas", status: "standby", latency: "28ms", capacity: "100%", services: "All" },
  { site: "DR Site B", location: "Davao City, Davao Region", status: "standby", latency: "42ms", capacity: "80%", services: "Core" },
  { site: "Cloud DR (AWS AP-SE-1)", location: "Singapore", status: "standby", latency: "18ms", capacity: "100%", services: "All" },
];

const drTests = [
  { date: "May 28, 2026", type: "Full DR Failover Test", result: "Pass", rto: "2h 18m", rpo: "22 min", score: "96.8%" },
  { date: "Apr 15, 2026", type: "Database Recovery Test", result: "Pass", rto: "45 min", rpo: "8 min", score: "99.2%" },
  { date: "Mar 1, 2026", type: "Tabletop Exercise", result: "Pass", rto: "N/A", rpo: "N/A", score: "100%" },
  { date: "Feb 12, 2026", type: "Application Failover Test", result: "Pass", rto: "1h 52m", rpo: "18 min", score: "98.1%" },
  { date: "Jan 8, 2026", type: "Full DR Failover Test", result: "Pass", rto: "2h 31m", rpo: "28 min", score: "95.4%" },
];

export function BCDRCenter() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Continuity & Disaster Recovery</h1>
          <p className="text-sm text-muted-foreground">Backup monitoring, DR infrastructure, failover management, and recovery testing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-3.5 w-3.5" /> Run DR Test
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> BC Plan Export
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-success/40 bg-success/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">All Systems Nominal — Business Continuity Ready</p>
              <p className="text-xs text-muted-foreground">Primary DC active. DR sites synchronized. Last full backup: 2026-05-29 02:00 — All checksums verified.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {bcdrStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="backup">
        <TabsList className="h-9">
          <TabsTrigger value="backup" className="text-xs">Backup Monitor</TabsTrigger>
          <TabsTrigger value="dr" className="text-xs">DR Infrastructure</TabsTrigger>
          <TabsTrigger value="rto" className="text-xs">RTO/RPO Metrics</TabsTrigger>
          <TabsTrigger value="tests" className="text-xs">Recovery Tests</TabsTrigger>
          <TabsTrigger value="playbooks" className="text-xs">Runbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="mt-4">
          <div className="space-y-3">
            {backupJobs.map((job) => (
              <Card key={job.name}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold">{job.name}</p>
                          <Badge variant="secondary" className="text-xs">{job.type}</Badge>
                          <Badge className="bg-success/15 text-success border-success/30 text-xs">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            Success
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Schedule: {job.schedule}</span>
                          <span>Last run: {job.lastRun}</span>
                          <span>Duration: {job.duration}</span>
                          <span>Size: {job.size}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 gap-1"
                      onClick={() => toast.success(`${job.name} verification started`)}>
                      <RefreshCw className="h-3 w-3" /> Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dr" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {drSites.map((site) => (
              <Card key={site.site} className={site.status === "active" ? "border-success/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${site.status === "active" ? "bg-success/10" : "bg-muted"}`}>
                        <Server className={`h-5 w-5 ${site.status === "active" ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{site.site}</p>
                        <p className="text-xs text-muted-foreground">{site.location}</p>
                      </div>
                    </div>
                    <Badge className={site.status === "active" ? "bg-success/15 text-success border-success/30 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                      {site.status === "active" ? "Active" : "Standby"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/40 rounded p-2">
                      <p className="text-muted-foreground">Latency</p>
                      <p className={`font-bold ${site.latency === "0ms" ? "text-success" : ""}`}>{site.latency}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-2">
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="font-bold">{site.capacity}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-2">
                      <p className="text-muted-foreground">Services</p>
                      <p className="font-bold">{site.services}</p>
                    </div>
                  </div>
                  {site.status === "standby" && (
                    <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs gap-2"
                      onClick={() => toast.info(`Failover to ${site.site} initiated (simulation)`)}>
                      <Zap className="h-3 w-3" /> Initiate Failover
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rto" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Recovery Time Objective (RTO)", target: "4 hours", actual: "2h 18m", pct: 58, status: "ok" },
              { label: "Recovery Point Objective (RPO)", target: "1 hour", actual: "22 minutes", pct: 37, status: "ok" },
              { label: "Mean Time to Detect (MTTD)", target: "5 minutes", actual: "2m 40s", pct: 53, status: "ok" },
              { label: "Mean Time to Restore (MTTR)", target: "30 minutes", actual: "18 minutes", pct: 60, status: "ok" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{m.label}</p>
                    <Badge className="bg-success/15 text-success border-success/30 text-xs">Within Target</Badge>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-sm font-medium">{m.target}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="text-lg font-bold text-success">{m.actual}</p>
                    </div>
                  </div>
                  <Progress value={100 - m.pct} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">{m.pct}% of target used — {100 - m.pct}% headroom remaining</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Result</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actual RTO</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actual RPO</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {drTests.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background border-b" : "bg-muted/20 border-b"}>
                      <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                      <td className="px-4 py-3 font-medium">{t.type}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-success/15 text-success border-success/30 text-xs">{t.result}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{t.rto}</td>
                      <td className="px-4 py-3 font-medium">{t.rpo}</td>
                      <td className="px-4 py-3 font-bold text-success">{t.score}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Download className="h-3 w-3" /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbooks" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "BIR EIS Outage Runbook", desc: "Step-by-step EIS connectivity recovery and failover procedure", lastUpdated: "May 2026", version: "v3.2" },
              { title: "Database Failure Recovery", desc: "Primary DB failure detection, failover to replica, and validation", lastUpdated: "Apr 2026", version: "v2.8" },
              { title: "Application Server Failover", desc: "Load balancer failover and application tier DR procedure", lastUpdated: "Mar 2026", version: "v2.5" },
              { title: "Ransomware Response Playbook", desc: "Incident isolation, backup restoration, and forensics procedure", lastUpdated: "May 2026", version: "v4.1" },
              { title: "Network Outage Recovery", desc: "ISP failover, BGP rerouting, and connectivity restoration", lastUpdated: "Feb 2026", version: "v2.1" },
              { title: "Complete Site Failover", desc: "Full primary DC to DR site failover procedure", lastUpdated: "May 2026", version: "v3.0" },
            ].map((pb) => (
              <Card key={pb.title} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{pb.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pb.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{pb.version}</Badge>
                      <span className="text-xs text-muted-foreground">Updated {pb.lastUpdated}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="h-3 w-3" /> View
                    </Button>
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
