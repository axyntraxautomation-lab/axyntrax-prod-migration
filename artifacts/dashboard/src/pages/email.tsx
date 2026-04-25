import { Card, CardContent } from "@/components/ui/card";
import { Mail, Bot, Inbox } from "lucide-react";

export default function Email() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email · Cecilia</h1>
        <p className="text-muted-foreground">
          Automatización de Gmail con IA. Clasificación, respuesta y seguimiento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Inbox, title: "Bandeja Gmail", desc: "Sincronización de correos entrantes y salientes." },
          { icon: Bot, title: "Cecilia (IA)", desc: "Lee, clasifica y responde correos automáticamente." },
          { icon: Mail, title: "Plantillas", desc: "Respuestas tipo y secuencias de seguimiento." },
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
          <Bot className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Cecilia se está entrenando</h2>
        <p className="text-muted-foreground max-w-md">
          La conexión OAuth con Gmail se activará en la fase de despliegue de
          automatización de email. Mientras tanto, Cecilia se entrena con tu
          historial de respuestas.
        </p>
      </div>
    </div>
  );
}
