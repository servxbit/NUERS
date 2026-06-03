import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Download, Plus, ChevronDown, ChevronUp,
  Edit, Eye, AlertTriangle, CheckCircle2, Clock, XCircle,
  ShieldCheck, MapPin, Phone, Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RegStatus = "active" | "pending" | "under_review" | "suspended" | "delinquent" | "cancelled";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface Taxpayer {
  id: string;
  name: string;
  tin: string;
  type: string;
  regStatus: RegStatus;
  verStatus: string;
  riskLevel: RiskLevel;
  riskScore: number;
  rdo: string;
  taxTypes: string[];
  vatRegistered: boolean;
  registrationDate: string;
  email: string;
  phone: string;
  address: string;
}

const MOCK_TAXPAYERS: Taxpayer[] = [
  { id: "tp-001", name: "Juan dela Cruz", tin: "123-456-789-000", type: "individual", regStatus: "active", verStatus: "verified", riskLevel: "low", riskScore: 12, rdo: "RDO 39 - Quezon City South", taxTypes: ["income_tax"], vatRegistered: false, registrationDate: "2022-03-15", email: "juan@email.com", phone: "+63 912 345 6789", address: "123 Rizal St., Quezon City" },
  { id: "tp-002", name: "ABC Trading Corporation", tin: "456-789-012-000", type: "corporation", regStatus: "under_review", verStatus: "in_review", riskLevel: "medium", riskScore: 45, rdo: "RDO 43 - Pasig City", taxTypes: ["income_tax","vat","withholding_tax"], vatRegistered: true, registrationDate: "2024-11-20", email: "finance@abctrading.ph", phone: "+63 2 8123 4567", address: "5F Tower One, Ortigas, Pasig" },
  { id: "tp-003", name: "Maria Santos", tin: "012-345-678-000", type: "sole_proprietor", regStatus: "pending", verStatus: "pending", riskLevel: "low", riskScore: 8, rdo: "RDO 52 - Paranaque", taxTypes: ["income_tax","percentage_tax"], vatRegistered: false, registrationDate: "2026-05-28", email: "maria@santos.ph", phone: "+63 918 765 4321", address: "45 Gen. Luna St., Paranaque" },
  { id: "tp-004", name: "Global Logistics Philippines Inc.", tin: "345-678-901-000", type: "corporation", regStatus: "suspended", verStatus: "flagged", riskLevel: "high", riskScore: 78, rdo: "RDO 47 - Manila", taxTypes: ["income_tax","vat","excise_tax"], vatRegistered: true, registrationDate: "2019-06-10", email: "compliance@globallogistics.ph", phone: "+63 2 8456 7890", address: "Port Area, Manila" },
  { id: "tp-005", name: "XYZ Partners Inc.", tin: "789-012-345-000", type: "corporation", regStatus: "active", verStatus: "verified", riskLevel: "low", riskScore: 15, rdo: "RDO 50 - Makati", taxTypes: ["income_tax","vat"], vatRegistered: true, registrationDate: "2021-08-25", email: "tax@xyzpartners.com", phone: "+63 2 8234 5678", address: "Ayala Ave., Makati City" },
  { id: "tp-006", name: "Pedro Reyes", tin: "567-890-123-000", type: "professional", regStatus: "active", verStatus: "verified", riskLevel: "low", riskScore: 5, rdo: "RDO 40 - Quezon City North", taxTypes: ["income_tax"], vatRegistered: false, registrationDate: "2020-01-12", email: "pedro.reyes@law.ph", phone: "+63 917 222 3333", address: "88 Commonwealth Ave., QC" },
  { id: "tp-007", name: "New Horizon Real Estate Corp.", tin: "890-123-456-000", type: "corporation", regStatus: "active", verStatus: "pending", riskLevel: "medium", riskScore: 52, rdo: "RDO 51 - Taguig", taxTypes: ["income_tax","vat","documentary_stamp_tax"], vatRegistered: true, registrationDate: "2023-03-01", email: "finance@newhorizon.ph", phone: "+63 2 8567 8901", address: "BGC, Taguig City" },
];

const STATUS_META: Record<RegStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:       { label: "Active",       color: "text-success",          icon: CheckCircle2 },
  pending:      { label: "Pending",      color: "text-warning",          icon: Clock },
  under_review: { label: "Under Review", color: "text-primary",          icon: Eye },
  suspended:    { label: "Suspended",    color: "text-destructive",      icon: XCircle },
  delinquent:   { label: "Delinquent",   color: "text-destructive",      icon: AlertTriangle },
  cancelled:    { label: "Cancelled",    color: "text-muted-foreground", icon: XCircle },
};

const RISK_META: Record<RiskLevel, { color: string; bg: string }> = {
  low:      { color: "text-success",     bg: "bg-success/10" },
  medium:   { color: "text-warning",     bg: "bg-warning/10" },
  high:     { color: "text-destructive", bg: "bg-destructive/10" },
  critical: { color: "text-destructive", bg: "bg-destructive/20" },
};

const TAXPAYER_TYPE_LABELS: Record<string, string> = {
  individual: "Individual", sole_proprietor: "Sole Proprietor",
  professional: "Professional", corporation: "Corporation",
  partnership: "Partnership", cooperative: "Cooperative",
};

export function TaxpayerRegistry() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    let list = MOCK_TAXPAYERS;
    if (search) list = list.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tin.includes(search) || t.email.includes(search)
    );
    if (statusFilter !== "all") list = list.filter(t => t.regStatus === statusFilter);
    if (typeFilter !== "all") list = list.filter(t => t.type === typeFilter);
    if (riskFilter !== "all") list = list.filter(t => t.riskLevel === riskFilter);
    if (tab === "individual") list = list.filter(t => ["individual","professional","sole_proprietor"].includes(t.type));
    if (tab === "corporate") list = list.filter(t => ["corporation","partnership","cooperative"].includes(t.type));
    if (tab === "flagged") list = list.filter(t => ["high","critical"].includes(t.riskLevel));
    return list;
  }, [search, statusFilter, typeFilter, riskFilter, tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Taxpayer Registry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">TIN management, registration status, RDO assignment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowRegister(true)}>
            <Plus className="h-3.5 w-3.5" /> Register Taxpayer
          </Button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", val: MOCK_TAXPAYERS.length, color: "bg-muted" },
          { label: "Active", val: MOCK_TAXPAYERS.filter(t => t.regStatus === "active").length, color: "bg-success/10 text-success" },
          { label: "Pending", val: MOCK_TAXPAYERS.filter(t => t.regStatus === "pending").length, color: "bg-warning/10 text-warning" },
          { label: "Suspended", val: MOCK_TAXPAYERS.filter(t => t.regStatus === "suspended").length, color: "bg-destructive/10 text-destructive" },
          { label: "High Risk", val: MOCK_TAXPAYERS.filter(t => ["high","critical"].includes(t.riskLevel)).length, color: "bg-destructive/10 text-destructive" },
        ].map(s => (
          <div key={s.label} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", s.color, !s.color.includes("text") && "text-foreground")}>
            <span>{s.label}:</span>
            <span className="font-bold">{s.val}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[200px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name, TIN, email…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TAXPAYER_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="mb-4">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="individual" className="text-xs">Individual</TabsTrigger>
              <TabsTrigger value="corporate" className="text-xs">Corporate</TabsTrigger>
              <TabsTrigger value="flagged" className="text-xs text-destructive">High Risk</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {["Taxpayer","TIN","Type","Status","Verification","Risk","RDO","VAT","Actions"].map(h => (
                    <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tp => {
                  const sm = STATUS_META[tp.regStatus];
                  const rm = RISK_META[tp.riskLevel];
                  const Icon = sm.icon;
                  const isExp = expanded === tp.id;
                  return (
                    <>
                      <tr key={tp.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-foreground">{tp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tp.email}</p>
                        </td>
                        <td className="py-3 pr-3 font-mono text-foreground">{tp.tin}</td>
                        <td className="py-3 pr-3">
                          <Badge variant="outline" className="text-[9px]">{TAXPAYER_TYPE_LABELS[tp.type]}</Badge>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={cn("flex items-center gap-1 font-medium", sm.color)}>
                            <Icon className="h-3 w-3" />
                            {sm.label}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={cn("text-xs font-medium capitalize",
                            tp.verStatus === "verified" ? "text-success" :
                            tp.verStatus === "flagged" ? "text-destructive" :
                            tp.verStatus === "in_review" ? "text-primary" : "text-warning"
                          )}>
                            {tp.verStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize", rm.color, rm.bg)}>
                            {tp.riskLevel} ({tp.riskScore})
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground text-[10px] max-w-[120px] truncate">{tp.rdo}</td>
                        <td className="py-3 pr-3">
                          {tp.vatRegistered
                            ? <Badge variant="default" className="text-[9px]">VAT</Badge>
                            : <span className="text-muted-foreground text-[10px]">Non-VAT</span>}
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(isExp ? null : tp.id)}>
                            {isExp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </td>
                      </tr>
                      {isExp && (
                        <tr key={`${tp.id}-exp`} className="border-b bg-muted/10">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              <div className="space-y-2">
                                <p className="font-semibold text-foreground">Contact</p>
                                <div className="space-y-1 text-muted-foreground">
                                  <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{tp.email}</div>
                                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{tp.phone}</div>
                                  <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{tp.address}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-foreground">Registration</p>
                                <div className="space-y-1 text-muted-foreground">
                                  <div><span>Date: </span><span className="text-foreground">{tp.registrationDate}</span></div>
                                  <div><span>RDO: </span><span className="text-foreground">{tp.rdo}</span></div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-foreground">Tax Types</p>
                                <div className="flex flex-wrap gap-1">
                                  {tp.taxTypes.map(t => (
                                    <Badge key={t} variant="secondary" className="text-[9px]">{t.replace(/_/g, " ")}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-semibold text-foreground">Actions</p>
                                <div className="flex flex-col gap-1.5">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full" onClick={() => navigate("/taxpayer/verification")}>
                                    <ShieldCheck className="h-3 w-3" /> View Verifications
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 w-full" onClick={() => toast.success("Edit form opened")}>
                                    <Edit className="h-3 w-3" /> Edit Record
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">No taxpayers match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Register Taxpayer Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Register New Taxpayer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { label: "Full Name / Legal Business Name", placeholder: "Juan dela Cruz", span: 2 },
              { label: "TIN", placeholder: "XXX-XXX-XXX-000" },
              { label: "Taxpayer Type", placeholder: "Individual" },
              { label: "Email Address", placeholder: "taxpayer@email.com" },
              { label: "Phone Number", placeholder: "+63 9XX XXX XXXX" },
              { label: "RDO Code", placeholder: "RDO 039" },
              { label: "RDO Name", placeholder: "Quezon City South" },
            ].map(f => (
              <div key={f.label} className={cn("space-y-1", f.span === 2 && "col-span-2")}>
                <Label className="text-xs">{f.label}</Label>
                <Input placeholder={f.placeholder} className="h-8 text-xs" />
              </div>
            ))}
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Registered Address</Label>
              <Input placeholder="Street, Barangay, City, Province" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowRegister(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setShowRegister(false); toast.success("Taxpayer registered successfully"); }}>
              Register Taxpayer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
