import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, LogIn, UserPlus, ShieldCheck } from "lucide-react";
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

  const [tab, setTab] = useState<"cliente" | "registro" | "admin">("cliente");

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
        description: err instanceof Error ? err.message : "Verificá tus datos",
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
        description: "Usá al menos 8 caracteres.",
      });
      return;
    }
    if (regPassword !== regPassword2) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Volvé a escribir la confirmación.",
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
        description: "Bienvenido a AXYNTRAX. Explorá el catálogo de módulos.",
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
            <CardTitle>Acceso al portal</CardTitle>
            <CardDescription>
              Creá tu cuenta para activar y descargar los módulos. Cada módulo
              entrega su propia clave de licencia tras la aprobación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as typeof tab)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="cliente" data-testid="tab-cliente">
                  <LogIn className="h-4 w-4 mr-2" />
                  Ingresar
                </TabsTrigger>
                <TabsTrigger value="registro" data-testid="tab-registro">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrarme
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente">
                <form onSubmit={submitClientLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Correo electrónico</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      autoComplete="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                      data-testid="input-client-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPassword">Contraseña</Label>
                    <Input
                      id="clientPassword"
                      type="password"
                      autoComplete="current-password"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      required
                      data-testid="input-client-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                    data-testid="button-login-client"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Entrar a mi portal
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ¿Aún no tenés cuenta?{" "}
                    <button
                      type="button"
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={() => setTab("registro")}
                    >
                      Registrate acá
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="registro">
                <form onSubmit={submitRegister} className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="regFirstName">Nombres</Label>
                      <Input
                        id="regFirstName"
                        autoComplete="given-name"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        required
                        minLength={2}
                        data-testid="input-reg-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regLastName">Apellidos</Label>
                      <Input
                        id="regLastName"
                        autoComplete="family-name"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        required
                        minLength={2}
                        data-testid="input-reg-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Correo electrónico</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      data-testid="input-reg-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPhone">Celular</Label>
                    <Input
                      id="regPhone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+51 999 999 999"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      data-testid="input-reg-phone"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Contraseña</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={8}
                        data-testid="input-reg-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regPassword2">Confirmar</Label>
                      <Input
                        id="regPassword2"
                        type="password"
                        autoComplete="new-password"
                        value={regPassword2}
                        onChange={(e) => setRegPassword2(e.target.value)}
                        required
                        minLength={8}
                        data-testid="input-reg-password-2"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres. Usá una contraseña única.
                  </p>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                    data-testid="button-register"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Crear mi cuenta
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
                        autenticación.
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
