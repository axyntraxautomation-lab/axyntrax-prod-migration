import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListUsersQueryKey,
  type User,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldOff,
  UserCog,
  Users,
} from "lucide-react";

type Role = "admin" | "supervisor" | "agente";

interface Props {
  users: User[] | undefined;
  loading: boolean;
  currentUserId: number;
}

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

async function jsonRequest(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<unknown> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function TeamManagementCard({ users, loading, currentUserId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [roleSelection, setRoleSelection] = useState<Role>("agente");
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);

  const [twofaTarget, setTwofaTarget] = useState<User | null>(null);

  const [pwdTarget, setPwdTarget] = useState<User | null>(null);
  const [pwdValue, setPwdValue] = useState("");
  const [pwdConfirmOpen, setPwdConfirmOpen] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);

  const [pendingAction, setPendingAction] = useState<
    null | "role" | "twofa" | "password"
  >(null);

  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });

  const openRoleDialog = (u: User) => {
    setRoleTarget(u);
    setRoleSelection(u.role as Role);
    setRoleConfirmOpen(false);
  };

  const handleChangeRole = async () => {
    if (!roleTarget) return;
    setPendingAction("role");
    try {
      await jsonRequest(`/api/users/${roleTarget.id}/role`, {
        method: "PATCH",
        json: { role: roleSelection },
      });
      toast({
        title: "Rol actualizado",
        description: `${roleTarget.name} ahora es ${roleSelection}.`,
      });
      await refreshList();
      setRoleTarget(null);
      setRoleConfirmOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo cambiar el rol",
        description: err instanceof Error ? err.message : "Error desconocido.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDisableTwofa = async () => {
    if (!twofaTarget) return;
    setPendingAction("twofa");
    try {
      await jsonRequest(`/api/admin/users/${twofaTarget.id}/disable-twofa`, {
        method: "POST",
      });
      toast({
        title: "2FA desactivada",
        description: `Se reseteó la verificación en dos pasos de ${twofaTarget.name}.`,
      });
      await refreshList();
      setTwofaTarget(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo resetear el 2FA",
        description: err instanceof Error ? err.message : "Error desconocido.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (!pwdTarget) return;
    setPendingAction("password");
    try {
      await jsonRequest(`/api/admin/users/${pwdTarget.id}/reset-password`, {
        method: "POST",
        json: { newPassword: pwdValue },
      });
      toast({
        title: "Contraseña reseteada",
        description: `La nueva contraseña de ${pwdTarget.name} ya está activa. Compártela por un canal seguro.`,
      });
      await refreshList();
      setPwdTarget(null);
      setPwdValue("");
      setPwdConfirmOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo resetear la contraseña",
        description: err instanceof Error ? err.message : "Error desconocido.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestión de equipo ({users?.length ?? 0})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cambia roles, resetea la verificación en dos pasos o asigna una
            contraseña nueva. Las acciones sobre administradores disparan
            alertas de seguridad.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando equipo…</p>
          ) : !users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    data-testid={`team-row-${u.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-foreground text-xs">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{u.name}</p>
                          {roleBadge(u.role)}
                          {u.twofaEnabled ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            >
                              2FA
                            </Badge>
                          ) : null}
                          {isSelf ? (
                            <Badge variant="outline" className="text-[10px]">
                              Vos
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRoleDialog(u)}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "No puedes cambiar tu propio rol"
                            : "Cambiar rol"
                        }
                        data-testid={`button-change-role-${u.id}`}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Cambiar rol
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTwofaTarget(u)}
                        disabled={!u.twofaEnabled}
                        title={
                          u.twofaEnabled
                            ? "Desactivar 2FA del usuario"
                            : "El usuario no tiene 2FA activo"
                        }
                        data-testid={`button-reset-twofa-${u.id}`}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Resetear 2FA
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPwdTarget(u);
                          setPwdValue("");
                          setPwdConfirmOpen(false);
                        }}
                        data-testid={`button-reset-password-${u.id}`}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Resetear contraseña
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change role dialog */}
      <Dialog
        open={!!roleTarget && !roleConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              {roleTarget ? (
                <>
                  Vas a cambiar el rol de{" "}
                  <span className="font-semibold text-foreground">
                    {roleTarget.name}
                  </span>{" "}
                  ({roleTarget.email}).
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role-select">Nuevo rol</Label>
            <Select
              value={roleSelection}
              onValueChange={(v) => setRoleSelection(v as Role)}
            >
              <SelectTrigger id="role-select" data-testid="select-role-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="supervisor">supervisor</SelectItem>
                <SelectItem value="agente">agente</SelectItem>
              </SelectContent>
            </Select>
            {roleTarget && roleSelection === "admin" &&
              roleTarget.role !== "admin" && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Promover a admin disparará una alerta de seguridad al equipo.
                </p>
              )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => setRoleConfirmOpen(true)}
              disabled={
                !roleTarget ||
                roleSelection === (roleTarget?.role as Role) ||
                pendingAction === "role"
              }
              data-testid="button-confirm-role-step1"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={roleConfirmOpen}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "role") setRoleConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas el cambio de rol?</AlertDialogTitle>
            <AlertDialogDescription>
              {roleTarget ? (
                <>
                  El rol de{" "}
                  <span className="font-semibold text-foreground">
                    {roleTarget.name}
                  </span>{" "}
                  pasará de{" "}
                  <span className="font-mono">{roleTarget.role}</span> a{" "}
                  <span className="font-mono">{roleSelection}</span>. La acción
                  queda registrada en la bitácora.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "role"}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleChangeRole();
              }}
              disabled={pendingAction === "role"}
              data-testid="button-confirm-role-final"
            >
              {pendingAction === "role" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cambiar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA dialog */}
      <AlertDialog
        open={!!twofaTarget}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "twofa") setTwofaTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Resetear 2FA del usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {twofaTarget ? (
                <>
                  Se va a desactivar la verificación en dos pasos de{" "}
                  <span className="font-semibold text-foreground">
                    {twofaTarget.name}
                  </span>{" "}
                  ({twofaTarget.email}). Va a poder iniciar sesión solo con su
                  contraseña hasta que vuelva a configurar 2FA.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "twofa"}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDisableTwofa();
              }}
              disabled={pendingAction === "twofa"}
              data-testid="button-confirm-twofa"
            >
              {pendingAction === "twofa" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Resetear 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password dialog */}
      <Dialog
        open={!!pwdTarget && !pwdConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPwdTarget(null);
            setPwdValue("");
            setPwdVisible(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
            <DialogDescription>
              {pwdTarget ? (
                <>
                  Asigna una contraseña nueva para{" "}
                  <span className="font-semibold text-foreground">
                    {pwdTarget.name}
                  </span>{" "}
                  ({pwdTarget.email}). Tendrá que cambiarla cuando inicie
                  sesión.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-password-input">
              Nueva contraseña (mínimo 8 caracteres)
            </Label>
            <div className="relative">
              <Input
                id="reset-password-input"
                type={pwdVisible ? "text" : "password"}
                autoComplete="new-password"
                value={pwdValue}
                onChange={(e) => setPwdValue(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
                data-testid="input-reset-password"
              />
              <button
                type="button"
                onClick={() => setPwdVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  pwdVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                data-testid="button-toggle-password-visibility"
              >
                {pwdVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartila por un canal seguro (no por correo en claro).
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPwdTarget(null);
                setPwdValue("");
                setPwdVisible(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setPwdConfirmOpen(true)}
              disabled={pwdValue.length < 8 || pendingAction === "password"}
              data-testid="button-reset-password-step1"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pwdConfirmOpen}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "password") setPwdConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Confirmas el reseteo de contraseña?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pwdTarget ? (
                <>
                  La contraseña de{" "}
                  <span className="font-semibold text-foreground">
                    {pwdTarget.name}
                  </span>{" "}
                  va a quedar reemplazada al instante. Quien la conozca podrá
                  iniciar sesión hasta que el usuario la cambie.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "password"}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}
              disabled={pendingAction === "password"}
              data-testid="button-confirm-reset-password"
            >
              {pendingAction === "password" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Resetear contraseña
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
