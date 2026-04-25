import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, ShieldAlert, Wallet } from "lucide-react";

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
              "Escaneá el QR con Google Authenticator o Authy y enviá el primer código.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Código 2FA inválido",
            description: data.error ?? "Reintentá con el código actual.",
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
            "Ingresá el código de 6 dígitos de tu app autenticadora.",
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description:
          data.error ?? "Credenciales incorrectas. Verificá los datos.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo contactar al servidor. Reintentá.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inSecondPhase = twofaRequired || !!twofaSetup;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/axyntrax-logo.jpeg"
            alt="AXYNTRAX AUTOMATION"
            className="h-16 mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            JARVIS
          </h1>
          <p className="text-xs uppercase tracking-[0.4em] text-primary mt-1">
            IA AXYNTRAX
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Cabina de mando — solo personal autorizado
          </p>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {twofaSetup ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Configurá doble factor
                </>
              ) : twofaRequired ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Verificación de dos pasos
                </>
              ) : (
                "Acceso a JARVIS"
              )}
            </CardTitle>
            <CardDescription>
              {twofaSetup
                ? "JARVIS exige doble factor obligatorio. Escaneá este QR con Google Authenticator, Authy o 1Password y enviá el primer código de 6 dígitos."
                : twofaRequired
                  ? "Ingresá el código de 6 dígitos de tu aplicación de autenticación."
                  : "Ingresá tus credenciales para iniciar sesión en JARVIS."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!inSecondPhase && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@axyntrax.com"
                      required
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-input"
                    />
                  </div>
                </>
              )}

              {twofaSetup && (
                <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="flex justify-center">
                    <img
                      src={twofaSetup.qrDataUrl}
                      alt="Código QR para doble factor"
                      className="h-44 w-44 bg-white p-2 rounded-md"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Si no podés escanear, usá esta clave secreta:
                  </p>
                  <p className="text-center font-mono text-sm tracking-widest break-all">
                    {twofaSetup.secret}
                  </p>
                </div>
              )}

              {inSecondPhase && (
                <div className="space-y-2">
                  <Label htmlFor="twofa" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
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
                      setTwofaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    required
                    autoFocus
                    className="bg-input text-center text-lg tracking-[0.4em] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuenta:{" "}
                    <span className="text-foreground">{email}</span>
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  submitting ||
                  (inSecondPhase && twofaCode.length !== 6)
                }
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : twofaSetup ? (
                  "Activar doble factor e ingresar"
                ) : twofaRequired ? (
                  "Verificar"
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              {inSecondPhase && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setTwofaRequired(false);
                    setTwofaSetup(null);
                    setTwofaCode("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 text-xs text-muted-foreground opacity-80">
            <div className="flex items-center gap-2 text-foreground/80">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <span>Depósitos Yape · Miguel Montero ·</span>
              <span className="font-mono font-semibold">991 740 590</span>
            </div>
            <div>Acceso restringido — solo personal autorizado.</div>
          </CardFooter>
        </Card>
      </div>

      <footer className="absolute bottom-0 w-full p-4 text-center text-xs text-muted-foreground">
        <div>
          Miguel Montero — Fundador & CEO · axyntrax-automation.com · +51 991 740 590
        </div>
        <div className="mt-1">JARVIS · © 2026 AXYNTRAX AUTOMATION</div>
      </footer>
    </div>
  );
}
