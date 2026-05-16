import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Factory, Plus, CheckCircle2 } from 'lucide-react';

export default function MatrixPage() {
  const recentProjects = [
    { client: "Clínica San Gabriel", type: "Diseño Web + IA", budget: "S/ 1,200", status: "Generando Diseños" },
    { client: "Restaurant Delivery Express", type: "Automatización WhatsApp", budget: "S/ 799", status: "Esperando Aprobación" },
    { client: "Condominio Los Portales", type: "Dashboard Residencial", budget: "S/ 2,400", status: "Propuestas Enviadas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Factory className="h-8 w-8 text-purple-400" /> Fábrica MATRIX
          </h1>
          <p className="text-gray-400 mt-1">Cálculo automático de presupuestos y generación de propuestas visuales.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800 col-span-2">
          <CardHeader><CardTitle>Fila de Fabricación Activa</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-950 border border-gray-800">
                  <div>
                    <h3 className="font-medium text-white">{p.client}</h3>
                    <p className="text-sm text-gray-500">{p.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-purple-400">{p.budget}</div>
                    <div className="text-xs text-cyan-500">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle>Precios Mercado Peruano</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex justify-between border-b border-gray-800 pb-2 text-gray-400">
               <span>Landing Page IA</span>
               <span className="text-white font-mono">S/ 399</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-2 text-gray-400">
               <span>E-Commerce Básico</span>
               <span className="text-white font-mono">S/ 799</span>
             </div>
             <div className="flex justify-between border-b border-gray-800 pb-2 text-gray-400">
               <span>Sistema B2B Medida</span>
               <span className="text-white font-mono">S/ 1,500+</span>
             </div>
             <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
               <CheckCircle2 className="h-3 w-3 text-green-500" /> Optimizados para máxima conversión y menor costo.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
