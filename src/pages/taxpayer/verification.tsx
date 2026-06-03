import { useState, useMemo } from "react";
import {
  ShieldCheck, FileText, CheckCircle2,
  XCircle, Clock, AlertTriangle, Search, Eye, Download,
  ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VerifStatus = "pending" | "submitted" | "under_review" | "additional_docs_required" | "approved" | "rejected" | "expired";
type Priority = "low" | "normal" | "high" | "urgent";

interface VerifRequest {
  id: string;
  taxpayer: string;
  taxpayerType: string;
  type: string;
  status: VerifStatus;
  priority: Priority;
  riskScore: number;
  riskFlags: string[];
  reviewer: string;
  submitted: string;
  documents: { name: string; type: string; status: string }[];
  notes: string;
}

const MOCK_VERIFS: VerifRequest[] = [
  { id: "VR-0421", taxpayer: "ABC Trading Corporation", taxpayerType: "corporation", type: "sec", status: "under_review", priority: "high", riskScore: 45, riskFlags: ["unusual_transactions", "incomplete_docs"], reviewer: "Admin User", submitted: "2026-05-29 08:12", documents: [{ name: "SEC Certificate.pdf", type: "sec_cert", status: "accepted" }, { name: "Articles of Incorp.pdf", type: "articles", status: "pending" }], notes: "SEC certificate verified. Waiting for complete Articles of Incorporation." },
  { id: "VR-0420", taxpayer: "Maria Santos", taxpayerType: "sole_proprietor", type: "dti", status: "pending", priority: "normal", riskScore: 8, riskFlags: [], reviewer: "", submitted: "2026-05-29 06:30", documents: [{ name: "DTI Certificate.jpg", type: "dti_cert", status: "pending" }], notes: "" },
  { id: "VR-0419", taxpayer: "New Horizon Real Estate Corp.", taxpayerType: "corporation", type: "business_permit", status: "additional_docs_required", priority: "urgent", riskScore: 52, riskFlags: ["high_capital", "multiple_shareholders"], reviewer: "Admin User", submitted: "2026-05-28 14:00", documents: [{ name: "Mayor's Permit 2026.pdf", type: "business_permit", status: "accepted" }, { name: "Fire Safety Cert.pdf", type: "safety_cert", status: "rejected" }], notes: "Fire safety certificate appears expired. Request updated certificate." },
  { id: "VR-0418", taxpayer: "Pedro Reyes", taxpayerType: "professional", type: "government_id", status: "approved", priority: "normal", riskScore: 5, riskFlags: [], reviewer: "Admin User", submitted: "2026-05-28 10:00", documents: [{ name: "PhilSys ID.jpg", type: "philsys", status: "accepted" }, { name: "PRC License.jpg", type: "license", status: "accepted" }], notes: "All documents verified." },
  { id: "VR-0417", taxpayer: "Global Logistics PH Inc.", taxpayerType: "corporation", type: "risk_assessment", status: "rejected", priority: "urgent", riskScore: 78, riskFlags: ["suspicious_transactions", "multiple_complaints", "delinquent_tax"], reviewer: "Admin User", submitted: "2026-05-27 09:00", documents: [{ name: "Financial Statement.pdf", type: "financials", status: "rejected" }], notes: "High-risk profile. Multiple BIR complaints. Forwarded to compliance team." },
];

const VERIF_TYPE_LABELS: Record<string, string> = {
  sec: "SEC Verification",
  dti: "DTI Verification",
  government_id: "Gov ID Verification",
  business_permit: "Business Permit",
  risk_assessment: "Risk Assessment",
  tin_verification: "TIN Verification",
};

const STATUS_META: Record<VerifStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:                  { label: "Pending",             color: "text-muted-foreground",  icon: Clock },
  submitted:                { label: "Submitted",           color: "text-primary",           icon: FileText },
  under_review:             { label: "Under Review",        color: "text-primary",           icon: Eye },
  additional_docs_required: { label: "Docs Required",       color: "text-warning",           icon: AlertTriangle },
  approved:                 { label: "Approved",            color: "text-success",           icon: CheckCircle2 },
  rejected:                 { label: "Rejected",            color: "text-destructive",       icon: XCircle },
  expired:                  { label: "Expired",             color: "text-muted-foreground",  icon: XCircle },
};

const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  urgent: { color: "text-destructive",  bg: "bg-destructive/10" },
  high:   { color: "text-warning",      bg: "bg-warning/10" },
  normal: { color: "text-primary",      bg: "bg-primary/10" },
  low:    { color: "text-muted-foreground", bg: "bg-muted" },
};

const RISK_COLOR = (score: number) =>
  score >= 70 ? "text-destructive" : score >= 40 ? "text-warning" : "text-success";

export function VerificationCenter() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<VerifRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const filtered = useMemo(() => {
    let list = MOCK_VERIFS;
    if (search) list = list.filter(v => v.taxpayer.toLowerCase().includes(search.toLowerCase()) || v.id.includes(search));
    if (typeFilter !== "all") list = list.filter(v => v.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(v => v.status === statusFilter);
    if (tab === "queue") list = list.filter(v => ["pending","submitted","under_review","additional_docs_required"].includes(v.status));
    if (tab === "high_risk") list = list.filter(v => v.riskScore >= 40);
    if (tab === "completed") list = list.filter(v => ["approved","rejected"].includes(v.status));
    return list;
  }, [search, typeFilter, statusFilter, tab]);

  const handleApprove = (v: VerifRequest) => {
    setReviewing(null);
    toast.success(`${v.id} approved — ${v.taxpayer}`);
  };

  const handleReject = (v: VerifRequest) => {
    setReviewing(null);
    toast.error(`${v.id} rejected — ${v.taxpayer}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Verification Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">SEC, DTI, Gov ID, Business Permit review and Risk Assessment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Requests", val: MOCK_VERIFS.length, color: "text-foreground" },
          { label: "Pending Queue",  val: MOCK_VERIFS.filter(v => ["pending","submitted","under_review"].includes(v.status)).length, color: "text-warning" },
          { label: "Docs Required",  val: MOCK_VERIFS.filter(v => v.status === "additional_docs_required").length, color: "text-warning" },
          { label: "Approved",       val: MOCK_VERIFS.filter(v => v.status === "approved").length, color: "text-success" },
          { label: "High Risk",      val: MOCK_VERIFS.filter(v => v.riskScore >= 50).length, color: "text-destructive" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold tabular-nums", k.color)}>{k.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[180px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search taxpayer, VR ID…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-44"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(VERIF_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mb-4">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="queue" className="text-xs">Queue</TabsTrigger>
              <TabsTrigger value="high_risk" className="text-xs">High Risk</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {filtered.map(v => {
              const sm = STATUS_META[v.status];
              const pm = PRIORITY_META[v.priority];
              const Icon = sm.icon;
              const isExp = expanded === v.id;

              return (
                <div key={v.id} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                    onClick={() => setExpanded(isExp ? null : v.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[9px]">{v.id}</Badge>
                        <span className="text-xs font-semibold text-foreground">{v.taxpayer}</span>
                        <Badge variant="outline" className="text-[9px]">{VERIF_TYPE_LABELS[v.type]}</Badge>
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize", pm.color, pm.bg)}>{v.priority}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="capitalize">{v.taxpayerType.replace("_", " ")}</span>
                        <span>Submitted: {v.submitted}</span>
                        <span>{v.documents.length} documents</span>
                        {v.reviewer && <span>Reviewer: {v.reviewer}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Risk score */}
                      <div className="text-center">
                        <p className={cn("text-sm font-bold tabular-nums", RISK_COLOR(v.riskScore))}>{v.riskScore}</p>
                        <p className="text-[9px] text-muted-foreground">Risk</p>
                      </div>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", sm.color)}>
                        <Icon className="h-3 w-3" />
                        {sm.label}
                      </span>
                      {["pending","submitted","under_review","additional_docs_required"].includes(v.status) && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); setReviewing(v); setReviewNotes(v.notes); }}>
                          <Eye className="h-3 w-3" /> Review
                        </Button>
                      )}
                      {isExp ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExp && (
                    <div className="border-t bg-muted/10 p-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">Documents</p>
                          {v.documents.map(d => (
                            <div key={d.name} className="flex items-center justify-between p-2 bg-muted/40 rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{d.name}</span>
                              </div>
                              <span className={cn("text-[10px] font-medium capitalize",
                                d.status === "accepted" ? "text-success" :
                                d.status === "rejected" ? "text-destructive" : "text-warning"
                              )}>{d.status}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">Risk Flags</p>
                          {v.riskFlags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {v.riskFlags.map(f => (
                                <Badge key={f} variant="destructive" className="text-[9px]">{f.replace(/_/g, " ")}</Badge>
                              ))}
                            </div>
                          ) : <p className="text-muted-foreground text-[10px]">No risk flags detected.</p>}
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground">Risk Score</span>
                              <span className={cn("font-bold", RISK_COLOR(v.riskScore))}>{v.riskScore}/100</span>
                            </div>
                            <Progress value={v.riskScore} className="h-1.5" />
                          </div>
                          {v.notes && (
                            <div className="mt-2 p-2 bg-muted/40 rounded text-[10px] text-muted-foreground">{v.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <ShieldCheck className="h-8 w-8 text-success mx-auto mb-2" />
                No verification requests match your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewing} onOpenChange={open => !open && setReviewing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Review Verification — {reviewing?.id}</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-muted/40 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-foreground">{reviewing.taxpayer}</p>
                  <Badge variant="outline" className="text-[9px]">{VERIF_TYPE_LABELS[reviewing.type]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold", RISK_COLOR(reviewing.riskScore))}>
                    Risk: {reviewing.riskScore}/100
                  </span>
                  {reviewing.riskFlags.map(f => (
                    <Badge key={f} variant="destructive" className="text-[9px]">{f.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Documents</p>
                {reviewing.documents.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-2 border rounded text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {d.name}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-success" onClick={() => toast.success(`${d.name} accepted`)}>
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => toast.error(`${d.name} rejected`)}>
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Enter review notes…"
                  className="text-xs min-h-[80px]"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:text-destructive" onClick={() => handleReject(reviewing)}>
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => handleApprove(reviewing)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
