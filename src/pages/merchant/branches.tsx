import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, CheckCircle2,
  Database, Eye, GitBranch, Key, Loader2, MapPin, RefreshCw,
  Search, Store, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

type ApiKeySummary = {
  id: string;
  name: string;
  environment: string;
  status: string;
  key_preview: string;
  last_seen: string;
  requests_today: number;
};

type Branch = {
  id: string;
  name: string;
  branch_code: string;
  branch_type: "main" | "branch";
  address: string;
  city: string;
  region: string;
  status: "active" | "inactive";
  monthly_revenue: number;
  txns_today: number;
  txns_month: number;
  compliance: number;
  growth: number;
  api_connections: number;
  online_connections: number;
  idle_connections: number;
  offline_connections: number;
  last_seen: string;
  keys: ApiKeySummary[];
};

type Summary = {
  total_branches: number;
  active_branches: number;
  monthly_revenue: number;
  transactions_today: number;
  avg_compliance: number;
  api_connections: number;
};

type ChartRow = {
  name: string;
  monthly_revenue: number;
  txns_month: number;
};

const API_TOKEN_KEY = "nuers_api_token";

const EMPTY_SUMMARY: Summary = {
  total_branches: 0,
  active_branches: 0,
  monthly_revenue: 0,
  transactions_today: 0,
  avg_compliance: 0,
  api_connections: 0,
};

const revenueChartConfig: ChartConfig = {
  monthly_revenue: { label: "Monthly Revenue (PHP)", color: "var(--chart-1)" },
  txns_month: { label: "Transactions", color: "var(--chart-2)" },
};

function authHeaders() {
  const headers = new Headers({ Accept: "application/json" });

  try {
    const token = window.localStorage.getItem(API_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // Browser storage can be unavailable in restricted contexts.
  }

  return headers;
}

function formatRev(n: number) {
  if (n >= 1_000_000) return `PHP ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `PHP ${(n / 1_000).toFixed(0)}K`;
  return `PHP ${n.toLocaleString()}`;
}

function goToApiKeys() {
  window.location.href = "/merchant/api-keys";
}

export function MerchantBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [chart, setChart] = useState<ChartRow[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBranches() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/merchant/api-branches", {
        headers: authHeaders(),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load API-connected branches.");
      }

      setBranches(payload.branches ?? []);
      setChart(payload.chart ?? []);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load API-connected branches.");
      setBranches([]);
      setChart([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const filtered = branches.filter((branch) =>
    (!search ||
      branch.name.toLowerCase().includes(search.toLowerCase()) ||
      branch.branch_code.toLowerCase().includes(search.toLowerCase()) ||
      branch.city.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || branch.status === statusFilter || branch.branch_type === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Branch Management</h1>
          <p className="text-sm text-muted-foreground">
            {summary.active_branches} active API branches · Branch identity is determined by each Business Account API key
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={loadBranches} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={goToApiKeys}>
            <Key className="h-4 w-4" /> Create Branch API Key
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "API Branches", value: summary.total_branches.toString(), icon: GitBranch, accent: "border-l-primary", sub: `${summary.active_branches} active` },
          { label: "Monthly Revenue", value: formatRev(summary.monthly_revenue), icon: ArrowUpRight, accent: "border-l-success", sub: "from branch-tagged transactions" },
          { label: "Today's Transactions", value: summary.transactions_today.toLocaleString(), icon: Activity, accent: "border-l-chart-1", sub: "API-ingested only" },
          { label: "Avg Compliance", value: `${summary.avg_compliance}%`, icon: CheckCircle2, accent: "border-l-chart-2", sub: `${summary.api_connections} API connections` },
        ].map((item) => (
          <Card key={item.label} className={`border-l-4 ${item.accent}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="outline" size="sm" onClick={loadBranches}>Retry</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">API Branch Performance Comparison</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Monthly revenue vs transaction volume from branch-tagged API keys</p>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading branch performance...
            </div>
          ) : chart.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="rounded-md border bg-muted/20 p-3">
                <ChartContainer config={revenueChartConfig} className="aspect-auto h-[260px] w-full">
                  <BarChart data={chart} accessibilityLayer margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={0} />
                    <YAxis
                      yAxisId="rev"
                      width={52}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v) => `PHP ${(Number(v) / 1_000_000).toFixed(1)}M`}
                    />
                    <YAxis yAxisId="txns" orientation="right" width={32} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar yAxisId="rev" dataKey="monthly_revenue" fill="var(--color-monthly_revenue)" radius={[4, 4, 0, 0]} maxBarSize={42} />
                    <Bar yAxisId="txns" dataKey="txns_month" fill="var(--color-txns_month)" radius={[4, 4, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="grid gap-3 rounded-md border bg-background p-4 text-sm sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: "API Branches", value: summary.total_branches.toLocaleString(), sub: `${summary.active_branches} active` },
                  { label: "Monthly Revenue", value: formatRev(summary.monthly_revenue), sub: "branch-tagged" },
                  { label: "Transactions Today", value: summary.transactions_today.toLocaleString(), sub: "API-ingested" },
                  { label: "Avg Compliance", value: `${summary.avg_compliance}%`, sub: `${summary.api_connections} API connections` },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
              <Database className="h-9 w-9 text-muted-foreground/70" />
              <p className="text-sm font-medium text-foreground">No branch transaction activity yet</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Create API keys for each main/branch location. Once those systems send transactions, branch revenue and volume will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-0 basis-full sm:min-w-[220px] sm:basis-auto sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search branch, code, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="main">Main Office</SelectItem>
            <SelectItem value="branch">Branches</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading API-connected branches...
            </CardContent>
          </Card>
        )}

        {!loading && filtered.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <Database className="h-9 w-9 text-muted-foreground/70" />
              <p className="text-sm font-medium text-foreground">No matching API branches</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Branch records are created by assigning branch identity to API keys, not by manual mock entries.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && filtered.map((branch) => (
          <Card
            key={branch.id}
            className={cn("cursor-pointer transition-all hover:shadow-md hover:border-primary/30", branch.status === "inactive" && "opacity-65")}
            onClick={() => setSelected(branch)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn("rounded-lg p-2", branch.status === "active" ? "bg-success/10" : "bg-muted")}>
                    <Store className={cn("h-4 w-4", branch.status === "active" ? "text-success" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight truncate">{branch.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />{branch.branch_code} · {branch.city || "No city"} {branch.region ? `· ${branch.region}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={branch.branch_type === "main" ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {branch.branch_type === "main" ? "main" : "branch"}
                  </Badge>
                  <Badge variant={branch.status === "active" ? "outline" : "secondary"} className="text-[10px] shrink-0">
                    {branch.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Revenue", value: formatRev(branch.monthly_revenue) },
                  { label: "Txns Today", value: branch.txns_today.toLocaleString() },
                  { label: "API Keys", value: branch.api_connections.toString() },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-muted/40 p-2">
                    <p className="text-xs font-semibold text-foreground">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 text-success"><Wifi className="h-3 w-3" />{branch.online_connections} online</span>
                <span>{branch.idle_connections} idle</span>
                <span className="flex items-center gap-1 text-destructive"><WifiOff className="h-3 w-3" />{branch.offline_connections} offline</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">API Compliance</span>
                  <span className={cn("font-semibold",
                    branch.compliance >= 90 ? "text-success" : branch.compliance >= 75 ? "text-warning" : "text-destructive"
                  )}>{branch.compliance}%</span>
                </div>
                <Progress value={branch.compliance} className={cn("h-1.5",
                  branch.compliance >= 90 ? "" : branch.compliance >= 75 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                )} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Last seen: {branch.last_seen}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />Details</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-foreground">{selected.address}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {selected.branch_type === "main" ? "Main office" : "Branch"} · Code {selected.branch_code} · {selected.city || "No city"} {selected.region ? `· ${selected.region}` : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Monthly Revenue", value: formatRev(selected.monthly_revenue) },
                  { label: "Transactions Today", value: selected.txns_today.toLocaleString() },
                  { label: "Monthly Transactions", value: selected.txns_month.toLocaleString() },
                  { label: "API Compliance", value: `${selected.compliance}/100` },
                  { label: "API Connections", value: selected.api_connections.toLocaleString() },
                  { label: "Last Seen", value: selected.last_seen },
                ].map((field) => (
                  <div key={field.label} className="rounded-lg border p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{field.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-foreground">API Keys Connected to This Branch</p>
                <div className="space-y-2">
                  {selected.keys.map((key) => (
                    <div key={key.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{key.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{key.key_preview}</p>
                        </div>
                        <Badge variant={key.status === "active" ? "default" : "secondary"} className="text-[10px]">{key.status}</Badge>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {key.environment} · {key.requests_today.toLocaleString()} requests today · last {key.last_seen}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" onClick={goToApiKeys}>
                <Key className="h-4 w-4" /> Manage Branch API Keys
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
