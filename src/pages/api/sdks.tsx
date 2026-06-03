import { Download, ExternalLink, Package, Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const sdks = [
  {
    lang: "JavaScript / Node.js",
    icon: "JS",
    iconColor: "bg-yellow-500/10 text-yellow-600",
    version: "v2.4.1",
    install: "npm install @nuers/sdk",
    stars: "1.2k",
    status: "stable",
  },
  {
    lang: "PHP",
    icon: "PHP",
    iconColor: "bg-blue-500/10 text-blue-600",
    version: "v2.1.0",
    install: "composer require nuers/sdk",
    stars: "843",
    status: "stable",
  },
  {
    lang: "Python",
    icon: "PY",
    iconColor: "bg-green-500/10 text-green-600",
    version: "v1.8.3",
    install: "pip install nuers-sdk",
    stars: "672",
    status: "stable",
  },
  {
    lang: "Java",
    icon: "JV",
    iconColor: "bg-orange-500/10 text-orange-600",
    version: "v1.5.0",
    install: `<dependency>\n  <groupId>ph.gov.bir</groupId>\n  <artifactId>nuers-sdk</artifactId>\n  <version>1.5.0</version>\n</dependency>`,
    stars: "410",
    status: "stable",
  },
  {
    lang: "C# / .NET",
    icon: "C#",
    iconColor: "bg-purple-500/10 text-purple-600",
    version: "v1.3.2",
    install: "dotnet add package NUERS.SDK",
    stars: "298",
    status: "stable",
  },
  {
    lang: "Ruby",
    icon: "RB",
    iconColor: "bg-red-500/10 text-red-600",
    version: "v1.1.0",
    install: "gem install nuers-sdk",
    stars: "147",
    status: "beta",
  },
];

const posIntegrations = [
  {
    name: "Oracle MICROS",
    category: "Restaurant POS",
    status: "certified",
    version: "v3.2",
    desc: "Full integration with Oracle MICROS POS including receipt issuance, VAT computation, and real-time BIR reporting.",
  },
  {
    name: "Square POS",
    category: "Retail / F&B",
    status: "certified",
    version: "v2.1",
    desc: "Square webhook integration for automatic receipt forwarding to NUERS on every completed transaction.",
  },
  {
    name: "Shopify",
    category: "E-Commerce",
    status: "certified",
    version: "v2.4",
    desc: "Shopify app for seamless NUERS receipt generation on order completion. Supports online and POS modes.",
  },
  {
    name: "WooCommerce",
    category: "E-Commerce",
    status: "certified",
    version: "v1.9",
    desc: "WordPress plugin that hooks into WooCommerce order events and submits receipts to NUERS automatically.",
  },
  {
    name: "SAP Business One",
    category: "ERP",
    status: "certified",
    version: "v1.6",
    desc: "SAP B1 add-on for enterprise batch receipt submission and tax reporting integration with NUERS.",
  },
  {
    name: "Clover POS",
    category: "Retail POS",
    status: "beta",
    version: "v0.9",
    desc: "Clover app integration currently in beta — receipt issuance supported, batch reporting in development.",
  },
];

const codeExamples: Record<string, string> = {
  nodejs: `import { NUERS } from '@nuers/sdk';

const nuers = new NUERS({
  apiKey: process.env.NUERS_API_KEY,
  environment: 'production', // or 'sandbox'
});

// Issue a receipt
const receipt = await nuers.receipts.create({
  merchantId: 'MCH-2024-001',
  amount: 1250.00,
  vat: 150.00,
  discount: 0,
  items: [
    { name: 'Product A', qty: 2, unitPrice: 500.00 },
    { name: 'Product B', qty: 1, unitPrice: 250.00 },
  ],
  paymentMethod: 'cash',
  cashierId: 'EMP-001',
});

console.log(receipt.receiptId);   // RCT-847291
console.log(receipt.qrCode);      // QR URL for verification
console.log(receipt.status);      // issued`,

  php: `<?php
require_once 'vendor/autoload.php';

use NUERS\\Client;

$nuers = new Client([
    'api_key' => getenv('NUERS_API_KEY'),
    'environment' => 'production',
]);

// Issue a receipt
$receipt = $nuers->receipts->create([
    'merchant_id' => 'MCH-2024-001',
    'amount' => 1250.00,
    'vat' => 150.00,
    'items' => [
        ['name' => 'Product A', 'qty' => 2, 'unit_price' => 500.00],
    ],
    'payment_method' => 'cash',
]);

echo $receipt['receipt_id'];   // RCT-847291
echo $receipt['qr_code'];      // QR verification URL`,

  python: `from nuers import NUERS

client = NUERS(
    api_key=os.environ["NUERS_API_KEY"],
    environment="production",
)

# Issue a receipt
receipt = client.receipts.create(
    merchant_id="MCH-2024-001",
    amount=1250.00,
    vat=150.00,
    items=[
        {"name": "Product A", "qty": 2, "unit_price": 500.00},
    ],
    payment_method="cash",
)

print(receipt.receipt_id)   # RCT-847291
print(receipt.qr_code)      # QR verification URL`,

  csharp: `using NUERS;

var client = new NUERSClient(new NUERSOptions {
    ApiKey = Environment.GetEnvironmentVariable("NUERS_API_KEY"),
    Environment = NUERSEnvironment.Production
});

// Issue a receipt
var receipt = await client.Receipts.CreateAsync(new CreateReceiptRequest {
    MerchantId = "MCH-2024-001",
    Amount = 1250.00m,
    Vat = 150.00m,
    Items = new[] {
        new ReceiptItem { Name = "Product A", Qty = 2, UnitPrice = 500.00m }
    },
    PaymentMethod = "cash"
});

Console.WriteLine(receipt.ReceiptId);  // RCT-847291`,
};

export function ApiSdks() {
  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SDKs & Libraries</h1>
        <p className="text-sm text-muted-foreground">Official client libraries and POS/e-commerce integrations</p>
      </div>

      {/* SDK Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sdks.map((sdk) => (
          <Card key={sdk.lang} className="group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${sdk.iconColor}`}>
                    {sdk.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sdk.lang}</p>
                    <p className="text-xs text-muted-foreground">{sdk.version}</p>
                  </div>
                </div>
                <Badge variant={sdk.status === "stable" ? "default" : "secondary"} className="text-[10px]">
                  {sdk.status}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <code className="flex-1 min-w-0 truncate rounded bg-muted px-2 py-1.5 text-xs font-mono text-muted-foreground">
                  {sdk.install.split("\n")[0]}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copy(sdk.install)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1">
                  <Download className="h-3.5 w-3.5" /> Install
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs flex-1">
                  <ExternalLink className="h-3.5 w-3.5" /> Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start Examples</CardTitle>
          <CardDescription>Issue your first receipt in under 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nodejs">
            <TabsList>
              <TabsTrigger value="nodejs">Node.js</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="csharp">C#</TabsTrigger>
            </TabsList>
            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="mt-4">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 z-10"
                    onClick={() => copy(code)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <pre className="overflow-x-auto rounded-lg bg-muted/50 border p-4 text-xs font-mono text-foreground leading-relaxed">
                    {code}
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* POS / E-commerce Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">POS & E-Commerce Integrations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {posIntegrations.map((integration) => (
            <Card key={integration.name} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                        <Badge variant="outline" className="text-[10px]">{integration.category}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge
                      variant={integration.status === "certified" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {integration.status === "certified" && <CheckCircle2 className="mr-1 h-2.5 w-2.5" />}
                      {integration.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{integration.version}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" /> Download Plugin
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" /> Setup Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
