import {
  Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, Brain,
  Building2, CheckCircle2, Clock, Cpu, CreditCard, Database, Download,
  FileText, Fingerprint, Globe, HardDrive, Key, Landmark, Layers, Lock,
  Network, Receipt, RefreshCw, Server, ShieldAlert, ShieldCheck,
  UserCheck, Users, Wallet, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDashboardData, type DashboardListItem } from "@/lib/dashboard-data";

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const iconMap = {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  Globe,
  HardDrive,
  Key,
  Landmark,
  Layers,
  Lock,
  Network,
  Receipt,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  Zap,
};

const statusStyles: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success",
  approved: "border-success/30 bg-success/10 text-success",
  compliant: "border-success/30 bg-success/10 text-success",
  connected: "border-success/30 bg-success/10 text-success",
  good: "border-success/30 bg-success/10 text-success",
  healthy: "border-success/30 bg-success/10 text-success",
  online: "border-success/30 bg-success/10 text-success",
  operational: "border-success/30 bg-success/10 text-success",
  ready: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning-foreground",
  review: "border-warning/30 bg-warning/10 text-warning-foreground",
  monitoring: "border-warning/30 bg-warning/10 text-warning-foreground",
  degraded: "border-warning/30 bg-warning/10 text-warning-foreground",
  high: "border-destructive/30 bg-destructive/10 text-destructive",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  blocked: "border-destructive/30 bg-destructive/10 text-destructive",
};

const AUTO_REFRESH_MS = 5000;

function statusClass(status?: string | null) {
  return statusStyles[String(status ?? "").toLowerCase()] ?? "border-border bg-secondary text-muted-foreground";
}

function metadataText(item: DashboardListItem, key: string, fallback = "—") {
  const value = item.metadata?.[key];
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function itemDisplayValue(item: DashboardListItem, fallback = "—") {
  const display = metadataText(item, "display", "");
  if (display) return display;
  if (item.primary_value === null || item.primary_value === undefined) return fallback;
  return item.primary_value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function itemIcon(item: DashboardListItem, fallback: keyof typeof iconMap = "Activity") {
  return iconMap[(item.badge as keyof typeof iconMap) ?? fallback] ?? iconMap[fallback];
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;

  return (
    <Badge variant="outline" className={cn("text-[10px]", statusClass(status))}>
      {status}
    </Badge>
  );
}

function MiniSignalRow({ item }: { item: DashboardListItem }) {
  const Icon = itemIcon(item, "Activity");

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{item.subtitle}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          {item.primary_value !== null && item.primary_value !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <Progress value={Math.min(100, Number(item.primary_value))} className="h-1.5" />
              <span className="w-10 text-right text-[10px] font-semibold text-foreground">
                {item.primary_value}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  const { data, loading, refreshing, error, reload, lastUpdatedAt } = useDashboardData("super-admin", {
    refreshIntervalMs: AUTO_REFRESH_MS,
  });
  const collectionTrend = data.series.collection_trend ?? [];
  const sourceMix = data.series.source_mix ?? [];
  const heatmap = data.lists.heatmap ?? [];
  const complianceSignals = data.lists.compliance_signals ?? [];
  const aiSignals = data.lists.ai_signals ?? [];
  const gateways = data.lists.gateways ?? [];
  const architectureControls = data.lists.architecture_controls ?? [];
  const architectureTags = data.lists.architecture_tags ?? [];
  const ecosystemAccounts = data.lists.ecosystem_accounts ?? [];
  const liveTransactions = data.lists.live_transactions ?? [];
  const securityOperations = data.lists.security_operations ?? [];
  const apiOperations = data.lists.api_operations ?? [];
  const subscriptionGovernance = data.lists.subscription_governance ?? [];
  const settlementReconciliation = data.lists.settlement_reconciliation ?? [];
  const auditOperations = data.lists.audit_operations ?? [];
  const backupOperations = data.lists.backup_operations ?? [];
  const notificationCenter = data.lists.notification_center ?? [];
  const enterpriseModules = data.lists.enterprise_modules ?? [];
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(lastUpdatedAt))
    : "Waiting";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">NUERS National Super Admin Command Center</h1>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Nationwide Online
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              Auto-sync {Math.round(AUTO_REFRESH_MS / 1000)}s
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Central control for electronic receipts, revenue collection, compliance, security, API operations, and ecosystem health.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last database sync: {lastUpdatedLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={reload} disabled={loading || refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", (loading || refreshing) && "animate-spin")} /> Sync Now
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
            <Link to="/super-admin/citizen-approval">
              <UserCheck className="h-3.5 w-3.5" /> Citizen Approval
            </Link>
          </Button>
          <Button size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Executive Pack
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Loading dashboard data from MySQL...</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Activity;
          return (
            <Card key={item.key} className={`border-l-4 ${item.accent ?? "border-l-primary"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" /> {item.subtext}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ecosystemAccounts.map((item) => {
          const Icon = itemIcon(item, "Users");
          return (
            <Card key={item.title}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.title}</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{itemDisplayValue(item)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-[10px] text-muted-foreground">{metadataText(item, "trend", "")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">National Collection Overview</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Daily, monthly, and year-to-date movement from the live transaction ledger, shown in PHP thousands</p>
              </div>
              <Badge variant="outline" className="text-xs">Live forecast</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="annual" name="Annual" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="monthly" name="Monthly" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.16} strokeWidth={2} />
                <Area type="monotone" dataKey="daily" name="Daily" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.18} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top Revenue Sources</CardTitle>
            <p className="text-xs text-muted-foreground">Collection mix by ecosystem segment</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={sourceMix} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3}>
                  {sourceMix.map((_item, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sourceMix.map((item, index) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    {item.label}
                  </span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Real-Time Transaction Command Stream</CardTitle>
                <p className="text-xs text-muted-foreground">Live transaction monitoring across agencies, business accounts, payment rails, and verification services</p>
              </div>
              <Badge variant="outline" className="gap-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-[10px] text-muted-foreground">
                    <th className="pb-2 font-medium">Transaction Lane</th>
                    <th className="pb-2 font-medium">Volume</th>
                    <th className="pb-2 font-medium">Risk</th>
                    <th className="pb-2 font-medium">SLA</th>
                    <th className="pb-2 font-medium">Action Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {liveTransactions.map((item) => (
                    <tr key={item.title} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-foreground">{itemDisplayValue(item)}</td>
                      <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{metadataText(item, "sla")}</td>
                      <td className="py-3 text-xs text-muted-foreground">{metadataText(item, "owner")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audit, Backup, and Notifications</CardTitle>
            <p className="text-xs text-muted-foreground">Enterprise control room queue for traceability and continuity</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...auditOperations, ...backupOperations, ...notificationCenter].slice(0, 6).map((item) => (
              <MiniSignalRow key={`${item.title}-${item.subtitle}`} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Transaction Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Regional volume and revenue pressure</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {heatmap.map((region) => (
              <div key={region.title} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{region.title}</span>
                  <span className="text-muted-foreground">{region.subtitle}</span>
                </div>
                <Progress value={region.primary_value ?? 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Compliance Status</CardTitle>
            <p className="text-xs text-muted-foreground">Government-grade control coverage</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceSignals.map((signal) => {
              const Icon = iconMap[signal.badge as keyof typeof iconMap] ?? ShieldCheck;
              return (
              <div key={signal.title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{signal.title}</span>
                    <span className="font-semibold text-success">{signal.primary_value}%</span>
                  </div>
                  <Progress value={signal.primary_value ?? 0} className="mt-1 h-1.5" />
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AI Fraud Detection</CardTitle>
            <p className="text-xs text-muted-foreground">Anomaly detection and smart audit recommendations</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSignals.map((signal) => (
              <div key={signal.title} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{signal.title}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{signal.subtitle}</p>
                  </div>
                  <Badge variant={signal.status === "High" ? "destructive" : "secondary"} className="text-[10px]">{signal.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={signal.primary_value ?? 0} className="h-1.5" />
                  <span className="w-8 text-right text-[10px] font-medium text-foreground">{signal.primary_value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Identity, Security, and RBAC Operations</CardTitle>
            <p className="text-xs text-muted-foreground">MFA, role policy, IP restrictions, device tracking, and SOC posture</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {securityOperations.map((item) => <MiniSignalRow key={item.title} item={item} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">API Management and Integration Health</CardTitle>
            <p className="text-xs text-muted-foreground">OAuth2, JWT, webhook, rate limit, and partner gateway monitoring</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {apiOperations.map((item) => <MiniSignalRow key={item.title} item={item} />)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Payment Gateway Management</CardTitle>
            <p className="text-xs text-muted-foreground">Multi-payment support, settlement, and reconciliation readiness</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-[10px] text-muted-foreground">
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium">Channel</th>
                    <th className="pb-2 font-medium">Uptime</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gateways.map((gateway) => (
                    <tr key={gateway.title} className="border-b last:border-0">
                      <td className="py-3 text-xs font-medium text-foreground">{gateway.title}</td>
                      <td className="py-3 text-xs text-muted-foreground">{gateway.subtitle}</td>
                      <td className="py-3 text-xs text-foreground">{gateway.primary_value}%</td>
                      <td className="py-3">
                        <Badge variant="secondary" className="gap-1.5 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {gateway.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Subscription and Settlement Governance</CardTitle>
            <p className="text-xs text-muted-foreground">SaaS plans, billing posture, collections reconciliation, and treasury settlement</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptionGovernance.map((item) => (
                <div key={item.title} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-lg font-bold tabular-nums text-foreground">{itemDisplayValue(item)}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{metadataText(item, "trend", "")}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              {settlementReconciliation.map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">{itemDisplayValue(item)}</p>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Enterprise Module Readiness Matrix</CardTitle>
            <p className="text-xs text-muted-foreground">Core NUERS SaaS capabilities mapped to command-center ownership</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {enterpriseModules.map((item) => {
              const Icon = itemIcon(item, "Layers");
              return (
                <div key={item.title} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">National-Scale Architecture</CardTitle>
            <p className="text-xs text-muted-foreground">Production controls mapped to the requested SaaS stack</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {architectureControls.map((item) => {
                const Icon = iconMap[item.badge as keyof typeof iconMap] ?? Server;
                return (
                <div key={item.title} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {architectureTags.map((item) => (
                <Badge key={item.title} variant="outline" className="text-[10px]">{item.title}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
