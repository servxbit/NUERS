import {
  Shield, AlertTriangle, CheckCircle2, Download,
  TrendingUp, AlertCircle, Eye, Lock,
  BarChart3, ClipboardList, Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const complianceTrend = [
  { month: "Dec 25", score: 96.2, target: 98.0 },
  { month: "Jan 26", score: 96.8, target: 98.0 },
  { month: "Feb 26", score: 97.1, target: 98.0 },
  { month: "Mar 26", score: 97.5, target: 98.0 },
  { month: "Apr 26", score: 98.2, target: 98.0 },
  { month: "May 26", score: 98.7, target: 98.0 },
];

const riskData = [
  { category: "Security", high: 3, medium: 8, low: 24 },
  { category: "Compliance", high: 1, medium: 5, low: 18 },
  { category: "Operational", high: 2, medium: 12, low: 31 },
  { category: "Infrastructure", high: 0, medium: 4, low: 15 },
];

const taxpayerCompliance = [
  { name: "EIS Filing", compliant: 12621, noncompliant: 226, total: 12847 },
  { name: "VAT Filing", compliant: 11842, noncompliant: 1005, total: 12847 },
  { name: "TIN Validation", compliant: 12780, noncompliant: 67, total: 12847 },
  { name: "Cert. Active", compliant: 12384, noncompliant: 463, total: 12847 },
  { name: "AFS Submitted", compliant: 10284, noncompliant: 2563, total: 12847 },
];

const regulatoryCalendar = [
  { date: "Jun 15, 2026", event: "Q2 EIS Compliance Report Submission", type: "deadline", status: "upcoming" },
  { date: "Jun 15, 2026", event: "Monthly VAT Filing Deadline", type: "deadline", status: "upcoming" },
  { date: "Jun 30, 2026", event: "Semi-Annual BIR EIS Audit", type: "audit", status: "upcoming" },
  { date: "Jul 31, 2026", event: "Annual Financial Statements Deadline", type: "deadline", status: "upcoming" },
  { date: "Aug 15, 2026", event: "BIR ESP Re-accreditation Application", type: "accreditation", status: "upcoming" },
  { date: "May 29, 2026", event: "Weekly ESP Performance Review - BIR", type: "review", status: "today" },
  { date: "May 28, 2026", event: "ISO 27001 Internal Audit Completed", type: "audit", status: "completed" },
  { date: "May 25, 2026", event: "Q1 2026 Audit Report Submitted to BIR", type: "submission", status: "completed" },
];

const policies = [
  { id: "POL-001", name: "Data Privacy Policy (DPA Compliant)", status: "active", lastReview: "Mar 2026", nextReview: "Sep 2026" },
  { id: "POL-002", name: "Information Security Policy (ISO 27001)", status: "active", lastReview: "Apr 2026", nextReview: "Oct 2026" },
  { id: "POL-003", name: "BIR EIS Transmission Policy", status: "active", lastReview: "Feb 2026", nextReview: "Aug 2026" },
  { id: "POL-004", name: "Business Continuity Plan", status: "review", lastReview: "Jan 2026", nextReview: "Jun 2026" },
  { id: "POL-005", name: "Incident Response Procedure", status: "active", lastReview: "May 2026", nextReview: "Nov 2026" },
  { id: "POL-006", name: "Key Management Policy (PKI)", status: "active", lastReview: "Apr 2026", nextReview: "Oct 2026" },
  { id: "POL-007", name: "Acceptable Use Policy", status: "active", lastReview: "Mar 2026", nextReview: "Sep 2026" },
  { id: "POL-008", name: "Vendor Risk Management Policy", status: "update", lastReview: "Nov 2025", nextReview: "May 2026" },
];

const trendConfig: ChartConfig = {
  score: { label: "Compliance Score", color: "var(--chart-1)" },
  target: { label: "Target", color: "var(--chart-2)" },
};

const riskConfig: ChartConfig = {
  high: { label: "High Risk", color: "var(--chart-5)" },
  medium: { label: "Medium Risk", color: "var(--chart-2)" },
  low: { label: "Low Risk", color: "var(--chart-4)" },
};

export function ComplianceCenter() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance & Regulatory Center</h1>
          <p className="text-sm text-muted-foreground">BIR compliance, data privacy, risk management, and regulatory governance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Compliance Report
          </Button>
          <Button size="sm" className="gap-2">
            <Bell className="h-3.5 w-3.5" /> Set Alerts
          </Button>
        </div>
      </div>

      {/* Compliance Score Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-success bg-success/10">
                <span className="text-lg font-black text-success">98.7</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Overall Compliance Score</p>
                <p className="text-xs text-muted-foreground">BIR EIS + Data Privacy + ISO 27001 + SOC 2</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-success">
                  <TrendingUp className="h-3 w-3" />
                  +0.5% vs last month — Exceeding 98% target
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "BIR EIS", score: "99.2%", color: "text-success" },
                { label: "Data Privacy", score: "98.4%", color: "text-success" },
                { label: "ISO 27001", score: "98.8%", color: "text-success" },
                { label: "SOC 2", score: "97.9%", color: "text-success" },
              ].map((s) => (
                <div key={s.label} className="text-center bg-card rounded-lg p-2 border">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.score}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="taxpayers" className="text-xs">Taxpayer</TabsTrigger>
          <TabsTrigger value="eis" className="text-xs">EIS Compliance</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs">Data Privacy</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
          <TabsTrigger value="controls" className="text-xs">Internal Controls</TabsTrigger>
          <TabsTrigger value="updates" className="text-xs">Regulatory Updates</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">Policies</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Compliance Score Trend (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={trendConfig} className="h-52">
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--border)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--border)" domain={[94, 100]} unit="%" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="score" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="target" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Risk Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={riskConfig} className="h-52">
                  <BarChart data={riskData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--border)" />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} stroke="var(--border)" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="high" fill="var(--chart-5)" radius={[0, 2, 2, 0]} stackId="risk" />
                    <Bar dataKey="medium" fill="var(--chart-2)" stackId="risk" />
                    <Bar dataKey="low" fill="var(--chart-4)" radius={[0, 2, 2, 0]} stackId="risk" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Active Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { msg: "POL-008 Vendor Risk Policy overdue for review", sev: "warning", action: "Review Policy" },
                  { msg: "1,005 taxpayers with outstanding VAT filing obligations", sev: "warning", action: "View List" },
                  { msg: "BIR ESP Re-accreditation due in 78 days (Aug 15, 2026)", sev: "info", action: "Prepare Documents" },
                  { msg: "PKI Certificate renewal required within 90 days", sev: "info", action: "Renew Certificate" },
                ].map((a, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${a.sev === "warning" ? "bg-warning/5 border-warning/30" : "bg-primary/5 border-primary/20"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${a.sev === "warning" ? "text-warning" : "text-primary"}`} />
                      <p className="text-xs">{a.msg}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">{a.action}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eis" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "EIS Transmission Rate", value: "99.84%", status: "ok" },
              { label: "Accepted Invoices", value: "99.21%", status: "ok" },
              { label: "Schema Compliance", value: "99.76%", status: "ok" },
              { label: "TIN Validation Rate", value: "99.95%", status: "ok" },
            ].map((k) => (
              <Card key={k.label} className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold text-success mt-1">{k.value}</p>
                  <p className="text-[10px] text-success mt-0.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> BIR Target: ≥ 98%</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">BIR EIS Compliance Checklist</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {[
                { item: "Real-time EIS transmission within 24 hours of transaction", status: true },
                { item: "Digital signature on all issued invoices (RSA-2048)", status: true },
                { item: "QR code inclusion on all document types", status: true },
                { item: "Unique invoice numbering with BIR-approved prefix", status: true },
                { item: "VAT computation per BIR prescribed rates", status: true },
                { item: "TIN validation against BIR taxpayer registry", status: true },
                { item: "Acknowledgement receipt processing within 2 seconds", status: true },
                { item: "Monthly EIS performance report to BIR (due 15th)", status: true },
                { item: "Certificate renewal 90 days before expiry", status: false },
                { item: "Annual BIR EIS audit compliance documentation", status: true },
              ].map((c) => (
                <div key={c.item} className="flex items-center gap-3 text-xs">
                  {c.status ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />}
                  <span className={c.status ? "text-foreground" : "text-warning-foreground"}>{c.item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-4 space-y-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Data Privacy Compliance — Republic Act 10173 (DPA)</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Privacy Score", value: "98.4%", color: "text-success" },
                  { label: "Data Requests", value: "142", color: "text-foreground" },
                  { label: "Breaches (YTD)", value: "0", color: "text-success" },
                  { label: "DPO Reports Filed", value: "5/5", color: "text-success" },
                ].map((k) => (
                  <div key={k.label} className="text-center p-3 rounded-lg border border-border/60 bg-muted/20">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>
              {[
                { area: "Lawful Basis for Processing", status: "compliant", detail: "All personal data processed with explicit taxpayer consent or legal obligation" },
                { area: "Data Subject Rights", status: "compliant", detail: "Access, correction, deletion, and portability requests handled within 30 days" },
                { area: "Data Retention Policy", status: "compliant", detail: "Invoice data retained 10 years per BIR mandate; personal data minimized after 7 years" },
                { area: "Cross-Border Data Transfer", status: "compliant", detail: "AWS Manila region primary; SCCs in place for DR sites in Singapore" },
                { area: "Privacy by Design", status: "compliant", detail: "Data minimization, pseudonymization, and encryption at rest and in transit" },
                { area: "Breach Notification Procedure", status: "compliant", detail: "72-hour NPC notification procedure documented and tested" },
                { area: "Privacy Impact Assessment", status: "review", detail: "New taxpayer portal feature — PIA in progress (ETA: Jun 15, 2026)" },
              ].map((a) => (
                <div key={a.area} className="flex items-start gap-3 p-3 rounded-lg border border-border/60">
                  {a.status === "compliant" ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-semibold text-foreground">{a.area}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxpayers" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Taxpayer Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxpayerCompliance.map((tc) => (
                  <div key={tc.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{tc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-success">{tc.compliant.toLocaleString()} compliant</span>
                        <span className="text-destructive">{tc.noncompliant.toLocaleString()} non-compliant</span>
                        <span className="font-bold">{((tc.compliant / tc.total) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={(tc.compliant / tc.total) * 100} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Non-Compliant Taxpayers", value: "1,005", icon: AlertTriangle, action: "Send Notices", color: "text-destructive" },
              { label: "Pending Verification", value: "226", icon: ClipboardList, action: "Review Queue", color: "text-warning" },
              { label: "Suspended Accounts", value: "18", icon: Lock, action: "View Details", color: "text-destructive" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">{s.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Critical Risks", value: "0", color: "text-muted-foreground" },
              { label: "High Risks", value: "6", color: "text-destructive" },
              { label: "Medium Risks", value: "29", color: "text-warning-foreground" },
              { label: "Low Risks", value: "88", color: "text-success" },
            ].map((r) => (
              <Card key={r.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className={`text-3xl font-black mt-1 ${r.color}`}>{r.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { id: "RSK-042", title: "API Authentication Token Expiry Management", category: "Security", sev: "high", owner: "InfoSec Team", due: "Jun 15, 2026", mitigation: "Implement automated token rotation with 7-day advance alerts" },
              { id: "RSK-041", title: "BIR Rate Limit Threshold Risk", category: "Operational", sev: "high", owner: "Platform Ops", due: "Jun 1, 2026", mitigation: "Implement request throttling and burst capacity management" },
              { id: "RSK-040", title: "Taxpayer Data Export Compliance (DPA)", category: "Compliance", sev: "high", owner: "DPO Office", due: "Jun 30, 2026", mitigation: "Deploy data masking and export audit logging" },
              { id: "RSK-039", title: "PKI Certificate Expiry Risk", category: "Security", sev: "high", owner: "Crypto Team", due: "Aug 15, 2026", mitigation: "Automated certificate renewal pipeline with 90-day warning" },
            ].map((r) => (
              <Card key={r.id} className="border-destructive/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                      <p className="text-sm font-semibold mt-0.5">{r.title}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs shrink-0">High</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Category: </span><span className="font-medium">{r.category}</span></div>
                    <div><span className="text-muted-foreground">Owner: </span><span className="font-medium">{r.owner}</span></div>
                    <div><span className="text-muted-foreground">Due: </span><span className="font-medium">{r.due}</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Mitigation: </span>{r.mitigation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Regulatory Calendar 2026</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {regulatoryCalendar.map((ev, i) => (
                  <div key={i} className={`flex items-center gap-4 px-4 py-3 ${ev.status === "today" ? "bg-primary/5" : ev.status === "completed" ? "opacity-60" : ""}`}>
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium">{ev.date}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{ev.event}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ev.type === "deadline" && <Badge variant="destructive" className="text-xs">Deadline</Badge>}
                      {ev.type === "audit" && <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">Audit</Badge>}
                      {ev.type === "review" && <Badge variant="secondary" className="text-xs">Review</Badge>}
                      {ev.type === "accreditation" && <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Accreditation</Badge>}
                      {ev.type === "submission" && <Badge className="bg-success/15 text-success border-success/30 text-xs">Submission</Badge>}
                      {ev.status === "completed" && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {ev.status === "today" && <Badge className="bg-primary text-primary-foreground text-xs">Today</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Policy ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Policy Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Review</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Review</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-mono font-medium text-primary">{p.id}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.status === "active" && <Badge className="bg-success/15 text-success border-success/30 text-xs">Active</Badge>}
                        {p.status === "review" && <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Under Review</Badge>}
                        {p.status === "update" && <Badge variant="destructive" className="text-xs">Needs Update</Badge>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.lastReview}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.nextReview}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="mt-4 space-y-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Internal Controls Framework</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Control ID</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Control Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Domain</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Frequency</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Last Test</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "CTL-001", name: "User Access Review", domain: "Access Control", freq: "Quarterly", last: "Apr 2026", result: "pass" },
                    { id: "CTL-002", name: "Invoice Integrity Check", domain: "Data Integrity", freq: "Daily", last: "May 29, 2026", result: "pass" },
                    { id: "CTL-003", name: "Digital Signature Verification", domain: "Cryptography", freq: "Continuous", last: "Live", result: "pass" },
                    { id: "CTL-004", name: "Backup Recovery Test", domain: "BCDR", freq: "Monthly", last: "May 2026", result: "pass" },
                    { id: "CTL-005", name: "Privileged Access Review", domain: "Access Control", freq: "Monthly", last: "May 2026", result: "pass" },
                    { id: "CTL-006", name: "Change Management Approval", domain: "Change Mgmt", freq: "Per Change", last: "May 28, 2026", result: "pass" },
                    { id: "CTL-007", name: "Penetration Testing", domain: "Security", freq: "Semi-annual", last: "Feb 2026", result: "pass" },
                    { id: "CTL-008", name: "Vendor Security Review", domain: "Third Party", freq: "Annual", last: "Nov 2025", result: "review" },
                  ].map((c, i) => (
                    <tr key={c.id} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-primary">{c.id}</td>
                      <td className="px-4 py-2.5 font-medium">{c.name}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.domain}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.freq}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.last}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-[10px] border ${c.result === "pass" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning-foreground border-warning/30"}`}>
                          {c.result === "pass" ? "Pass" : "Review"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="mt-4 space-y-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="text-sm font-semibold">Regulatory Updates & Circulars</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {[
                { id: "RMC-2026-042", title: "Mandatory EIS Integration for Large Taxpayers Phase 3", date: "May 15, 2026", authority: "BIR", impact: "high", status: "implemented" },
                { id: "RR-2026-08", title: "Updated VAT Zero-Rating Requirements for Exporters", date: "May 10, 2026", authority: "BIR", impact: "medium", status: "in-progress" },
                { id: "NPC-2026-12", title: "Data Breach Notification Timeline Update (48 → 72 hours)", date: "Apr 28, 2026", authority: "NPC", impact: "low", status: "implemented" },
                { id: "BSP-2026-031", title: "Digital Payment Transaction Reporting Requirements", date: "Apr 15, 2026", authority: "BSP", impact: "medium", status: "under-review" },
                { id: "RMO-2026-019", title: "ESP Accreditation Requirements — New Security Standards", date: "Mar 31, 2026", authority: "BIR", impact: "high", status: "implemented" },
                { id: "RMC-2026-028", title: "Electronic Official Receipt — Revised Format Guidelines", date: "Mar 20, 2026", authority: "BIR", impact: "medium", status: "implemented" },
              ].map((u) => (
                <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono font-semibold text-primary">{u.id}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.authority}</Badge>
                      <Badge className={`text-[10px] border ${u.impact === "high" ? "bg-destructive/15 text-destructive border-destructive/30" : u.impact === "medium" ? "bg-warning/15 text-warning-foreground border-warning/30" : "bg-muted text-muted-foreground border-border"}`}>{u.impact} impact</Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground">{u.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{u.date}</p>
                  </div>
                  <Badge className={`text-[10px] border flex-shrink-0 ${u.status === "implemented" ? "bg-success/15 text-success border-success/30" : u.status === "in-progress" ? "bg-primary/10 text-primary border-primary/30" : u.status === "under-review" ? "bg-warning/15 text-warning-foreground border-warning/30" : "bg-muted text-muted-foreground border-border"}`}>
                    {u.status.replace("-", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "BIR EIS Compliance Report", type: "Regulatory", period: "May 2026", icon: Shield },
              { title: "Data Privacy Impact Assessment", type: "Privacy", period: "Q2 2026", icon: Lock },
              { title: "Risk Register Report", type: "Risk", period: "May 2026", icon: AlertTriangle },
              { title: "Internal Controls Report", type: "Audit", period: "Q1 2026", icon: ClipboardList },
              { title: "ISO 27001 Audit Summary", type: "Certification", period: "Apr 2026", icon: CheckCircle2 },
              { title: "Executive Compliance Summary", type: "Executive", period: "May 2026", icon: BarChart3 },
            ].map((r) => (
              <Card key={r.title} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <r.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.type} Report</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{r.period}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Download className="h-3 w-3" /> Export
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
