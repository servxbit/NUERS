import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Download, FileText, Receipt, CreditCard,
  TrendingUp, TrendingDown, Truck, Wrench,
  CheckCircle2, Clock, AlertTriangle, XCircle, Eye, Copy,
  RefreshCw, MoreHorizontal, BarChart3, Loader2, Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  BIR_DOCUMENT_TYPES, DOC_TYPE_META, STATUS_META, formatAmount,
  type DocumentType, type Invoice, type InvoiceStatus,
} from "@/lib/invoice-utils";
import { apiFetch, readJsonResponse } from "@/lib/api-url";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ─── Doc type icon map ─────────────────────────────────────────────────────
const DOC_ICON: Record<DocumentType, React.ElementType> = {
  vat_invoice:        FileText,
  non_vat_invoice:    FileText,
  vat_exempt_invoice: Receipt,
  zero_rated_invoice: Receipt,
  mixed_sales_invoice: FileText,
  payment_receipt:    Receipt,
  sales_invoice:    FileText,
  official_receipt: Receipt,
  credit_memo:      CreditCard,
  debit_memo:       TrendingUp,
  purchase_invoice: TrendingDown,
  delivery_receipt: Truck,
  service_invoice:  Wrench,
};

const STATUS_ICON: Record<InvoiceStatus, React.ElementType> = {
  draft:               FileText,
  pending:             Clock,
  validated:           CheckCircle2,
  sent:                RefreshCw,
  paid:                CheckCircle2,
  partially_paid:      Clock,
  overdue:             AlertTriangle,
  cancelled:           XCircle,
  voided:              XCircle,
  correction_pending:  AlertTriangle,
};

const API_TOKEN_KEY = "nuers_api_token";

type InvoiceSummary = {
  invoice_count: number;
  total_issued: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
};

type InvoiceMerchant = {
  id: string;
  business_name: string;
  tin: string;
  address: string;
  email: string;
  rdo_code?: string | null;
  rdo_name?: string | null;
};

type InvoiceTrendPoint = {
  month: string;
  issued: number;
  paid: number;
  overdue: number;
};

type InvoiceTypePoint = {
  type: string;
  document_type: DocumentType;
  count: number;
  amount: number;
};

function authHeaders() {
  const headers = new Headers({ Accept: "application/json" });

  try {
    const token = window.localStorage.getItem(API_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }

  return headers;
}

function exportInvoicesCsv(invoices: Invoice[], merchant?: InvoiceMerchant | null) {
  if (invoices.length === 0) {
    toast.info("No database invoices to export for this Business Account.");
    return;
  }

  const rows = [
    ["Business Account", merchant?.business_name ?? ""],
    ["TIN", merchant?.tin ?? ""],
    [],
    ["Invoice #", "Type", "Buyer", "Buyer TIN", "Issue Date", "Due Date", "Total Amount", "Amount Paid", "Amount Due", "Status", "Formats"],
    ...invoices.map((invoice) => [
      invoice.invoice_number,
      DOC_TYPE_META[invoice.document_type]?.label ?? invoice.document_type,
      invoice.buyer_name,
      invoice.buyer_tin ?? "",
      invoice.issue_date ?? "",
      invoice.due_date ?? "",
      (invoice.total_amount / 100).toFixed(2),
      (invoice.amount_paid / 100).toFixed(2),
      (invoice.amount_due / 100).toFixed(2),
      STATUS_META[invoice.status]?.label ?? invoice.status,
      (invoice.formats_generated ?? []).join("|"),
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nuers-invoices-${merchant?.tin || "business-account"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Exported database invoices.");
}

export function MerchantInvoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tab, setTab] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [merchant, setMerchant] = useState<InvoiceMerchant | null>(null);
  const [summary, setSummary] = useState<InvoiceSummary>({
    invoice_count: 0,
    total_issued: 0,
    total_collected: 0,
    total_outstanding: 0,
    total_overdue: 0,
  });
  const [trendData, setTrendData] = useState<InvoiceTrendPoint[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<InvoiceTypePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const serverStatus = useMemo(() => {
    if (statusFilter !== "all") return statusFilter;
    return tab;
  }, [statusFilter, tab]);

  const loadInvoices = useCallback(async (quiet = false) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (serverStatus !== "all") params.set("status", serverStatus);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await apiFetch(`/api/business-invoices?${params.toString()}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const payload = await readJsonResponse<{
        merchant?: InvoiceMerchant | null;
        invoices?: Invoice[];
        summary?: InvoiceSummary;
        trend?: InvoiceTrendPoint[];
        type_distribution?: InvoiceTypePoint[];
      }>(response, "Unable to load Business Account invoices.");

      setMerchant(payload.merchant ?? null);
      setInvoices(payload.invoices ?? []);
      setSummary(payload.summary ?? {
        invoice_count: 0,
        total_issued: 0,
        total_collected: 0,
        total_outstanding: 0,
        total_overdue: 0,
      });
      setTrendData(payload.trend ?? []);
      setTypeDistribution(payload.type_distribution ?? []);
    } catch (err) {
      setInvoices([]);
      setMerchant(null);
      setError(err instanceof Error ? err.message : "Unable to load Business Account invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, serverStatus, typeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadInvoices();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadInvoices]);

  const filtered = invoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Electronic Invoicing Engine</h1>
          <p className="text-sm text-muted-foreground">
            {merchant
              ? `Database invoices for ${merchant.business_name}${merchant.tin ? ` · TIN ${merchant.tin}` : ""}`
              : "Module 1 — Real-time invoice generation, tax computation & digital signing"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadInvoices(true)} disabled={refreshing} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" onClick={() => navigate("/merchant/invoices/create")} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Issued",       value: formatAmount(summary.total_issued),       icon: FileText,       color: "text-primary",     sub: `${summary.invoice_count} account invoices` },
          { label: "Total Collected",    value: formatAmount(summary.total_collected),    icon: CheckCircle2,   color: "text-success",     sub: "Paid invoices" },
          { label: "Outstanding",        value: formatAmount(summary.total_outstanding),  icon: Clock,          color: "text-warning",     sub: "Awaiting payment" },
          { label: "Overdue",            value: `${summary.total_overdue} invoices`,      icon: AlertTriangle,  color: "text-destructive", sub: "Requires action" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-semibold">Invoice Trend — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area dataKey="issued" stroke="var(--chart-1)" fill="url(#gIssued)" strokeWidth={2} />
                <Area dataKey="paid" stroke="var(--chart-2)" fill="url(#gPaid)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className="text-sm font-semibold">By Document Type</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeDistribution} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick doc type buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {BIR_DOCUMENT_TYPES.map((type) => {
          const meta = DOC_TYPE_META[type];
          const Icon = DOC_ICON[type];
          return (
            <Button
              key={type}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1.5"
              onClick={() => navigate(`/merchant/invoices/create?type=${type}`)}
            >
              <Icon className={`h-4 w-4 ${meta.color}`} />
              <span className="text-[10px] font-medium leading-tight text-center">{meta.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[200px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice # or buyer..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {BIR_DOCUMENT_TYPES.map((k) => {
                  const v = DOC_TYPE_META[k];
                  return (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.entries(STATUS_META) as [InvoiceStatus, typeof STATUS_META[InvoiceStatus]][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => exportInvoicesCsv(filtered, merchant)}
            >
              <Download className="h-3 w-3" /> Export
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <Tabs value={tab} onValueChange={setTab} className="mb-4">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unpaid" className="text-xs">Unpaid</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {["Invoice #","Type","Buyer","Issue Date","Due Date","Amount","Status","Formats",""].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading real Business Account invoices...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(inv => {
                  const Icon = DOC_ICON[inv.document_type];
                  const StatusIcon = STATUS_ICON[inv.status];
                  const meta = DOC_TYPE_META[inv.document_type];
                  const statusMeta = STATUS_META[inv.status];
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-3">
                        <span className="text-xs font-mono font-medium text-foreground">{inv.invoice_number}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          <span className="text-xs text-muted-foreground">{meta.short}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-medium text-foreground">{inv.buyer_name}</p>
                        {inv.buyer_tin && <p className="text-[10px] text-muted-foreground font-mono">{inv.buyer_tin}</p>}
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{inv.issue_date}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{inv.due_date ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <span className={`text-xs font-bold tabular-nums ${inv.total_amount < 0 ? "text-destructive" : "text-foreground"}`}>
                          {formatAmount(inv.total_amount)}
                        </span>
                        {inv.amount_due > 0 && inv.status !== "paid" && (
                          <p className="text-[10px] text-muted-foreground">Due: {formatAmount(inv.amount_due)}</p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={statusMeta.variant} className="gap-1 text-[10px]">
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-1">
                          {(inv.formats_generated ?? []).map(f => (
                            <span key={f} className="text-[9px] uppercase font-bold px-1 py-0.5 bg-muted rounded text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => navigate(`/merchant/invoices/${inv.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/merchant/invoices/${inv.id}/edit`)}>
                              <FileText className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(inv.invoice_number); toast.success("Copied!"); }}>
                              <Copy className="h-3.5 w-3.5 mr-2" /> Copy Number
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toast.info(`Downloading ${inv.invoice_number}.pdf…`)}>
                              <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Exporting JSON…`)}>
                              <Download className="h-3.5 w-3.5 mr-2" /> Export JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Exporting XML…`)}>
                              <Download className="h-3.5 w-3.5 mr-2" /> Export XML
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Exporting CSV…`)}>
                              <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <Database className="h-8 w-8 text-muted-foreground/70" />
                        <span className="font-medium text-foreground">No database invoices found for this Business Account.</span>
                        <span className="text-xs">Saved invoices will appear here only when they belong to the currently logged-in account.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {summary.invoice_count} invoices</span>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>Total shown: {formatAmount(filtered.reduce((s, i) => s + i.total_amount, 0))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
