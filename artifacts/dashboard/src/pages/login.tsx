import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation("/");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "Credenciales incorrectas. Verificá los datos e intentá de nuevo.",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/axyntrax-logo.jpeg" alt="AXYNTRAX AUTOMATION" className="h-16 mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AXYNTRAX AUTOMATION</h1>
          <p className="text-muted-foreground text-sm">Automatización con IA para PyMEs</p>
        </div>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Acceso al Sistema</CardTitle>
            <CardDescription>Ingresá tus credenciales para acceder a la cabina de mando.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
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
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-muted-foreground opacity-50">
            Acceso restringido — solo personal autorizado.
          </CardFooter>
        </Card>
      </div>

      <footer className="absolute bottom-0 w-full p-4 text-center text-xs text-muted-foreground">
        <div>Miguel Montero — Fundador & CEO · axyntrax-automation.com · +51 991 740 590</div>
        <div className="mt-1">© 2026 AXYNTRAX AUTOMATION</div>
      </footer>
    </div>
  );
}
