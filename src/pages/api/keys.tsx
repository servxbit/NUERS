import { useState } from "react";
import {
  Key, Copy, Eye, EyeOff, Plus, Trash2, Shield,
  CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const apiKeys = [
  {
    id: "1",
    name: "Production",
    key: "nuers_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    prefix: "nuers_live_sk_",
    masked: "nuers_live_sk_****************************p6",
    created: "2026-01-15",
    lastUsed: "2 mins ago",
    env: "production",
    permissions: ["receipts:write", "receipts:read", "verify:read", "stats:read"],
    rateLimit: { used: 1000, total: 5000 },
    status: "active",
  },
  {
    id: "2",
    name: "Sandbox",
    key: "nuers_test_sk_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4",
    prefix: "nuers_test_sk_",
    masked: "nuers_test_sk_****************************k4",
    created: "2026-01-15",
    lastUsed: "1 hour ago",
    env: "sandbox",
    permissions: ["receipts:write", "receipts:read", "verify:read"],
    rateLimit: { used: 200, total: 1000 },
    status: "active",
  },
  {
    id: "3",
    name: "Staging - Mobile POS",
    key: "nuers_test_sk_b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8",
    prefix: "nuers_test_sk_",
    masked: "nuers_test_sk_****************************q8",
    created: "2026-03-01",
    lastUsed: "3 days ago",
    env: "sandbox",
    permissions: ["receipts:write", "receipts:read"],
    rateLimit: { used: 50, total: 1000 },
    status: "active",
  },
];

const PERMISSIONS = [
  { id: "receipts:write", label: "Create Receipts", desc: "POST /api/v1/receipts" },
  { id: "receipts:read", label: "Read Receipts", desc: "GET /api/v1/receipts/:id" },
  { id: "verify:read", label: "Verify Receipts", desc: "POST /api/v1/verify" },
  { id: "stats:read", label: "Read Statistics", desc: "GET /api/v1/merchants/:id/stats" },
  { id: "batch:write", label: "Batch Transactions", desc: "POST /api/v1/transactions/batch" },
  { id: "webhooks:write", label: "Manage Webhooks", desc: "POST /api/v1/webhooks" },
];

export function ApiKeys() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState("sandbox");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(["receipts:write", "receipts:read"]);

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  }

  function togglePerm(perm: string) {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage authentication credentials for your integrations</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>Create a new API key for your integration.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Key Name</Label>
                <Input
                  placeholder="e.g. Mobile POS Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Environment</Label>
                <Select value={newKeyEnv} onValueChange={setNewKeyEnv}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {PERMISSIONS.map((perm) => (
                    <div key={perm.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{perm.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{perm.desc}</p>
                      </div>
                      <Switch
                        checked={selectedPerms.includes(perm.id)}
                        onCheckedChange={() => togglePerm(perm.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => toast.success("API key generated successfully")}
                disabled={!newKeyName}
              >
                Generate Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-foreground">Keep your API keys secure</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Never expose API keys in client-side code or public repositories. Rotate keys immediately if compromised.
          </p>
        </div>
      </div>

      {/* Keys list */}
      <div className="space-y-4">
        {apiKeys.map((k) => (
          <Card key={k.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${k.env === "production" ? "bg-primary/10" : "bg-secondary"}`}>
                    <Key className={`h-4 w-4 ${k.env === "production" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{k.name}</span>
                      <Badge variant={k.env === "production" ? "default" : "secondary"} className="text-[10px]">
                        {k.env}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-success">
                        <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> {k.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 min-w-0 truncate rounded bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                        {revealed[k.id] ? k.key : k.masked}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => toggleReveal(k.id)}
                      >
                        {revealed[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => copyKey(k.key)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {k.permissions.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground mt-0.5">{k.created}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Used</p>
                  <p className="font-medium text-foreground mt-0.5">{k.lastUsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5">
                    Rate Limit — {k.rateLimit.used.toLocaleString()} / {k.rateLimit.total.toLocaleString()} req/min
                  </p>
                  <Progress value={(k.rateLimit.used / k.rateLimit.total) * 100} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* IP Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">IP Allowlist</CardTitle>
          <CardDescription>Restrict API key usage to specific IP addresses or CIDR ranges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="e.g. 203.0.113.0/24 or 192.168.1.100" className="font-mono text-sm" />
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {["203.0.113.0/24", "10.0.0.1"].map((ip) => (
              <div key={ip} className="flex items-center justify-between rounded-md border px-3 py-2">
                <code className="text-xs font-mono text-foreground">{ip}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Leave empty to allow requests from any IP address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
