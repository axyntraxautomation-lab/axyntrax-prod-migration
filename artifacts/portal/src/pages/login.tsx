import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Loader2,
  LogIn,
  UserPlus,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Bot,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { portalApi, PortalApiError } from "@/lib/portal-api";
import { useAuth } from "@/lib/auth-context";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { BlueprintBackdrop } from "@/components/ui/blueprint-backdrop";
import { StatusPill } from "@/components/ui/status-pill";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setSession } = useAuth();

  const initialTab: "cliente" | "registro" | "admin" = (() => {
    if (typeof window === "undefined") return "cliente";
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "register" || t === "registro") return "registro";
    if (t === "admin") return "admin";
    return "cliente";
  })();
  const [tab, setTab] = useState<"cliente" | "registro" | "admin">(initialTab);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "register" || t === "registro") setTab("registro");
    else if (t === "admin") setTab("admin");
  }, []);

  // Cliente login
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");

  // Registro
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  // Admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [requiresTwofa, setRequiresTwofa] = useState(false);

  const [busy, setBusy] = useState(false);

  const submitClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const s = await portalApi.loginClient(clientEmail.trim(), clientPassword);
      setSession(s);
      setLocation("/mis-modulos");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No pudimos iniciar sesión",
        description: err instanceof Error ? err.message : "Verifica tus datos",
      });
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Contraseña muy corta",
        description: "Usa al menos 8 caracteres.",
      });
      return;
    }
    if (regPassword !== regPassword2) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Vuelve a escribir la confirmación.",
      });
      return;
    }
    setBusy(true);
    try {
      const s = await portalApi.register({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      setSession(s);
      toast({
        title: "Cuenta creada",
        description: "Bienvenido a AXYNTRAX. Explora el catálogo de módulos.",
      });
      setLocation("/catalogo");
    } catch (err) {
      const msg =
        err instanceof PortalApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No pudimos crear la cuenta";
      toast({
        variant: "destructive",
        title: "Registro rechazado",
        description: msg,
      });
    } finally {
      setBusy(false);
    }
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const code = requiresTwofa ? twofaCode.trim() : undefined;
      const s = await portalApi.loginAdmin(email.trim(), password, code);
      setSession(s);
      setRequiresTwofa(false);
      setTwofaCode("");
      setLocation("/admin");
    } catch (err) {
      if (
        err instanceof PortalApiError &&
        err.status === 401 &&
        typeof err.data === "object" &&
        err.data &&
        (err.data as { requiresTwofa?: boolean }).requiresTwofa
      ) {
        setRequiresTwofa(true);
        toast({
          title: "Verificación 2FA",
          description: "Ingresa el código de tu app de autenticación.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Credenciales inválidas",
          description: err instanceof Error ? err.message : "Reintenta",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "h-11 rounded-xl border-white/10 bg-white/[0.04] text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute left-0 right-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-200"
            data-testid="link-home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio
          </Link>
          <StatusPill tone="info" size="sm">
            AXYNTRAX OS · sesión segura
          </StatusPill>
        </div>
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1fr_minmax(0,520px)]">
        {/* Panel izquierdo: branding inmersivo */}
        <BlueprintBackdrop intensity="vivid" animated className="hidden lg:flex">
          <div className="relative flex h-full w-full items-center justify-center px-12">
            <div className="max-w-md space-y-8">
              <div className="flex items-center gap-4">
                <BrandLogo size="xl" />
                <div className="leading-tight">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                    Automation OS · Arequipa
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <h2 className="font-display text-4xl font-semibold leading-tight text-slate-50">
                  Bienvenido al{" "}
                  <span className="gradient-text-cyan-violet">
                    centro de mando
                  </span>{" "}
                  de tu negocio.
                </h2>
                <p className="text-base leading-relaxed text-slate-400">
                  Activa módulos, genera cotizaciones formales y deja que JARVIS
                  responda a tus clientes 24/7 desde un solo panel.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Bot, text: "JARVIS cotiza y atiende automáticamente" },
                  { icon: CheckCircle2, text: "Demos gratuitas por 30 días sin tarjeta" },
                  { icon: Lock, text: "Cifrado AES-256-GCM y 2FA en administración" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <Sparkles className="h-3 w-3 text-cyan-300" />
                Operaciones IA · Arequipa, Perú
              </div>
            </div>
          </div>
        </BlueprintBackdrop>

        {/* Panel derecho: card de auth */}
        <div className="relative flex items-center justify-center px-4 py-20 sm:px-8 lg:py-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute inset-0 bg-blueprint opacity-50" />
            <div className="absolute inset-0 bg-mesh-cyan opacity-60" />
          </div>
          <div className="relative w-full max-w-[440px]">
            {/* Logo móvil */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <BrandLogo size="lg" />
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-300">
                Automation OS · Arequipa
              </p>
            </div>

            <GlassCard tone="strong" border="gradient" className="p-6 sm:p-8">
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-semibold text-slate-50">
                  Acceso al portal
                </h2>
                <p className="text-sm text-slate-400">
                  Crea tu cuenta para activar y descargar los módulos. Cada
                  módulo entrega su propia clave de licencia tras la aprobación.
                </p>
              </div>

              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as typeof tab)}
                className="mt-6 w-full"
              >
                <TabsList className="grid w-full grid-cols-3 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  {[
                    { value: "cliente", icon: LogIn, label: "Ingresar", testId: "tab-cliente" },
                    { value: "registro", icon: UserPlus, label: "Registrarme", testId: "tab-registro" },
                    { value: "admin", icon: ShieldCheck, label: "Admin", testId: "tab-admin" },
                  ].map(({ value, icon: Icon, label, testId }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      data-testid={testId}
                      className={cn(
                        "rounded-lg text-xs font-medium text-slate-400 transition-all",
                        "data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/15",
                        "data-[state=active]:text-cyan-100 data-[state=active]:shadow-[inset_0_0_18px_rgba(34,211,238,0.15)]",
                      )}
                    >
                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="cliente" className="mt-6">
                  <form onSubmit={submitClientLogin} className="space-y-4">
                    <FieldGroup
                      id="clientEmail"
                      label="Correo electrónico"
                      input={
                        <Input
                          id="clientEmail"
                          type="email"
                          autoComplete="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          required
                          className={inputCls}
                          placeholder="tu@empresa.com"
                          data-testid="input-client-email"
                        />
                      }
                    />
                    <FieldGroup
                      id="clientPassword"
                      label="Contraseña"
                      input={
                        <Input
                          id="clientPassword"
                          type="password"
                          autoComplete="current-password"
                          value={clientPassword}
                          onChange={(e) => setClientPassword(e.target.value)}
                          required
                          className={inputCls}
                          placeholder="••••••••"
                          data-testid="input-client-password"
                        />
                      }
                    />
                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={busy}
                      data-testid="button-login-client"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Entrar a mi portal
                    </GradientButton>
                    <p className="pt-1 text-center text-xs text-slate-400">
                      ¿Aún no tienes cuenta?{" "}
                      <button
                        type="button"
                        className="font-medium text-cyan-300 underline-offset-2 transition-colors hover:text-cyan-200 hover:underline"
                        onClick={() => setTab("registro")}
                      >
                        Registrate acá
                      </button>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="registro" className="mt-6">
                  <form onSubmit={submitRegister} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldGroup
                        id="regFirstName"
                        label="Nombres"
                        input={
                          <Input
                            id="regFirstName"
                            autoComplete="given-name"
                            value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
                            required
                            minLength={2}
                            className={inputCls}
                            data-testid="input-reg-first-name"
                          />
                        }
                      />
                      <FieldGroup
                        id="regLastName"
                        label="Apellidos"
                        input={
                          <Input
                            id="regLastName"
                            autoComplete="family-name"
                            value={regLastName}
                            onChange={(e) => setRegLastName(e.target.value)}
                            required
                            minLength={2}
                            className={inputCls}
                            data-testid="input-reg-last-name"
                          />
                        }
                      />
                    </div>
                    <FieldGroup
                      id="regEmail"
                      label="Correo electrónico"
                      input={
                        <Input
                          id="regEmail"
                          type="email"
                          autoComplete="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          className={inputCls}
                          placeholder="tu@empresa.com"
                          data-testid="input-reg-email"
                        />
                      }
                    />
                    <FieldGroup
                      id="regPhone"
                      label="Celular"
                      input={
                        <Input
                          id="regPhone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+51 999 999 999"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          required
                          className={inputCls}
                          data-testid="input-reg-phone"
                        />
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FieldGroup
                        id="regPassword"
                        label="Contraseña"
                        input={
                          <Input
                            id="regPassword"
                            type="password"
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            minLength={8}
                            className={inputCls}
                            data-testid="input-reg-password"
                          />
                        }
                      />
                      <FieldGroup
                        id="regPassword2"
                        label="Confirmar"
                        input={
                          <Input
                            id="regPassword2"
                            type="password"
                            autoComplete="new-password"
                            value={regPassword2}
                            onChange={(e) => setRegPassword2(e.target.value)}
                            required
                            minLength={8}
                            className={inputCls}
                            data-testid="input-reg-password-2"
                          />
                        }
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mínimo 8 caracteres. Usa una contraseña única.
                    </p>
                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={busy}
                      data-testid="button-register"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Crear mi cuenta
                    </GradientButton>
                  </form>
                </TabsContent>

                <TabsContent value="admin" className="mt-6">
                  <form onSubmit={submitAdmin} className="space-y-4">
                    <FieldGroup
                      id="email"
                      label="Correo"
                      input={
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={inputCls}
                          placeholder="admin@axyntrax-automation.net"
                          data-testid="input-email"
                        />
                      }
                    />
                    <FieldGroup
                      id="password"
                      label="Contraseña"
                      input={
                        <Input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={inputCls}
                          placeholder="••••••••"
                          data-testid="input-password"
                        />
                      }
                    />
                    {requiresTwofa && (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-300" />
                          <span className="font-display text-sm font-semibold text-slate-100">
                            Verificación 2FA
                          </span>
                        </div>
                        <FieldGroup
                          id="twofaCode"
                          label="Código de verificación"
                          input={
                            <Input
                              id="twofaCode"
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder="123456"
                              value={twofaCode}
                              onChange={(e) =>
                                setTwofaCode(e.target.value.replace(/\D/g, ""))
                              }
                              required
                              autoFocus
                              className={cn(inputCls, "text-center font-mono text-lg tracking-[0.4em]")}
                              data-testid="input-twofa-code"
                            />
                          }
                          hint="Ingresa el código de 6 dígitos de tu app de autenticación."
                        />
                      </div>
                    )}
                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={busy}
                      data-testid="button-login-admin"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {requiresTwofa
                        ? "Verificar código y entrar"
                        : "Acceder a administración"}
                    </GradientButton>
                  </form>
                </TabsContent>
              </Tabs>
            </GlassCard>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              AXYNTRAX AUTOMATION · Arequipa, Perú · v1.2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  id,
  label,
  input,
  hint,
}: {
  id: string;
  label: string;
  input: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
      </Label>
      {input}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
