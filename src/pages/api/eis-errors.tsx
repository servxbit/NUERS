import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, XCircle, AlertTriangle, AlertCircle, Search,
  CheckCircle2, Clock, Download,
  ChevronDown, ChevronUp, Bell, BellOff, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Error types ──────────────────────────────────────────────────────────
type Severity = "critical" | "error" | "warning" | "info";

interface ApiError {
  id: string;
  code: string;
  message: string;
  endpoint: string;
  method: string;
  statusCode: number;
  severity: Severity;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  category: string;
  stack?: string;
}

// ─── Mock errors ───────────────────────────────────────────────────────────
const MOCK_ERRORS: ApiError[] = [
  { id: "err-001", code: "EIS_503", message: "BIR EIS service temporarily unavailable", endpoint: "/v2/eis/submit", method: "POST", statusCode: 503, severity: "critical", count: 31, firstSeen: "08:12", lastSeen: "09:48", resolved: false, category: "EIS Connectivity", stack: "EisClient.submit: ConnectionRefused at 10.0.0.1:8443" },
  { id: "err-002", code: "EIS_422", message: "Validation failed: invalid TIN format in invoice payload", endpoint: "/v2/eis/submit", method: "POST", statusCode: 422, severity: "error", count: 18, firstSeen: "07:30", lastSeen: "09:51", resolved: false, category: "Validation" },
  { id: "err-003", code: "AUTH_401", message: "JWT token expired — client did not refresh before expiry", endpoint: "/v2/invoices", method: "GET", statusCode: 401, severity: "warning", count: 142, firstSeen: "06:00", lastSeen: "09:52", resolved: false, category: "Authentication" },
  { id: "err-004", code: "RATE_429", message: "Rate limit exceeded — 120 RPM threshold breached", endpoint: "/v2/eis/submit", method: "POST", statusCode: 429, severity: "warning", count: 94, firstSeen: "08:00", lastSeen: "09:50", resolved: false, category: "Rate Limiting" },
  { id: "err-005", code: "DUP_409", message: "Duplicate transmission detected — payload hash matches existing TX", endpoint: "/v2/eis/submit", method: "POST", statusCode: 409, severity: "info", count: 12, firstSeen: "08:14", lastSeen: "09:30", resolved: false, category: "Duplicate Detection" },
  { id: "err-006", code: "SCOPE_403", message: "Insufficient scope: eis:submit required", endpoint: "/v2/eis/submit", method: "POST", statusCode: 403, severity: "error", count: 7, firstSeen: "07:10", lastSeen: "08:40", resolved: false, category: "Authorization" },
  { id: "err-007", code: "TIMEOUT_504", message: "BIR EIS gateway timeout after 30s", endpoint: "/v2/eis/submit", method: "POST", statusCode: 504, severity: "critical", count: 4, firstSeen: "07:55", lastSeen: "08:55", resolved: true, category: "EIS Connectivity" },
  { id: "err-008", code: "INV_400", message: "Malformed request body — unexpected field 'invoiceType'", endpoint: "/v2/invoices", method: "POST", statusCode: 400, severity: "warning", count: 22, firstSeen: "06:30", lastSeen: "09:40", resolved: false, category: "Validation" },
  { id: "err-009", code: "VER_410", message: "API v1 endpoint deprecated and disabled", endpoint: "/v1/eis/submit", method: "POST", statusCode: 410, severity: "info", count: 58, firstSeen: "00:00", lastSeen: "09:52", resolved: false, category: "API Versioning" },
];

const errorTrend = [
  { hour: "00", critical: 0,  error: 2,  warning: 8,  info: 4  },
  { hour: "02", critical: 0,  error: 1,  warning: 5,  info: 3  },
  { hour: "04", critical: 0,  error: 1,  warning: 3,  info: 2  },
  { hour: "06", critical: 0,  error: 3,  warning: 12, info: 7  },
  { hour: "08", critical: 4,  error: 8,  warning: 28, info: 14 },
  { hour: "10", critical: 6,  error: 12, warning: 42, info: 21 },
  { hour: "12", critical: 5,  error: 10, warning: 38, info: 18 },
  { hour: "14", critical: 3,  error: 7,  warning: 28, info: 12 },
];

const SEV_META: Record<Severity, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  critical: { label: "Critical", color: "text-destructive",       bg: "bg-destructive/10 border-destructive/30",  icon: XCircle },
  error:    { label: "Error",    color: "text-destructive",       bg: "bg-destructive/5 border-destructive/20",   icon: AlertCircle },
  warning:  { label: "Warning",  color: "text-warning",           bg: "bg-warning/10 border-warning/30",          icon: AlertTriangle },
  info:     { label: "Info",     color: "text-muted-foreground",  bg: "bg-muted/50 border-border",                icon: Zap },
};



export function EisErrors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const categories = [...new Set(MOCK_ERRORS.map(e => e.category))];

  const filtered = useMemo(() => {
    let list = MOCK_ERRORS;
    if (search) list = list.filter(e => e.code.toLowerCase().includes(search.toLowerCase()) || e.message.toLowerCase().includes(search.toLowerCase()) || e.endpoint.includes(search));
    if (sevFilter !== "all") list = list.filter(e => e.severity === sevFilter);
    if (catFilter !== "all") list = list.filter(e => e.category === catFilter);
    return list;
  }, [search, sevFilter, catFilter]);

  const totalErrors = MOCK_ERRORS.reduce((s, e) => s + e.count, 0);
  const criticals = MOCK_ERRORS.filter(e => e.severity === "critical" && !e.resolved);
  const unresolvedCount = MOCK_ERRORS.filter(e => !e.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/api/eis")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">API Error Monitoring</h1>
          <p className="text-xs text-muted-foreground">Real-time error tracking, categorization, and alerting</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5">
            {alertsEnabled ? <Bell className="h-3.5 w-3.5 text-primary" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">Alerts</span>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} className="scale-75" />
          </div>
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
            <Download className="h-3 w-3" /> Export
          </Button>
        </div>
      </div>

      {/* Critical banners */}
      {criticals.length > 0 && (
        <div className="space-y-2">
          {criticals.map(e => (
            <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-destructive">[{e.code}] {e.message}</p>
                  <Badge variant="destructive" className="text-[9px]">CRITICAL</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {e.endpoint} • {e.count} occurrences • Last: {e.lastSeen}
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-destructive/40 text-destructive hover:text-destructive" onClick={() => toast.success("Incident acknowledged")}>
                <CheckCircle2 className="h-3 w-3" /> Acknowledge
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Errors (Today)", val: totalErrors, icon: XCircle, color: "text-destructive" },
          { label: "Critical",   val: MOCK_ERRORS.filter(e => e.severity === "critical").reduce((s,e)=>s+e.count,0), icon: AlertCircle, color: "text-destructive" },
          { label: "Unresolved", val: unresolvedCount, icon: Clock, color: "text-warning" },
          { label: "Error Rate", val: "0.21%", icon: AlertTriangle, color: "text-warning" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={cn("h-8 w-8 p-2 rounded-lg bg-muted flex-shrink-0", k.color)} />
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{k.val}</p>
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error trend chart */}
      <Card>
        <CardHeader className="px-5 pt-4 pb-2">
          <CardTitle className="text-sm">Error Trend by Severity (Today)</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={errorTrend}>
              <defs>
                {[
                  ["gCrit",  "var(--destructive)"],
                  ["gErr",   "var(--chart-4)"],
                  ["gWarn",  "var(--warning)"],
                  ["gInfo",  "var(--muted-foreground)"],
                ].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Area dataKey="critical" stroke="var(--destructive)"      fill="url(#gCrit)" strokeWidth={2} name="Critical" />
              <Area dataKey="error"    stroke="var(--chart-4)"           fill="url(#gErr)"  strokeWidth={2} name="Error" />
              <Area dataKey="warning"  stroke="var(--warning)"           fill="url(#gWarn)" strokeWidth={2} name="Warning" />
              <Area dataKey="info"     stroke="var(--muted-foreground)"  fill="url(#gInfo)" strokeWidth={1} name="Info" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Error list */}
      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[180px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search error code, message, endpoint…" className="pl-8 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-36"><SelectValue placeholder="All severities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {(Object.entries(SEV_META) as [Severity, typeof SEV_META[Severity]][]).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-44"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.map(err => {
              const sm = SEV_META[err.severity];
              const Icon = sm.icon;
              const isExp = expanded === err.id;
              return (
                <div key={err.id} className={cn("border rounded-lg overflow-hidden", err.resolved && "opacity-50")}>
                  <button
                    className={cn("w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors", isExp && "bg-muted/10")}
                    onClick={() => setExpanded(isExp ? null : err.id)}
                  >
                    <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", sm.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-xs font-bold font-mono", sm.color)}>[{err.code}]</span>
                        <span className="text-xs font-medium text-foreground">{err.message}</span>
                        <Badge variant="outline" className={cn("text-[9px]", sm.color)}>{sm.label}</Badge>
                        {err.resolved && <Badge variant="secondary" className="text-[9px]">Resolved</Badge>}
                        <Badge variant="outline" className="text-[9px] text-muted-foreground">{err.category}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="font-mono">{err.method} {err.endpoint}</span>
                        <span>HTTP {err.statusCode}</span>
                        <span className="font-medium text-foreground">{err.count}x occurrences</span>
                        <span>First: {err.firstSeen}</span>
                        <span>Last: {err.lastSeen}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!err.resolved && (
                        <Button
                          variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-success hover:text-success"
                          onClick={e => { e.stopPropagation(); toast.success(`Error ${err.code} marked resolved`); }}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Resolve
                        </Button>
                      )}
                      {isExp ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExp && (
                    <div className="border-t bg-muted/10 p-4 space-y-3 text-xs">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <p className="font-semibold text-foreground mb-1">Error Details</p>
                          <div className="space-y-1 text-muted-foreground">
                            <div><span>Code: </span><span className="font-mono text-foreground">{err.code}</span></div>
                            <div><span>HTTP: </span><span className="font-mono text-foreground">{err.statusCode}</span></div>
                            <div><span>Category: </span><span className="text-foreground">{err.category}</span></div>
                            <div><span>Occurrences: </span><span className="text-foreground font-medium">{err.count}</span></div>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground mb-1">Timing</p>
                          <div className="space-y-1 text-muted-foreground">
                            <div><span>First seen: </span><span className="text-foreground">{err.firstSeen}</span></div>
                            <div><span>Last seen: </span><span className="text-foreground">{err.lastSeen}</span></div>
                            <div><span>Status: </span><span className={err.resolved ? "text-success" : "text-warning"}>{err.resolved ? "Resolved" : "Active"}</span></div>
                          </div>
                        </div>
                        {err.stack && (
                          <div>
                            <p className="font-semibold text-foreground mb-1">Stack Trace</p>
                            <pre className="bg-muted p-2 rounded text-[10px] font-mono text-muted-foreground overflow-auto max-h-24">{err.stack}</pre>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg">
                        <p className="font-semibold text-foreground mb-1">Recommended Action</p>
                        <p className="text-muted-foreground">
                          {err.code === "EIS_503" && "Check BIR EIS endpoint health. Failed transmissions are queued for auto-retry. Monitor recovery status."}
                          {err.code === "EIS_422" && "Review invoice payloads for TIN format compliance. Ensure business account TINs are 15-digit format: XXX-XXX-XXX-XXXXX."}
                          {err.code === "AUTH_401" && "Update SDK clients to proactively refresh JWT tokens 60s before expiry. Check token_expiry field in auth response."}
                          {err.code === "RATE_429" && "Implement request queuing and exponential backoff. Consider upgrading API plan for higher rate limits."}
                          {err.code === "DUP_409" && "Expected behavior — duplicate detection working correctly. Review client logic to prevent resubmission of already-processed transmissions."}
                          {err.code === "SCOPE_403" && "Grant eis:submit scope to affected credentials in the API Gateway console."}
                          {err.code === "INV_400" && "Remove unsupported field 'invoiceType' from request body. Use document_type instead per API v2 spec."}
                          {err.code === "VER_410" && "Migrate clients from v1 to v2 endpoints. v1 was sunset on Jan 1, 2026. See migration guide."}
                          {err.code === "TIMEOUT_504" && "BIR EIS was experiencing elevated latency. Auto-retry resolved affected transmissions."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                No errors match your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
