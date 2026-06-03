import { useState } from "react";
import {
  CreditCard, Download, Receipt, CheckCircle2,
  TrendingUp, Zap,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const invoices = [
  { id: "INV-2026-0006", period: "May 2026", amount: 4850, status: "paid", due: "Jun 15, 2026", paid_on: "Jun 3, 2026", txns: 28400 },
  { id: "INV-2026-0005", period: "Apr 2026", amount: 4120, status: "paid", due: "May 15, 2026", paid_on: "May 8, 2026", txns: 24200 },
  { id: "INV-2026-0004", period: "Mar 2026", amount: 4960, status: "paid", due: "Apr 15, 2026", paid_on: "Apr 11, 2026", txns: 29200 },
  { id: "INV-2026-0003", period: "Feb 2026", amount: 3840, status: "paid", due: "Mar 15, 2026", paid_on: "Mar 10, 2026", txns: 22600 },
  { id: "INV-2026-0002", period: "Jan 2026", amount: 3680, status: "paid", due: "Feb 15, 2026", paid_on: "Feb 7, 2026", txns: 21600 },
];

const feeBreakdown = [
  { month: "Jan", platform: 1200, transaction: 2480, addon: 0 },
  { month: "Feb", platform: 1200, transaction: 2640, addon: 200 },
  { month: "Mar", platform: 1200, transaction: 3760, addon: 0 },
  { month: "Apr", platform: 1200, transaction: 2920, addon: 0 },
  { month: "May", platform: 1200, transaction: 3650, addon: 0 },
];

const spendTrend = feeBreakdown.map((d) => ({ month: d.month, total: d.platform + d.transaction + d.addon }));

const feeConfig: ChartConfig = {
  platform: { label: "Platform Fee", color: "var(--chart-1)" },
  transaction: { label: "Transaction Fee", color: "var(--chart-2)" },
  addon: { label: "Add-ons", color: "var(--chart-3)" },
};

const trendConfig: ChartConfig = {
  total: { label: "Total Billed (₱)", color: "var(--chart-1)" },
};

const plans = [
  {
    name: "Starter",
    price: 500,
    txn_fee: "₱0.25/txn",
    limit: 10000,
    features: ["Basic POS Integration", "Standard Reports", "Email Support"],
    current: false,
  },
  {
    name: "Professional",
    price: 800,
    txn_fee: "₱0.20/txn",
    limit: 30000,
    features: ["All POS Integrations", "Advanced Analytics", "Priority Support", "API Access"],
    current: false,
  },
  {
    name: "Enterprise",
    price: 1200,
    txn_fee: "₱2/txn",
    limit: 50000,
    features: ["Unlimited Transactions", "All Integrations", "Advanced Analytics", "Priority Support", "API Access", "Custom Reports", "Dedicated CSM"],
    current: true,
  },
];

const currentPlan = plans.find((p) => p.current)!;
const currentUsage = { used: 28400, limit: currentPlan.limit };

export function MerchantBilling() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<(typeof invoices)[0] | null>(null);

  const totalPaid = invoices.reduce((s, i) => s + i.amount, 0);
  const totalTxns = invoices.reduce((s, i) => s + i.txns, 0);
  const avgMonthly = Math.round(totalPaid / invoices.length);
  const usagePct = Math.round((currentUsage.used / currentUsage.limit) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing &amp; Subscription</h1>
          <p className="text-sm text-muted-foreground">Manage your plan, view invoices &amp; track usage</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => toast.success("All invoices downloaded.")}>
          <Download className="h-4 w-4" /> Download All Invoices
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Current Plan", value: currentPlan.name, icon: Star, accent: "border-l-primary", sub: `₱${currentPlan.price.toLocaleString()}/month` },
          { label: "This Month", value: `₱${invoices[0].amount.toLocaleString()}`, icon: CreditCard, accent: "border-l-success", sub: "Paid Jun 3, 2026" },
          { label: "YTD Spend", value: `₱${totalPaid.toLocaleString()}`, icon: Receipt, accent: "border-l-chart-1", sub: `avg ₱${avgMonthly.toLocaleString()}/mo` },
          { label: "Total Transactions", value: totalTxns.toLocaleString(), icon: TrendingUp, accent: "border-l-chart-2", sub: "processed this year" },
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

      {/* Plan + Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current Plan */}
        <Card className="border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Current Subscription</CardTitle>
              <Badge className="text-xs gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-foreground">₱{currentPlan.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground mb-1">/month</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{currentPlan.name}</Badge>
                <span className="text-xs text-muted-foreground">{currentPlan.txn_fee}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {currentPlan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Monthly Usage</span>
                <span className="font-semibold text-foreground">{currentUsage.used.toLocaleString()} / {currentUsage.limit.toLocaleString()}</span>
              </div>
              <Progress value={usagePct} className={cn("h-2", usagePct > 80 && "[&>div]:bg-warning")} />
              <p className="text-[10px] text-muted-foreground">{usagePct}% of monthly transaction limit</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs w-full" onClick={() => setUpgradeOpen(true)}>
                <Zap className="h-3.5 w-3.5 mr-1.5" /> Upgrade
              </Button>
              <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => toast.success("Billing portal opened.")}>
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fee Breakdown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <Tabs defaultValue="breakdown">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Fee Analysis</CardTitle>
                <TabsList className="h-7">
                  <TabsTrigger value="breakdown" className="text-xs px-2">Breakdown</TabsTrigger>
                  <TabsTrigger value="trend" className="text-xs px-2">Trend</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="breakdown" className="mt-3">
                <ChartContainer config={feeConfig} className="min-h-[200px] w-full">
                  <BarChart data={feeBreakdown} accessibilityLayer>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `₱${v.toLocaleString()}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="platform" fill="var(--color-platform)" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="transaction" fill="var(--color-transaction)" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="addon" fill="var(--color-addon)" radius={[3, 3, 0, 0]} stackId="a" />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="trend" className="mt-3">
                <ChartContainer config={trendConfig} className="min-h-[200px] w-full">
                  <AreaChart data={spendTrend} accessibilityLayer>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `₱${v.toLocaleString()}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} fill="url(#spendGrad)" />
                  </AreaChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Invoice History</CardTitle>
            <Badge variant="secondary" className="text-xs">{invoices.length} invoices</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {["Invoice", "Period", "Transactions", "Amount", "Due Date", "Paid On", "Status", ""].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-medium text-muted-foreground pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setInvoiceDetail(inv)}>
                    <td className="py-3 pr-4 font-mono text-xs font-medium text-foreground">{inv.id}</td>
                    <td className="py-3 pr-4 text-xs text-foreground">{inv.period}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{inv.txns.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-xs font-semibold text-foreground">₱{inv.amount.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{inv.due}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{inv.paid_on}</td>
                    <td className="py-3 pr-4">
                      <Badge className="text-[10px] gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Paid
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); toast.success(`Downloading ${inv.id}...`); }}>
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plan Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Choose Your Plan
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3 mt-2">
            {plans.map((plan) => (
              <div key={plan.name} className={cn(
                "rounded-lg border p-4 space-y-3 transition-all cursor-pointer",
                plan.current ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/50"
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.txn_fee}</p>
                  </div>
                  {plan.current && <Badge className="text-[10px]">Current</Badge>}
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">₱{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={plan.current}
                  onClick={() => { toast.success(`Upgrading to ${plan.name}...`); setUpgradeOpen(false); }}
                >
                  {plan.current ? "Current Plan" : "Select Plan"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!invoiceDetail} onOpenChange={() => setInvoiceDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> {invoiceDetail?.id}
            </DialogTitle>
          </DialogHeader>
          {invoiceDetail && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                {[
                  { label: "Billing Period", value: invoiceDetail.period },
                  { label: "Plan", value: "Enterprise" },
                  { label: "Transactions Processed", value: invoiceDetail.txns.toLocaleString() },
                  { label: "Platform Fee (₱1,200)", value: "₱1,200" },
                  { label: "Transaction Fees", value: `₱${(invoiceDetail.amount - 1200).toLocaleString()}` },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium text-foreground">{f.value}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>₱{invoiceDetail.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Paid on {invoiceDetail.paid_on}
              </div>
              <Button className="w-full gap-2" onClick={() => toast.success("Invoice downloaded.")}>
                <Download className="h-4 w-4" /> Download PDF Invoice
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
