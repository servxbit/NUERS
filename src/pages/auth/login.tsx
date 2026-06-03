import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "@/components/layouts/auth-shell";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);

  return (
    <AuthShell
      eyebrow="Role-based portal access"
      title="Welcome back"
      description="Sign in once and NUERS opens the correct dashboard for your Super Admin, BIR, Business Account, or Client role."
      heroTitle="Secure access for national revenue operations"
      heroDescription="NUERS centralizes electronic official receipts, revenue collection, compliance monitoring, and audit visibility across government and regulated institutions."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </>
      }
    >
      {!showMfa ? (
        <LoginForm showPassword={showPassword} setShowPassword={setShowPassword} />
      ) : (
        <Card className="rounded-lg border-slate-200">
          <CardContent className="p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Enter the code from your authenticator app</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Input key={i} maxLength={1} className="h-12 text-center text-lg font-bold" />
              ))}
            </div>
            <Button className="mt-6 h-11 w-full">Verify code</Button>
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setShowMfa(false)}>
              Back to login
            </Button>
          </CardContent>
        </Card>
      )}
    </AuthShell>
  );
}

function LoginForm({
  showPassword,
  setShowPassword,
}: {
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error, role } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      if (role === "merchant") navigate("/merchant");
      else if (role === "consumer" || role === "client") navigate("/client");
      else if (role === "bir") navigate("/bir");
      else navigate("/super-admin");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className="h-11 pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="h-11 pl-10 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="h-11 w-full bg-[#082844] text-white hover:bg-[#0b3559]" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] text-slate-500">
        <span className="rounded-md bg-slate-50 px-2 py-2">MFA ready</span>
        <span className="rounded-md bg-slate-50 px-2 py-2">RBAC secured</span>
        <span className="rounded-md bg-slate-50 px-2 py-2">Audit logged</span>
      </div>
    </form>
  );
}
