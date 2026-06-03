import { useEffect, useMemo, useState, type ElementType, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownRight,
  Barcode,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileCheck2,
  FileSearch,
  FileText,
  Fingerprint,
  Landmark,
  Loader2,
  LockKeyhole,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Store,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useDashboardData, type DashboardListItem } from "@/lib/dashboard-data";

type ClientProfile = {
  id: number;
  email: string;
  role: string;
  full_name: string;
  organization: string;
  tin: string | null;
  tin_bound_at: string | null;
};

type ClientAccount = {
  id: string;
  user_id: number | null;
  account_number: string;
  full_name: string;
  account_type: string;
  email: string | null;
  mobile: string | null;
  wallet_balance: number;
  mfa_enabled: boolean;
  notification_preferences: Record<string, unknown> | null;
  status: string;
  tin?: string | null;
  created_at: string;
  updated_at: string;
};

type Merchant = {
  id: string;
  tin: string | null;
  business_name: string;
  rdo_code?: string | null;
  rdo_name?: string | null;
  logo_url?: string | null;
  branch_count: number;
  sector: string;
};

type MerchantTransaction = {
  id: string;
  merchant_id: string | null;
  transaction_ref: string | null;
  amount: number;
  vat_amount: number;
  payment_method: string;
  branch: string | null;
  rdo_code?: string | null;
  rdo_name?: string | null;
  channel: string;
  transaction_type: string;
  customer_tin: string | null;
  status: string;
  receipt_id: string | null;
  created_at: string;
};

type TransactionReceipt = {
  id: string;
  transaction_id: string | null;
  merchant_id: string | null;
  receipt_number: string;
  merchant_name: string;
  merchant_tin: string;
  rdo_code?: string | null;
  rdo_name?: string | null;
  buyer_tin: string | null;
  total_due: number;
  status: string;
  issued_at: string | null;
  created_at: string;
};

type TransactionRow = {
  id: string;
  reference: string;
  merchant: string;
  merchantLogo?: string | null;
  merchantTin?: string | null;
  branch?: string | null;
  rdoBranch?: string | null;
  type: string;
  paymentMethod: string;
  channel: string;
  amount: number;
  vat?: number;
  status: string;
  receiptNumber?: string;
  date: string;
};

type ClientPageView = "overview" | "transactions" | "receipts" | "barcode" | "wallet" | "notifications" | "security";

const clientPageMeta: Record<ClientPageView, { title: string; description: string }> = {
  overview: {
    title: "Client Command Center",
    description: "Unified transaction, electronic receipt, wallet, verification, and security workspace for your NUERS account.",
  },
  transactions: {
    title: "My Transactions",
    description: "View every business account, agency, school, hospital, and LGU transaction matched to your bound TIN.",
  },
  receipts: {
    title: "Receipt Vault",
    description: "Search, verify, and download electronic official receipts attached to your taxpayer identity.",
  },
  barcode: {
    title: "TIN Barcode",
    description: "Use your TIN-based client barcode so business accounts can scan and post future transactions to your dashboard.",
  },
  wallet: {
    title: "Wallet & Payments",
    description: "Manage wallet balance, saved payment methods, upcoming payments, and payment activity.",
  },
  notifications: {
    title: "Notification Center",
    description: "Review receipt, payment, wallet, and account security notifications from NUERS.",
  },
  security: {
    title: "Security Center",
    description: "Monitor MFA, TIN binding, account controls, and receipt fraud protection for your client account.",
  },
};

const legacyClientHashRoutes: Record<string, string> = {
  "#overview": "/client",
  "#transactions": "/client/transactions",
  "#receipts": "/client/receipts",
  "#barcode": "/client/barcode",
  "#wallet": "/client/wallet",
  "#notifications": "/client/notifications",
  "#security": "/client/security",
};

const code39Patterns: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

function formatPHP(value: number) {
  return `PHP ${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function compactPHP(value: number) {
  if (Math.abs(value) >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `PHP ${(value / 1_000).toFixed(1)}K`;
  return formatPHP(value);
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRdoBranch(code?: string | null, name?: string | null) {
  const normalizedCode = (code ?? "").trim();
  const normalizedName = (name ?? "").trim();

  if (normalizedCode && normalizedName) return `${normalizedCode} · ${normalizedName}`;
  if (normalizedCode) return `RDO ${normalizedCode}`;
  return normalizedName || "Unassigned RDO";
}

function normalizeTin(value: string) {
  return value.replace(/\D/g, "");
}

function formatTin(value: string) {
  const digits = normalizeTin(value).slice(0, 12);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 12)].filter(Boolean);
  return groups.join("-");
}

function barcodePayload(tin: string) {
  return `NUERS-${normalizeTin(tin)}`;
}

function isValidTin(value: string) {
  const digits = normalizeTin(value);
  return digits.length >= 9 && digits.length <= 12;
}

function mysqlTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");
}

function statusVariant(status?: string | null) {
  const normalized = (status ?? "").toLowerCase();
  if (["paid", "issued", "verified", "completed", "active", "receipt"].includes(normalized)) return "secondary";
  if (["pending", "reminder"].includes(normalized)) return "outline";
  return "outline";
}

function BusinessLogo({ name, src }: { name: string; src?: string | null }) {
  const initials = (name || "BA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "BA";

  return (
    <Avatar className="h-9 w-9 shrink-0 rounded-lg border bg-secondary">
      {src && <AvatarImage src={src} alt={`${name} logo`} className="object-cover" />}
      <AvatarFallback className="rounded-lg bg-secondary text-[10px] font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function ClientPortalPage({ view }: { view: ClientPageView }) {
  const { user, profile: authProfile } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData("client");
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);
  const [merchantMap, setMerchantMap] = useState<Record<string, Merchant>>({});
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [error, setError] = useState("");
  const [tinInput, setTinInput] = useState("");
  const [tinError, setTinError] = useState("");
  const [savingTin, setSavingTin] = useState(false);
  const [tinDialogOpen, setTinDialogOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const boundTin = clientProfile?.tin || authProfile?.tin || clientAccount?.tin || "";
  const hasBoundTin = isValidTin(boundTin);
  const payload = hasBoundTin ? barcodePayload(boundTin) : "";

  useEffect(() => {
    async function loadClientProfile() {
      if (!user?.id) return;
      setLoading(true);
      setError("");

      const [{ data, error: profileError }, { data: accountData, error: accountError }] = await Promise.all([
        supabase
          .from<ClientProfile>("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from<ClientAccount>("client_accounts")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (accountError) {
        setError(accountError.message);
      }

      setClientProfile(data);
      setClientAccount(accountData ?? null);
      setTinInput(data?.tin ?? accountData?.tin ?? "");
      setTinDialogOpen(!isValidTin(data?.tin ?? accountData?.tin ?? ""));
      setLoading(false);
    }

    loadClientProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!hasBoundTin) {
      setTransactions([]);
      setReceipts([]);
      setMerchantMap({});
      return;
    }

    loadTransactions(boundTin);
  }, [boundTin, hasBoundTin]);

  async function loadTransactions(tin: string) {
    setTransactionLoading(true);
    setError("");

    const [{ data: transactionData, error: transactionError }, { data: receiptData, error: receiptError }] = await Promise.all([
      supabase
        .from<MerchantTransaction[]>("merchant_transactions")
        .select("*")
        .eq("customer_tin", tin)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from<TransactionReceipt[]>("transaction_receipts")
        .select("*")
        .eq("buyer_tin", tin)
        .order("issued_at", { ascending: false })
        .limit(100),
    ]);

    if (transactionError || receiptError) {
      setError(transactionError?.message || receiptError?.message || "Unable to load client transactions.");
      setTransactionLoading(false);
      return;
    }

    const nextTransactions = transactionData ?? [];
    const nextReceipts = receiptData ?? [];
    setTransactions(nextTransactions);
    setReceipts(nextReceipts);

    const merchantIds = Array.from(
      new Set([
        ...nextTransactions.map((transaction) => transaction.merchant_id).filter(Boolean),
        ...nextReceipts.map((receipt) => receipt.merchant_id).filter(Boolean),
      ]),
    ) as string[];

    if (merchantIds.length) {
      const { data: merchants } = await supabase
        .from<Merchant[]>("merchants")
        .select("*")
        .in("id", merchantIds);

      setMerchantMap(
        (merchants ?? []).reduce<Record<string, Merchant>>((map, merchant) => {
          map[merchant.id] = merchant;
          return map;
        }, {}),
      );
    } else {
      setMerchantMap({});
    }

    setTransactionLoading(false);
  }

  async function handleTinSubmit(event: FormEvent) {
    event.preventDefault();
    setTinError("");

    if (!user?.id) {
      setTinError("Unable to identify your client account. Please sign in again.");
      return;
    }

    if (!isValidTin(tinInput)) {
      setTinError("Enter a valid 9 to 12 digit TIN number.");
      return;
    }

    const formattedTin = formatTin(tinInput);
    const boundAt = mysqlTimestamp();
    setSavingTin(true);

    const { error: updateError } = await supabase
      .from<ClientProfile>("profiles")
      .update({ tin: formattedTin, tin_bound_at: boundAt })
      .eq("id", user.id);

    if (!updateError && clientAccount) {
      await supabase
        .from<ClientAccount>("client_accounts")
        .update({ tin: formattedTin })
        .eq("user_id", user.id);
    }

    setSavingTin(false);

    if (updateError) {
      setTinError(updateError.message);
      return;
    }

    setClientProfile((current) => ({
      id: Number(user.id),
      email: user.email,
      role: current?.role ?? "client",
      full_name: current?.full_name ?? authProfile?.full_name ?? "",
      organization: current?.organization ?? authProfile?.organization ?? "Citizen Account",
      tin: formattedTin,
      tin_bound_at: boundAt,
    }));
    setClientAccount((current) => current ? { ...current, tin: formattedTin } : current);
    setTinInput(formattedTin);
    setTinDialogOpen(false);
  }

  const rows = useMemo<TransactionRow[]>(() => {
    const receiptsByTransaction = receipts.reduce<Record<string, TransactionReceipt>>((map, receipt) => {
      if (receipt.transaction_id) map[receipt.transaction_id] = receipt;
      return map;
    }, {});

    const transactionRows = transactions.map((transaction) => {
      const receipt = transaction.receipt_id ? receipts.find((item) => item.id === transaction.receipt_id) : receiptsByTransaction[transaction.id];
      const merchant = transaction.merchant_id ? merchantMap[transaction.merchant_id] : null;

      return {
        id: transaction.id,
        reference: transaction.transaction_ref || transaction.id,
        merchant: merchant?.business_name || receipt?.merchant_name || "Business Account POS",
        merchantLogo: merchant?.logo_url ?? null,
        merchantTin: merchant?.tin || receipt?.merchant_tin,
        branch: transaction.branch,
        rdoBranch: formatRdoBranch(transaction.rdo_code || receipt?.rdo_code || merchant?.rdo_code, transaction.rdo_name || receipt?.rdo_name || merchant?.rdo_name),
        type: transaction.transaction_type.replace(/_/g, " "),
        paymentMethod: transaction.payment_method.replace(/_/g, " "),
        channel: transaction.channel.replace(/_/g, " "),
        amount: Number(transaction.amount),
        vat: Number(transaction.vat_amount),
        status: transaction.status,
        receiptNumber: receipt?.receipt_number,
        date: transaction.created_at,
      };
    });

    const transactionIds = new Set(transactions.map((transaction) => transaction.id));
    const receiptOnlyRows = receipts
      .filter((receipt) => !receipt.transaction_id || !transactionIds.has(receipt.transaction_id))
      .map((receipt) => {
        const merchant = receipt.merchant_id ? merchantMap[receipt.merchant_id] : null;

        return {
          id: receipt.id,
          reference: receipt.receipt_number,
          merchant: receipt.merchant_name,
          merchantLogo: merchant?.logo_url ?? null,
          merchantTin: receipt.merchant_tin,
          branch: null,
          rdoBranch: formatRdoBranch(receipt.rdo_code, receipt.rdo_name),
          type: "receipt issued",
          paymentMethod: "recorded by business account",
          channel: "receipt archive",
          amount: Number(receipt.total_due),
          vat: undefined,
          status: receipt.status,
          receiptNumber: receipt.receipt_number,
          date: receipt.issued_at || receipt.created_at,
        };
      });

    return [...transactionRows, ...receiptOnlyRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [merchantMap, receipts, transactions]);

  const filteredRows = rows.filter((row) => {
    const text = `${row.reference} ${row.merchant} ${row.receiptNumber ?? ""} ${row.type} ${row.status} ${row.paymentMethod} ${row.rdoBranch ?? ""}`.toLowerCase();
    const matchesText = text.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || row.status.toLowerCase() === statusFilter;
    return matchesText && matchesStatus;
  });

  const receiptRows = receipts
    .map((receipt) => ({
      id: receipt.id,
      receiptNumber: receipt.receipt_number,
      merchant: receipt.merchant_name,
      merchantLogo: receipt.merchant_id ? merchantMap[receipt.merchant_id]?.logo_url ?? null : null,
      merchantTin: receipt.merchant_tin,
      amount: Number(receipt.total_due),
      status: receipt.status,
      date: receipt.issued_at || receipt.created_at,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const walletBalance = Number(clientAccount?.wallet_balance ?? 0);
  const totalSpend = rows.reduce((total, row) => total + row.amount, 0);
  const totalVat = rows.reduce((total, row) => total + Number(row.vat ?? 0), 0);
  const receiptCount = receipts.length;
  const verifiedReceipts = receipts.filter((receipt) => ["verified", "issued", "completed"].includes(receipt.status.toLowerCase())).length;
  const merchantCount = new Set(rows.map((row) => row.merchant)).size;
  const pendingCount = rows.filter((row) => ["pending", "processing", "awaiting"].includes(row.status.toLowerCase())).length;
  const averageTransaction = rows.length ? totalSpend / rows.length : 0;
  const latestActivity = rows[0]?.date ?? clientAccount?.updated_at ?? clientProfile?.tin_bound_at;

  const walletActivity = dashboardData.series.wallet_activity ?? [];
  const savedPaymentMethods = dashboardData.lists.payment_methods ?? [];
  const clientNotifications = dashboardData.lists.notifications ?? [];
  const recommendedPayments = dashboardData.lists.transactions ?? [];
  const loyaltyItem = dashboardData.lists.loyalty?.[0];

  const monthlySpend = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-PH", { month: "short" });
    const totals = rows.reduce<Record<string, number>>((map, row) => {
      const date = new Date(row.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      map[key] = (map[key] ?? 0) + row.amount;
      return map;
    }, {});

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return { label: formatter.format(date), amount: totals[key] ?? 0 };
    });
  }, [rows]);

  const paymentMix = useMemo(() => {
    const totals = rows.reduce<Record<string, number>>((map, row) => {
      map[row.paymentMethod] = (map[row.paymentMethod] ?? 0) + row.amount;
      return map;
    }, {});
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value, percent: total ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rows]);

  const issuerLeaderboard = useMemo(() => {
    const totals = rows.reduce<Record<string, { amount: number; count: number }>>((map, row) => {
      const current = map[row.merchant] ?? { amount: 0, count: 0 };
      current.amount += row.amount;
      current.count += 1;
      map[row.merchant] = current;
      return map;
    }, {});

    return Object.entries(totals)
      .map(([merchant, values]) => ({ merchant, ...values }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [rows]);

  const pageMeta = clientPageMeta[view];

  return (
    <div className="space-y-6">
      <TinBindingDialog
        open={tinDialogOpen || !hasBoundTin}
        tinInput={tinInput}
        tinError={tinError}
        saving={savingTin}
        canClose={hasBoundTin}
        onOpenChange={(open) => setTinDialogOpen(hasBoundTin ? open : true)}
        onTinChange={(value) => setTinInput(formatTin(value))}
        onSubmit={handleTinSubmit}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{pageMeta.title}</h1>
            <Badge variant={hasBoundTin ? "secondary" : "destructive"} className="gap-1.5 text-xs">
              {hasBoundTin ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {hasBoundTin ? "TIN Bound" : "TIN Required"}
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <Fingerprint className="h-3 w-3" />
              {clientAccount?.mfa_enabled ? "MFA Enabled" : "MFA Pending"}
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{pageMeta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => hasBoundTin && loadTransactions(boundTin)} disabled={!hasBoundTin || transactionLoading}>
            {transactionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
            <Link to="/verify">
              <QrCode className="h-3.5 w-3.5" />
              Verify Receipt
            </Link>
          </Button>
          <Button size="sm" className="gap-2 text-xs" onClick={() => setTinDialogOpen(true)}>
            <UserCheck className="h-3.5 w-3.5" />
            {hasBoundTin ? "Update TIN" : "Bind TIN"}
          </Button>
        </div>
      </div>

      {(loading || transactionLoading || dashboardLoading) && (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading client records from MySQL...
          </CardContent>
        </Card>
      )}

      {(error || dashboardError) && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error || dashboardError}</CardContent>
        </Card>
      )}

      {view === "overview" && (
      <section id="client-overview" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-slate-50/80 pb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Landmark className="h-4 w-4 text-primary" />
                    Digital Taxpayer Identity
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {clientAccount?.account_number ?? "Client account pending"} • {clientAccount?.account_type ?? "citizen"} • {clientAccount?.status ?? "profile active"}
                  </p>
                </div>
                <Badge variant={hasBoundTin ? "secondary" : "destructive"} className="w-fit text-[10px]">
                  {hasBoundTin ? "Ready for business account scan" : "TIN binding required"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <IdentityField label="Account holder" value={clientProfile?.full_name || authProfile?.full_name || user?.email || "Client User"} />
                <IdentityField label="Account number" value={clientAccount?.account_number ?? "Pending provisioning"} />
                <IdentityField label="Bound TIN" value={hasBoundTin ? boundTin : "Not bound"} mono />
                <IdentityField label="Last account update" value={formatDate(clientAccount?.updated_at ?? clientProfile?.tin_bound_at)} />
                <IdentityField label="Email" value={clientAccount?.email ?? user?.email ?? "No email"} />
                <IdentityField label="Mobile" value={clientAccount?.mobile ?? "Not registered"} />
              </div>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{formatPHP(walletBalance)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Available client account balance</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-slate-50 p-2">
                    <span className="text-muted-foreground">Receipts</span>
                    <p className="mt-1 font-semibold text-foreground">{receiptCount}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <span className="text-muted-foreground">Pending</span>
                    <p className="mt-1 font-semibold text-foreground">{pendingCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Account Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReadinessRow label="TIN binding" value={hasBoundTin ? 100 : 25} status={hasBoundTin ? "Complete" : "Required"} />
              <ReadinessRow label="Receipt matching" value={hasBoundTin ? 90 : 0} status={hasBoundTin ? "Active" : "Locked"} />
              <ReadinessRow label="MFA coverage" value={clientAccount?.mfa_enabled ? 100 : 45} status={clientAccount?.mfa_enabled ? "Enabled" : "Pending"} />
              <ReadinessRow label="Notification routing" value={clientAccount?.notification_preferences ? 85 : 60} status={clientAccount?.notification_preferences ? "Configured" : "Default"} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Recorded Transactions" value={rows.length.toLocaleString("en-PH")} icon={Receipt} subtext="Matched to your TIN" />
          <MetricCard label="Total Amount" value={compactPHP(totalSpend)} icon={ArrowDownRight} subtext="All matched records" />
          <MetricCard label="VAT Captured" value={compactPHP(totalVat)} icon={FileCheck2} subtext="From transaction ledger" />
          <MetricCard label="Verified Receipts" value={`${verifiedReceipts}/${receiptCount}`} icon={ShieldCheck} subtext="eOR authenticity" />
          <MetricCard label="Issuers" value={merchantCount.toLocaleString("en-PH")} icon={Store} subtext="Business accounts and agencies" />
          <MetricCard label="Average Spend" value={compactPHP(averageTransaction)} icon={TrendingUp} subtext="Per recorded item" />
        </div>
      </section>
      )}

      {view === "barcode" && (
      <section id="client-barcode" className="scroll-mt-24">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-slate-50/80 pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Barcode className="h-4 w-4 text-primary" />
                  Client Scan Barcode
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">TIN-based scan credential for business account, hospital, school, LGU, and agency transaction posting.</p>
              </div>
              <Badge variant={hasBoundTin ? "secondary" : "outline"} className="w-fit text-[10px]">
                {hasBoundTin ? "Scan ready" : "Locked"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {hasBoundTin ? (
              <div className="space-y-4">
                <Code39Barcode value={payload} />
                <div className="grid gap-3 md:grid-cols-3">
                  <IdentityField label="Bound TIN" value={boundTin} mono />
                  <IdentityField label="Scan payload" value={payload} mono />
                  <IdentityField label="Last transaction sync" value={formatDate(latestActivity)} />
                </div>
              </div>
            ) : (
              <TinLockedState onOpen={() => setTinDialogOpen(true)} />
            )}
          </CardContent>
        </Card>
      </section>
      )}

      {view === "transactions" && (
      <section id="client-transactions" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Monthly Transaction Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlySpendChart points={monthlySpend} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment Channel Mix</CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelMix rows={paymentMix} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-sm">My Transaction Ledger</CardTitle>
                <p className="text-xs text-muted-foreground">Database transactions and receipts matched to your bound TIN.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search business account, receipt, amount..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="completed">Completed</option>
                  <option value="issued">Issued</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasBoundTin && filteredRows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Account / Agency</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>RDO Branch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BusinessLogo name={row.merchant} src={row.merchantLogo} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{row.merchant}</p>
                            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                              {row.merchantTin ?? "Business account TIN pending"}{row.branch ? ` • ${row.branch}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.reference}</TableCell>
                      <TableCell>
                        <span className="inline-flex max-w-56 items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {row.rdoBranch ?? "Unassigned RDO"}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">{row.type}</TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">{row.channel}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatDate(row.date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatPHP(row.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)} className="capitalize text-[10px]">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.receiptNumber ? (
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            {row.receiptNumber}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Awaiting eOR</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyLedger hasBoundTin={hasBoundTin} onOpenTin={() => setTinDialogOpen(true)} />
            )}
          </CardContent>
        </Card>
      </section>
      )}

      {view === "receipts" && (
      <section id="client-receipts" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileSearch className="h-4 w-4 text-primary" />
                Receipt Vault
              </CardTitle>
              <p className="text-xs text-muted-foreground">Electronic official receipts matched to your taxpayer identity.</p>
            </CardHeader>
            <CardContent>
              {receiptRows.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {receiptRows.slice(0, 8).map((receipt) => (
                    <div key={receipt.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <BusinessLogo name={receipt.merchant} src={receipt.merchantLogo} />
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-foreground">{receipt.receiptNumber}</p>
                            <p className="mt-1 truncate text-sm font-medium text-foreground">{receipt.merchant}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{receipt.merchantTin}</p>
                          </div>
                        </div>
                        <Badge variant={statusVariant(receipt.status)} className="text-[10px]">{receipt.status}</Badge>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{formatDate(receipt.date)}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{formatPHP(receipt.amount)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EnterpriseEmpty icon={FileText} title="Receipt vault empty" text={hasBoundTin ? "No electronic official receipts are currently matched to your TIN." : "Bind your TIN to unlock receipt matching."} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Issuer Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              {issuerLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {issuerLeaderboard.map((issuer) => (
                    <div key={issuer.merchant} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{issuer.merchant}</p>
                          <p className="text-xs text-muted-foreground">{issuer.count} recorded item{issuer.count === 1 ? "" : "s"}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{compactPHP(issuer.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EnterpriseEmpty icon={Building2} title="No issuers yet" text="Issuer activity appears once business accounts or agencies post transactions to your account." compact />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {view === "wallet" && (
      <section id="client-wallet" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />
                Wallet Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatPHP(walletBalance)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Current MySQL client account balance</p>
              {loyaltyItem && (
                <div className="mt-5 rounded-lg border bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">{loyaltyItem.title}</p>
                      <p className="text-[11px] text-muted-foreground">{loyaltyItem.subtitle}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{Math.round(loyaltyItem.primary_value ?? 0)}%</Badge>
                  </div>
                  <Progress className="mt-3 h-1.5" value={Math.min(100, loyaltyItem.primary_value ?? 0)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Saved Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {savedPaymentMethods.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {savedPaymentMethods.map((method) => (
                    <DashboardListCard key={method.title} item={method} icon={method.subtitle?.toLowerCase().includes("wallet") ? Smartphone : CreditCard} />
                  ))}
                </div>
              ) : (
                <EnterpriseEmpty icon={CreditCard} title="No saved methods" text="Payment methods will appear after account payment setup is completed." compact />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Wallet Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletActivityChart points={walletActivity} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upcoming & Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedPayments.length > 0 ? (
                <div className="space-y-3">
                  {recommendedPayments.slice(0, 4).map((item) => (
                    <DashboardListCard key={item.title} item={item} icon={item.status?.toLowerCase() === "pending" ? Clock3 : Landmark} horizontal />
                  ))}
                </div>
              ) : (
                <EnterpriseEmpty icon={Clock3} title="No upcoming payments" text="Pending fees and scheduled payments will appear here." compact />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {view === "notifications" && (
      <section id="client-notifications" className="scroll-mt-24">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-primary" />
              Notification Center
            </CardTitle>
            <p className="text-xs text-muted-foreground">Receipt, payment, wallet, and compliance notifications from the NUERS database.</p>
          </CardHeader>
          <CardContent>
            {clientNotifications.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {clientNotifications.map((item) => (
                  <DashboardListCard key={item.title} item={item} icon={item.badge === "Payment" ? CreditCard : item.badge === "Reminder" ? Clock3 : Bell} />
                ))}
              </div>
            ) : (
              <EnterpriseEmpty icon={Bell} title="No notifications" text="Account notifications will appear here." compact />
            )}
          </CardContent>
        </Card>
      </section>
      )}

      {view === "security" && (
      <section id="client-security" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <SecurityControl icon={Fingerprint} title="Multi-Factor Authentication" status={clientAccount?.mfa_enabled ? "Enabled" : "Pending"} detail={clientAccount?.mfa_enabled ? "Strong login protection is active." : "Enable MFA to strengthen account access."} good={Boolean(clientAccount?.mfa_enabled)} />
          <SecurityControl icon={ShieldCheck} title="TIN Binding" status={hasBoundTin ? "Verified" : "Required"} detail={hasBoundTin ? `Bound to ${boundTin}` : "TIN binding is required before barcode generation."} good={hasBoundTin} />
          <SecurityControl icon={ShieldAlert} title="Receipt Fraud Protection" status="Active" detail="Receipts are checked through QR, receipt number, and signature validation." good />
        </div>
      </section>
      )}
    </div>
  );
}

export function ClientDashboard() {
  const location = useLocation();
  const legacyRoute = legacyClientHashRoutes[location.hash];

  if (legacyRoute) return <Navigate to={legacyRoute} replace />;

  return <ClientPortalPage view="overview" />;
}

export function ClientTransactionsPage() {
  return <ClientPortalPage view="transactions" />;
}

export function ClientReceiptsPage() {
  return <ClientPortalPage view="receipts" />;
}

export function ClientBarcodePage() {
  return <ClientPortalPage view="barcode" />;
}

export function ClientWalletPage() {
  return <ClientPortalPage view="wallet" />;
}

export function ClientNotificationsPage() {
  return <ClientPortalPage view="notifications" />;
}

export function ClientSecurityPage() {
  return <ClientPortalPage view="security" />;
}

function TinBindingDialog({
  open,
  tinInput,
  tinError,
  saving,
  canClose,
  onOpenChange,
  onTinChange,
  onSubmit,
}: {
  open: boolean;
  tinInput: string;
  tinError: string;
  saving: boolean;
  canClose: boolean;
  onOpenChange: (open: boolean) => void;
  onTinChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={canClose} className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Bind your TIN number</DialogTitle>
            <DialogDescription>
              Required before NUERS can generate your client barcode or display transactions matched to your taxpayer identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-tin">Client TIN number</Label>
            <Input
              id="client-tin"
              value={tinInput}
              onChange={(event) => onTinChange(event.target.value)}
              placeholder="000-000-000-000"
              className="font-mono"
              inputMode="numeric"
              autoFocus
              required
            />
            {tinError ? (
              <p className="text-xs text-destructive">{tinError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">TIN must contain 9 to 12 digits. This becomes the basis of your scan barcode.</p>
            )}
          </div>

          <div className="rounded-lg border bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
            No barcode will be generated until this TIN is bound. Business account scans will post future transactions to this client account.
          </div>

          <DialogFooter>
            {canClose && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="w-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save TIN and generate barcode
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 truncate text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function IdentityField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ReadinessRow({ label, value, status }: { label: string; value: number; status: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{status}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function TinLockedState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 p-6 text-center">
      <LockKeyhole className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">Barcode unavailable</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        Bind your TIN first. NUERS will not generate a client barcode until your TIN is saved to your profile.
      </p>
      <Button className="mt-4 gap-2" onClick={onOpen}>
        <UserCheck className="h-4 w-4" />
        Bind TIN now
      </Button>
    </div>
  );
}

function EmptyLedger({ hasBoundTin, onOpenTin }: { hasBoundTin: boolean; onOpenTin: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 p-8 text-center">
      <FileText className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">
        {hasBoundTin ? "No transactions recorded yet" : "Bind your TIN to load transactions"}
      </p>
      <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
        {hasBoundTin
          ? "New purchases and official electronic receipts will appear here once posted by business accounts or agencies."
          : "Your transaction ledger and barcode stay locked until a valid TIN number is bound to your client account."}
      </p>
      {!hasBoundTin && (
        <Button className="mt-4 gap-2" onClick={onOpenTin}>
          <UserCheck className="h-4 w-4" />
          Bind TIN now
        </Button>
      )}
    </div>
  );
}

function EnterpriseEmpty({ icon: Icon, title, text, compact = false }: { icon: ElementType; title: string; text: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 p-6 text-center ${compact ? "min-h-36" : "min-h-52"}`}>
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function MonthlySpendChart({ points }: { points: Array<{ label: string; amount: number }> }) {
  const max = Math.max(...points.map((point) => point.amount), 1);

  return (
    <div className="flex h-56 items-end gap-3">
      {points.map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end rounded-md bg-slate-50 p-1">
            <div
              className="w-full rounded bg-primary transition-all"
              style={{ height: `${Math.max(6, (point.amount / max) * 100)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-muted-foreground">{point.label}</p>
            <p className="text-[10px] text-foreground">{point.amount ? compactPHP(point.amount) : "PHP 0.00"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WalletActivityChart({ points }: { points: Array<Record<string, string | number>> }) {
  const max = Math.max(
    ...points.flatMap((point) => [Number(point.payments ?? 0), Number(point.topup ?? 0)]),
    1,
  );

  if (!points.length) {
    return <EnterpriseEmpty icon={Wallet} title="No wallet activity" text="Wallet payment and top-up activity will appear after account transactions are posted." compact />;
  }

  return (
    <div className="flex h-56 items-end gap-3">
      {points.map((point) => (
        <div key={String(point.label)} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end gap-1 rounded-md bg-slate-50 p-1">
            <div
              className="flex-1 rounded bg-primary"
              style={{ height: `${Math.max(6, (Number(point.payments ?? 0) / max) * 100)}%` }}
            />
            <div
              className="flex-1 rounded bg-gold"
              style={{ height: `${Math.max(6, (Number(point.topup ?? 0) / max) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground">{point.label}</p>
        </div>
      ))}
    </div>
  );
}

function ChannelMix({ rows }: { rows: Array<{ label: string; value: number; percent: number }> }) {
  if (!rows.length) {
    return <EnterpriseEmpty icon={CreditCard} title="No payment mix yet" text="Payment channel analytics will appear after matched transactions are recorded." compact />;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="capitalize text-xs font-medium text-foreground">{row.label}</span>
            <span className="text-xs text-muted-foreground">{row.percent}%</span>
          </div>
          <Progress value={row.percent} />
          <p className="mt-1 text-[10px] text-muted-foreground">{formatPHP(row.value)}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardListCard({ item, icon: Icon, horizontal = false }: { item: DashboardListItem; icon: ElementType; horizontal?: boolean }) {
  return (
    <div className={`rounded-lg border bg-background p-4 ${horizontal ? "flex items-start justify-between gap-3" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
          {item.metadata?.type && <p className="mt-1 text-[10px] text-muted-foreground">{String(item.metadata.type)}</p>}
        </div>
      </div>
      <div className={`${horizontal ? "shrink-0 text-right" : "mt-4 flex items-end justify-between gap-3"}`}>
        <Badge variant={statusVariant(item.status)} className="text-[10px]">{item.status ?? item.badge ?? "Active"}</Badge>
        {item.primary_value !== null && (
          <p className={`${horizontal ? "mt-2" : ""} text-sm font-bold text-foreground`}>{formatPHP(item.primary_value)}</p>
        )}
      </div>
    </div>
  );
}

function SecurityControl({ icon: Icon, title, status, detail, good }: { icon: ElementType; title: string; status: string; detail: string; good: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${good ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <Badge variant={good ? "secondary" : "outline"} className="text-[10px]">{status}</Badge>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Code39Barcode({ value }: { value: string }) {
  const encoded = `*${value.toUpperCase().replace(/[^0-9A-Z .-]/g, "")}*`;
  const narrow = 2;
  const wide = 6;
  const gap = 2;
  let x = 10;
  const bars: Array<{ x: number; width: number }> = [];

  for (const char of encoded) {
    const pattern = code39Patterns[char] ?? code39Patterns["0"];
    pattern.split("").forEach((unit, index) => {
      const width = unit === "w" ? wide : narrow;
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    });
    x += gap;
  }

  const width = x + 10;

  return (
    <div className="rounded-lg border bg-white p-4">
      <svg viewBox={`0 0 ${width} 96`} preserveAspectRatio="none" className="h-28 w-full" role="img" aria-label={`NUERS barcode ${value}`}>
        <rect x="0" y="0" width={width} height="96" fill="white" />
        {bars.map((bar, index) => (
          <rect key={`${bar.x}-${index}`} x={bar.x} y="8" width={bar.width} height="62" fill="#0f172a" />
        ))}
        <text x={width / 2} y="88" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#334155">
          {value}
        </text>
      </svg>
    </div>
  );
}
