import {
  CheckCircle2, Clock, AlertTriangle, FileText, Download,
  Upload, Eye, Calendar, Award,
  TrendingUp, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const accreditationInfo = {
  espNo: "ESP-2024-00142",
  status: "Accredited",
  category: "Class A — Large-Scale ESP",
  issuedDate: "January 15, 2024",
  renewalDate: "January 15, 2027",
  daysToRenewal: 231,
  issuingAuthority: "Bureau of Internal Revenue — Large Taxpayers Service",
  authorizedCapacity: "Unlimited Taxpayers",
};

const requirements = [
  { id: "REQ-001", requirement: "Legal Entity Registration (SEC/DTI)", status: "met", doc: "SEC Cert. CS201900001", due: null },
  { id: "REQ-002", requirement: "BIR Registration (TIN)", status: "met", doc: "TIN: 001-842-841-000", due: null },
  { id: "REQ-003", requirement: "ISO 27001:2022 Certification", status: "met", doc: "ISO-27001-2024-PH-0089", due: null },
  { id: "REQ-004", requirement: "SOC 2 Type II Report", status: "met", doc: "SOC2-2025-0341", due: null },
  { id: "REQ-005", requirement: "Data Privacy Act Compliance (NPC)", status: "met", doc: "NPC-REG-2024-00891", due: null },
  { id: "REQ-006", requirement: "BIR EIS Technical Standards Compliance", status: "met", doc: "BIR-TECH-2024-0089", due: null },
  { id: "REQ-007", requirement: "Network Penetration Test Report", status: "met", doc: "PENTEST-2025-Q4-0042", due: null },
  { id: "REQ-008", requirement: "Business Continuity Plan", status: "met", doc: "BCP-NUERS-v3.2", due: null },
  { id: "REQ-009", requirement: "Anti-Money Laundering Compliance", status: "met", doc: "AMLC-REG-2024-0281", due: null },
  { id: "REQ-010", requirement: "Annual ESP Performance Report Submission", status: "pending", doc: null, due: "Jun 30, 2026" },
  { id: "REQ-011", requirement: "Quarterly Technical Review Meeting (BIR)", status: "scheduled", doc: null, due: "Jun 15, 2026" },
  { id: "REQ-012", requirement: "ESP Re-accreditation Application", status: "upcoming", doc: null, due: "Aug 15, 2026" },
];

const documents = [
  { name: "ESP Accreditation Certificate", type: "Certificate", no: "ESP-2024-00142", issued: "Jan 15, 2024", expires: "Jan 15, 2027", status: "valid" },
  { name: "ISO 27001:2022 Certificate", type: "Certification", no: "ISO-27001-2024-PH-0089", issued: "Nov 15, 2024", expires: "Nov 15, 2027", status: "valid" },
  { name: "SOC 2 Type II Report", type: "Audit Report", no: "SOC2-2025-0341", issued: "Aug 30, 2025", expires: "Aug 30, 2026", status: "valid" },
  { name: "PCI DSS v4.0 Assessment", type: "Compliance", no: "PCI-2025-PH-0021", issued: "Mar 31, 2025", expires: "Mar 31, 2026", status: "expiring" },
  { name: "Network Penetration Test Report", type: "Security", no: "PENTEST-2025-Q4-0042", issued: "Dec 15, 2025", expires: "Dec 15, 2026", status: "valid" },
  { name: "NPC Privacy Registration", type: "Regulatory", no: "NPC-REG-2024-00891", issued: "Jun 1, 2024", expires: "Dec 31, 2026", status: "valid" },
  { name: "DICT Digital Certificate", type: "PKI", no: "DICT-CERT-2024-0042", issued: "Aug 1, 2024", expires: "Aug 1, 2026", status: "expiring" },
  { name: "AMLC Compliance Certificate", type: "Regulatory", no: "AMLC-REG-2024-0281", issued: "Sep 1, 2024", expires: "Sep 1, 2026", status: "valid" },
];

const kpis = [
  { label: "Uptime SLA", target: "99.9%", actual: "99.98%", met: true },
  { label: "Transmission Success Rate", target: "99.5%", actual: "99.89%", met: true },
  { label: "Response Time P95", target: "< 500ms", actual: "252ms", met: true },
  { label: "Taxpayer Onboarding TAT", target: "< 3 days", actual: "1.8 days", met: true },
  { label: "Incident Response Time", target: "< 2 hrs", actual: "1.2 hrs", met: true },
  { label: "Compliance Score", target: "≥ 95%", actual: "98.7%", met: true },
];

export function ESPAccreditation() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ESP Accreditation Management</h1>
          <p className="text-sm text-muted-foreground">BIR EIS accreditation status, compliance requirements, and certification repository</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Accreditation Report
          </Button>
          <Button size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </Button>
        </div>
      </div>

      {/* Accreditation Status Banner */}
      <Card className="border-success/40 bg-success/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-success bg-success/10 shrink-0">
                <Award className="h-8 w-8 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge className="bg-success text-success-foreground text-xs">BIR Accredited ESP</Badge>
                  <Badge variant="secondary" className="text-xs">{accreditationInfo.category}</Badge>
                </div>
                <p className="text-sm font-bold">NUERS — National Unified Electronic Receipt System</p>
                <p className="text-xs text-muted-foreground">ESP No.: <span className="font-mono font-medium">{accreditationInfo.espNo}</span> · Issued by: {accreditationInfo.issuingAuthority}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="text-center bg-card rounded-lg p-2 border">
                <p className="text-xs text-muted-foreground">Issued</p>
                <p className="text-xs font-bold">{accreditationInfo.issuedDate}</p>
              </div>
              <div className="text-center bg-card rounded-lg p-2 border">
                <p className="text-xs text-muted-foreground">Renewal</p>
                <p className="text-xs font-bold">{accreditationInfo.renewalDate}</p>
              </div>
              <div className="text-center bg-card rounded-lg p-2 border">
                <p className="text-xs text-muted-foreground">Days Left</p>
                <p className="text-sm font-black text-success">{accreditationInfo.daysToRenewal}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="requirements">
        <TabsList className="h-9">
          <TabsTrigger value="requirements" className="text-xs">Requirements Checklist</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Document Repository</TabsTrigger>
          <TabsTrigger value="kpis" className="text-xs">Performance KPIs</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">Audit Readiness</TabsTrigger>
          <TabsTrigger value="renewal" className="text-xs">Renewal Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="mt-4">
          <div className="space-y-2">
            {requirements.map((r) => (
              <Card key={r.id} className={r.status === "upcoming" ? "border-warning/40" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {r.status === "met" && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                      {r.status === "pending" && <Clock className="h-4 w-4 text-warning shrink-0" />}
                      {r.status === "scheduled" && <Calendar className="h-4 w-4 text-primary shrink-0" />}
                      {r.status === "upcoming" && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                          <p className="text-sm font-medium">{r.requirement}</p>
                        </div>
                        {r.doc && <p className="text-xs text-muted-foreground font-mono">{r.doc}</p>}
                        {r.due && <p className="text-xs text-warning-foreground">Due: {r.due}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === "met" && <Badge className="bg-success/15 text-success border-success/30 text-xs">Met</Badge>}
                      {r.status === "pending" && <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Pending</Badge>}
                      {r.status === "scheduled" && <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">Scheduled</Badge>}
                      {r.status === "upcoming" && <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Upcoming</Badge>}
                      {r.doc && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 p-4 bg-muted/40 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Overall Readiness</p>
              <p className="text-sm font-bold text-success">9/12 Met ({(9/12*100).toFixed(0)}%)</p>
            </div>
            <Progress value={75} className="h-3" />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.name} className={doc.status === "expiring" ? "border-warning/40" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${doc.status === "valid" ? "bg-success/10" : "bg-warning/10"} shrink-0`}>
                        <FileText className={`h-4 w-4 ${doc.status === "valid" ? "text-success" : "text-warning"}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold">{doc.name}</p>
                          <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                          {doc.status === "valid" ? (
                            <Badge className="bg-success/15 text-success border-success/30 text-xs">Valid</Badge>
                          ) : (
                            <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Expiring Soon</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">No: {doc.no}</p>
                        <p className="text-xs text-muted-foreground">Issued: {doc.issued} · Expires: {doc.expires}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          <div className="space-y-3">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TrendingUp className="h-4 w-4 text-success shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{kpi.label}</p>
                        <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-bold text-success">{kpi.actual}</p>
                      <Badge className="bg-success/15 text-success border-success/30 text-xs">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        Met
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <Card className="border-success/40 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-gold" />
                <div>
                  <p className="text-sm font-bold">Audit Readiness Score: 98.4%</p>
                  <p className="text-xs text-muted-foreground">All critical controls in place. 3 minor items pending completion.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { domain: "BIR EIS Technical Compliance", score: 99.2, items: 42 },
              { domain: "ISO 27001 Controls", score: 98.8, items: 114 },
              { domain: "SOC 2 Trust Criteria", score: 97.9, items: 64 },
              { domain: "Data Privacy Act Requirements", score: 98.4, items: 36 },
              { domain: "Business Continuity", score: 96.8, items: 28 },
              { domain: "Cryptographic Standards", score: 100, items: 18 },
            ].map((d) => (
              <Card key={d.domain}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">{d.domain}</span>
                    <span className={`font-bold ${d.score >= 99 ? "text-success" : d.score >= 97 ? "text-success" : "text-warning-foreground"}`}>{d.score}%</span>
                  </div>
                  <Progress value={d.score} className="h-2 mb-1" />
                  <p className="text-[10px] text-muted-foreground">{d.items} controls evaluated</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="renewal" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Re-accreditation Timeline (Target: Jan 15, 2027)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { milestone: "Initiate re-accreditation process", date: "Aug 15, 2026", status: "upcoming", daysLeft: 78 },
                  { milestone: "Compile and submit documentation package", date: "Sep 15, 2026", status: "upcoming", daysLeft: 109 },
                  { milestone: "BIR technical audit and site inspection", date: "Oct 15, 2026", status: "upcoming", daysLeft: 139 },
                  { milestone: "Address audit findings", date: "Nov 15, 2026", status: "upcoming", daysLeft: 170 },
                  { milestone: "BIR approval and certificate issuance", date: "Dec 15, 2026", status: "upcoming", daysLeft: 200 },
                  { milestone: "Accreditation renewal complete", date: "Jan 15, 2027", status: "upcoming", daysLeft: 231 },
                ].map((m) => (
                  <div key={m.milestone} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-border shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{m.milestone}</p>
                      <p className="text-xs text-muted-foreground">{m.date} ({m.daysLeft} days)</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Upcoming</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
