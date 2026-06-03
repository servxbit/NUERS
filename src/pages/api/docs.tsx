import { Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/receipts",
    title: "Create Receipt",
    desc: "Issue an electronic receipt for a completed transaction. Receipt is transmitted to BIR in real-time.",
    body: {
      merchant_id: "string (required) — Your BIR-registered business account ID",
      amount: "number (required) — Total transaction amount in PHP",
      vat: "number (required) — VAT amount in PHP (0 for exempt)",
      discount: "number (optional) — Discount amount in PHP",
      vat_type: "string (required) — 'vatable' | 'exempt' | 'zero_rated'",
      payment_method: "string (required) — 'cash' | 'card' | 'gcash' | 'maya' | 'bank_transfer'",
      cashier_id: "string (optional) — Cashier/employee ID",
      items: "array (required) — Line items: { name, qty, unit_price }",
      timestamp: "string (optional) — ISO 8601. Defaults to current time.",
    },
    response: {
      receipt_id: "string — Unique NUERS receipt identifier",
      bir_ref_no: "string — BIR official reference number",
      qr_code: "string — URL to QR verification page",
      status: "string — 'issued' | 'pending'",
      issued_at: "string — ISO 8601 timestamp",
    },
    errors: [
      { code: 400, desc: "Invalid request body — check required fields" },
      { code: 401, desc: "Invalid or missing API key" },
      { code: 403, desc: "Business account not registered or inactive" },
      { code: 422, desc: "VAT amount does not match computed VAT" },
      { code: 429, desc: "Rate limit exceeded" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/receipts/:id",
    title: "Get Receipt",
    desc: "Retrieve a previously issued receipt by its ID.",
    body: null,
    response: {
      receipt_id: "string — NUERS receipt ID",
      bir_ref_no: "string — BIR reference number",
      merchant_id: "string — Business account ID",
      amount: "number — Total amount",
      vat: "number — VAT amount",
      status: "string — 'issued' | 'cancelled'",
      qr_code: "string — Verification URL",
      items: "array — Line items",
      issued_at: "string — Issue timestamp",
    },
    errors: [
      { code: 401, desc: "Unauthorized" },
      { code: 404, desc: "Receipt not found" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/verify",
    title: "Verify Receipt",
    desc: "Verify the authenticity and BIR status of a receipt. Used by consumers to confirm receipts.",
    body: {
      receipt_id: "string (required) — NUERS receipt ID",
      merchant_id: "string (optional) — Additional validation",
    },
    response: {
      valid: "boolean — Whether the receipt is authentic",
      receipt_id: "string — Receipt ID",
      merchant_name: "string — Registered business account name",
      amount: "number — Transaction amount",
      issued_at: "string — Issue timestamp",
      bir_ref_no: "string — BIR reference",
    },
    errors: [
      { code: 404, desc: "Receipt not found or invalid" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/transactions/batch",
    title: "Batch Submit",
    desc: "Submit up to 1,000 transactions in a single request. Ideal for offline POS sync and ERP exports.",
    body: {
      merchant_id: "string (required) — Business account ID",
      device_id: "string (optional) — POS terminal ID",
      transactions: "array (required) — Array of up to 1,000 transaction objects",
    },
    response: {
      batch_id: "string — Batch processing ID",
      status: "string — 'processing' | 'completed' | 'partial'",
      total: "number — Total transactions submitted",
      accepted: "number — Successfully accepted",
      rejected: "number — Failed transactions",
      estimated_completion: "string — ETA",
    },
    errors: [
      { code: 400, desc: "Batch exceeds 1,000 transaction limit" },
      { code: 422, desc: "One or more transactions have validation errors" },
    ],
  },
];

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
}

export function ApiDocs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Reference</h1>
          <p className="text-sm text-muted-foreground">Complete NUERS REST API documentation</p>
        </div>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" /> OpenAPI Spec
        </Button>
      </div>

      {/* Base URL */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Base URL</p>
              <code className="text-sm font-mono text-foreground">https://api.nuers.gov.ph/v1</code>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground mb-1">Authentication</p>
              <code className="text-xs font-mono text-foreground">Authorization: Bearer &lt;api_key&gt;</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-4">
        {endpoints.map((ep) => (
          <Card key={ep.path}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant={ep.method === "POST" ? "default" : "secondary"}
                  className="font-mono text-xs w-12 justify-center"
                >
                  {ep.method}
                </Badge>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="text-sm font-mono font-medium text-foreground">{ep.path}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => copy(ep.path)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-sm">{ep.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{ep.desc}</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="request">
                <TabsList className="h-8">
                  <TabsTrigger value="request" className="text-xs h-7">
                    {ep.body ? "Request Body" : "Parameters"}
                  </TabsTrigger>
                  <TabsTrigger value="response" className="text-xs h-7">Response</TabsTrigger>
                  <TabsTrigger value="errors" className="text-xs h-7">Errors</TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="mt-3">
                  {ep.body ? (
                    <div className="space-y-1.5 rounded-lg border p-3">
                      {Object.entries(ep.body).map(([key, desc]) => (
                        <div key={key} className="flex items-start gap-3 text-xs">
                          <code className="w-44 shrink-0 font-mono text-primary">{key}</code>
                          <span className="text-muted-foreground">{desc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No request body. Pass the ID in the URL path.</p>
                  )}
                </TabsContent>

                <TabsContent value="response" className="mt-3">
                  <div className="space-y-1.5 rounded-lg border p-3">
                    {Object.entries(ep.response).map(([key, desc]) => (
                      <div key={key} className="flex items-start gap-3 text-xs">
                        <code className="w-44 shrink-0 font-mono text-success">{key}</code>
                        <span className="text-muted-foreground">{desc}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="errors" className="mt-3">
                  <div className="space-y-2">
                    {ep.errors.map((err) => (
                      <div key={err.code} className="flex items-center gap-3 text-xs rounded-md border px-3 py-2">
                        <Badge variant={err.code >= 500 ? "destructive" : err.code >= 400 ? "secondary" : "default"} className="text-[10px] w-10 justify-center">
                          {err.code}
                        </Badge>
                        <span className="text-muted-foreground">{err.desc}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rate limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Requests / min</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Requests / day</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Batch size</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  { plan: "Sandbox", rpm: "100", rpd: "10,000", batch: "100" },
                  { plan: "Starter", rpm: "1,000", rpd: "500,000", batch: "500" },
                  { plan: "Business", rpm: "5,000", rpd: "5,000,000", batch: "1,000" },
                  { plan: "Enterprise", rpm: "Unlimited", rpd: "Unlimited", batch: "1,000" },
                ].map((row) => (
                  <tr key={row.plan} className="border-b last:border-0">
                    <td className="py-2 font-medium text-foreground">{row.plan}</td>
                    <td className="py-2 text-muted-foreground font-mono">{row.rpm}</td>
                    <td className="py-2 text-muted-foreground font-mono">{row.rpd}</td>
                    <td className="py-2 text-muted-foreground font-mono">{row.batch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Rate limit headers are included in every response: <code className="rounded bg-muted px-1">X-RateLimit-Limit</code>, <code className="rounded bg-muted px-1">X-RateLimit-Remaining</code>, <code className="rounded bg-muted px-1">X-RateLimit-Reset</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
