import { useState } from "react";
import { FlaskConical, Play, Copy, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ENDPOINTS = [
  { method: "POST", path: "/api/v1/receipts", label: "Create Receipt" },
  { method: "GET", path: "/api/v1/receipts/:id", label: "Get Receipt" },
  { method: "POST", path: "/api/v1/verify", label: "Verify Receipt" },
  { method: "GET", path: "/api/v1/merchants/:id/stats", label: "Business Account Stats" },
  { method: "POST", path: "/api/v1/transactions/batch", label: "Batch Submit" },
  { method: "POST", path: "/api/v1/z-readings", label: "Z-Reading (End of Day)" },
];

const SAMPLE_PAYLOADS: Record<string, string> = {
  "POST /api/v1/receipts": JSON.stringify({
    merchant_id: "MCH-2024-001",
    amount: 1250.00,
    vat: 150.00,
    discount: 0,
    vat_type: "vatable",
    payment_method: "cash",
    cashier_id: "EMP-001",
    items: [
      { name: "Product A", qty: 2, unit_price: 500.00 },
      { name: "Product B", qty: 1, unit_price: 250.00 },
    ],
    timestamp: new Date().toISOString(),
  }, null, 2),
  "POST /api/v1/verify": JSON.stringify({
    receipt_id: "RCT-847291",
    merchant_id: "MCH-2024-001",
  }, null, 2),
  "POST /api/v1/transactions/batch": JSON.stringify({
    merchant_id: "MCH-2024-001",
    device_id: "POS-TERM-001",
    transactions: [
      { amount: 500.00, vat: 60.00, timestamp: new Date().toISOString(), items: [{ name: "Item 1", qty: 1, unit_price: 500.00 }] },
      { amount: 750.00, vat: 90.00, timestamp: new Date().toISOString(), items: [{ name: "Item 2", qty: 3, unit_price: 250.00 }] },
    ],
  }, null, 2),
};

const SAMPLE_RESPONSES: Record<string, { status: number; body: object }> = {
  "POST /api/v1/receipts": {
    status: 201,
    body: {
      receipt_id: "RCT-847291",
      bir_ref_no: "BIR-2026-05-847291",
      merchant_id: "MCH-2024-001",
      amount: 1250.00,
      vat: 150.00,
      status: "issued",
      qr_code: "https://verify.nuers.gov.ph/r/RCT-847291",
      issued_at: new Date().toISOString(),
    },
  },
  "POST /api/v1/verify": {
    status: 200,
    body: {
      valid: true,
      receipt_id: "RCT-847291",
      merchant_name: "Sample Store Inc.",
      amount: 1250.00,
      issued_at: "2026-05-27T10:30:00Z",
      bir_ref_no: "BIR-2026-05-847291",
    },
  },
  "POST /api/v1/transactions/batch": {
    status: 202,
    body: {
      batch_id: "BAT-20260527-001",
      status: "processing",
      total: 2,
      accepted: 2,
      rejected: 0,
      estimated_completion: "30s",
    },
  },
};

const testHistory = [
  { id: "t1", method: "POST", endpoint: "/api/v1/receipts", status: 201, time: "2 mins ago", duration: "143ms" },
  { id: "t2", method: "POST", endpoint: "/api/v1/verify", status: 200, time: "5 mins ago", duration: "67ms" },
  { id: "t3", method: "POST", endpoint: "/api/v1/receipts", status: 422, time: "10 mins ago", duration: "88ms" },
];

export function ApiSandbox() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("POST /api/v1/receipts");
  const [payload, setPayload] = useState(SAMPLE_PAYLOADS["POST /api/v1/receipts"] || "");
  const [response, setResponse] = useState<{ status: number; body: object } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleEndpointChange(val: string) {
    setSelectedEndpoint(val);
    setPayload(SAMPLE_PAYLOADS[val] || "{}");
    setResponse(null);
  }

  async function runTest() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setResponse(SAMPLE_RESPONSES[selectedEndpoint] || { status: 200, body: { ok: true } });
    setLoading(false);
  }

  function copyResponse() {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.body, null, 2));
      toast.success("Response copied");
    }
  }

  const ep = ENDPOINTS.find((e) => `${e.method} ${e.path}` === selectedEndpoint);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Sandbox</h1>
          <p className="text-sm text-muted-foreground">Test API endpoints in a safe sandbox environment</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <FlaskConical className="h-3.5 w-3.5" /> Sandbox Mode
        </Badge>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-muted-foreground">
          All requests in this sandbox use test credentials and are not transmitted to BIR.
          Receipts issued here have prefix <code className="rounded bg-muted px-1 font-mono text-xs">RCT-TEST-</code> and are not legally valid.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Endpoint</Label>
              <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((ep) => (
                    <SelectItem key={`${ep.method} ${ep.path}`} value={`${ep.method} ${ep.path}`}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={ep.method === "POST" ? "default" : "secondary"}
                          className="text-[10px] font-mono w-10 justify-center"
                        >
                          {ep.method}
                        </Badge>
                        <span className="font-mono text-xs">{ep.path}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Authorization</Label>
              <Input
                value="Bearer nuers_test_sk_****************************k4"
                readOnly
                className="font-mono text-xs text-muted-foreground"
              />
            </div>

            {ep?.method !== "GET" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Request Body (JSON)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => setPayload(SAMPLE_PAYLOADS[selectedEndpoint] || "{}")}
                  >
                    <RefreshCw className="h-3 w-3" /> Reset
                  </Button>
                </div>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="min-h-48 font-mono text-xs"
                />
              </div>
            )}

            <Button className="w-full gap-2" onClick={runTest} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {loading ? "Sending…" : "Send Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Response */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Response</CardTitle>
              {response && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={response.status < 300 ? "default" : "destructive"}
                    className="gap-1.5"
                  >
                    {response.status < 300 ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {response.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResponse}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {response ? (
              <pre className="min-h-48 overflow-x-auto rounded-lg bg-muted/50 border p-4 text-xs font-mono text-foreground leading-relaxed">
                {JSON.stringify(response.body, null, 2)}
              </pre>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground">Send a request to see the response</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Test Calls</CardTitle>
          <CardDescription>Your sandbox request history in this session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {testHistory.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={t.method === "POST" ? "default" : "secondary"}
                    className="text-[10px] font-mono w-10 justify-center"
                  >
                    {t.method}
                  </Badge>
                  <span className="font-mono text-foreground">{t.endpoint}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={t.status < 300 ? "default" : "destructive"} className="text-[10px]">
                    {t.status}
                  </Badge>
                  <span className="font-mono text-muted-foreground">{t.duration}</span>
                  <span className="text-muted-foreground">{t.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
