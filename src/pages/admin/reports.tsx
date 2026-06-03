import { useState } from "react";
import {
  Download, FileText, BarChart3, Calendar,
  Clock, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Report = {
  id: string;
  name: string;
  description: string;
  category: string;
  lastGenerated: string;
  frequency: string;
  format: string;
  size: string;
};

const REPORTS: Report[] = [
  { id: "r1", name: "Monthly Revenue Collection", description: "Nationwide tax revenue by region, sector, and business account type", category: "Revenue", lastGenerated: "May 31, 2026", frequency: "Monthly", format: "PDF/Excel", size: "2.4 MB" },
  { id: "r2", name: "VAT Compliance Summary", description: "VAT filing status, collections, and compliance rates nationwide", category: "Compliance", lastGenerated: "May 31, 2026", frequency: "Monthly", format: "Excel", size: "1.8 MB" },
  { id: "r3", name: "Risk Detection Report", description: "AI-detected anomalies, confirmed cases, and tax leakage estimates", category: "Risk", lastGenerated: "May 27, 2026", frequency: "Weekly", format: "PDF", size: "890 KB" },
  { id: "r4", name: "Regional Performance Dashboard", description: "Transaction volume, compliance, and revenue KPIs by region", category: "Analytics", lastGenerated: "May 27, 2026", frequency: "Weekly", format: "PDF/Excel", size: "3.1 MB" },
  { id: "r5", name: "Business Account Compliance Scorecard", description: "Compliance scores, violations, and remediation status per business account", category: "Compliance", lastGenerated: "May 25, 2026", frequency: "Weekly", format: "Excel", size: "5.2 MB" },
  { id: "r6", name: "System Audit Log Export", description: "Complete audit trail of all admin actions and system events", category: "Security", lastGenerated: "May 27, 2026", frequency: "Daily", format: "JSON/CSV", size: "12.4 MB" },
  { id: "r7", name: "API Usage Statistics", description: "Endpoint performance, error rates, and business account API activity", category: "Technical", lastGenerated: "May 27, 2026", frequency: "Daily", format: "JSON", size: "450 KB" },
  { id: "r8", name: "Annual Tax Collection Summary", description: "Year-to-date collection summary for BIR executive reporting", category: "Revenue", lastGenerated: "Apr 30, 2026", frequency: "Monthly", format: "PDF", size: "1.2 MB" },
];

const categoryColor: Record<string, string> = {
  Revenue: "bg-primary/10 text-primary",
  Compliance: "bg-success/10 text-success",
  Risk: "bg-destructive/10 text-destructive",
  Analytics: "bg-chart-2/10 text-foreground",
  Security: "bg-warning/10 text-warning",
  Technical: "bg-secondary text-secondary-foreground",
};

type ScheduledReport = {
  name: string;
  next: string;
  freq: string;
  recipients: number;
};

const SCHEDULED: ScheduledReport[] = [
  { name: "Monthly Revenue Collection", next: "Jun 1, 2026", freq: "Monthly", recipients: 12 },
  { name: "Weekly Risk Detection", next: "Jun 3, 2026", freq: "Weekly", recipients: 8 },
  { name: "Daily Audit Log", next: "Tomorrow 08:00", freq: "Daily", recipients: 3 },
  { name: "Business Account Compliance Scorecard", next: "Jun 3, 2026", freq: "Weekly", recipients: 15 },
];

export function AdminReports() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const filtered = REPORTS.filter((r) => categoryFilter === "all" || r.category === categoryFilter);

  function toggleSelect(id: string) {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function simulateGenerate(id: string) {
    const report = REPORTS.find((r) => r.id === id);
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      toast.success(`"${report?.name}" downloaded (${report?.size}).`);
    }, 2000);
  }

  function handleDownloadSelected() {
    const names = selectedReports.map((id) => REPORTS.find((r) => r.id === id)?.name).filter(Boolean);
    toast.success(`Downloading ${names.length} report(s): ${names.join(", ")}.`);
    setSelectedReports([]);
  }

  function handleGenerateCustom() {
    toast.success("Custom report generation started. You will be notified when ready.");
  }

  function handleEditSchedule(name: string) {
    toast.info(`Schedule editor for "${name}" would open here.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-sm text-muted-foreground">Generate, schedule, and download government reports</p>
        </div>
        {selectedReports.length > 0 && (
          <Button size="sm" className="gap-2" onClick={handleDownloadSelected}>
            <Download className="h-4 w-4" /> Download {selectedReports.length} Selected
          </Button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Reports Generated (30d)", value: "184", icon: FileText },
          { label: "Scheduled Reports", value: SCHEDULED.length.toString(), icon: Calendar },
          { label: "Avg Generation Time", value: "2.4s", icon: Clock },
          { label: "Total Data Exported", value: "8.4 GB", icon: BarChart3 },
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

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Report Library</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="custom">Custom Report</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {["Revenue", "Compliance", "Risk", "Analytics", "Security", "Technical"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{filtered.length} reports</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-lg border p-4 transition-all cursor-pointer hover:border-primary/30 ${
                      selectedReports.includes(r.id) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleSelect(r.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedReports.includes(r.id)}
                          onCheckedChange={() => toggleSelect(r.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">{r.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColor[r.category] ?? "bg-secondary"}`}>
                          {r.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{r.frequency} · {r.format} · {r.size}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); simulateGenerate(r.id); }}
                        disabled={generating === r.id}
                      >
                        {generating === r.id ? (
                          <><Clock className="h-3 w-3 animate-spin" /> Generating...</>
                        ) : (
                          <><Download className="h-3 w-3" /> Download</>
                        )}
                      </Button>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">Last generated: {r.lastGenerated}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Scheduled Deliveries</h3>
              <div className="space-y-3">
                {SCHEDULED.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Next: {s.next} · {s.recipients} recipients</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{s.freq}</Badge>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleEditSchedule(s.name)}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Build Custom Report</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue Collection</SelectItem>
                      <SelectItem value="compliance">Compliance Status</SelectItem>
                      <SelectItem value="risk">Risk Analysis</SelectItem>
                      <SelectItem value="merchant">Business Account Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="qtd">Quarter to Date</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="ncr">NCR</SelectItem>
                      <SelectItem value="r3">Region III</SelectItem>
                      <SelectItem value="r4a">Region IV-A</SelectItem>
                      <SelectItem value="r7">Region VII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <Label>Include Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Executive Summary", "Charts & Graphs", "Detailed Tables", "Business Account Breakdown", "Regional Analysis", "Trend Comparison"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <Checkbox id={s} defaultChecked />
                      <Label htmlFor={s} className="text-xs font-normal">{s}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" onClick={handleGenerateCustom}>
                <TrendingUp className="h-4 w-4" /> Generate Custom Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
