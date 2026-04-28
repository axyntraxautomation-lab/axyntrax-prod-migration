import { useState } from "react";
import {
  useSetupTwofa,
  useEnableTwofa,
  useDisableTwofa,
  getGetCurrentUserQueryKey,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, KeyRound, Loader2, X } from "lucide-react";

interface Props {
  enabled: boolean;
}

export function TwofaCard({ enabled }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [secret, setSecret] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const setupMut = useSetupTwofa();
  const enableMut = useEnableTwofa();
  const disableMut = useDisableTwofa();

  const startSetup = () => {
    setupMut.mutate(undefined, {
      onSuccess: (data) => {
        setSecret(data.secret);
        setQrUrl(data.qrCodeDataUrl);
        setCode("");
      },
      onError: () =>
        toast({
          variant: "destructive",
          title: "No se pudo iniciar 2FA",
          description: "Reintenta en unos instantes.",
        }),
    });
  };

  const confirmEnable = () => {
    if (!secret || code.length !== 6) return;
    enableMut.mutate(
      { data: { secret, code } },
      {
        onSuccess: () => {
          setSecret(null);
          setQrUrl(null);
          setCode("");
          queryClient.invalidateQueries({
            queryKey: getGetCurrentUserQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListUsersQueryKey(),
          });
          toast({
            title: "2FA activada",
            description:
              "Tu cuenta ahora pide código de 6 dígitos al iniciar sesión.",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Código inválido",
            description: "Verifica el código en tu app autenticadora.",
          }),
      },
    );
  };

  const confirmDisable = () => {
    if (disableCode.length !== 6) return;
    disableMut.mutate(
      { data: { code: disableCode } },
      {
        onSuccess: () => {
          setDisableCode("");
          queryClient.invalidateQueries({
            queryKey: getGetCurrentUserQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListUsersQueryKey(),
          });
          toast({
            title: "2FA desactivada",
            description: "Tu cuenta ya no requiere verificación de dos pasos.",
          });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Código inválido",
            description: "Verifica el código actual de tu app autenticadora.",
          }),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verificación en dos pasos (2FA)
          </span>
          {enabled ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">
              Activa
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Inactiva
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tu cuenta requiere un código de 6 dígitos de tu aplicación
              autenticadora cada vez que iniciás sesión. Para desactivar la
              verificación ingresa un código actual.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="disable2fa">Código actual</Label>
                <Input
                  id="disable2fa"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) =>
                    setDisableCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="000000"
                  className="font-mono tracking-[0.3em] text-center"
                />
              </div>
              <Button
                variant="destructive"
                onClick={confirmDisable}
                disabled={disableMut.isPending || disableCode.length !== 6}
              >
                {disableMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Desactivar 2FA
              </Button>
            </div>
          </div>
        ) : !secret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Protegé tu cuenta con un código de 6 dígitos generado por una app
              autenticadora (Google Authenticator, Authy, 1Password, Microsoft
              Authenticator, etc.).
            </p>
            <Button
              onClick={startSetup}
              disabled={setupMut.isPending}
              className="w-full sm:w-auto"
            >
              {setupMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Activar 2FA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="Código QR para 2FA"
                  className="h-44 w-44 rounded-md border border-border bg-white p-1"
                />
              )}
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Escanea el código QR con tu app autenticadora. Si no puedes
                  escanearlo, ingresa la clave manualmente:
                </p>
                <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                  {secret}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enable2fa">Código de verificación (6 dígitos)</Label>
              <Input
                id="enable2fa"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="font-mono tracking-[0.3em] text-center"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmEnable}
                disabled={enableMut.isPending || code.length !== 6}
              >
                {enableMut.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar y activar
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSecret(null);
                  setQrUrl(null);
                  setCode("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
