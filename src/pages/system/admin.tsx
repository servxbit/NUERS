import {
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  Cloud,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const cpuData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}m`,
  cpu: Math.floor(Math.random() * 30) + 25,
  memory: Math.floor(Math.random() * 20) + 55,
}));

const services = [
  { name: "API Gateway", status: "Running", instances: 8, cpu: 34, memory: 62 },
  { name: "Receipt Service", status: "Running", instances: 12, cpu: 45, memory: 71 },
  { name: "Auth Service", status: "Running", instances: 4, cpu: 22, memory: 48 },
  { name: "Analytics Engine", status: "Running", instances: 6, cpu: 67, memory: 82 },
  { name: "Risk Detection", status: "Running", instances: 4, cpu: 78, memory: 85 },
  { name: "Notification Service", status: "Running", instances: 3, cpu: 15, memory: 38 },
  { name: "Report Generator", status: "Idle", instances: 2, cpu: 5, memory: 25 },
];

const dbStats = [
  { name: "Primary (PostgreSQL)", size: "2.4 TB", connections: "847/1000", replication: "Sync" },
  { name: "Analytics (MongoDB)", size: "890 GB", connections: "234/500", replication: "Async" },
  { name: "Cache (Redis)", size: "64 GB", connections: "1,247/5000", replication: "Cluster" },
  { name: "Queue (Kafka)", size: "450 GB", connections: "89 topics", replication: "3x" },
];

export function SystemAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Administration</h1>
          <p className="text-sm text-muted-foreground">Infrastructure monitoring and management</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Cloud className="h-3 w-3" /> AWS ap-southeast-1
          </Badge>
          <Badge variant="default" className="text-xs">DR Active</Badge>
        </div>
      </div>

      {/* Infrastructure Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "CPU Utilization", value: "42%", icon: Cpu, progress: 42 },
          { label: "Memory Usage", value: "67%", icon: MemoryStick, progress: 67 },
          { label: "Storage", value: "3.8 TB / 10 TB", icon: HardDrive, progress: 38 },
          { label: "Network I/O", value: "2.4 Gbps", icon: Activity, progress: 48 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">{s.value}</p>
              <Progress value={s.progress} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Microservices</TabsTrigger>
          <TabsTrigger value="database">Databases</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Kubernetes Pods</h3>
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <RefreshCcw className="h-3 w-3" /> Refresh
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Service</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Instances</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">CPU</th>
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc) => (
                      <tr key={svc.name} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Server className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">{svc.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={svc.status === "Running" ? "default" : "secondary"} className="text-[10px]">
                            {svc.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{svc.instances} pods</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={svc.cpu} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground">{svc.cpu}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={svc.memory} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground">{svc.memory}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {dbStats.map((db) => (
              <Card key={db.name}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">{db.name}</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="text-foreground">{db.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connections</span>
                      <span className="text-foreground">{db.connections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Replication</span>
                      <span className="text-foreground">{db.replication}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Resource Utilization (30m)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
