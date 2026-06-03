import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Code,
  Database,
  Eye,
  FileText,
  Landmark,
  Lock,
  QrCode,
  Server,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LiveTransactionTicker } from "./live-ticker";
import { HeroStats } from "./hero-stats";
import { ModeToggle } from "@/components/mode-toggle";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const platformCapabilities = [
  { icon: FileText, title: "Electronic Receipt Issuance", desc: "Generate secure electronic official receipts in real time." },
  { icon: Building2, title: "Government Revenue Collection", desc: "Centralize taxes, permits, licenses, fees, and service charges." },
  { icon: Smartphone, title: "Payment Processing", desc: "Support cash, cards, online banking, QR payments, e-wallets, and kiosks." },
  { icon: BarChart3, title: "Financial Reporting", desc: "Produce daily, monthly, annual, audit, and reconciliation reports." },
  { icon: Shield, title: "Audit Compliance", desc: "Maintain complete transaction histories and user activity trails." },
  { icon: TrendingUp, title: "Revenue Analytics", desc: "Monitor collection performance, revenue trends, forecasts, and alerts." },
  { icon: QrCode, title: "Citizen Verification", desc: "Verify receipt authenticity through QR codes, receipt numbers, and signatures." },
  { icon: Activity, title: "Real-Time Monitoring", desc: "Track transactions across offices, departments, and locations as they happen." },
];

const enterprisePortals = [
  {
    icon: Server,
    title: "Super Admin Dashboard",
    desc: "System-wide command center for transactions, business accounts, clients, BIR accounts, RBAC, APIs, fraud, subscriptions, gateways, health, and security.",
    href: "/super-admin",
  },
  {
    icon: Landmark,
    title: "BIR Dashboard",
    desc: "Regulator workspace for national and regional revenue monitoring, EOR compliance, audit review, analytics, forecasts, and exportable reports.",
    href: "/bir",
  },
  {
    icon: Building2,
    title: "Business Account Dashboard",
    desc: "Business portal for profile, BIR registration, branches, POS integrations, EOR issuance, receipt templates, settlements, and tax reports.",
    href: "/merchant",
  },
  {
    icon: Users,
    title: "Client Dashboard",
    desc: "Citizen portal for digital wallet, government fee payments, payment history, receipt downloads, QR verification, and notifications.",
    href: "/client",
  },
];

const supportedTransactions = [
  "Tax Collections",
  "Business Permits",
  "Mayor's Permits",
  "Regulatory Fees",
  "Government Service Fees",
  "Court Fees",
  "Utility Payments",
  "Public Hospital Payments",
  "School and University Fees",
  "Fines and Penalties",
  "Community Charges",
  "Miscellaneous Collections",
];

const governmentUsers = [
  "National Government Agencies",
  "Local Government Units (LGUs)",
  "Provinces",
  "Cities and Municipalities",
  "Government-Owned and Controlled Corporations (GOCCs)",
  "State Universities and Colleges",
  "Public Hospitals",
  "Regulatory Agencies",
  "Public Service Offices",
];

const paymentMethods = [
  "Cash Payments",
  "Credit Cards",
  "Debit Cards",
  "Online Banking",
  "Mobile Banking",
  "QR Payments",
  "E-Wallets",
  "Payment Kiosks",
  "Government Payment Portals",
];

const reports = [
  "Daily Collection Reports",
  "Monthly Revenue Reports",
  "Annual Financial Reports",
  "Audit Reports",
  "Compliance Reports",
  "Transaction Logs",
  "Collection Reconciliation Reports",
  "Performance Analytics Reports",
];

const securityFeatures = [
  "End-to-End Data Encryption",
  "Multi-Factor Authentication (MFA)",
  "Role-Based Access Control (RBAC)",
  "Secure Cloud Infrastructure",
  "Automated Backups",
  "Disaster Recovery Systems",
  "Digital Signatures",
  "Intrusion Monitoring",
  "Fraud Prevention Mechanisms",
];

const coreModules = [
  { title: "Electronic Receipt Management System", desc: "Generate, manage, archive, and verify electronic receipts." },
  { title: "Revenue Collection Management", desc: "Track collections from multiple offices, departments, and locations." },
  { title: "Payment Gateway Integration", desc: "Connect government payment channels and third-party providers." },
  { title: "Reporting and Analytics Module", desc: "Generate financial reports, dashboards, and performance insights." },
  { title: "Audit and Compliance Module", desc: "Monitor compliance, reconcile revenue, and support audit activities." },
  { title: "Citizen Verification Portal", desc: "Provide public receipt authentication and online verification services." },
  { title: "Administration and User Management", desc: "Manage users, permissions, roles, system settings, and controls." },
];

const searchKeywords = [
  "Electronic Receipt System Philippines",
  "Government Revenue Collection System",
  "Electronic Official Receipt System",
  "Digital Government Payment Platform",
  "LGU Revenue Management System",
  "Government Collection Software",
  "Electronic Receipt Verification System",
  "Government Financial Management System",
  "Digital Payment Collection System",
  "Government Compliance Reporting Software",
  "Financial Transparency Platform",
  "Audit Management System for Government",
];

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center">
            <img
              src="/NUERSLOGO.png"
              alt="NUERS"
              className="h-9 w-auto dark:brightness-0 dark:invert"
            />
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#overview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Overview</a>
            <a href="#portals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portals</a>
            <a href="#receipts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Receipts</a>
            <a href="#payments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Payments</a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#modules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Modules</a>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/super-admin">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)/5%,transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          >
            <motion.div variants={fadeUp} className="flex flex-col justify-center">
              <Badge variant="secondary" className="mb-6 w-fit text-xs">
                <Zap className="mr-1.5 h-3 w-3 text-gold" />
                Government Electronic Receipt System
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl xl:text-6xl">
                National Unified{" "}
                <span className="text-primary">Electronic Receipt</span>{" "}
                System (NUERS)
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Modernizing government revenue collection through secure electronic official
                receipts, digital payments, compliance reporting, audit management, and
                real-time financial transparency.
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Built for government agencies, local government units, state universities,
                public hospitals, regulatory offices, and government-owned institutions
                collecting taxes, permits, licenses, tuition fees, healthcare payments,
                regulatory fees, and public service charges.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/super-admin">
                  <Button size="lg" className="gap-2">
                    View Super Admin <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/verify">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" /> Verify Receipt
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid gap-5 sm:grid-cols-3">
                {[
                  { value: "24/7", label: "Receipt Verification" },
                  { value: "Real-Time", label: "Revenue Monitoring" },
                  { value: "Unified", label: "Government Collections" },
                ].map((stat) => (
                  <div key={stat.label} className="border-l pl-4">
                    <span className="block text-2xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <HeroStats />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <LiveTransactionTicker />

      <section id="portals" className="border-b py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">Four Enterprise Portals</Badge>
              <h2 className="text-3xl font-bold text-foreground">One Platform for Every NUERS Stakeholder</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                NUERS separates platform administration, BIR regulatory oversight,
                business account operations, and client self-service into secure role-based portals.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 grid gap-4 lg:grid-cols-4">
              {enterprisePortals.map((portal) => (
                <Card key={portal.title} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <portal.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">{portal.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{portal.desc}</p>
                    <Link to={portal.href} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline">
                      Open portal <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="overview" className="border-b bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4">What is NUERS?</Badge>
              <h2 className="text-3xl font-bold text-foreground">A Central Platform for Government Receipts and Collections</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                NUERS is a comprehensive Electronic Receipt Management System (ERMS)
                built specifically for government institutions seeking to modernize
                financial operations and support digital transformation initiatives.
                It helps reduce revenue leakage, eliminate manual errors, improve
                reporting accuracy, and strengthen public trust.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformCapabilities.map((feature) => (
                <Card key={feature.title} className="group border-border/50 transition-all hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                      <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="receipts" className="border-b py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="grid gap-12 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4">Electronic Receipt System</Badge>
                <h2 className="text-3xl font-bold text-foreground">
                  Generate Secure Electronic Official Receipts Instantly
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  NUERS allows government offices to issue legally compliant electronic
                  receipts in real time, with secure digital records and instant public
                  verification through QR codes, receipt numbers, and digital signatures.
                </p>
                <div className="mt-8">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Supported Transactions</h3>
                  <CheckList items={supportedTransactions} />
                </div>
              </div>
              <div className="space-y-4">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground">Key Benefits</h3>
                    <div className="mt-4">
                      <CheckList items={[
                        "Paperless Receipt Generation",
                        "Faster Transaction Processing",
                        "Reduced Operational Costs",
                        "Improved Collection Efficiency",
                        "Secure Digital Records",
                        "Real-Time Reporting",
                      ]} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground">Verification Methods</h3>
                    <div className="mt-4">
                      <CheckList items={[
                        "QR Code Verification",
                        "Receipt Number Validation",
                        "Digital Signature Verification",
                        "Online Receipt Authentication",
                      ]} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Badge variant="outline" className="mb-4">Unified Revenue Collection</Badge>
                <h2 className="text-3xl font-bold text-foreground">Centralized Collection Management</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  NUERS consolidates all collection activities into one secure platform.
                  Government institutions can monitor revenues from multiple offices,
                  departments, and locations through a centralized dashboard.
                </p>
              </div>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Ideal For</h3>
                  <div className="mt-4">
                    <CheckList items={governmentUsers} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="payments" className="border-b py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center">
              <Badge variant="secondary" className="mb-4">Digital Payment Integration</Badge>
              <h2 className="text-3xl font-bold text-foreground">Multiple Payment Channels for Citizens</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                NUERS supports modern payment methods that reduce queues, speed up
                transactions, increase collection rates, and improve citizen experience.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Supported Payment Methods</h3>
                  <div className="mt-4">
                    <CheckList items={paymentMethods} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Benefits of Digital Payments</h3>
                  <div className="mt-4">
                    <CheckList items={[
                      "Faster Transactions",
                      "Reduced Queues",
                      "Increased Collection Rates",
                      "Improved Citizen Experience",
                      "Secure Payment Processing",
                    ]} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="grid gap-8 lg:grid-cols-3">
              {[
                {
                  icon: BarChart3,
                  title: "Real-Time Revenue Monitoring and Analytics",
                  desc: "Monitor daily collections, collection performance, revenue trends, department performance, transaction summaries, forecasting, financial analytics, and real-time alerts.",
                },
                {
                  icon: FileText,
                  title: "Automated Financial Reporting and Compliance",
                  desc: "Simplify government reporting requirements with automated financial, compliance, audit, reconciliation, and performance reports.",
                },
                {
                  icon: Eye,
                  title: "Audit Management and Transparency",
                  desc: "Record every transaction with complete audit trails, user activity monitoring, transaction history, reconciliation, fraud detection, and documentation.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-border/50">
                  <CardContent className="p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Available Reports</h3>
                  <div className="mt-4">
                    <CheckList items={reports} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="security" className="border-b py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <Badge variant="secondary" className="mb-4">Enterprise Security and Data Protection</Badge>
                <h2 className="text-3xl font-bold text-foreground">Secure Government Financial Transactions</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  NUERS uses enterprise-grade cybersecurity technologies to protect
                  sensitive government data and financial information, supporting
                  modern cybersecurity and digital governance requirements.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Lock, title: "Encryption" },
                    { icon: Shield, title: "MFA + RBAC" },
                    { icon: Database, title: "Recovery" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-lg border bg-card p-4">
                      <item.icon className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Security Features</h3>
                  <div className="mt-4">
                    <CheckList items={securityFeatures} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center">
              <Badge variant="outline" className="mb-4">Benefits of NUERS</Badge>
              <h2 className="text-3xl font-bold text-foreground">Built for Agencies and Citizens</h2>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">For Government Agencies</h3>
                  </div>
                  <div className="mt-5">
                    <CheckList items={[
                      "Improve Revenue Collection Efficiency",
                      "Reduce Revenue Leakage",
                      "Enhance Financial Transparency",
                      "Automate Manual Processes",
                      "Strengthen Regulatory Compliance",
                      "Improve Audit Readiness",
                      "Increase Operational Productivity",
                    ]} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">For Citizens</h3>
                  </div>
                  <div className="mt-5">
                    <CheckList items={[
                      "Faster Government Transactions",
                      "Convenient Digital Payments",
                      "Secure Electronic Receipts",
                      "Online Receipt Verification",
                      "Reduced Waiting Times",
                      "Improved Government Services",
                    ]} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="modules" className="border-b py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center">
              <Badge variant="secondary" className="mb-4">Core System Modules</Badge>
              <h2 className="text-3xl font-bold text-foreground">A Unified Electronic Receipt Platform</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                One solution for collection, receipt management, reporting, verification,
                audit readiness, user administration, and financial transparency.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coreModules.map((module) => (
                <Card key={module.title} className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground">{module.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{module.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-b bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="grid gap-12 lg:grid-cols-2">
              <div>
                <Badge variant="outline" className="mb-4">Why Government Agencies Choose NUERS</Badge>
                <h2 className="text-3xl font-bold text-foreground">Secure, Scalable, and Future-Ready</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  NUERS supports municipal, provincial, regional, and national deployments
                  with real-time revenue visibility, modern digital payment options,
                  instant electronic receipts, automated compliance reporting, and
                  stronger financial transparency.
                </p>
              </div>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-foreground">Frequently Searched Keywords Integrated</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {searchKeywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-[10px]">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="bg-primary py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="flex justify-center mb-8">
            <img src="/NUERSLOGOWHITE.png" alt="NUERS" className="h-10 w-auto opacity-90" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground">
            Digitizing Government Collections and Strengthening Transparency
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            NUERS helps government institutions build trust through secure electronic
            receipt technology, digital payment integration, and real-time collection visibility.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/admin">
              <Button size="lg" variant="secondary" className="gap-2">
                Request Government Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/api">
              <Button size="lg" variant="outline" className="gap-2 border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:text-primary">
                <Code className="h-4 w-4" /> View API Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center">
                <img
                  src="/NUERSLOGO.png"
                  alt="NUERS"
                  className="h-8 w-auto dark:brightness-0 dark:invert"
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                National Unified Electronic Receipt System for revenue collection,
                compliance, audit management, and digital transformation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Platform</h4>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li><a href="#overview" className="hover:text-foreground transition-colors">Overview</a></li>
                <li><a href="#receipts" className="hover:text-foreground transition-colors">Electronic Receipts</a></li>
                <li><a href="#payments" className="hover:text-foreground transition-colors">Digital Payments</a></li>
                <li><a href="#modules" className="hover:text-foreground transition-colors">System Modules</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Government</h4>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li><Link to="/admin" className="hover:text-foreground transition-colors">Revenue Dashboard</Link></li>
                <li><Link to="/audit" className="hover:text-foreground transition-colors">Audit Management</Link></li>
                <li><Link to="/compliance" className="hover:text-foreground transition-colors">Compliance Center</Link></li>
                <li><Link to="/notifications" className="hover:text-foreground transition-colors">Alerts and Notifications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Access</h4>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link to="/api" className="hover:text-foreground transition-colors">API Documentation</Link></li>
                <li><Link to="/consumer" className="hover:text-foreground transition-colors">Citizen Verification</Link></li>
                <li><Link to="/system" className="hover:text-foreground transition-colors">System Administration</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              2024-2026 NUERS. Government electronic receipt system for public sector collections.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Data Processing Agreement</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
