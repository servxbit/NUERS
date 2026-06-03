import {
  Activity, AlertTriangle, Building2, Download,
  FileText, Globe, Landmark, Receipt, Search, ShieldCheck, TrendingUp, UserCheck,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardData } from "@/lib/dashboard-data";

const iconMap = {
  Activity,
  AlertTriangle,
  Building2,
  Landmark,
  Receipt,
  ShieldCheck,
  TrendingUp,
};

function initialsFor(value?: string | null) {
  return (value || "BA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "BA";
}

export function BirDashboard() {
  const { data, loading, error } = useDashboardData("bir");
  const collectionTrend = data.series.collection_trend ?? [];
  const revenueByRegion = data.series.revenue_by_region ?? [];
  const merchantCompliance = data.lists.merchant_compliance ?? [];
  const auditQueue = data.lists.audit_queue ?? [];
  const reports = data.lists.reports ?? [];
  const receiptVerification = data.lists.receipt_verification?.[0];
  const forecastCards = data.lists.forecast_cards ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">BIR Revenue and Compliance Dashboard</h1>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Landmark className="h-3 w-3" /> Authorized Regulator View
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            National and regional monitoring for electronic official receipts, business account compliance, tax collections, and audit investigation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
            <Link to="/bir/rdo-registration">
              <Landmark className="h-3.5 w-3.5" /> Register RDO
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
            <Link to="/bir/citizen-approval">
              <UserCheck className="h-3.5 w-3.5" /> Citizen Approval
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
            <Link to="/rdo">
              <Building2 className="h-3.5 w-3.5" /> Open RDO Portal
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
          <Button size="sm" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" /> Open Audit Case
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {data.kpis.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Activity;
          return (
            <Card key={item.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.subtext}</p>
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
                <CardTitle className="text-sm">Collection Trends</CardTitle>
                <p className="text-xs text-muted-foreground">Daily revenue, tax, and receipt volume in PHP billions</p>
              </div>
              <Badge variant="outline" className="text-xs">Real-time tracking</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.14} strokeWidth={2} />
                <Area type="monotone" dataKey="tax" name="Tax" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="receipts" name="Receipts" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Receipt Verification</CardTitle>
            <p className="text-xs text-muted-foreground">Validate receipt number, QR code, and digital signature</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={String(receiptVerification?.metadata.receipt_number ?? "")} readOnly />
            </div>
            <div className="rounded-lg border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{receiptVerification?.title}</p>
                  <p className="text-xs text-muted-foreground">{receiptVerification?.subtitle}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Business Account</span><span className="text-right font-medium text-foreground">{receiptVerification?.metadata.merchant}</span>
                <span className="text-muted-foreground">Status</span><span className="text-right font-medium text-success">{receiptVerification?.status}</span>
                <span className="text-muted-foreground">Method</span><span className="text-right font-medium text-foreground">{receiptVerification?.metadata.method}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2 text-xs">
              <Globe className="h-3.5 w-3.5" /> Open Public Verification Portal
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Regional Revenue Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Revenue and tax collection by region</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByRegion}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tax" name="Tax" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {revenueByRegion.slice(0, 4).map((region) => (
                <div key={region.label} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{region.label}</span>
                    <span className="text-success">{region.compliance}%</span>
                  </div>
                  <Progress value={Number(region.compliance ?? 0)} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tax Collection Forecast</CardTitle>
            <p className="text-xs text-muted-foreground">AI-assisted revenue outlook and performance metrics</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" name="Actual" stroke="var(--chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="tax" name="Projected Tax" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {forecastCards.map((item) => (
                <div key={item.title} className="rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{item.metadata.display ?? item.primary_value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Business Account Compliance Scoring</CardTitle>
            <p className="text-xs text-muted-foreground">EOR compliance, filing status, and audit readiness</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {merchantCompliance.map((merchant) => (
              <div key={merchant.title} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 rounded-lg border bg-secondary">
                      {typeof merchant.metadata.logo_url === "string" && merchant.metadata.logo_url && (
                        <AvatarImage src={merchant.metadata.logo_url} alt={`${merchant.title} logo`} className="object-cover" />
                      )}
                      <AvatarFallback className="rounded-lg bg-secondary text-[10px] font-bold">
                        {initialsFor(merchant.title)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{merchant.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{merchant.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">{merchant.primary_value}</span>
                </div>
                <Progress value={merchant.primary_value ?? 0} className="mt-2 h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audit Queue</CardTitle>
            <p className="text-xs text-muted-foreground">Investigation, validation, and exception reporting</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditQueue.map((audit) => (
              <div key={audit.title} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground">{audit.title}</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{audit.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground">{audit.metadata.scope}</p>
                  </div>
                  <Badge variant={audit.status === "High" ? "destructive" : "secondary"} className="text-[10px]">{audit.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Report Center</CardTitle>
            <p className="text-xs text-muted-foreground">Daily, monthly, quarterly, annual, and export formats</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {reports.map((report) => (
                <Button key={report.title} variant="outline" size="sm" className="justify-start gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5" /> {report.title}
                </Button>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="rounded-lg border bg-secondary/40 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Activity className="h-3.5 w-3.5 text-success" /> Report generator online
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Last export completed 4 minutes ago.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
