import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Receipt, TrendingUp } from "lucide-react";

export default function Finanzas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">
          Módulo AXIA · pagos Culqi · facturación SUNAT.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Wallet,
            title: "AXIA",
            desc: "Asistente financiero IA. Cierre mensual automático y forecast.",
          },
          {
            icon: Receipt,
            title: "SUNAT",
            desc: "Boletas y facturas electrónicas en formato peruano.",
          },
          {
            icon: TrendingUp,
            title: "Culqi",
            desc: "Pagos online con tarjeta · Yape · Plin.",
          },
        ].map((m) => (
          <Card key={m.title} className="bg-card">
            <CardContent className="p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <m.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Wallet className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Módulo en preparación</h2>
        <p className="text-muted-foreground max-w-md">
          La conexión con Culqi y SUNAT requiere credenciales productivas.
          Configurá las API keys en la fase de habilitación financiera para activar
          este módulo.
        </p>
      </div>
    </div>
  );
}
