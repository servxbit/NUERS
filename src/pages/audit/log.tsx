import { useState } from "react";
import {
  ClipboardList, Search, Download, Shield, User, FileText,
  Lock, Activity, ChevronDown, ChevronRight, Clock,
  Database, Key, Globe, SlidersHorizontal, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const eventTypes = {
  login:    { label: "Login",     icon: User,        cls: "bg-primary/10 text-primary border-primary/30" },
  logout:   { label: "Logout",    icon: User,        cls: "bg-muted text-muted-foreground border-border" },
  invoice:  { label: "Invoice",   icon: FileText,    cls: "bg-success/15 text-success border-success/30" },
  api:      { label: "API",       icon: Globe,       cls: "bg-primary/10 text-primary border-primary/30" },
  data:     { label: "Data",      icon: Database,    cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  security: { label: "Security",  icon: Shield,      cls: "bg-destructive/15 text-destructive border-destructive/30" },
  key:      { label: "Key Mgmt",  icon: Key,         cls: "bg-primary/10 text-primary border-primary/30" },
  system:   { label: "System",    icon: Activity,    cls: "bg-muted text-muted-foreground border-border" },
};

type EventType = keyof typeof eventTypes;

const logs = [
  { id: "LOG-00481923", time: "2026-05-29 14:41:32", user: "admin@bir.gov.ph", role: "BIR Admin", event: "login" as EventType, action: "User Login", detail: "Successful authentication via SSO", ip: "103.20.84.12", session: "SES-29842", risk: "low" },
  { id: "LOG-00481922", time: "2026-05-29 14:40:18", user: "ops@nuers.gov.ph", role: "Platform Ops", event: "invoice" as EventType, action: "Bulk Invoice Submission", detail: "Submitted 2,840 invoices to BIR EIS — Batch TX-BULK-20260529-0042", ip: "192.168.10.5", session: "SES-29841", risk: "low" },
  { id: "LOG-00481921", time: "2026-05-29 14:38:45", user: "sec@nuers.gov.ph", role: "Security", event: "security" as EventType, action: "Failed Login Attempt", detail: "3 consecutive failed login attempts from IP 103.20.84.99 — Account locked", ip: "103.20.84.99", session: null, risk: "high" },
  { id: "LOG-00481920", time: "2026-05-29 14:35:02", user: "api@smb.ph", role: "API User", event: "api" as EventType, action: "API Key Regenerated", detail: "Production API key rotated for business account SM-28400", ip: "203.112.84.21", session: "SES-29840", risk: "medium" },
  { id: "LOG-00481919", time: "2026-05-29 14:30:00", user: "cert@nuers.gov.ph", role: "Crypto", event: "key" as EventType, action: "Certificate Updated", detail: "BIR EIS TLS certificate renewed — CN=eis.bir.gov.ph, Valid: 2027-05-29", ip: "192.168.10.8", session: "SES-29839", risk: "low" },
  { id: "LOG-00481918", time: "2026-05-29 14:28:12", user: "admin@nuers.gov.ph", role: "Admin", event: "data" as EventType, action: "User Role Changed", detail: "Business account user john.doe@smb.ph promoted from Viewer → Approver", ip: "192.168.10.2", session: "SES-29838", risk: "medium" },
  { id: "LOG-00481917", time: "2026-05-29 14:22:08", user: "sys@nuers.gov.ph", role: "System", event: "system" as EventType, action: "Scheduled Backup Completed", detail: "Daily full backup completed — 2.84TB, SHA-256: a8f4e2c... — Archived to cold storage", ip: "192.168.1.100", session: "SYS", risk: "low" },
  { id: "LOG-00481916", time: "2026-05-29 14:18:40", user: "tax@ayala.ph", role: "Taxpayer", event: "invoice" as EventType, action: "Invoice Cancelled", detail: "INV-2026-0001820 cancelled by taxpayer — Reason: Duplicate Invoice", ip: "114.108.12.45", session: "SES-29837", risk: "low" },
];

const activityData = [
  { hour: "00", events: 284, security: 2 },
  { hour: "04", events: 168, security: 1 },
  { hour: "08", events: 1240, security: 8 },
  { hour: "10", events: 2840, security: 12 },
  { hour: "12", events: 3120, security: 15 },
  { hour: "14", events: 2680, security: 18 },
  { hour: "16", events: 2140, security: 10 },
  { hour: "18", events: 1480, security: 6 },
  { hour: "20", events: 820, security: 4 },
  { hour: "22", events: 420, security: 2 },
];

const actConfig: ChartConfig = {
  events: { label: "Events", color: "var(--chart-1)" },
  security: { label: "Security Events", color: "var(--chart-5)" },
};

function RiskBadge({ risk }: { risk: string }) {
  if (risk === "high") return <Badge variant="destructive" className="text-xs">High</Badge>;
  if (risk === "medium") return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Medium</Badge>;
  return <Badge className="bg-success/15 text-success border-success/30 text-xs">Low</Badge>;
}

function EventBadge({ ev }: { ev: EventType }) {
  const cfg = eventTypes[ev];
  return <Badge className={`text-xs border ${cfg.cls}`}>{cfg.label}</Badge>;
}

function LogRow({ log }: { log: typeof logs[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-2.5">
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </td>
        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.time}</td>
        <td className="px-4 py-2.5 text-xs font-medium">{log.user}</td>
        <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.role}</td>
        <td className="px-4 py-2.5"><EventBadge ev={log.event} /></td>
        <td className="px-4 py-2.5 text-xs font-medium">{log.action}</td>
        <td className="px-4 py-2.5 text-xs max-w-[200px] truncate text-muted-foreground">{log.detail}</td>
        <td className="px-4 py-2.5"><RiskBadge risk={log.risk} /></td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20 border-b">
          <td colSpan={8} className="px-8 py-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Log ID</p>
                <p className="text-xs font-mono font-medium">{log.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IP Address</p>
                <p className="text-xs font-mono font-medium">{log.ip}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="text-xs font-mono font-medium">{log.session || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="text-xs font-mono font-medium">{log.time}</p>
              </div>
            </div>
            <div className="bg-card border rounded p-3">
              <p className="text-xs text-muted-foreground mb-1">Full Event Detail:</p>
              <p className="text-xs font-mono">{log.detail}</p>
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Clock className="h-3 w-3" /> Full Timeline
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" /> Export Log
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AuditLogManagement() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log Management</h1>
          <p className="text-sm text-muted-foreground">Immutable, tamper-evident audit trail for all system events</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-success/15 text-success border-success/30 text-xs">
            <Lock className="h-3 w-3 mr-1" /> Immutable Logs
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
            SHA-256 Tamper Detection
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Download className="h-3.5 w-3.5" /> Export Audit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Events Today", value: "18,284", icon: ClipboardList, color: "text-primary" },
          { label: "Security Events", value: "78", icon: Shield, color: "text-destructive" },
          { label: "Data Changes", value: "2,840", icon: Database, color: "text-warning" },
          { label: "API Transactions", value: "12,481", icon: Globe, color: "text-primary" },
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

      <Tabs defaultValue="logs">
        <TabsList className="h-9">
          <TabsTrigger value="logs" className="text-xs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security Events</TabsTrigger>
          <TabsTrigger value="investigation" className="text-xs">Investigation</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader className="pb-2 px-5 pt-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm font-semibold">System Audit Trail</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowFilters((v) => !v)}>
                      <SlidersHorizontal className="h-3.5 w-3.5" /> Advanced Filters
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-0 basis-full sm:min-w-[180px] sm:basis-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search by user, IP, action, detail..." className="h-8 pl-9 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
                  </div>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="All Events" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {Object.entries(eventTypes).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="h-8 w-full text-xs sm:w-28"><SelectValue placeholder="All Risk" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {showFilters && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">User / Email</label>
                      <Input placeholder="user@domain.ph" className="h-7 text-xs" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">Date From</label>
                      <Input type="date" className="h-7 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">Date To</label>
                      <Input type="date" className="h-7 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" className="h-7 text-xs w-full" onClick={() => { setUserFilter(""); setDateFrom(""); setDateTo(""); setShowFilters(false); }}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="w-8 px-4 py-2.5" />
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Timestamp</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Action</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Detail</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => <LogRow key={log.id} log={log} />)}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">Showing 8 of 18,284 events</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs">Previous</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Event Activity by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={actConfig} className="h-52">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="ev-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="events" stroke="var(--chart-1)" fill="url(#ev-g)" strokeWidth={2} />
                  <Area type="monotone" dataKey="security" stroke="var(--chart-5)" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(eventTypes).map(([k, v]) => (
              <Card key={k}>
                <CardContent className="p-4 text-center">
                  <v.icon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{v.label}</p>
                  <p className="text-lg font-bold mt-0.5">{Math.floor(Math.random() * 5000 + 100)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="space-y-3">
            {[
              { time: "14:38:45", event: "Failed Login — 3 consecutive attempts", user: "Unknown (IP: 103.20.84.99)", risk: "high", resolved: false },
              { time: "13:21:08", event: "Privilege Escalation Detected — Role change logged", user: "admin@nuers.gov.ph", risk: "medium", resolved: true },
              { time: "11:45:22", event: "API Key accessed from new IP location", user: "api@smb.ph", risk: "medium", resolved: true },
              { time: "09:12:33", event: "Suspicious bulk export — 50,000 records", user: "user@enterprise.ph", risk: "high", resolved: false },
              { time: "08:02:15", event: "TLS certificate warning — Expires in 45 days", user: "SYSTEM", risk: "low", resolved: false },
            ].map((ev, i) => (
              <Card key={i} className={ev.risk === "high" && !ev.resolved ? "border-destructive/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 shrink-0 ${ev.risk === "high" ? "text-destructive" : ev.risk === "medium" ? "text-warning" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-medium">{ev.event}</p>
                        <RiskBadge risk={ev.risk} />
                        {ev.resolved && <Badge className="bg-success/15 text-success border-success/30 text-xs">Resolved</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.user} — {ev.time}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">Investigate</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investigation" className="mt-4 space-y-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">User Activity Timeline — Investigation Tool</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Enter email, IP address, session ID, or log ID..." className="h-9 pl-9 text-xs" />
                </div>
                <Button size="sm" className="h-9 gap-2">
                  <Activity className="h-3.5 w-3.5" /> Investigate
                </Button>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mb-3">Sample: sec@nuers.gov.ph — 2026-05-29</p>
              <div className="space-y-2">
                {[
                  { time: "08:12:04", action: "Login", detail: "Successful SSO login — IP: 192.168.10.8", risk: "low" },
                  { time: "09:34:18", action: "Viewed Security Dashboard", detail: "Accessed SOC operations overview", risk: "low" },
                  { time: "11:48:02", action: "Policy Updated", detail: "Incident Response Procedure v2.4 → v2.5", risk: "medium" },
                  { time: "14:38:45", action: "Security Alert Triggered", detail: "Failed login brute-force from 103.20.84.99 — Account locked", risk: "high" },
                  { time: "14:42:11", action: "Incident Created", detail: "INC-2026-0085 opened — Brute-force detection", risk: "high" },
                  { time: "15:10:29", action: "Logout", detail: "Session SES-29842 terminated normally", risk: "low" },
                ].map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${e.risk === "high" ? "bg-destructive" : e.risk === "medium" ? "bg-warning" : "bg-success"}`} />
                      {i < 5 && <div className="w-px flex-1 bg-border min-h-4" />}
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">{e.time}</span>
                        <span className="text-xs font-semibold text-foreground">{e.action}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Investigation & Incident Reconstruction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-border/60">
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-semibold">Compliance Investigation</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {[
                  { label: "Invoice INV-2026-0001840 rejection chain", status: "complete" },
                  { label: "Bulk export audit — 50,000 records (May 29)", status: "open" },
                  { label: "API key rotation compliance — business account SM-28400", status: "complete" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3 text-xs">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "complete" ? "bg-success" : "bg-warning"}`} />
                    <span className="flex-1 text-foreground">{c.label}</span>
                    <Badge className={`text-[10px] border ${c.status === "complete" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning-foreground border-warning/30"}`}>{c.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border border-border/60">
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-semibold">Incident Reconstruction</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {[
                  { id: "INC-2026-0084", title: "ACK Handler Latency Spike", logs: "2,840 correlated events" },
                  { id: "INC-2026-0081", title: "Transmission Queue Spike", logs: "10,240 correlated events" },
                ].map((inc) => (
                  <div key={inc.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-primary">{inc.id}</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Reconstruct</Button>
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{inc.title}</p>
                    <p className="text-[10px] text-muted-foreground">{inc.logs}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
