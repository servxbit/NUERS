import {
  Key, Shield, RefreshCw, AlertTriangle, CheckCircle2,
  Download, Upload, Eye, Plus, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const certificates = [
  { id: "CERT-001", name: "BIR EIS TLS Certificate", cn: "eis.bir.gov.ph", type: "TLS/SSL", issuer: "DigiCert Global CA", serial: "0A:4B:2C:8E:F1:D3", issued: "2025-05-29", expires: "2027-05-29", daysLeft: 731, status: "valid", fingerprint: "SHA-256:a8f4e2c1b9d7..." },
  { id: "CERT-002", name: "NUERS Platform TLS Certificate", cn: "*.nuers.gov.ph", type: "Wildcard TLS", issuer: "DigiCert Global CA", serial: "1B:5C:3D:9F:G2:E4", issued: "2025-11-15", expires: "2027-11-15", daysLeft: 901, status: "valid", fingerprint: "SHA-256:b9e5f3d2c8e1..." },
  { id: "CERT-003", name: "EIS Digital Signing Certificate", cn: "sign.nuers.gov.ph", type: "Code Signing", issuer: "DICT National CA", serial: "2C:6D:4E:AG:H3:F5", issued: "2024-08-01", expires: "2026-08-01", daysLeft: 64, status: "expiring", fingerprint: "SHA-256:c0f6g4e3d9f2..." },
  { id: "CERT-004", name: "Client Authentication Certificate", cn: "client.nuers.gov.ph", type: "Client Auth", issuer: "DICT National CA", serial: "3D:7E:5F:BH:I4:G6", issued: "2024-11-01", expires: "2026-11-01", daysLeft: 156, status: "valid", fingerprint: "SHA-256:d1g7h5f4e0g3..." },
  { id: "CERT-005", name: "Backup Signing Certificate", cn: "backup-sign.nuers.gov.ph", type: "Code Signing", issuer: "DICT National CA", serial: "4E:8F:6G:CI:J5:H7", issued: "2025-01-15", expires: "2027-01-15", daysLeft: 596, status: "valid", fingerprint: "SHA-256:e2h8i6g5f1h4..." },
];

const keys = [
  { id: "KEY-001", name: "EIS Transmission Master Key", algo: "RSA-4096", purpose: "Invoice Signing", created: "2025-01-15", rotationDue: "2026-07-15", daysToRotation: 47, status: "active" },
  { id: "KEY-002", name: "API Authentication Key", algo: "ECDSA P-256", purpose: "JWT Signing", created: "2025-03-01", rotationDue: "2026-09-01", daysToRotation: 95, status: "active" },
  { id: "KEY-003", name: "Data Encryption Key", algo: "AES-256-GCM", purpose: "PII Encryption", created: "2025-02-01", rotationDue: "2026-08-01", daysToRotation: 64, status: "active" },
  { id: "KEY-004", name: "Backup Encryption Key", algo: "AES-256-CBC", purpose: "Backup Encryption", created: "2025-04-01", rotationDue: "2026-10-01", daysToRotation: 125, status: "active" },
  { id: "KEY-005", name: "Legacy Signing Key", algo: "RSA-2048", purpose: "Legacy Support", created: "2023-01-01", rotationDue: "2025-01-01", daysToRotation: -150, status: "retired" },
];

const rotationHistory = [
  { date: "May 15, 2026", key: "EIS Transmission Master Key", action: "Scheduled Rotation", by: "crypto@nuers.gov.ph", result: "Success" },
  { date: "Apr 1, 2026", key: "API Authentication Key", action: "Scheduled Rotation", by: "crypto@nuers.gov.ph", result: "Success" },
  { date: "Mar 15, 2026", key: "Data Encryption Key", action: "Emergency Rotation", by: "sec@nuers.gov.ph", result: "Success" },
  { date: "Jan 15, 2026", key: "EIS Transmission Master Key", action: "Scheduled Rotation", by: "crypto@nuers.gov.ph", result: "Success" },
];

function CertStatusBadge({ status }: { status: string }) {
  if (status === "valid") return <Badge className="bg-success/15 text-success border-success/30 text-xs">Valid</Badge>;
  if (status === "expiring") return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs">Expiring Soon</Badge>;
  if (status === "expired") return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

export function CertificateManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate & Cryptographic Management</h1>
          <p className="text-sm text-muted-foreground">PKI, digital certificates, key management, and cryptographic operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" /> Import Certificate
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Request Certificate
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm"><span className="font-semibold">Certificate expiring soon:</span> EIS Digital Signing Certificate expires in <span className="font-bold text-warning-foreground">64 days</span> (Aug 1, 2026). Initiate renewal process.</p>
            <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs">Renew Now</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Valid Certificates", value: "4", icon: CheckCircle2, color: "text-success" },
          { label: "Expiring Soon", value: "1", icon: AlertTriangle, color: "text-warning" },
          { label: "Active Keys", value: "4", icon: Key, color: "text-primary" },
          { label: "Retired Keys", value: "1", icon: Lock, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="certificates">
        <TabsList className="h-9">
          <TabsTrigger value="certificates" className="text-xs">Certificates</TabsTrigger>
          <TabsTrigger value="keys" className="text-xs">Key Management</TabsTrigger>
          <TabsTrigger value="rotation" className="text-xs">Rotation History</TabsTrigger>
          <TabsTrigger value="pki" className="text-xs">PKI Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="mt-4">
          <div className="space-y-3">
            {certificates.map((cert) => (
              <Card key={cert.id} className={cert.status === "expiring" ? "border-warning/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${cert.status === "valid" ? "bg-success/10" : "bg-warning/10"}`}>
                        <Shield className={`h-5 w-5 ${cert.status === "valid" ? "text-success" : "text-warning"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold">{cert.name}</p>
                          <CertStatusBadge status={cert.status} />
                          <Badge variant="secondary" className="text-xs">{cert.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5">CN: <span className="font-mono">{cert.cn}</span></p>
                        <p className="text-xs text-muted-foreground">Issuer: {cert.issuer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Eye className="h-3 w-3" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" /> Export
                      </Button>
                      {cert.status === "expiring" && (
                        <Button size="sm" className="h-7 text-xs gap-1">
                          <RefreshCw className="h-3 w-3" /> Renew
                        </Button>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Serial Number</p>
                      <p className="font-mono">{cert.serial}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issued</p>
                      <p className="font-medium">{cert.issued}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className={`font-medium ${cert.daysLeft < 90 ? "text-warning-foreground" : ""}`}>{cert.expires} ({cert.daysLeft}d)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fingerprint</p>
                      <p className="font-mono truncate">{cert.fingerprint}</p>
                    </div>
                  </div>
                  {cert.status === "expiring" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Days remaining</span>
                        <span className="font-bold text-warning-foreground">{cert.daysLeft} days</span>
                      </div>
                      <Progress value={(cert.daysLeft / 365) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <div className="space-y-3">
            {keys.map((key) => (
              <Card key={key.id} className={key.status === "retired" ? "opacity-60" : key.daysToRotation < 60 ? "border-warning/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${key.status === "active" ? "bg-primary/10" : "bg-muted"}`}>
                        <Key className={`h-5 w-5 ${key.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold">{key.name}</p>
                          <Badge variant={key.status === "active" ? "default" : "secondary"} className="text-xs">
                            {key.status === "active" ? "Active" : "Retired"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-mono">{key.algo}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Purpose: {key.purpose}</p>
                        <p className="text-xs text-muted-foreground">Created: {key.created}</p>
                      </div>
                    </div>
                    {key.status === "active" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0"
                        onClick={() => toast.success(`Key rotation scheduled for ${key.name}`)}>
                        <RefreshCw className="h-3 w-3" /> Rotate
                      </Button>
                    )}
                  </div>
                  {key.status === "active" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Next rotation: {key.rotationDue}</span>
                        <span className={`font-bold ${key.daysToRotation < 60 ? "text-warning-foreground" : "text-success"}`}>
                          {key.daysToRotation > 0 ? `${key.daysToRotation} days` : "Overdue"}
                        </span>
                      </div>
                      <Progress value={Math.max(0, Math.min(100, (key.daysToRotation / 180) * 100))} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rotation" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Key Rotation History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Key</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Performed By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rotationHistory.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background border-b" : "bg-muted/20 border-b"}>
                      <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                      <td className="px-4 py-3 font-medium">{r.key}</td>
                      <td className="px-4 py-3">{r.action}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{r.by}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-success/15 text-success border-success/30 text-xs">{r.result}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pki" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">PKI Trust Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { level: "Root CA", name: "Philippine DICT National Root CA", type: "Root", valid: "2020–2040", cls: "border-primary bg-primary/5" },
                  { level: "Intermediate CA", name: "DICT Government Services CA", type: "Intermediate", valid: "2022–2032", cls: "border-primary/50 bg-primary/3" },
                  { level: "Issuing CA", name: "NUERS ESP Certificate Authority", type: "Issuing", valid: "2024–2029", cls: "border-border" },
                ].map((ca, i) => (
                  <div key={ca.level} className="flex items-center gap-3">
                    {i > 0 && <div className="w-6 h-4 border-l-2 border-b-2 border-border ml-4" />}
                    <Card className={`flex-1 border ${ca.cls}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="secondary" className="text-xs mb-1">{ca.level}</Badge>
                            <p className="text-sm font-semibold">{ca.name}</p>
                            <p className="text-xs text-muted-foreground">{ca.type} Certificate • Valid: {ca.valid}</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
