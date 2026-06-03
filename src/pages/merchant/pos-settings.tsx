import { useEffect, useState, type ElementType } from "react";
import {
  Activity, AlertTriangle, BarChart3, CheckCircle2, Code, Cpu,
  Database, Eye, Globe, Key, Loader2, Monitor, RefreshCw,
  Server, Settings, ShieldCheck, Smartphone, Terminal, Wifi, WifiOff,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ConnectionStatus = "online" | "offline" | "idle";

type ApiConnection = {
  id: string;
  name: string;
  type: string;
  key_preview: string;
  environment: "live" | "sandbox";
  status: ConnectionStatus;
  active: boolean;
  last_seen: string;
  last_seen_at?: string | null;
  last_source_system: string;
  requests_today: number;
  requests_month: number;
  errors_today: number;
  success_rate: number;
  uptime_pct: number;
  rate_limit: number;
  permissions: string[];
  ip_whitelist: string[];
  created: string;
};

type Summary = {
  total_connections: number;
  active_connections: number;
  online: number;
  idle: number;
  offline: number;
  requests_today: number;
  transactions_today: number;
  errors_today: number;
  avg_success_rate: number;
  avg_latency_ms: number;
};

type ActivityPoint = {
  name: string;
  requests: number;
  errors: number;
};

type HourlyPoint = {
  hour: string;
  requests: number;
  errors: number;
};

type IntegrationInfo = {
  transaction_endpoint: string;
  auth_header: string;
  accepted_tax_types: string[];
};

const API_TOKEN_KEY = "nuers_api_token";

const EMPTY_SUMMARY: Summary = {
  total_connections: 0,
  active_connections: 0,
  online: 0,
  idle: 0,
  offline: 0,
  requests_today: 0,
  transactions_today: 0,
  errors_today: 0,
  avg_success_rate: 0,
  avg_latency_ms: 0,
};

const activityConfig: ChartConfig = {
  requests: { label: "Accepted Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--chart-3)" },
};

const hourlyConfig: ChartConfig = {
  requests: { label: "Requests", color: "var(--chart-1)" },
  errors: { label: "Errors", color: "var(--chart-3)" },
};

const statusConfig = {
  online: { color: "text-success", bg: "bg-success/10", icon: Wifi, label: "Online", badgeVariant: "default" as const },
  idle: { color: "text-warning", bg: "bg-warning/10", icon: Wifi, label: "Idle", badgeVariant: "secondary" as const },
  offline: { color: "text-destructive", bg: "bg-destructive/10", icon: WifiOff, label: "Offline", badgeVariant: "destructive" as const },
};

const typeIcons: Record<string, ElementType> = {
  POS: Monitor,
  Accounting: Database,
  Billing: Server,
  ERP: Terminal,
  "E-Commerce": Globe,
  "Mobile App": Smartphone,
  Kiosk: Monitor,
  "External API": Code,
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

function goToApiKeys() {
  window.location.href = "/merchant/api-keys";
}

export function MerchantPosSettings() {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [integration, setIntegration] = useState<IntegrationInfo | null>(null);
  const [selected, setSelected] = useState<ApiConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadConnections() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/merchant/pos-devices", {
        headers: authHeaders(),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load connected API systems.");
      }

      setConnections(payload.connections ?? []);
      setActivity(payload.activity ?? []);
      setHourly(payload.hourly_requests ?? []);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setIntegration(payload.integration ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load connected API systems.");
      setConnections([]);
      setActivity([]);
      setHourly([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConnections();
  }, []);

  function testConnection(connection: ApiConnection) {
    if (!connection.active || connection.status === "offline") {
      toast.error(`${connection.name} is not connected right now.`);
      return;
    }

    if (connection.status === "idle") {
      toast.warning(`${connection.name} is active but has no recent API heartbeat.`);
      return;
    }

    toast.success(`${connection.name} is connected through NUERS API.`);
  }

  const problemCount = summary.offline + summary.errors_today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POS &amp; API Device Management</h1>
          <p className="text-sm text-muted-foreground">
            {summary.online}/{summary.total_connections} connected systems online · From Business Account API keys and request logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={loadConnections} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={goToApiKeys}>
            <Key className="h-4 w-4" /> Create API Key
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "API Connections", value: summary.total_connections.toString(), icon: Cpu, accent: "border-l-primary", sub: `${summary.active_connections} active keys` },
          { label: "Online Now", value: summary.online.toString(), icon: Wifi, accent: "border-l-success", sub: `${summary.idle} idle · ${summary.offline} offline` },
          { label: "Today's API Transactions", value: summary.transactions_today.toLocaleString(), icon: CheckCircle2, accent: "border-l-chart-1", sub: `${summary.errors_today} errors today` },
          { label: "Success Rate", value: `${summary.avg_success_rate}%`, icon: Activity, accent: "border-l-chart-2", sub: `${summary.avg_latency_ms}ms avg latency` },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.accent}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
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
            <Button variant="outline" size="sm" onClick={loadConnections}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {!error && problemCount > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-foreground">
              {summary.offline} offline connection{summary.offline === 1 ? "" : "s"} · {summary.errors_today} API error{summary.errors_today === 1 ? "" : "s"} today.
            </p>
            <Button size="sm" variant="outline" className="ml-auto gap-1 text-xs" onClick={loadConnections}>
              <Zap className="h-3.5 w-3.5" /> Diagnose
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="connections">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-3 lg:w-fit">
          <TabsTrigger value="connections" className="min-h-9 justify-center gap-2 px-3 py-2 text-xs sm:text-sm">
            <span className="truncate">Connected Systems</span>
            <Badge variant="secondary" className="h-4 shrink-0 text-[10px]">{connections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="min-h-9 gap-2 px-3 py-2 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="contract" className="min-h-9 gap-2 px-3 py-2 text-xs sm:text-sm">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">API Contract</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Connected API Systems</CardTitle>
              <p className="text-xs text-muted-foreground">
                Each row is an API key connected to this Business Account. External POS, accounting, billing, and ERP transactions are inserted through these keys.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading connected systems from the database...
                </div>
              )}

              {!loading && connections.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
                  <Database className="h-9 w-9 text-muted-foreground/70" />
                  <p className="text-sm font-medium text-foreground">No API-connected systems yet</p>
                  <p className="max-w-md text-xs text-muted-foreground">
                    Create an API key for each POS, accounting, billing, or ERP system. Once that system sends transactions, it will appear here with real activity.
                  </p>
                  <Button size="sm" className="mt-2 gap-2" onClick={goToApiKeys}>
                    <Key className="h-4 w-4" /> Create API Key
                  </Button>
                </div>
              )}

              {!loading && connections.map((connection) => {
                const sc = statusConfig[connection.status];
                const TypeIcon = typeIcons[connection.type] ?? Code;
                const usage = connection.rate_limit > 0 ? (connection.requests_today / connection.rate_limit) * 100 : 0;

                return (
                  <div key={connection.id} className={cn(
                    "rounded-lg border p-3 hover:bg-muted/20 transition-colors",
                    connection.status === "offline" && "border-destructive/20",
                  )}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("rounded-lg p-2.5", sc.bg)}>
                          <TypeIcon className={cn("h-5 w-5", sc.color)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{connection.name}</p>
                            <Badge variant="secondary" className="text-[10px]">{connection.type}</Badge>
                            <Badge variant={connection.environment === "live" ? "default" : "secondary"} className="text-[10px] capitalize">{connection.environment}</Badge>
                            <Badge variant={sc.badgeVariant} className="text-[10px] gap-1">
                              <sc.icon className="h-2.5 w-2.5" /> {sc.label}
                            </Badge>
                            {connection.ip_whitelist.length > 0 && (
                              <Badge variant="outline" className="text-[10px] border-success/40 text-success">IP restricted</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Key: <span className="font-mono">{connection.key_preview}</span> · Source: {connection.last_source_system}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Last: {connection.last_seen} · Today: {connection.requests_today.toLocaleString()} API transactions · Month: {connection.requests_month.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => testConnection(connection)}>
                          <ShieldCheck className="h-3.5 w-3.5" /> Test
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setSelected(connection)}>
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={goToApiKeys}>
                          <Key className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Daily API usage</span>
                          <span>{connection.requests_today.toLocaleString()} / {connection.rate_limit.toLocaleString()}</span>
                        </div>
                        <Progress value={usage} className={cn("h-1", usage > 80 && "[&>div]:bg-warning")} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>30-day success rate</span>
                          <span className={connection.success_rate >= 95 ? "text-success font-medium" : "text-warning font-medium"}>{connection.success_rate}%</span>
                        </div>
                        <Progress value={connection.success_rate} className={cn("h-1", connection.success_rate < 95 && "[&>div]:bg-warning")} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">API Transactions per Connected System</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={activityConfig} className="min-h-[220px] w-full">
                <BarChart data={activity} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" fill="var(--color-requests)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" fill="var(--color-errors)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">API Request Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourlyConfig} className="min-h-[180px] w-full">
                <AreaChart data={hourly} accessibilityLayer>
                  <defs>
                    <linearGradient id="posReqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="requests" stroke="var(--chart-1)" strokeWidth={2} fill="url(#posReqGrad)" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">External System API Contract</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                POS, accounting, billing, ERP, and e-commerce systems insert real Business Account transactions through this endpoint.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Transaction endpoint</p>
                <code className="mt-2 block break-all rounded bg-muted px-3 py-2 text-xs text-foreground">
                  POST {integration?.transaction_endpoint ?? "/api/integrations/transactions"}
                </code>
                <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">Authentication</p>
                <code className="mt-2 block rounded bg-muted px-3 py-2 text-xs text-foreground">
                  {integration?.auth_header ?? "X-NUERS-API-Key"}: &lt;business-account-key&gt;
                </code>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-foreground">Required VAT classification</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each external transaction must send one tax type so NUERS can store vatable, non-VAT, VAT-exempt, or zero-rated sales accurately.
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(integration?.accepted_tax_types ?? ["vatable", "vat_exempt", "zero_rated", "non_vat"]).map((type) => (
                    <Badge key={type} variant="outline" className="font-mono text-[10px]">{type}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Connection Type", value: selected.type },
                  { label: "Environment", value: selected.environment },
                  { label: "Status", value: selected.status },
                  { label: "Last Seen", value: selected.last_seen },
                  { label: "Source System", value: selected.last_source_system },
                  { label: "Today Requests", value: selected.requests_today.toLocaleString() },
                  { label: "Monthly Requests", value: selected.requests_month.toLocaleString() },
                  { label: "Daily Rate Limit", value: selected.rate_limit.toLocaleString() },
                  { label: "Errors Today", value: selected.errors_today.toLocaleString() },
                  { label: "Success Rate", value: `${selected.success_rate}%` },
                ].map((field) => (
                  <div key={field.label} className="rounded border p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field.label}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 capitalize">{field.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Scopes</p>
                <div className="flex flex-wrap gap-1">
                  {selected.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="font-mono text-[10px]">{permission}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
