import { ShoppingCart, Monitor, Building2, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const guides = [
  {
    id: "ecommerce",
    icon: ShoppingCart,
    title: "E-Commerce Integration",
    desc: "Integrate NUERS into your online store to automatically issue electronic receipts on every order.",
    difficulty: "Beginner",
    time: "30 min",
    steps: [
      { title: "Install the SDK", desc: "Run npm install @nuers/sdk or use our Shopify/WooCommerce plugin." },
      { title: "Configure your API key", desc: "Set NUERS_API_KEY in your environment. Use sandbox key for testing." },
      { title: "Hook into order completion", desc: "Call nuers.receipts.create() in your order.completed event handler." },
      { title: "Display the QR code", desc: "Return receipt.qrCode in your order confirmation email and page." },
      { title: "Handle webhooks (optional)", desc: "Configure a webhook endpoint to receive receipt.created events for your records." },
    ],
    tags: ["Shopify", "WooCommerce", "Node.js", "PHP"],
  },
  {
    id: "pos",
    icon: Monitor,
    title: "POS System Integration",
    desc: "Connect your point-of-sale terminal to NUERS for real-time receipt issuance and BIR compliance.",
    difficulty: "Intermediate",
    time: "1–2 hours",
    steps: [
      { title: "Register your POS device", desc: "Each POS terminal must be registered with a unique device ID via POST /api/v1/devices." },
      { title: "Authenticate per session", desc: "Generate a session token at start-of-day using POST /api/v1/sessions." },
      { title: "Issue receipts per transaction", desc: "Call POST /api/v1/receipts synchronously at payment completion." },
      { title: "Print QR on receipt", desc: "Embed the returned qr_code URL as a QR image on the printed receipt." },
      { title: "Handle offline mode", desc: "Use POST /api/v1/transactions/batch to upload queued offline receipts on reconnection." },
      { title: "End-of-day report", desc: "Submit daily Z-reading via POST /api/v1/z-readings for BIR compliance." },
    ],
    tags: ["Oracle MICROS", "Clover", "Square", "Java", "C#"],
  },
  {
    id: "erp",
    icon: Building2,
    title: "ERP / Accounting Integration",
    desc: "Integrate NUERS with your enterprise resource planning or accounting system for automated tax reporting.",
    difficulty: "Advanced",
    time: "2–4 hours",
    steps: [
      { title: "Set up batch processing", desc: "Use POST /api/v1/transactions/batch for high-volume invoice submission (up to 1,000 per batch)." },
      { title: "Configure VAT mapping", desc: "Map your ERP tax codes to NUERS VAT types: VATable, VAT-Exempt, Zero-Rated." },
      { title: "Schedule daily sync", desc: "Set up a cron job to sync previous-day transactions to NUERS each night." },
      { title: "Monitor submission status", desc: "Poll GET /api/v1/batches/:id for processing status and error reports." },
      { title: "Retrieve tax reports", desc: "Pull monthly VAT summary via GET /api/v1/merchants/:id/tax-summary for reconciliation." },
    ],
    tags: ["SAP B1", "QuickBooks", "Xero", "Python", "Java"],
  },
  {
    id: "mobile",
    icon: Smartphone,
    title: "Mobile App Integration",
    desc: "Add NUERS receipt generation to your mobile POS or delivery app using our REST API directly.",
    difficulty: "Beginner",
    time: "45 min",
    steps: [
      { title: "Use REST API directly", desc: "Mobile apps should call the REST API directly — no SDK needed. Use Bearer token auth." },
      { title: "Secure your API key", desc: "Never embed API keys in mobile app code. Use a backend proxy endpoint instead." },
      { title: "Implement a proxy endpoint", desc: "Your mobile app calls your own server, which forwards to NUERS with the secret key." },
      { title: "Display QR for verification", desc: "Render the returned qr_code as a QR code image for customers to scan." },
    ],
    tags: ["React Native", "Flutter", "iOS", "Android"],
  },
];

const faqs = [
  {
    q: "What is the difference between sandbox and production?",
    a: "Sandbox receipts are for testing only and are not reported to BIR. They use test API keys prefixed with nuers_test_sk_. Production keys (nuers_live_sk_) issue real receipts that are transmitted to BIR in real time.",
  },
  {
    q: "How do I handle VAT-exempt or zero-rated transactions?",
    a: "Set the vat_type field to 'exempt' or 'zero_rated' when creating a receipt. The vat field should be 0 for these transactions. NUERS will tag them correctly in BIR submissions.",
  },
  {
    q: "What happens if my receipt submission fails?",
    a: "NUERS returns a 4xx error with a descriptive error code. You should implement retry logic with exponential backoff. For POS terminals, queue failed receipts locally and submit via the batch endpoint when connectivity is restored.",
  },
  {
    q: "How long does it take for receipts to reach BIR?",
    a: "Receipts are transmitted to BIR within 5 seconds of issuance for production keys. You will receive a bir_ref_no in the response confirming successful BIR registration.",
  },
  {
    q: "Can I issue receipts in bulk / batch?",
    a: "Yes. Use POST /api/v1/transactions/batch with up to 1,000 transactions per request. Batch processing is ideal for end-of-day sync from offline POS systems or ERP exports.",
  },
  {
    q: "How do I handle refunds and credit memos?",
    a: "Issue a credit memo by calling POST /api/v1/receipts with type set to 'credit_memo' and referencing the original_receipt_id. This creates an official credit memo in BIR records.",
  },
];

export function ApiGuides() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Guides</h1>
        <p className="text-sm text-muted-foreground">Step-by-step guides for connecting your platform to NUERS</p>
      </div>

      {/* Guide cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {guides.map((guide) => (
          <Card key={guide.id} className="group">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                  <guide.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{guide.title}</h3>
                    <Badge
                      variant={guide.difficulty === "Beginner" ? "default" : guide.difficulty === "Intermediate" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {guide.difficulty}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{guide.time}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{guide.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {guide.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <ol className="space-y-2">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{step.title} — </span>
                      <span className="text-muted-foreground">{step.desc}</span>
                    </div>
                  </li>
                ))}
              </ol>

              <Button variant="outline" size="sm" className="mt-4 gap-2 text-xs w-full">
                View Full Guide <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist for going live */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Pre-Production Checklist
          </CardTitle>
          <CardDescription>Complete these steps before switching to your production API key</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Test all receipt types in sandbox (regular, VAT-exempt, zero-rated)",
              "Verify QR code renders correctly and resolves on verify.nuers.gov.ph",
              "Test batch submission and confirm all records are accepted",
              "Set up webhook endpoint and verify delivery of receipt.created events",
              "Implement offline queue and batch upload fallback for POS systems",
              "Configure IP allowlist for production API key",
              "Set up error alerting for API call failures",
              "Complete BIR business account registration and confirm bir_ref_no in responses",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
