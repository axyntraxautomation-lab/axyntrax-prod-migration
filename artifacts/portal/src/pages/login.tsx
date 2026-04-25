import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { portalApi, PortalApiError } from "@/lib/portal-api";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setSession } = useAuth();

  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [requiresTwofa, setRequiresTwofa] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const s = await portalApi.loginLicense(licenseKey.trim());
      setSession(s);
      setLocation("/mis-modulos");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No pudimos iniciar sesión",
        description: err instanceof Error ? err.message : "Verificá la licencia",
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
          description: "Ingresá el código de tu app de autenticación.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Credenciales inválidas",
          description: err instanceof Error ? err.message : "Reintentá",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <img
            src={`${import.meta.env.BASE_URL}axyntrax-logo.jpeg`}
            alt="AXYNTRAX"
            className="h-14 w-14 rounded-lg object-cover mb-3"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            AXYNTRAX AUTOMATION
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Portal de clientes y administración
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Elegí tu tipo de acceso. Los clientes ingresan con la licencia
              entregada por AXYNTRAX. El equipo interno usa correo y contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cliente" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="cliente" data-testid="tab-cliente">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Administración
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente">
                <form onSubmit={submitLicense} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseKey">Clave de licencia</Label>
                    <Input
                      id="licenseKey"
                      autoComplete="off"
                      placeholder="AXY-XXXX-XXXX-XXXX"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      required
                      data-testid="input-license-key"
                    />
                    <p className="text-xs text-muted-foreground">
                      Si todavía no tenés clave, escribinos a
                      contacto@axyntrax-automation.com.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                    data-testid="button-login-license"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Ingresar al portal
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={submitAdmin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  {requiresTwofa && (
                    <div className="space-y-2">
                      <Label htmlFor="twofaCode">Código de verificación</Label>
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
                        data-testid="input-twofa-code"
                      />
                      <p className="text-xs text-muted-foreground">
                        Ingresá el código de 6 dígitos de tu app de
                        autenticación (Google Authenticator, 1Password, etc.).
                      </p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                    data-testid="button-login-admin"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {requiresTwofa
                      ? "Verificar código y entrar"
                      : "Acceder a administración"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AXYNTRAX AUTOMATION · Arequipa, Perú
        </p>
      </div>
    </div>
  );
}
