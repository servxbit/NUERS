import { useState } from "react";
import {
  Webhook, Plus, Trash2, RefreshCw, CheckCircle2,
  XCircle, AlertCircle, ChevronDown, ChevronRight, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const WEBHOOK_EVENTS = [
  { id: "receipt.created", label: "Receipt Created", desc: "Fired when a new receipt is issued" },
  { id: "receipt.verified", label: "Receipt Verified", desc: "Fired when a receipt QR is scanned and verified" },
  { id: "transaction.batch_completed", label: "Batch Completed", desc: "Fired when a batch transaction upload completes" },
  { id: "merchant.compliance_alert", label: "Compliance Alert", desc: "Fired when a compliance threshold is breached" },
  { id: "merchant.risk_detected", label: "Risk Detected", desc: "Fired when anomaly risk score exceeds threshold" },
  { id: "api.rate_limit_warning", label: "Rate Limit Warning", desc: "Fired at 80% rate limit consumption" },
];

const webhooks = [
  {
    id: "wh_1",
    url: "https://pos.example.com/nuers/webhooks",
    events: ["receipt.created", "receipt.verified"],
    status: "active",
    secret: "whsec_****************************a1b2",
    lastDelivery: "Success — 2 mins ago",
    successRate: 99.8,
  },
  {
    id: "wh_2",
    url: "https://ecom.example.com/api/nuers-events",
    events: ["receipt.created", "transaction.batch_completed", "merchant.risk_detected"],
    status: "active",
    secret: "whsec_****************************c3d4",
    lastDelivery: "Success — 15 mins ago",
    successRate: 98.2,
  },
  {
    id: "wh_3",
    url: "https://legacy-erp.example.com/nuers",
    events: ["receipt.created"],
    status: "failing",
    secret: "whsec_****************************e5f6",
    lastDelivery: "Failed — 1 hour ago (timeout)",
    successRate: 61.4,
  },
];

const deliveryLog = [
  { id: "dl_1", event: "receipt.created", url: "pos.example.com", status: "success", code: 200, duration: "143ms", time: "2 mins ago" },
  { id: "dl_2", event: "receipt.verified", url: "pos.example.com", status: "success", code: 200, duration: "89ms", time: "2 mins ago" },
  { id: "dl_3", event: "receipt.created", url: "ecom.example.com", status: "success", code: 200, duration: "201ms", time: "15 mins ago" },
  { id: "dl_4", event: "receipt.created", url: "legacy-erp.example.com", status: "failed", code: 504, duration: "30000ms", time: "1 hour ago" },
  { id: "dl_5", event: "transaction.batch_completed", url: "ecom.example.com", status: "success", code: 200, duration: "312ms", time: "2 hours ago" },
];

export function ApiWebhooks() {
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["receipt.created"]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Receive real-time event notifications to your endpoints</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Endpoint</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
              <DialogDescription>Configure a URL to receive NUERS event notifications.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Endpoint URL</Label>
                <Input
                  placeholder="https://your-app.com/webhooks/nuers"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Listen</Label>
                <div className="space-y-2 rounded-lg border p-3 max-h-64 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ev.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{ev.id}</p>
                      </div>
                      <Switch
                        checked={selectedEvents.includes(ev.id)}
                        onCheckedChange={() => toggleEvent(ev.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => toast.success("Webhook endpoint created")}
                disabled={!newUrl || selectedEvents.length === 0}
              >
                Create Endpoint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {webhooks.map((wh) => (
          <Card key={wh.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${wh.status === "active" ? "bg-success/10" : "bg-destructive/10"}`}>
                    <Webhook className={`h-4 w-4 ${wh.status === "active" ? "text-success" : "text-destructive"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono font-medium text-foreground truncate">{wh.url}</code>
                      <Badge
                        variant={wh.status === "active" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {wh.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <Badge key={ev} variant="outline" className="text-[10px] font-mono">{ev}</Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {wh.status === "active" ? (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                        {wh.lastDelivery}
                      </span>
                      <span>Success rate: <span className={`font-medium ${wh.successRate > 90 ? "text-success" : "text-destructive"}`}>{wh.successRate}%</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toast.success("Test event sent")}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setExpanded((prev) => ({ ...prev, [wh.id]: !prev[wh.id] }))}
                  >
                    {expanded[wh.id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {expanded[wh.id] && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Signing Secret</p>
                    <code className="block rounded bg-muted px-3 py-2 text-xs font-mono text-muted-foreground">
                      {wh.secret}
                    </code>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Use this to verify webhook signatures in your server.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Deliveries</CardTitle>
          <CardDescription>Last 30 webhook delivery attempts across all endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deliveryLog.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  <span className="font-mono text-foreground">{log.event}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground truncate max-w-40">{log.url}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <Badge
                    variant={log.status === "success" ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {log.code}
                  </Badge>
                  <span className="text-muted-foreground font-mono">{log.duration}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {log.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Payload Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 border p-4 font-mono text-xs space-y-1">
            <p className="text-muted-foreground">// POST to your endpoint</p>
            <p className="text-foreground">{`{`}</p>
            <p className="text-foreground pl-4">{`"id": "evt_01HX9Z...",`}</p>
            <p className="text-foreground pl-4">{`"type": "receipt.created",`}</p>
            <p className="text-foreground pl-4">{`"created": "2026-05-27T10:30:00Z",`}</p>
            <p className="text-foreground pl-4">{`"data": {`}</p>
            <p className="text-foreground pl-8">{`"receipt_id": "RCT-847291",`}</p>
            <p className="text-foreground pl-8">{`"merchant_id": "MCH-2024-001",`}</p>
            <p className="text-foreground pl-8">{`"amount": 1250.00,`}</p>
            <p className="text-foreground pl-8">{`"qr_code": "https://verify.nuers.gov.ph/..."` }</p>
            <p className="text-foreground pl-4">{`}`}</p>
            <p className="text-foreground">{`}`}</p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Verify the <code className="rounded bg-muted px-1 py-0.5">NUERS-Signature</code> header using HMAC-SHA256 with your signing secret.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
