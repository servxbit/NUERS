import { useState } from "react";
import {
  Search, Download, Eye, FileText, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Clock, Archive, RefreshCw,
  Receipt, CreditCard, Tag, Calendar, Hash,
  SlidersHorizontal, X, Plus, MoreHorizontal, TrendingUp,
  Layers, Truck, Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const statusConfig = {
  draft:     { label: "Draft",     icon: FileText,     cls: "bg-muted text-muted-foreground border-border" },
  pending:   { label: "Pending",   icon: Clock,        cls: "bg-warning/15 text-warning-foreground border-warning/30" },
  submitted: { label: "Submitted", icon: RefreshCw,    cls: "bg-primary/10 text-primary border-primary/30" },
  accepted:  { label: "Accepted",  icon: CheckCircle2, cls: "bg-success/15 text-success border-success/30" },
  rejected:  { label: "Rejected",  icon: XCircle,      cls: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { label: "Cancelled", icon: XCircle,      cls: "bg-muted text-muted-foreground border-border" },
  archived:  { label: "Archived",  icon: Archive,      cls: "bg-muted text-muted-foreground border-border" },
};

type InvoiceStatus = keyof typeof statusConfig;

const ALL_TAGS = ["VAT", "Large", "Banking", "Credit", "Telecom", "Government", "Utilities", "Aviation", "Food Service", "Zero-Rated", "Exempt", "Priority"];

const invoices = [
  { id: "INV-2026-0001842", type: "Sales Invoice", taxpayer: "SM Prime Holdings, Inc.", tin: "123-456-789-000", branch: "Main Office", customer: "Makati Development Corp.", date: "2026-05-29", dueDate: "2026-06-28", amount: 2840500.00, tax: 341260.00, status: "accepted" as InvoiceStatus, birRef: "BIR-EIS-2026-0481923", tags: ["VAT", "Large"] },
  { id: "INV-2026-0001841", type: "Official Receipt", taxpayer: "Ayala Land, Inc.", tin: "234-567-890-000", branch: "BGC Branch", customer: "Bonifacio Global City Corp.", date: "2026-05-29", dueDate: "2026-06-15", amount: 1240800.00, tax: 149136.00, status: "accepted" as InvoiceStatus, birRef: "BIR-EIS-2026-0481922", tags: ["VAT"] },
  { id: "INV-2026-0001840", type: "Sales Invoice", taxpayer: "BDO Unibank, Inc.", tin: "345-678-901-000", branch: "Makati HQ", customer: "Philippine Nat'l Bank", date: "2026-05-29", dueDate: "2026-06-29", amount: 580200.00, tax: 69624.00, status: "rejected" as InvoiceStatus, birRef: "BIR-EIS-2026-0481921", tags: ["VAT", "Banking"] },
  { id: "INV-2026-0001839", type: "Credit Memo", taxpayer: "Globe Telecom, Inc.", tin: "456-789-012-000", branch: "Pasig Office", customer: "Enterprise Client 001", date: "2026-05-28", dueDate: "2026-06-27", amount: -124000.00, tax: -14880.00, status: "accepted" as InvoiceStatus, birRef: "BIR-EIS-2026-0481820", tags: ["Credit", "Telecom"] },
  { id: "INV-2026-0001838", type: "Service Invoice", taxpayer: "Jollibee Foods Corp.", tin: "567-890-123-000", branch: "Ortigas Center", customer: "Franchise Owner 2841", date: "2026-05-28", dueDate: "2026-06-12", amount: 892400.00, tax: 107088.00, status: "pending" as InvoiceStatus, birRef: null, tags: ["Food Service"] },
  { id: "INV-2026-0001837", type: "Official Receipt", taxpayer: "PLDT, Inc.", tin: "678-901-234-000", branch: "Makati HQ", customer: "DOT Philippines", date: "2026-05-28", dueDate: "2026-06-28", amount: 3240600.00, tax: 388872.00, status: "submitted" as InvoiceStatus, birRef: "BIR-EIS-2026-0481819", tags: ["Government", "Telecom"] },
  { id: "INV-2026-0001836", type: "Debit Memo", taxpayer: "Meralco Corp.", tin: "789-012-345-000", branch: "San Isidro Office", customer: "Industrial Client 0042", date: "2026-05-27", dueDate: "2026-06-11", amount: 48200.00, tax: 5784.00, status: "draft" as InvoiceStatus, birRef: null, tags: ["Utilities"] },
  { id: "INV-2026-0001835", type: "Purchase Invoice", taxpayer: "Philippine Airlines", tin: "890-123-456-000", branch: "NAIA Terminal 2", customer: "Fuel Supplier Corp.", date: "2026-05-27", dueDate: "2026-06-10", amount: 18240000.00, tax: 2188800.00, status: "accepted" as InvoiceStatus, birRef: "BIR-EIS-2026-0481718", tags: ["Large", "Aviation"] },
  { id: "INV-2026-0001834", type: "Delivery Receipt", taxpayer: "San Miguel Corp.", tin: "901-234-567-000", branch: "Mandaluyong Plant", customer: "Distributor PH 041", date: "2026-05-26", dueDate: "2026-06-10", amount: 672000.00, tax: 80640.00, status: "archived" as InvoiceStatus, birRef: "BIR-EIS-2026-0481600", tags: ["VAT"] },
  { id: "INV-2026-0001833", type: "Sales Invoice", taxpayer: "Petron Corporation", tin: "012-345-678-000", branch: "Batangas Refinery", customer: "DPWH Region IV", date: "2026-05-26", dueDate: "2026-06-05", amount: 42800000.00, tax: 5136000.00, status: "cancelled" as InvoiceStatus, birRef: null, tags: ["Large", "Government"] },
];

const summaryCards = [
  { label: "Total Invoices",    value: "1,284,392", color: "text-primary",     icon: FileText,     delta: "+2.4%" },
  { label: "Accepted",          value: "1,278,240", color: "text-success",     icon: CheckCircle2, delta: "+2.3%" },
  { label: "Rejected",          value: "3,812",     color: "text-destructive", icon: XCircle,      delta: "-0.8%" },
  { label: "Pending Review",    value: "2,340",     color: "text-warning",     icon: Clock,        delta: "+12%" },
];

const classificationOptions = ["All Types", "Sales Invoice", "Official Receipt", "Credit Memo", "Debit Memo", "Purchase Invoice", "Delivery Receipt", "Service Invoice"];

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = statusConfig[status];
  return <Badge className={cn("text-xs border", cfg.cls)}>{cfg.label}</Badge>;
}

function TagBadge({ tag }: { tag: string }) {
  return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>;
}

// ─── Advanced Search Dialog ──────────────────────────────────────────────────
function AdvancedSearchDialog({ onSearch }: { onSearch: (filters: Record<string, string>) => void }) {
  const [filters, setFilters] = useState<Record<string, string>>({
    invoiceNumber: "", tin: "", branch: "", customer: "",
    dateFrom: "", dateTo: "", status: "all", amountMin: "", amountMax: "",
  });

  function set(k: string, v: string) { setFilters((f) => ({ ...f, [k]: v })); }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Advanced Invoice Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Invoice Number</Label>
              <Input placeholder="INV-2026-..." className="h-8 text-xs" value={filters.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">TIN</Label>
              <Input placeholder="123-456-789" className="h-8 text-xs" value={filters.tin} onChange={(e) => set("tin", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Branch</Label>
              <Input placeholder="Branch name" className="h-8 text-xs" value={filters.branch} onChange={(e) => set("branch", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Customer</Label>
              <Input placeholder="Customer name" className="h-8 text-xs" value={filters.customer} onChange={(e) => set("customer", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Date From</Label>
              <Input type="date" className="h-8 text-xs" value={filters.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Date To</Label>
              <Input type="date" className="h-8 text-xs" value={filters.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Amount Min (₱)</Label>
              <Input placeholder="0" className="h-8 text-xs" value={filters.amountMin} onChange={(e) => set("amountMin", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">Amount Max (₱)</Label>
              <Input placeholder="999,999,999" className="h-8 text-xs" value={filters.amountMax} onChange={(e) => set("amountMax", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">Status</Label>
            <Select value={filters.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 h-8 text-xs" onClick={() => onSearch(filters)}>Search</Button>
            <Button variant="outline" className="h-8 text-xs" onClick={() => setFilters({ invoiceNumber: "", tin: "", branch: "", customer: "", dateFrom: "", dateTo: "", status: "all", amountMin: "", amountMax: "" })}>
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tag Management Dialog ───────────────────────────────────────────────────
function TagManagementDialog() {
  const [activeTags, setActiveTags] = useState<string[]>(["VAT", "Large", "Government"]);
  const toggle = (t: string) => setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Tag className="h-3.5 w-3.5" /> Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Invoice Classification Tags</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-xs text-muted-foreground mb-3">Click to toggle active tag filters</p>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors",
                  activeTags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex items-center gap-2">
            <Input placeholder="New tag..." className="h-8 text-xs flex-1" />
            <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice Row ─────────────────────────────────────────────────────────────
function InvoiceRow({ inv }: { inv: typeof invoices[0] }) {
  const [expanded, setExpanded] = useState(false);
  const typeIconMap: Record<string, React.ElementType> = {
    "Sales Invoice": FileText, "Official Receipt": Receipt,
    "Credit Memo": CreditCard, "Debit Memo": TrendingUp,
    "Purchase Invoice": FileText, "Delivery Receipt": Truck,
    "Service Invoice": Wrench,
  };
  const TypeIcon = typeIconMap[inv.type] ?? FileText;

  return (
    <>
      <tr className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setExpanded((v) => !v)}>
        <td className="px-4 py-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </td>
        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{inv.id}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs">
            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {inv.type}
          </div>
        </td>
        <td className="px-4 py-3 text-xs font-medium max-w-[140px] truncate">{inv.taxpayer}</td>
        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{inv.tin}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{inv.branch}</td>
        <td className="px-4 py-3 text-xs">{inv.date}</td>
        <td className="px-4 py-3 text-xs font-semibold text-right">
          ₱{Math.abs(inv.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          {inv.amount < 0 && <span className="text-destructive ml-1">(CR)</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1 flex-wrap max-w-[100px]">
            {inv.tags.slice(0, 2).map((t) => <TagBadge key={t} tag={t} />)}
            {inv.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{inv.tags.length - 2}</span>}
          </div>
        </td>
        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
        <td className="px-4 py-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10 border-b">
          <td colSpan={11} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Receipt className="h-3 w-3" />Customer</p>
                <p className="text-xs font-medium">{inv.customer}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Due Date</p>
                <p className="text-xs font-medium">{inv.dueDate}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><CreditCard className="h-3 w-3" />VAT Amount</p>
                <p className="text-xs font-medium">₱{Math.abs(inv.tax).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Tag className="h-3 w-3" />All Tags</p>
                <div className="flex flex-wrap gap-1">{inv.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>
              </div>
              {inv.birRef && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Hash className="h-3 w-3" />BIR Reference</p>
                  <p className="text-xs font-mono font-medium text-success">{inv.birRef}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Lifecycle Stage</p>
                <div className="flex items-center gap-1">
                  {Object.keys(statusConfig).map((s, i) => (
                    <div key={s} className="flex items-center gap-0.5">
                      <div className={cn("w-2 h-2 rounded-full", s === inv.status ? "bg-primary" : "bg-border")} />
                      {i < Object.keys(statusConfig).length - 1 && <div className="w-3 h-px bg-border" />}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{inv.status}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" /> PDF</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><FileText className="h-3 w-3" /> XML</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Eye className="h-3 w-3" /> View Full</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Tag className="h-3 w-3" /> Edit Tags</Button>
              {inv.status === "rejected" && (
                <Button size="sm" className="h-7 text-xs gap-1 bg-primary"><RefreshCw className="h-3 w-3" /> Resubmit</Button>
              )}
              {(inv.status === "accepted" || inv.status === "submitted") && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-warning border-warning/40 hover:bg-warning/10"><Archive className="h-3 w-3" /> Archive</Button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Tracking Panel ──────────────────────────────────────────────────────────
function InvoiceTrackingPanel() {
  const [trackId, setTrackId] = useState("");
  const trackingSteps = [
    { step: "Created",    time: "2026-05-29 08:14:22", done: true,  note: "Draft generated by Business Account API" },
    { step: "Validated",  time: "2026-05-29 08:14:23", done: true,  note: "All fields pass BIR schema validation" },
    { step: "Signed",     time: "2026-05-29 08:14:24", done: true,  note: "RSA-2048 digital signature applied" },
    { step: "Submitted",  time: "2026-05-29 08:14:31", done: true,  note: "Transmitted to BIR EIS endpoint" },
    { step: "Acknowledged", time: "2026-05-29 08:14:44", done: true,  note: "BIR returned ACK-2026-0481923" },
    { step: "Accepted",   time: "2026-05-29 08:15:01", done: true,  note: "BIR processed and accepted invoice" },
  ];

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3 px-5 pt-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" /> Invoice Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Invoice # or BIR Reference..."
            className="h-9 text-xs flex-1"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
          />
          <Button size="sm" className="h-9 text-xs gap-1"><Search className="h-3.5 w-3.5" /> Track</Button>
        </div>
        <div className="space-y-2">
          {trackingSteps.map((step, i) => (
            <div key={step.step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  step.done ? "bg-success border-success" : "bg-muted border-border"
                )}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-success-foreground" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                </div>
                {i < trackingSteps.length - 1 && <div className={cn("w-px flex-1 min-h-4", step.done ? "bg-success/40" : "bg-border")} />}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{step.step}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{step.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{step.note}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvoiceManagementCenter() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [activeSearchFilters, setActiveSearchFilters] = useState<Record<string, string>>({});

  const hasActiveFilters = Object.values(activeSearchFilters).some((v) => v && v !== "all");

  function filterInvoices(tab: string) {
    return invoices
      .filter((inv) => {
        if (tab === "sales") return inv.type === "Sales Invoice";
        if (tab === "receipts") return inv.type === "Official Receipt";
        if (tab === "memos") return inv.type === "Credit Memo" || inv.type === "Debit Memo";
        if (tab === "archived") return inv.status === "archived";
        if (tab === "service") return inv.type === "Service Invoice";
        return true;
      })
      .filter((inv) => typeFilter === "All Types" || inv.type === typeFilter)
      .filter((inv) => statusFilter === "all" || inv.status === statusFilter)
      .filter((inv) =>
        search === "" ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.tin.includes(search) ||
        inv.taxpayer.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase()) ||
        inv.branch.toLowerCase().includes(search.toLowerCase())
      );
  }

  return (
    <div className="max-w-full space-y-4 p-0 sm:space-y-6 xl:max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary bg-primary/5">MODULE 5</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice Management Center</h1>
          <p className="text-sm text-muted-foreground">Unified repository, search engine, classification, and lifecycle tracking for all electronic invoices</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <c.icon className={cn("h-5 w-5", c.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
                <p className={cn("text-[10px] font-semibold", c.delta.startsWith("+") ? "text-success" : "text-destructive")}>{c.delta} today</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Table — 3/4 width */}
        <div className="xl:col-span-3 space-y-4">
          <Tabs defaultValue="all">
            {/* Toolbar */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
                  <TabsTrigger value="receipts" className="text-xs">Receipts</TabsTrigger>
                  <TabsTrigger value="memos" className="text-xs">Credit/Debit</TabsTrigger>
                  <TabsTrigger value="service" className="text-xs">Service</TabsTrigger>
                  <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <AdvancedSearchDialog onSearch={setActiveSearchFilters} />
                  <TagManagementDialog />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-0 basis-full sm:min-w-[200px] sm:basis-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice #, TIN, taxpayer, customer, branch..."
                    className="h-9 pl-9 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 w-full text-xs sm:w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classificationOptions.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-full text-xs sm:w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Advanced filters active</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive px-2" onClick={() => setActiveSearchFilters({})}>
                    <X className="h-3 w-3 mr-1" /> Clear filters
                  </Button>
                </div>
              )}
            </div>

            {["all", "sales", "receipts", "memos", "service", "archived"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-3">
                <Card className="border border-border/60">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="w-8 px-4 py-3" />
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Taxpayer</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TIN</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {filterInvoices(tab).map((inv) => <InvoiceRow key={inv.id} inv={inv} />)}
                          {filterInvoices(tab).length === 0 && (
                            <tr><td colSpan={11} className="px-4 py-8 text-center text-xs text-muted-foreground">No invoices match your filters</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-xs text-muted-foreground">Showing {filterInvoices(tab).length} of 1,284,392 invoices</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs">Previous</Button>
                        <span className="text-xs text-muted-foreground">Page 1 of 128,440</span>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Next</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Invoice Lifecycle Guide */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Invoice Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(statusConfig).map(([key, val], i, arr) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge className={cn("text-xs border", val.cls)}>{val.label}</Badge>
                    {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Invoices progress through the lifecycle. Rejected invoices can be resubmitted. Accepted invoices can be archived after 7 years per BIR retention policy.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar — 1/4 width */}
        <div className="space-y-4">
          <InvoiceTrackingPanel />

          {/* Classification Summary */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Classification Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              {[
                { type: "Sales Invoice",    count: 584291, icon: FileText   },
                { type: "Official Receipt", count: 412841, icon: Receipt    },
                { type: "Service Invoice",  count: 187234, icon: Wrench     },
                { type: "Purchase Invoice", count: 62910,  icon: FileText   },
                { type: "Delivery Receipt", count: 24841,  icon: Truck      },
                { type: "Credit Memo",      count: 8234,   icon: CreditCard },
                { type: "Debit Memo",       count: 4041,   icon: TrendingUp },
              ].map(({ type, count, icon: Icon }) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{type}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{count.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Archiving Policy */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Archive className="h-4 w-4 text-primary" /> Archiving Policy</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              {[
                { label: "Retention Period",   value: "10 years (BIR)" },
                { label: "Auto-Archive After", value: "7 years" },
                { label: "Archive Storage",    value: "Cold Tier (AWS S3 Glacier)" },
                { label: "Legal Hold Active",  value: "3 invoices" },
                { label: "WORM Compliant",     value: "Yes — Immutable" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
