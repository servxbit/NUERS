import { useState } from "react";
import {
  FileText, Search, Download, User,
  Settings, Shield, AlertTriangle, Eye, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const actionConfig: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOGIN: { icon: User, variant: "secondary" },
  LOGOUT: { icon: User, variant: "outline" },
  VIEW: { icon: Eye, variant: "outline" },
  UPDATE: { icon: Settings, variant: "secondary" },
  DELETE: { icon: AlertTriangle, variant: "destructive" },
  SUSPEND: { icon: Shield, variant: "destructive" },
  INVESTIGATE: { icon: Search, variant: "secondary" },
  EXPORT: { icon: Download, variant: "outline" },
};

const MOCK_LOGS = [
  { id: "1", actor: "servxbit@gmail.com", action: "LOGIN", resource: "Auth", resource_id: null, ip: "180.195.12.44", time: "2 min ago", details: "Successful login via MFA" },
  { id: "2", actor: "regulator@bir.gov.ph", action: "INVESTIGATE", resource: "Business Account", resource_id: "ABC Trading Co.", ip: "192.168.1.5", time: "15 min ago", details: "Flagged for sales suppression investigation" },
  { id: "3", actor: "admin2@bir.gov.ph", action: "UPDATE", resource: "Business Account", resource_id: "Quick Mart Chain", ip: "10.0.0.22", time: "1 hr ago", details: "Status changed to suspended" },
  { id: "4", actor: "analyst@bir.gov.ph", action: "EXPORT", resource: "Report", resource_id: "May 2026 Revenue", ip: "192.168.1.8", time: "2 hr ago", details: "Exported nationwide revenue CSV" },
  { id: "5", actor: "servxbit@gmail.com", action: "VIEW", resource: "Business Account", resource_id: "SM Supermalls", ip: "180.195.12.44", time: "3 hr ago", details: "Viewed business account profile" },
  { id: "6", actor: "regulator@bir.gov.ph", action: "SUSPEND", resource: "Business Account", resource_id: "XYZ Enterprises", ip: "192.168.1.5", time: "4 hr ago", details: "Account suspended pending audit" },
  { id: "7", actor: "admin2@bir.gov.ph", action: "VIEW", resource: "Risk Alert", resource_id: "ALT-001", ip: "10.0.0.22", time: "5 hr ago", details: "Reviewed AI risk alert" },
  { id: "8", actor: "analyst@bir.gov.ph", action: "VIEW", resource: "Transaction", resource_id: null, ip: "192.168.1.8", time: "6 hr ago", details: "Accessed live transaction feed" },
  { id: "9", actor: "servxbit@gmail.com", action: "UPDATE", resource: "System", resource_id: null, ip: "180.195.12.44", time: "8 hr ago", details: "Updated notification preferences" },
  { id: "10", actor: "regulator@bir.gov.ph", action: "EXPORT", resource: "Report", resource_id: "Compliance Q1", ip: "192.168.1.5", time: "1 day ago", details: "Exported Q1 compliance summary" },
  { id: "11", actor: "admin2@bir.gov.ph", action: "DELETE", resource: "Notification", resource_id: "NOTIF-045", ip: "10.0.0.22", time: "1 day ago", details: "Dismissed resolved alert" },
  { id: "12", actor: "analyst@bir.gov.ph", action: "LOGIN", resource: "Auth", resource_id: null, ip: "192.168.1.8", time: "2 days ago", details: "Successful login" },
];

export function AdminAudit() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = MOCK_LOGS.filter((l) => {
    const matchSearch =
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      (l.resource_id ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const actionCounts: Record<string, number> = {};
  MOCK_LOGS.forEach((l) => { actionCounts[l.action] = (actionCounts[l.action] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Complete immutable record of all admin actions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export Log
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Events (24h)", value: MOCK_LOGS.length.toString(), icon: FileText },
          { label: "Unique Users", value: "4", icon: User },
          { label: "Critical Actions", value: MOCK_LOGS.filter((l) => ["DELETE", "SUSPEND"].includes(l.action)).length.toString(), icon: AlertTriangle },
          { label: "Exports", value: MOCK_LOGS.filter((l) => l.action === "EXPORT").length.toString(), icon: Download },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-0 basis-full sm:min-w-[200px] sm:basis-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, resource, or action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.keys(actionConfig).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filtered.map((log) => {
              const ac = actionConfig[log.action] ?? actionConfig.VIEW;
              const Icon = ac.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    ac.variant === "destructive" ? "bg-destructive/10" : "bg-secondary"
                  }`}>
                    <Icon className={`h-4 w-4 ${ac.variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                          {log.actor.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground">{log.actor}</span>
                      <Badge variant={ac.variant} className="text-[10px]">{log.action}</Badge>
                      {log.resource_id && (
                        <span className="text-xs text-primary font-medium">{log.resource_id}</span>
                      )}
                      <span className="text-xs text-muted-foreground">on {log.resource}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{log.details}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{log.ip}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {MOCK_LOGS.length} events. Audit logs are immutable and retained for 7 years.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
