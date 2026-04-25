import {
  useGetCurrentUser,
  useListUsers,
  useLogout,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, BellOff, Loader2, LogOut, Shield, ShieldCheck, Users } from "lucide-react";
import { TwofaCard } from "@/components/twofa-card";
import { usePushNotifications } from "@/hooks/use-push";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: "bg-primary/15 text-primary border-primary/30",
    supervisor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    agente: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`uppercase text-[10px] ${map[role] ?? ""}`}>
      {role}
    </Badge>
  );
}

export default function Settings() {
  const { data: user, isLoading: loadingUser } = useGetCurrentUser();
  const { data: users, isLoading: loadingUsers } = useListUsers();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground">
          Cuenta personal · Equipo · Seguridad.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Mi cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUser || !user ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    {roleBadge(user.role)}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Miembro desde{" "}
                    {new Date(user.createdAt).toLocaleDateString("es-PE")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cerrá sesión en este dispositivo.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Equipo ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  {roleBadge(u.role)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TwofaCard enabled={!!user?.twofaEnabled} />

      <PushNotificationsCard />


      <Card className="border-dashed">
        <CardContent className="py-6 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Seguridad activa en esta fase
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sesión JWT en cookie HttpOnly (30 días, sameSite lax)</li>
            <li>Verificación 2FA TOTP por usuario (RFC 6238, 30s)</li>
            <li>Cifrado AES-256-GCM de teléfonos, notas y claves de licencia</li>
            <li>Contraseñas con bcrypt + control de acceso por roles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PushNotificationsCard() {
  const push = usePushNotifications();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificaciones push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!push.supported ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Tu navegador no soporta notificaciones push.
          </p>
        ) : push.subscribed ? (
          <p className="text-sm text-emerald-500">
            Push activado en este dispositivo. Recibirás alertas en tiempo real.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Recibí avisos de mensajes nuevos, pagos y eventos de Cecilia
              incluso con la pestaña cerrada.
            </p>
            <Button
              onClick={push.enable}
              disabled={push.loading}
              data-testid="button-enable-push"
            >
              {push.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Activar notificaciones
            </Button>
            {push.permission === "denied" && (
              <p className="text-xs text-amber-500">
                Las notificaciones están bloqueadas a nivel de navegador.
                Habilítalas en la configuración del sitio para continuar.
              </p>
            )}
          </>
        )}
        {push.error && (
          <p className="text-xs text-red-500">Error: {push.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
