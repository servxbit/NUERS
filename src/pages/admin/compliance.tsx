import {
  Shield, CheckCircle2, AlertTriangle, TrendingUp,
  TrendingDown, MapPin, Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Cell,
} from "recharts";

const nationalTrend = [
  { month: "Dec'25", rate: 93.1 },
  { month: "Jan'26", rate: 94.2 },
  { month: "Feb'26", rate: 94.8 },
  { month: "Mar'26", rate: 95.5 },
  { month: "Apr'26", rate: 96.1 },
  { month: "May'26", rate: 98.2 },
];

const regionCompliance = [
  { region: "NCR", rate: 99.1, merchants: 845234 },
  { region: "Region IV-A", rate: 97.8, merchants: 234521 },
  { region: "Region III", rate: 96.4, merchants: 189023 },
  { region: "Region VII", rate: 95.2, merchants: 142012 },
  { region: "Region XI", rate: 93.8, merchants: 89234 },
  { region: "Region VI", rate: 91.4, merchants: 76543 },
  { region: "Region I", rate: 89.2, merchants: 54321 },
  { region: "Region X", rate: 87.6, merchants: 45678 },
];

const sectorCompliance = [
  { sector: "Banking", score: 100 },
  { sector: "Retail", score: 98 },
  { sector: "F&B", score: 96 },
  { sector: "Services", score: 93 },
  { sector: "E-Commerce", score: 91 },
  { sector: "Wholesale", score: 88 },
  { sector: "Manufacturing", score: 84 },
];

const violationTypes = [
  { type: "Sales Suppression", count: 47, severity: "critical" },
  { type: "Late Filing", count: 234, severity: "medium" },
  { type: "Under-reporting", count: 89, severity: "high" },
  { type: "Ghost Invoicing", count: 23, severity: "critical" },
  { type: "Missing Receipts", count: 156, severity: "low" },
  { type: "Incorrect VAT", count: 78, severity: "medium" },
];

const radarData = [
  { category: "Filing Rate", value: 98 },
  { category: "VAT Accuracy", value: 95 },
  { category: "Timely Payment", value: 92 },
  { category: "Receipt Issuance", value: 99 },
  { category: "Audit Response", value: 88 },
  { category: "System Integration", value: 96 },
];


const severityBadge: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "secondary",
  medium: "outline",
  low: "outline",
};

export function AdminCompliance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance Monitoring</h1>
          <p className="text-sm text-muted-foreground">Nationwide business account compliance tracking and enforcement</p>
        </div>
        <Button size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Compliance Report
        </Button>
      </div>

      {/* National KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "National Compliance Rate", value: "98.2%", change: "+4.0pp", up: true, icon: Shield },
          { label: "Compliant Business Accounts", value: "2,363,600", change: "+45,200", up: true, icon: CheckCircle2 },
          { label: "Active Violations", value: "627", change: "-12%", up: true, icon: AlertTriangle },
          { label: "Cases Resolved (30d)", value: "1,248", change: "+23%", up: true, icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {s.up ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className="text-success">{s.change}</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regions">By Region</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">National Compliance Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={nationalTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[88, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: "var(--success)" }} name="Compliance %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Compliance Dimensions</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                    <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sector compliance */}
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Compliance Rate by Sector</h3>
              <div className="space-y-3">
                {sectorCompliance.map((s) => (
                  <div key={s.sector} className="flex items-center gap-4">
                    <span className="w-28 text-xs text-foreground">{s.sector}</span>
                    <Progress value={s.score} className="flex-1 h-2" />
                    <span className={`w-12 text-right text-xs font-bold ${
                      s.score >= 95 ? "text-success" : s.score >= 88 ? "text-warning" : "text-destructive"
                    }`}>{s.score}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Regional Compliance Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {["Region", "Compliance Rate", "Business Accounts", "Score", "Status"].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionCompliance.map((r) => (
                      <tr key={r.region} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">{r.region}</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-bold text-foreground">{r.rate}%</td>
                        <td className="py-3 text-xs text-muted-foreground">{r.merchants.toLocaleString()}</td>
                        <td className="py-3">
                          <Progress value={r.rate} className="h-1.5 w-32" />
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={r.rate >= 95 ? "default" : r.rate >= 90 ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {r.rate >= 95 ? "Excellent" : r.rate >= 90 ? "Good" : "Needs Attention"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Active Violation Types</h3>
                <div className="space-y-3">
                  {violationTypes.map((v) => (
                    <div key={v.type} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{v.type}</p>
                        <p className="text-[10px] text-muted-foreground">{v.count} active cases</p>
                      </div>
                      <Badge variant={severityBadge[v.severity]} className="text-[10px]">
                        {v.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Violation Count by Type</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={violationTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {violationTypes.map((v, i) => (
                        <Cell key={i} fill={v.severity === "critical" ? "var(--destructive)" : v.severity === "high" ? "var(--chart-4)" : "var(--chart-2)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
