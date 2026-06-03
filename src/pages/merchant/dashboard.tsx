import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, CreditCard,
  Download, Receipt, RefreshCw, ShieldCheck, TrendingUp, Users, Wallet,
  Wifi, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDashboardData } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const iconMap = {
  Activity,
  CreditCard,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
};

function formatPHP(value: number) {
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `PHP ${(value / 1_000).toFixed(0)}K`;
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function businessAccountText(value: unknown) {
  return String(value ?? "")
    .replace(/\bMerchants\b/g, "Business Accounts")
    .replace(/\bmerchants\b/g, "business accounts")
    .replace(/\bMerchant\b/g, "Business Account")
    .replace(/\bmerchant\b/g, "business account");
}

function statusClass(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  if (["completed", "paid", "issued", "settled", "verified", "validated", "sent", "active"].some((key) => status.includes(key))) {
    return "border-success/30 bg-success/10 text-success";
  }

  if (["pending", "draft", "review", "queued"].some((key) => status.includes(key))) {
    return "border-warning/30 bg-warning/10 text-warning";
  }

  if (["void", "cancel", "failed", "refund"].some((key) => status.includes(key))) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-border bg-secondary text-muted-foreground";
}

function MetricSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-6 w-28" />
        <Skeleton className="mt-2 h-3 w-36" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Skeleton className="h-3 w-56 max-w-full" />
      </CardHeader>
      <CardContent>
        <div className={cn("relative overflow-hidden rounded-md border bg-muted/20", compact ? "h-[210px]" : "h-[250px]")}>
          <div className="absolute inset-x-6 bottom-8 top-6 flex items-end gap-3">
            {[54, 72, 44, 86, 63, 78].map((height, index) => (
              <Skeleton key={index} className="w-full rounded-t-sm" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="absolute inset-x-6 bottom-6 h-px bg-border" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="xl:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent Transactions</CardTitle>
        <Skeleton className="h-3 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-3 border-b pb-3 last:border-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MerchantDashboardLoading({ reload, refreshing }: { reload: () => void; refreshing: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Business Account Dashboard</h1>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Spinner className="h-3 w-3" /> Loading live data
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Fetching your linked MySQL business record, transaction ledger, receipts, and VAT summaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 border-warning/50 bg-warning/10 text-xs text-warning">
            <Spinner className="h-3 w-3" /> Database sync in progress
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={reload} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Retry
          </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background">
            <Spinner className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Loading dashboard data from MySQL</p>
            <p className="text-xs text-muted-foreground">
              This may take a few seconds while NUERS connects to the live database and prepares account-scoped analytics.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <MetricSkeleton key={index} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartSkeleton title="Daily Sales Overview" compact />
        </div>
        <ChartSkeleton title="Payment Method Mix" compact />
      </div>

      <ChartSkeleton title="Monthly Revenue Trend" />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top Product Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <TableSkeleton />
      </div>
    </div>
  );
}

export function MerchantDashboard() {
  const { data, loading, refreshing, error, reload } = useDashboardData("merchant");
  const profile = data.lists.merchant_profile?.[0];
  const posSystem = String(profile?.metadata.pos_system ?? "").trim();
  const hasPosIntegration = Boolean(posSystem) && !/no\s+pos|not\s+registered|not\s+connected/i.test(posSystem);
  const dailySales = data.series.daily_sales ?? [];
  const monthlySales = data.series.monthly_sales ?? [];
  const paymentMix = data.lists.payment_mix ?? [];
  const topProducts = data.lists.top_products ?? [];
  const recentTransactions = data.lists.recent_transactions ?? [];
  const alerts = data.lists.alerts ?? [];
  const integrationHealth = data.lists.integration_health ?? [];
  const isInitialLoading = loading && data.kpis.length === 0;

  if (isInitialLoading) {
    return <MerchantDashboardLoading reload={reload} refreshing={refreshing} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{businessAccountText(profile?.title ?? "Business Account Dashboard")}</h1>
            <Badge variant="secondary" className="font-mono text-xs">{profile?.subtitle}</Badge>
            <Badge variant="outline" className="gap-1 border-success/40 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" /> Compliance {profile?.primary_value ?? 0}/100
            </Badge>
            <Badge variant="secondary" className="text-xs">{profile?.badge}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Business account data loaded from your linked MySQL business record and transaction ledger.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs",
              hasPosIntegration
                ? "border-success/40 bg-success/10 text-success"
                : "border-warning/50 bg-warning/10 text-warning",
            )}
          >
            {hasPosIntegration ? <Wifi className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>{hasPosIntegration ? `${posSystem} Connected` : "No POS integration connected"}</span>
          </Badge>
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={reload} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {data.kpis.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Activity;
          return (
            <Card key={item.key} className={`border-l-4 ${item.accent ?? "border-l-primary"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">{item.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" /> {item.subtext}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Daily Sales Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Revenue and VAT values from your business transactions.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(value) => `PHP ${Number(value) / 1000}K`} />
                <Tooltip />
                <Bar dataKey="sales" name="Sales" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vat" name="VAT" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Payment Method Mix</CardTitle>
            <p className="text-xs text-muted-foreground">Current day collection channels.</p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <PieChart width={170} height={170}>
                <Pie data={paymentMix} dataKey="primary_value" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {paymentMix.map((entry, index) => (
                    <Cell key={entry.title} fill={String(entry.metadata.color ?? `var(--chart-${index + 1})`)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </div>
            <div className="mt-3 space-y-1.5">
              {paymentMix.map((method) => (
                <div key={method.title} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{method.title}</span>
                  <span className="font-medium text-foreground">{method.primary_value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Monthly Revenue Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue, VAT, and target from MySQL.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(value) => `PHP ${(Number(value) / 1_000_000).toFixed(0)}M`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="vat" name="VAT" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.16} strokeWidth={2} />
              <Area type="monotone" dataKey="target" name="Target" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top Product Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product) => (
              <div key={product.title} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{product.title}</span>
                  <span className="text-muted-foreground">{formatPHP(product.primary_value ?? 0)}</span>
                </div>
                <Progress value={product.secondary_value ?? 0} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Transactions</CardTitle>
            <p className="text-xs text-muted-foreground">Rows are scoped to the currently logged-in Business Account.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-[10px] text-muted-foreground">
                    <th className="pb-2 font-medium">Receipt ID</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.title} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs text-foreground">{txn.title}</td>
                      <td className="py-3 text-xs text-muted-foreground">{txn.subtitle}</td>
                      <td className="py-3"><Badge variant="secondary" className="text-[10px]">{txn.badge}</Badge></td>
                      <td className="py-3 text-xs font-medium text-foreground">{formatPHP(txn.primary_value ?? 0)}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={cn("text-[10px]", statusClass(txn.status))}>{txn.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Integration Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrationHealth.map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
              </div>
            ))}
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">System Uptime</span>
                <span className="font-medium text-success">{integrationHealth[0]?.primary_value ?? 0}%</span>
              </div>
              <Progress value={integrationHealth[0]?.primary_value ?? 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alerts and Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.title} className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                alert.status === "warning" ? "border-warning/30 bg-warning/5"
                  : alert.status === "success" ? "border-success/30 bg-success/5"
                    : "bg-muted/30"
              )}>
                {alert.status === "warning" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}
                {alert.status === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
                {alert.status === "info" && <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                <div>
                  <p className="text-xs font-medium text-foreground">{alert.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.subtitle}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
