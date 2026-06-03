import { useState } from "react";
import {
  Bell, Mail, MessageSquare, Webhook, AlertTriangle, CheckCircle2,
  XCircle, Settings, Plus, Trash2, Edit, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const channels = [
  { id: "email", name: "Email", icon: Mail, enabled: true, count: "12,847 subscribers" },
  { id: "sms", name: "SMS", icon: MessageSquare, enabled: true, count: "8,420 subscribers" },
  { id: "push", name: "Push Notifications", icon: Bell, enabled: true, count: "6,284 devices" },
  { id: "teams", name: "Microsoft Teams", icon: MessageSquare, enabled: true, count: "3 workspaces" },
  { id: "slack", name: "Slack", icon: MessageSquare, enabled: false, count: "Not configured" },
  { id: "webhook", name: "Webhooks", icon: Webhook, enabled: true, count: "28 endpoints" },
];

const alertRules = [
  { id: "ALR-001", name: "Invoice Submission Confirmation", trigger: "Invoice submitted to BIR EIS", channel: ["Email", "Push"], severity: "info", recipients: "Taxpayer", status: "active" },
  { id: "ALR-002", name: "Failed Transmission Alert", trigger: "EIS transmission fails", channel: ["Email", "SMS"], severity: "high", recipients: "Taxpayer, Admin", status: "active" },
  { id: "ALR-003", name: "BIR API Downtime", trigger: "BIR EIS API unavailable > 2 min", channel: ["Email", "SMS", "Teams"], severity: "critical", recipients: "Ops Team", status: "active" },
  { id: "ALR-004", name: "Security Event Detection", trigger: "Failed login > 3 attempts", channel: ["Email", "SMS"], severity: "high", recipients: "Security Team", status: "active" },
  { id: "ALR-005", name: "Compliance Violation", trigger: "Taxpayer compliance score < 80%", channel: ["Email"], severity: "medium", recipients: "Compliance Team", status: "active" },
  { id: "ALR-006", name: "Rate Limit Warning", trigger: "API rate limit > 90% capacity", channel: ["Slack", "Teams"], severity: "medium", recipients: "Platform Ops", status: "inactive" },
  { id: "ALR-007", name: "Certificate Expiry Warning", trigger: "Digital cert expiring < 90 days", channel: ["Email", "Teams"], severity: "high", recipients: "Crypto Team", status: "active" },
  { id: "ALR-008", name: "Daily Transmission Summary", trigger: "Scheduled: Daily 23:59", channel: ["Email"], severity: "info", recipients: "All Admins", status: "active" },
];

const recentNotifs = [
  { id: "NTF-00842", time: "14:41", type: "error", title: "Failed Transmission Alert", body: "TX-2026-848289 rejected by BIR EIS — BIR-ERR-4012 VAT Rate Mismatch", channel: "Email + SMS", recipient: "BDO Unibank, Inc." },
  { id: "NTF-00841", time: "14:40", type: "success", title: "Invoice Submission Confirmed", body: "TX-2026-848291 accepted by BIR EIS — Ref: BIR-EIS-2026-0481923", channel: "Email", recipient: "SM Prime Holdings" },
  { id: "NTF-00840", time: "14:35", type: "warning", title: "Rate Limit Warning", body: "Daily BIR API rate limit at 94.7% — 284,080 / 300,000 requests", channel: "Teams", recipient: "Platform Ops" },
  { id: "NTF-00839", time: "14:22", type: "info", title: "Incident Created", body: "INC-2026-0084 opened — Acknowledgement Handler Latency Spike", channel: "Email + Teams", recipient: "Ops Team" },
  { id: "NTF-00838", time: "13:00", type: "info", title: "Scheduled Report Sent", body: "Morning EIS Summary Report dispatched to 8 admin recipients", channel: "Email", recipient: "All Admins" },
  { id: "NTF-00837", time: "12:15", type: "success", title: "Incident Resolved", body: "INC-2026-0083 resolved — BIR Rate Limit threshold reset", channel: "Email + SMS", recipient: "Ops Team" },
];

const escalationRules = [
  { trigger: "API Downtime > 5 min", level1: "On-call Ops (SMS)", level2: "Platform Manager (Call)", level3: "CTO (Call)", delay: "Immediate → +5min → +15min" },
  { trigger: "Transmission Failure Rate > 5%", level1: "Ops Team (Teams)", level2: "BIR Integration Lead (Email)", level3: "ESP Account Manager (SMS)", delay: "Immediate → +10min → +30min" },
  { trigger: "Security Incident", level1: "SOC Team (SMS + Email)", level2: "CISO (Call)", level3: "CEO (Call)", delay: "Immediate → +5min → +10min" },
];

function SeverityBadge({ sev }: { sev: string }) {
  const map: Record<string, string> = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-destructive/15 text-destructive border-destructive/30",
    medium: "bg-warning/15 text-warning-foreground border-warning/30",
    info: "bg-primary/10 text-primary border-primary/30",
  };
  return <Badge className={`text-xs border ${map[sev] || "bg-muted text-muted-foreground"}`}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</Badge>;
}

function NotifTypeIcon({ type }: { type: string }) {
  if (type === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  if (type === "success") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <Bell className="h-4 w-4 text-primary" />;
}

export function NotificationCenter() {
  const [addRuleOpen, setAddRuleOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification & Alerting Center</h1>
          <p className="text-sm text-muted-foreground">Multi-channel notifications, alert rules, and escalation workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-3.5 w-3.5" /> Configure
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setAddRuleOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Alert Rule
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Notifications Today", value: "8,420", icon: Bell, color: "text-primary" },
          { label: "Active Alert Rules", value: "7", icon: Zap, color: "text-success" },
          { label: "Critical Alerts", value: "0", icon: AlertTriangle, color: "text-muted-foreground" },
          { label: "Delivery Rate", value: "99.94%", icon: CheckCircle2, color: "text-success" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="channels">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="channels" className="text-xs">Channels</TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">Alert Rules</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Delivery Analytics</TabsTrigger>
          <TabsTrigger value="automation" className="text-xs">Automation</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          <TabsTrigger value="escalation" className="text-xs">Escalation</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch) => (
              <Card key={ch.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ch.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">{ch.count}</p>
                      </div>
                    </div>
                    <Switch checked={ch.enabled} onCheckedChange={() => toast.success(`${ch.name} ${ch.enabled ? "disabled" : "enabled"}`)} />
                  </div>
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between">
                    <Badge className={ch.enabled ? "bg-success/15 text-success border-success/30 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                      {ch.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Settings className="h-3 w-3" /> Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rule Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trigger</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channels</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipients</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alertRules.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-background border-b" : "bg-muted/20 border-b"}>
                      <td className="px-4 py-3 font-mono text-primary">{r.id}</td>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{r.trigger}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.channel.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3"><SeverityBadge sev={r.severity} /></td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{r.recipients}</td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === "active" ? "bg-success/15 text-success border-success/30 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Invoice Submission Confirmed", category: "Invoice", channels: ["Email", "Push"], desc: "Sent when BIR accepts an invoice submission" },
              { name: "Transmission Failed", category: "EIS", channels: ["Email", "SMS"], desc: "Sent when a BIR transmission fails with error code" },
              { name: "BIR API Downtime", category: "Operations", channels: ["Email", "SMS", "Teams"], desc: "Sent when BIR EIS API is unreachable > 2 minutes" },
              { name: "Security Incident Detected", category: "Security", channels: ["SMS", "Email"], desc: "Triggered by SOC on security event detection" },
              { name: "Compliance Violation", category: "Compliance", channels: ["Email"], desc: "Sent when taxpayer compliance score drops below threshold" },
              { name: "Certificate Expiry Warning", category: "Certificate", channels: ["Email", "Teams"], desc: "Alert 90, 30, and 7 days before cert expiry" },
              { name: "Daily EIS Summary", category: "Report", channels: ["Email"], desc: "Scheduled daily summary of EIS transmission stats" },
              { name: "Rate Limit Warning", category: "API", channels: ["Slack", "Teams"], desc: "Sent when API rate limit exceeds 90% of quota" },
              { name: "Backup Completed", category: "BCDR", channels: ["Email"], desc: "Daily backup job completion notification" },
            ].map((t) => (
              <Card key={t.name} className="border border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">{t.category}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2 flex-shrink-0">Use</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{t.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.channels.map((c) => <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">{c}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Sent Today", value: "8,420", sub: "+12% vs yesterday", cls: "text-primary" },
              { label: "Delivery Rate", value: "99.94%", sub: "3 failed", cls: "text-success" },
              { label: "Open Rate (Email)", value: "74.2%", sub: "Industry avg: 42%", cls: "text-success" },
              { label: "SMS Delivery", value: "99.81%", sub: "GLOBE/SMART", cls: "text-success" },
            ].map((k) => (
              <Card key={k.label} className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${k.cls}`}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Delivery Analytics by Channel</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                {[
                  { channel: "Email",              sent: 5847, delivered: 5844, opened: 4337, failed: 3, rate: 99.95 },
                  { channel: "SMS",                sent: 1240, delivered: 1238, opened: 1238, failed: 2, rate: 99.84 },
                  { channel: "Push Notifications", sent: 892,  delivered: 891,  opened: 612,  failed: 1, rate: 99.89 },
                  { channel: "Microsoft Teams",    sent: 284,  delivered: 284,  opened: 271,  failed: 0, rate: 100.0 },
                  { channel: "Webhooks",           sent: 157,  delivered: 157,  opened: 157,  failed: 0, rate: 100.0 },
                ].map((c) => (
                  <div key={c.channel} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium w-40">{c.channel}</span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{c.sent.toLocaleString()} sent</span>
                        <span className="text-success">{c.delivered.toLocaleString()} delivered</span>
                        {c.failed > 0 && <span className="text-destructive">{c.failed} failed</span>}
                        <span className="font-bold text-foreground">{c.rate}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${c.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Reminder Engine", desc: "Automated reminder sequences for pending taxpayer actions — 3-day, 7-day, 14-day cycles", icon: Bell, active: true },
              { title: "Approval Workflow Notifications", desc: "Notify approvers and requesters at each stage of approval workflows", icon: CheckCircle2, active: true },
              { title: "Scheduled Reports", desc: "Automatic report generation and email delivery on configurable schedules", icon: Zap, active: true },
              { title: "Escalation Automation", desc: "Auto-escalate unacknowledged critical alerts based on SLA thresholds", icon: AlertTriangle, active: true },
            ].map((a) => (
              <Card key={a.title} className="border border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <a.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">{a.title}</p>
                        <Switch checked={a.active} onCheckedChange={() => toast.success("Automation updated")} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Scheduled Notifications</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Schedule</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Channel</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Last Run</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Daily EIS Summary", schedule: "Daily 23:59", channel: "Email", last: "May 28, 2026", status: "active" },
                    { name: "Weekly Compliance Report", schedule: "Mon 08:00", channel: "Email", last: "May 26, 2026", status: "active" },
                    { name: "Monthly VAT Filing Reminder", schedule: "10th of month", channel: "Email + SMS", last: "May 10, 2026", status: "active" },
                    { name: "Quarterly Audit Report", schedule: "First Mon of Qtr", channel: "Email", last: "Apr 1, 2026", status: "active" },
                  ].map((s, i) => (
                    <tr key={s.name} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{s.schedule}</td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="text-[10px]">{s.channel}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.last}</td>
                      <td className="px-4 py-2.5"><Badge className="text-[10px] bg-success/15 text-success border-success/30">{s.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="space-y-2">
            {recentNotifs.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <NotifTypeIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <span className="text-xs text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{n.body}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">To: <span className="font-medium text-foreground">{n.recipient}</span></span>
                        <span className="text-muted-foreground">Via: <span className="font-medium text-foreground">{n.channel}</span></span>
                      </div>
                    </div>
                    <Badge className="bg-success/15 text-success border-success/30 text-xs shrink-0">Delivered</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="escalation" className="mt-4 space-y-4">
          <div className="space-y-3">
            {escalationRules.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold mb-1">Trigger: <span className="text-destructive">{r.trigger}</span></p>
                    <p className="text-xs text-muted-foreground">Timing: {r.delay}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[r.level1, r.level2, r.level3].map((l, j) => (
                      <div key={j} className="flex items-center gap-1">
                        <Badge variant={j === 0 ? "default" : "secondary"} className="text-xs">L{j + 1}: {l}</Badge>
                        {j < 2 && <span className="text-muted-foreground text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">On-Call Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {[
                  { role: "Platform Ops", name: "Marco Santos", contact: "+63 917 123 4567", until: "May 30, 2026 08:00" },
                  { role: "BIR Integration", name: "Ana Reyes", contact: "+63 918 234 5678", until: "Jun 2, 2026 08:00" },
                  { role: "Security SOC", name: "Juan Dela Cruz", contact: "+63 919 345 6789", until: "May 30, 2026 20:00" },
                ].map((s) => (
                  <div key={s.role} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{s.role}</p>
                      <p className="text-muted-foreground">{s.name} — {s.contact}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-success/15 text-success border-success/30 text-xs">On Call</Badge>
                      <p className="text-muted-foreground mt-0.5">Until {s.until}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Rule Name</Label>
              <Input placeholder="e.g. Invoice Rejection Alert" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trigger Condition</Label>
              <Input placeholder="e.g. EIS transmission fails" className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Channel</Label>
                <Select>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddRuleOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => { toast.success("Alert rule created"); setAddRuleOpen(false); }}>
                Create Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
