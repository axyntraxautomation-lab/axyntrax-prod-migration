import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Lock,
  Cpu,
  Radar,
  ArrowRight,
  Mail,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { BlueprintBackdrop } from "@/components/ui/blueprint-backdrop";
import { JarvisAvatar } from "@/components/ui/jarvis-avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

interface LoginErrorPayload {
  error?: string;
  requiresTwofa?: boolean;
  requiresTwofaSetup?: boolean;
  secret?: string;
  otpauth?: string;
  qrDataUrl?: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [twofaRequired, setTwofaRequired] = useState(false);
  const [twofaSetup, setTwofaSetup] = useState<{
    secret: string;
    qrDataUrl: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState<{ sentTo: string } | null>(
    null,
  );

  const requestEmailOtp = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description:
          "Vuelve al primer paso e ingresa tu correo y contraseña primero.",
      });
      return;
    }
    setSendingEmailOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/2fa/email/request`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sentTo?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast({
          variant: "destructive",
          title: "No se pudo enviar el código",
          description: data.error ?? "Reintenta en un momento.",
        });
        return;
      }
      setEmailOtpSent({ sentTo: data.sentTo ?? email });
      setTwofaCode("");
      toast({
        title: "Código enviado",
        description: `Revisa tu bandeja en ${data.sentTo ?? email}. El código vence en 10 minutos.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo contactar al servidor. Reintenta.",
      });
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(twofaRequired || twofaSetup ? { twofaCode } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as LoginErrorPayload;
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/");
        return;
      }
      if (data.requiresTwofaSetup) {
        if (data.secret && data.qrDataUrl) {
          setTwofaSetup({ secret: data.secret, qrDataUrl: data.qrDataUrl });
          setTwofaRequired(false);
          toast({
            title: "JARVIS exige doble factor",
            description:
              "Escanea el QR con Google Authenticator o Authy y envía el primer código.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Código 2FA inválido",
            description: data.error ?? "Reintenta con el código actual.",
          });
        }
        return;
      }
      if (data.requiresTwofa) {
        setTwofaRequired(true);
        setTwofaSetup(null);
        toast({
          title: "Verificación 2FA requerida",
          description:
            "Ingresa el código de 6 dígitos de tu app autenticadora.",
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description:
          data.error ?? "Credenciales incorrectas. Verifica los datos.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo contactar al servidor. Reintenta.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inSecondPhase = twofaRequired || !!twofaSetup;
  const inputCls =
    "h-11 rounded-xl border-white/10 bg-white/[0.04] text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/40 focus-visible:ring-cyan-400/20";

  return (
    <BlueprintBackdrop
      intensity="vivid"
      animated
      className="min-h-[100dvh] w-full"
    >
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {/* Top status bar */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            Cabina JARVIS · acceso restringido
          </div>
          <StatusPill tone="violet" size="sm">
            AXYNTRAX OS · v1.2
          </StatusPill>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-[460px]">
            {/* Header dramático con avatar pulsante */}
            <div className="mb-7 flex flex-col items-center text-center">
              <JarvisAvatar size="xl" pulse />
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
                <span className="gradient-text-cyan-violet">JARVIS</span>
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.34em] text-cyan-300">
                IA AXYNTRAX
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
                Centro de mando interno. Solo personal autorizado con doble
                factor activo.
              </p>
            </div>

            <GlassCard tone="strong" border="gradient" className="p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-2.5">
                {twofaSetup ? (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-200">
                      <ShieldAlert className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-display text-base font-semibold text-slate-50">
                        Configura doble factor
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Obligatorio para entrar a JARVIS
                      </div>
                    </div>
                  </>
                ) : twofaRequired ? (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-display text-base font-semibold text-slate-50">
                        Verificación 2FA
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Ingresa el código de 6 dígitos
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                      <Lock className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-display text-base font-semibold text-slate-50">
                        Acceso a JARVIS
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Iniciá sesión con tus credenciales
                      </div>
                    </div>
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!inSecondPhase && (
                  <>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                      >
                        Correo electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@axyntrax.com"
                        required
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                      >
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={inputCls}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                )}

                {twofaSetup && (
                  <div className="space-y-3 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.04] p-4">
                    <div className="flex justify-center">
                      <div className="rounded-2xl bg-white p-3 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.4)]">
                        <img
                          src={twofaSetup.qrDataUrl}
                          alt="Código QR para doble factor"
                          className="h-44 w-44"
                        />
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-slate-400">
                      Si no puedes escanear, usa esta clave secreta:
                    </p>
                    <p className="break-all text-center font-mono text-sm font-semibold tracking-widest text-cyan-200">
                      {twofaSetup.secret}
                    </p>
                  </div>
                )}

                {inSecondPhase && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="twofa"
                        className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                        Código de 6 dígitos
                      </Label>
                      <Input
                        id="twofa"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={twofaCode}
                        onChange={(e) =>
                          setTwofaCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="000000"
                        required
                        autoFocus
                        className={cn(
                          inputCls,
                          "text-center font-mono text-xl tracking-[0.4em]",
                        )}
                      />
                      <p className="text-[11px] text-slate-500">
                        Cuenta:{" "}
                        <span className="font-mono text-slate-300">{email}</span>
                      </p>
                    </div>

                    {twofaRequired && !twofaSetup && (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3">
                        {emailOtpSent ? (
                          <div className="space-y-2 text-center">
                            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                              <Mail className="h-3.5 w-3.5" />
                              Código enviado a {emailOtpSent.sentTo}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Revisa tu bandeja (incluye spam). Vence en 10 min.
                            </p>
                            <button
                              type="button"
                              onClick={requestEmailOtp}
                              disabled={sendingEmailOtp}
                              className="text-[11px] font-medium text-cyan-300 underline-offset-4 hover:underline disabled:opacity-50"
                            >
                              {sendingEmailOtp
                                ? "Reenviando..."
                                : "Reenviar código por correo"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center">
                            <p className="text-[11px] text-slate-400">
                              ¿No tienes acceso a tu app autenticadora?
                            </p>
                            <button
                              type="button"
                              onClick={requestEmailOtp}
                              disabled={sendingEmailOtp}
                              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200 disabled:opacity-50"
                            >
                              {sendingEmailOtp ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Mail className="h-3.5 w-3.5" />
                              )}
                              Recibir código por correo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <GradientButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={
                    submitting || (inSecondPhase && twofaCode.length !== 6)
                  }
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {twofaSetup
                    ? "Activar doble factor e ingresar"
                    : twofaRequired
                      ? "Verificar y entrar"
                      : "Iniciar sesión"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </GradientButton>

                {inSecondPhase && (
                  <GradientButton
                    type="button"
                    variant="ghost"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setTwofaRequired(false);
                      setTwofaSetup(null);
                      setTwofaCode("");
                      setEmailOtpSent(null);
                    }}
                  >
                    Cancelar
                  </GradientButton>
                )}
              </form>

              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/5 pt-5 text-center">
                {[
                  { icon: Cpu, label: "Núcleo IA" },
                  { icon: Radar, label: "Telemetría" },
                  { icon: Lock, label: "AES-256" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2.5"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Wallet className="h-3 w-3 text-cyan-300" />
                Depósitos Yape · Miguel Montero ·{" "}
                <span className="font-mono font-semibold text-slate-300">
                  991 740 590
                </span>
              </div>
            </GlassCard>
          </div>
        </div>

        <footer className="px-6 py-5 text-center text-[10px] text-slate-500 sm:px-10">
          <div>
            Miguel Montero — Fundador & CEO · www.axyntrax-automation.net · +51 991
            740 590
          </div>
          <div className="mt-1 font-mono uppercase tracking-[0.18em]">
            JARVIS · © 2026 AXYNTRAX AUTOMATION
          </div>
        </footer>
      </div>
    </BlueprintBackdrop>
  );
}
