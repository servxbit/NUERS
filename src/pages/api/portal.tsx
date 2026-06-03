import { Key, AlertCircle, Copy, ExternalLink, Zap, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const apiTraffic = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  requests: Math.floor(Math.random() * 50000) + 20000,
  errors: Math.floor(Math.random() * 200),
}));

const endpoints = [
  { method: "POST", path: "/api/v1/receipts", calls: "2.4M", latency: "12ms", status: "healthy" },
  { method: "GET", path: "/api/v1/receipts/:id", calls: "1.8M", latency: "8ms", status: "healthy" },
  { method: "POST", path: "/api/v1/verify", calls: "890K", latency: "15ms", status: "healthy" },
  { method: "GET", path: "/api/v1/merchants/:id/stats", calls: "450K", latency: "22ms", status: "healthy" },
  { method: "POST", path: "/api/v1/transactions/batch", calls: "120K", latency: "45ms", status: "degraded" },
];

export function ApiPortal() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Management Platform</h1>
          <p className="text-sm text-muted-foreground">Developer portal and API monitoring</p>
        </div>
        <Button className="gap-2">
          <ExternalLink className="h-4 w-4" /> Full Documentation
        </Button>
      </div>

      {/* API Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total API Calls", value: "284M", sub: "This month", icon: Zap },
          { label: "Avg Response Time", value: "14ms", sub: "P95: 45ms", icon: Clock },
          { label: "Error Rate", value: "0.03%", sub: "Below threshold", icon: AlertCircle },
          { label: "Active Keys", value: "12,847", sub: "+234 this week", icon: Key },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="monitoring">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Quick Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">API Traffic (24h)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={apiTraffic}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="errors" stroke="var(--destructive)" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Endpoint Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Endpoint</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Calls (30d)</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Latency</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoints.map((ep) => (
                      <tr key={ep.path} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono">{ep.method}</Badge>
                            <span className="text-xs font-mono text-foreground">{ep.path}</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{ep.calls}</td>
                        <td className="py-3 text-xs text-foreground">{ep.latency}</td>
                        <td className="py-3">
                          <Badge variant={ep.status === "healthy" ? "default" : "secondary"} className="text-[10px]">
                            {ep.status}
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

        <TabsContent value="keys" className="mt-6">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Your API Keys</h3>
                <Button size="sm">Generate New Key</Button>
              </div>
              {[
                { name: "Production", key: "nuers_live_sk_****************************a8f2", created: "2026-01-15" },
                { name: "Sandbox", key: "nuers_test_sk_****************************b3c1", created: "2026-01-15" },
              ].map((k) => (
                <div key={k.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{k.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{k.key}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2">Rate Limits</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Requests/minute</span>
                    <span className="text-foreground">1,000 / 5,000</span>
                  </div>
                  <Progress value={20} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Start</h3>
              <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs space-y-2">
                <p className="text-muted-foreground"># Install SDK</p>
                <p className="text-foreground">npm install @nuers/sdk</p>
                <p className="mt-4 text-muted-foreground"># Initialize</p>
                <p className="text-foreground">{`import { NUERS } from '@nuers/sdk';`}</p>
                <p className="text-foreground">{`const nuers = new NUERS('nuers_live_sk_...');`}</p>
                <p className="mt-4 text-muted-foreground"># Issue a receipt</p>
                <p className="text-foreground">{`const receipt = await nuers.receipts.create({`}</p>
                <p className="text-foreground pl-4">{`amount: 1250.00,`}</p>
                <p className="text-foreground pl-4">{`vat: 150.00,`}</p>
                <p className="text-foreground pl-4">{`items: [{ name: 'Item', qty: 1 }]`}</p>
                <p className="text-foreground">{`});`}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
