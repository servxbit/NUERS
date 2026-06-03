import { useState } from "react";
import {
  Building2, Plus, GitBranch, Layers, ChevronDown, ChevronUp,
  Search, MapPin, Mail,
  CheckCircle2, Clock, XCircle, Edit, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  legalName: string;
  tradeName: string;
  type: string;
  industry: string;
  secNo: string;
  dtiNo: string;
  status: string;
  branches: number;
  subsidiaries: number;
  city: string;
  province: string;
  email: string;
  capital: number;
  registeredDate: string;
}

const MOCK_BUSINESSES: Business[] = [
  { id: "be-001", legalName: "ABC Trading Corporation", tradeName: "ABC Trading", type: "corporation", industry: "Wholesale Trade", secNo: "CS2019-123456", dtiNo: "", status: "active", branches: 3, subsidiaries: 1, city: "Pasig", province: "Metro Manila", email: "finance@abctrading.ph", capital: 10000000, registeredDate: "2019-04-15" },
  { id: "be-002", legalName: "XYZ Partners Inc.", tradeName: "XYZ", type: "corporation", industry: "Financial Services", secNo: "CS2021-789012", dtiNo: "", status: "active", branches: 1, subsidiaries: 2, city: "Makati", province: "Metro Manila", email: "tax@xyzpartners.com", capital: 50000000, registeredDate: "2021-08-25" },
  { id: "be-003", legalName: "Santos Bakeshop", tradeName: "Santos Bakeshop", type: "sole_proprietorship", industry: "Food Service", secNo: "", dtiNo: "DTI-2023-456789", status: "active", branches: 2, subsidiaries: 0, city: "Paranaque", province: "Metro Manila", email: "maria@santos.ph", capital: 500000, registeredDate: "2023-02-10" },
  { id: "be-004", legalName: "Global Logistics Philippines Inc.", tradeName: "GlobalLog PH", type: "corporation", industry: "Logistics & Transport", secNo: "CS2018-012345", dtiNo: "", status: "suspended", branches: 5, subsidiaries: 0, city: "Manila", province: "Metro Manila", email: "compliance@globallogistics.ph", capital: 25000000, registeredDate: "2018-09-01" },
  { id: "be-005", legalName: "New Horizon Real Estate Corp.", tradeName: "New Horizon", type: "corporation", industry: "Real Estate", secNo: "CS2023-345678", dtiNo: "", status: "pending", branches: 1, subsidiaries: 3, city: "Taguig", province: "Metro Manila", email: "finance@newhorizon.ph", capital: 100000000, registeredDate: "2023-03-01" },
];

const BRANCHES = [
  { id: "br-001", businessId: "be-001", name: "Ortigas Branch", code: "ORG-01", type: "regular", city: "Mandaluyong", status: "active", manager: "Jose Santos" },
  { id: "br-002", businessId: "be-001", name: "Makati Branch", code: "MKT-01", type: "regular", city: "Makati", status: "active", manager: "Ana Reyes" },
  { id: "br-003", businessId: "be-001", name: "QC Satellite", code: "QC-SAT-01", type: "satellite", city: "Quezon City", status: "inactive", manager: "" },
  { id: "br-004", businessId: "be-002", name: "Head Office", code: "HO-001", type: "head_office", city: "Makati", status: "active", manager: "Maria Cruz" },
  { id: "br-005", businessId: "be-004", name: "Manila Port Office", code: "MNL-PORT", type: "regular", city: "Manila", status: "suspended", manager: "" },
];

const HIERARCHY = [
  { parent: "XYZ Partners Inc.", child: "XYZ Capital Ventures Inc.", type: "subsidiary", pct: 100 },
  { parent: "XYZ Partners Inc.", child: "XYZ Insurance Corp.", type: "affiliate", pct: 60 },
  { parent: "New Horizon Real Estate Corp.", child: "New Horizon Commercial Inc.", type: "subsidiary", pct: 100 },
  { parent: "New Horizon Real Estate Corp.", child: "Horizon Leasing Corp.", type: "joint_venture", pct: 51 },
  { parent: "New Horizon Real Estate Corp.", child: "NH Property Management", type: "subsidiary", pct: 100 },
];

const STATUS_ICON: Record<string, React.ElementType> = {
  active: CheckCircle2, pending: Clock, suspended: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  active: "text-success", pending: "text-warning", suspended: "text-destructive",
};

const BRANCH_STATUS_COLOR: Record<string, string> = {
  active: "text-success", inactive: "text-muted-foreground", closed: "text-destructive",
  suspended: "text-destructive", pending: "text-warning",
};

export function BusinessRegistration() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("businesses");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"business" | "branch">("business");

  const filtered = MOCK_BUSINESSES.filter(b =>
    !search || b.legalName.toLowerCase().includes(search.toLowerCase()) ||
    b.secNo.includes(search) || b.dtiNo.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Business Registration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">SEC/DTI entities, branches, company hierarchy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setAddType("branch"); setShowAdd(true); }}>
            <GitBranch className="h-3.5 w-3.5" /> Add Branch
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setAddType("business"); setShowAdd(true); }}>
            <Plus className="h-3.5 w-3.5" /> Register Business
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Businesses", val: MOCK_BUSINESSES.length, icon: Building2 },
          { label: "Active",           val: MOCK_BUSINESSES.filter(b => b.status === "active").length, icon: CheckCircle2 },
          { label: "Total Branches",   val: BRANCHES.length, icon: GitBranch },
          { label: "Company Groups",   val: 3, icon: Layers },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-8 w-8 p-2 rounded-lg bg-muted text-primary flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-foreground">{s.val}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-8">
            <TabsTrigger value="businesses" className="text-xs">Businesses</TabsTrigger>
            <TabsTrigger value="branches" className="text-xs">Branches</TabsTrigger>
            <TabsTrigger value="hierarchy" className="text-xs">Company Hierarchy</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-8 h-8 text-xs w-56" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── Businesses ──────────────────────────────────────────── */}
        {tab === "businesses" && (
          <Card>
            <CardContent className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {["Business","Type","Industry","SEC/DTI","Status","Branches","Capital",""].map(h => (
                        <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => {
                      const SIcon = STATUS_ICON[b.status] ?? Clock;
                      const isExp = expanded === b.id;
                      return (
                        <>
                          <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-3 pr-3">
                              <p className="font-semibold text-foreground">{b.legalName}</p>
                              <p className="text-[10px] text-muted-foreground">{b.tradeName !== b.legalName ? `d/b/a ${b.tradeName}` : ""}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <Badge variant="outline" className="text-[9px] capitalize">{b.type.replace("_", " ")}</Badge>
                            </td>
                            <td className="py-3 pr-3 text-muted-foreground">{b.industry}</td>
                            <td className="py-3 pr-3">
                              {b.secNo && <span className="font-mono text-[10px] text-foreground">{b.secNo}</span>}
                              {b.dtiNo && <span className="font-mono text-[10px] text-foreground">{b.dtiNo}</span>}
                            </td>
                            <td className="py-3 pr-3">
                              <span className={cn("flex items-center gap-1 font-medium", STATUS_COLOR[b.status])}>
                                <SIcon className="h-3 w-3" />
                                <span className="capitalize">{b.status}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-3 tabular-nums">{b.branches}</td>
                            <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                              ₱{(b.capital / 1_000_000).toFixed(1)}M
                            </td>
                            <td className="py-3">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(isExp ? null : b.id)}>
                                {isExp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </td>
                          </tr>
                          {isExp && (
                            <tr key={`${b.id}-exp`} className="border-b bg-muted/10">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-foreground">Registration</p>
                                    <div className="space-y-1 text-muted-foreground">
                                      <div><span>SEC: </span><span className="font-mono text-foreground">{b.secNo || "—"}</span></div>
                                      <div><span>DTI: </span><span className="font-mono text-foreground">{b.dtiNo || "—"}</span></div>
                                      <div><span>Registered: </span><span className="text-foreground">{b.registeredDate}</span></div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-semibold text-foreground">Address & Contact</p>
                                    <div className="space-y-1 text-muted-foreground">
                                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}, {b.province}</div>
                                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{b.email}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-semibold text-foreground">Structure</p>
                                    <div className="space-y-1 text-muted-foreground">
                                      <div><span>Branches: </span><span className="font-medium text-foreground">{b.branches}</span></div>
                                      <div><span>Subsidiaries: </span><span className="font-medium text-foreground">{b.subsidiaries}</span></div>
                                      <div><span>Authorized Capital: </span><span className="font-medium text-foreground">₱{b.capital.toLocaleString()}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Branches ─────────────────────────────────────────────── */}
        {tab === "branches" && (
          <Card>
            <CardContent className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {["Branch Name","Code","Type","Business","City","Manager","Status",""].map(h => (
                        <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BRANCHES.map(br => {
                      const biz = MOCK_BUSINESSES.find(b => b.id === br.businessId);
                      return (
                        <tr key={br.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-3 pr-3 font-semibold text-foreground">{br.name}</td>
                          <td className="py-3 pr-3 font-mono text-muted-foreground">{br.code}</td>
                          <td className="py-3 pr-3">
                            <Badge variant="outline" className="text-[9px] capitalize">{br.type.replace("_", " ")}</Badge>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">{biz?.legalName ?? "—"}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{br.city}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{br.manager || "—"}</td>
                          <td className="py-3 pr-3">
                            <span className={cn("font-medium capitalize", BRANCH_STATUS_COLOR[br.status])}>{br.status}</span>
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.success("Edit branch")}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Company Hierarchy ────────────────────────────────────── */}
        {tab === "hierarchy" && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Parent-child relationships between business entities.</p>
              <div className="space-y-2">
                {HIERARCHY.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-foreground">{h.parent}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground inline mx-1" />
                      <span className="text-xs text-foreground">{h.child}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] capitalize">{h.type.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">{h.pct}%</span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => toast.success("Add hierarchy relationship")}>
                <Plus className="h-3.5 w-3.5" /> Add Relationship
              </Button>
            </CardContent>
          </Card>
        )}
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {addType === "business" ? "Register Business Entity" : "Add Branch Office"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {addType === "business" ? (
              <>
                <div className="col-span-2 space-y-1"><Label className="text-xs">Legal Business Name</Label><Input className="h-8 text-xs" placeholder="ABC Corporation" /></div>
                <div className="space-y-1"><Label className="text-xs">Trade Name (DBA)</Label><Input className="h-8 text-xs" placeholder="ABC Corp" /></div>
                <div className="space-y-1"><Label className="text-xs">Business Type</Label><Input className="h-8 text-xs" placeholder="Corporation" /></div>
                <div className="space-y-1"><Label className="text-xs">SEC Registration No.</Label><Input className="h-8 text-xs" placeholder="CS2024-XXXXXX" /></div>
                <div className="space-y-1"><Label className="text-xs">DTI Registration No.</Label><Input className="h-8 text-xs" placeholder="DTI-2024-XXXXXX" /></div>
                <div className="space-y-1"><Label className="text-xs">Industry</Label><Input className="h-8 text-xs" placeholder="Wholesale Trade" /></div>
                <div className="space-y-1"><Label className="text-xs">Authorized Capital (PHP)</Label><Input className="h-8 text-xs" placeholder="1,000,000.00" /></div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">Registered Address</Label><Input className="h-8 text-xs" placeholder="Street, City, Province" /></div>
              </>
            ) : (
              <>
                <div className="col-span-2 space-y-1"><Label className="text-xs">Branch Name</Label><Input className="h-8 text-xs" placeholder="Makati Branch" /></div>
                <div className="space-y-1"><Label className="text-xs">Branch Code</Label><Input className="h-8 text-xs" placeholder="MKT-01" /></div>
                <div className="space-y-1"><Label className="text-xs">Branch Type</Label><Input className="h-8 text-xs" placeholder="Regular" /></div>
                <div className="space-y-1"><Label className="text-xs">Branch TIN</Label><Input className="h-8 text-xs" placeholder="XXX-XXX-XXX-001" /></div>
                <div className="space-y-1"><Label className="text-xs">Manager Name</Label><Input className="h-8 text-xs" placeholder="Juan Cruz" /></div>
                <div className="col-span-2 space-y-1"><Label className="text-xs">Branch Address</Label><Input className="h-8 text-xs" placeholder="Street, City" /></div>
              </>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setShowAdd(false); toast.success(addType === "business" ? "Business registered" : "Branch added"); }}>
              {addType === "business" ? "Register Business" : "Add Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
