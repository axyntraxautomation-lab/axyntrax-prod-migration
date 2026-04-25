// Placeholder content for simple pages
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bot, AlertCircle } from "lucide-react";

export default function Inbox() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bandeja Unificada</h1>
        <p className="text-muted-foreground">Centro de mensajes de todos los canales.</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <MessageSquare className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Conectores en Fase de Despliegue</h2>
        <p className="text-muted-foreground max-w-md">
          La integración omnicanal (Web, Facebook, Instagram, WhatsApp, Email) será activada en el próximo ciclo de actualización. 
          Los agentes de AXYN CORE están preparando los webhooks.
        </p>
      </div>
    </div>
  );
}
