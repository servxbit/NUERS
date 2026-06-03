import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Brain,
  Building2,
  CreditCard,
  Download,
  FileText,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createMerchantExpense,
  useMerchantExpenses,
  type MerchantExpense,
} from "@/lib/merchant-expenses-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ExpenseFormState = {
  source_invoice_reference: string;
  purchase_order_reference: string;
  supplier_name: string;
  supplier_tin: string;
  expense_category: string;
  description: string;
  gross_amount: string;
  vatable_amount: string;
  input_vat_amount: string;
  withholding_tax_amount: string;
  due_at: string;
};

const initialForm: ExpenseFormState = {
  source_invoice_reference: "",
  purchase_order_reference: "",
  supplier_name: "",
  supplier_tin: "",
  expense_category: "General",
  description: "",
  gross_amount: "",
  vatable_amount: "",
  input_vat_amount: "",
  withholding_tax_amount: "",
  due_at: "",
};

function formatPHP(value: number) {
  if (Math.abs(value) >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `PHP ${(value / 1_000).toFixed(1)}K`;
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
}

function statusClass(value: string | null | undefined) {
  const status = String(value ?? "").toLowerCase();
  if (["matched", "validated", "deductible", "paid", "for_payment", "low"].some((key) => status.includes(key))) {
    return "border-success/20 bg-success/10 text-success";
  }
  if (["critical", "high", "flagged", "bir_flagged", "mismatch", "hold"].some((key) => status.includes(key))) {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  if (["pending", "review", "medium"].some((key) => status.includes(key))) {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  return "border-border bg-secondary text-muted-foreground";
}

function pretty(value: string | null | undefined) {
  return String(value ?? "N/A").replaceAll("_", " ");
}

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className={cn("border-l-4", accent)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ExpenseModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormState>(initialForm);
  const [saving, setSaving] = useState(false);

  function setField(key: keyof ExpenseFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await createMerchantExpense({
        source_invoice_reference: form.source_invoice_reference,
        purchase_order_reference: form.purchase_order_reference || undefined,
        supplier_name: form.supplier_name,
        supplier_tin: form.supplier_tin || undefined,
        expense_category: form.expense_category,
        description: form.description || undefined,
        gross_amount: Number(form.gross_amount),
        vatable_amount: form.vatable_amount ? Number(form.vatable_amount) : undefined,
        input_vat_amount: form.input_vat_amount ? Number(form.input_vat_amount) : undefined,
        withholding_tax_amount: form.withholding_tax_amount ? Number(form.withholding_tax_amount) : undefined,
        due_at: form.due_at || undefined,
        payment_status: "unpaid",
        validation_status: "pending_validation",
        reconciliation_status: "pending",
        claim_status: "pending_validation",
        risk_level: "Medium",
      });

      toast.success("B2B expense recorded.");
      setForm(initialForm);
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Record B2B Expense
          </DialogTitle>
          <DialogDescription>
            Use this for supplier invoices generated by another business account for your business.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source_invoice_reference">Supplier invoice number</Label>
              <Input
                id="source_invoice_reference"
                required
                value={form.source_invoice_reference}
                onChange={(event) => setField("source_invoice_reference", event.target.value)}
                placeholder="SI-2026-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_order_reference">Purchase order reference</Label>
              <Input
                id="purchase_order_reference"
                value={form.purchase_order_reference}
                onChange={(event) => setField("purchase_order_reference", event.target.value)}
                placeholder="PO-2026-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier business account</Label>
              <Input
                id="supplier_name"
                required
                value={form.supplier_name}
                onChange={(event) => setField("supplier_name", event.target.value)}
                placeholder="Supplier business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_tin">Supplier TIN</Label>
              <Input
                id="supplier_tin"
                value={form.supplier_tin}
                onChange={(event) => setField("supplier_tin", event.target.value)}
                placeholder="000-000-000-000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense_category">Expense category</Label>
              <Select value={form.expense_category} onValueChange={(value) => setField("expense_category", value)}>
                <SelectTrigger id="expense_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["General", "Inventory", "Freight", "Office supplies", "Utilities", "Professional services", "Equipment", "Software"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_at">Due date</Label>
              <Input
                id="due_at"
                type="date"
                value={form.due_at}
                onChange={(event) => setField("due_at", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gross_amount">Gross amount</Label>
              <Input
                id="gross_amount"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.gross_amount}
                onChange={(event) => setField("gross_amount", event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatable_amount">Vatable amount</Label>
              <Input
                id="vatable_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.vatable_amount}
                onChange={(event) => setField("vatable_amount", event.target.value)}
                placeholder="Auto computed if blank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="input_vat_amount">Input VAT</Label>
              <Input
                id="input_vat_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.input_vat_amount}
                onChange={(event) => setField("input_vat_amount", event.target.value)}
                placeholder="Auto computed if blank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withholding_tax_amount">EWT/CWT withheld</Label>
              <Input
                id="withholding_tax_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.withholding_tax_amount}
                onChange={(event) => setField("withholding_tax_amount", event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="What was purchased and why this invoice should be claimed as an expense."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseRow({ expense }: { expense: MerchantExpense }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-semibold text-foreground">{expense.source_invoice_reference}</p>
        <p className="text-[10px] text-muted-foreground">{expense.purchase_order_reference ?? "No PO linked"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-foreground">{expense.supplier_name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{expense.supplier_tin ?? "TIN pending"}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="text-[10px]">{expense.expense_category}</Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <p>{formatDate(expense.issued_at)}</p>
        <p className="text-[10px]">Due {formatDate(expense.due_at)}</p>
      </td>
      <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">{formatPHP(expense.gross_amount)}</td>
      <td className="px-4 py-3 text-right text-xs text-success">{formatPHP(expense.input_vat_amount)}</td>
      <td className="px-4 py-3 text-right text-xs text-foreground">{formatPHP(expense.withholding_tax_amount)}</td>
      <td className="px-4 py-3 text-right text-xs font-semibold text-foreground">{formatPHP(expense.net_payable)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn("w-fit text-[10px] capitalize", statusClass(expense.validation_status))}>
            {pretty(expense.validation_status)}
          </Badge>
          <Badge variant="outline" className={cn("w-fit text-[10px] capitalize", statusClass(expense.payment_status))}>
            {pretty(expense.payment_status)}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Progress value={expense.ai_score ?? 0} className="h-1.5 w-16" />
          <span className="text-xs font-bold text-foreground">{expense.ai_score ?? "-"}</span>
        </div>
        <Badge variant="outline" className={cn("mt-1 text-[10px]", statusClass(expense.risk_level))}>
          {expense.risk_level ?? "Normal"}
        </Badge>
      </td>
    </tr>
  );
}

export function MerchantExpenses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, refresh } = useMerchantExpenses({ search, category, status, supplier });

  const maxCategoryAmount = useMemo(
    () => Math.max(1, ...data.series.categories.map((item) => item.amount)),
    [data.series.categories],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">B2B Expenses</h1>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <TrendingDown className="h-3 w-3" />
              Supplier Invoice Ledger
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track invoices issued by other business accounts to {data.merchant?.business_name ?? "your business account"} as deductible business expenses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Expense export will use the same ledger data.")}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Record Expense
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading B2B expenses from MySQL...</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Total Expenses" value={formatPHP(data.summary.total_expenses)} subtext={`${data.summary.expense_count} supplier invoices`} icon={Receipt} accent="border-l-primary" />
        <KpiCard label="Input VAT" value={formatPHP(data.summary.input_vat)} subtext="Available VAT credit from expenses" icon={Wallet} accent="border-l-success" />
        <KpiCard label="EWT/CWT" value={formatPHP(data.summary.withholding_tax)} subtext="Creditable withholding tracked" icon={Banknote} accent="border-l-chart-2" />
        <KpiCard label="Net Payable" value={formatPHP(data.summary.net_payable)} subtext="Gross less withholding tax" icon={CreditCard} accent="border-l-warning" />
        <KpiCard label="Suppliers" value={String(data.summary.supplier_count)} subtext="Unique supplier TINs" icon={Building2} accent="border-l-chart-3" />
        <KpiCard label="Review Queue" value={String(data.summary.pending_validation)} subtext={`${data.summary.high_risk} high-risk records`} icon={AlertTriangle} accent="border-l-destructive" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Monthly Expense and Input VAT Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Gross expense, input VAT, and EWT/CWT from the business account expense ledger.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.series.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(value) => `PHP ${(Number(value) / 1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatPHP(Number(value))} />
                <Area type="monotone" dataKey="gross" name="Gross Expenses" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="input_vat" name="Input VAT" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.16} strokeWidth={2} />
                <Area type="monotone" dataKey="withholding" name="EWT/CWT" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Expense Category Mix</CardTitle>
            <p className="text-xs text-muted-foreground">Supplier spend grouped by B2B expense category.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.series.categories} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(value) => `${Number(value) / 1000}K`} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={92} />
                <Tooltip formatter={(value) => formatPHP(Number(value))} />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.series.categories.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{formatPHP(item.amount)}</span>
                  </div>
                  <Progress value={(item.amount / maxCategoryAmount) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-0 flex-1 basis-full sm:min-w-64 sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 pl-9 text-sm"
                placeholder="Search invoice, supplier, TIN, category..."
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {data.filters.categories.map((item) => (
                  <SelectItem key={item} value={item}>{item === "all" ? "All categories" : item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Validation" />
              </SelectTrigger>
              <SelectContent>
                {data.filters.statuses.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">{item === "all" ? "All validation" : pretty(item)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                {data.filters.suppliers.map((item) => (
                  <SelectItem key={item} value={item}>{item === "all" ? "All suppliers" : item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-xs">
              <thead>
                <tr className="border-b">
                  {["Invoice", "Supplier", "Category", "Dates", "Gross", "Input VAT", "EWT/CWT", "Net Payable", "Status", "AI Risk"].map((header) => (
                    <th
                      key={header}
                      className={cn(
                        "px-4 pb-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                        ["Gross", "Input VAT", "EWT/CWT", "Net Payable"].includes(header) && "text-right",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
                {data.expenses.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                      No B2B expenses match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">How B2B Expenses Are Recorded</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { title: "Supplier issues invoice", desc: "Another business account creates a B2B invoice with your TIN as buyer.", icon: FileText },
            { title: "NUERS matches buyer TIN", desc: "The invoice is attached to your expense ledger for validation and VAT claim tracking.", icon: ShieldCheck },
            { title: "Input VAT and EWT posted", desc: "The record feeds Input VAT Wallet, EWT/CWT tracking, and reconciliation status.", icon: Brain },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border p-4">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <ExpenseModal open={modalOpen} onOpenChange={setModalOpen} onCreated={refresh} />
    </div>
  );
}
