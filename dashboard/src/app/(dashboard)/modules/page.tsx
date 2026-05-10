import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

const modulos = [
  { name: 'Módulo 1: Automatización', version: '2.1.0', desc: 'RPA de tareas repetitivas' },
  { name: 'Módulo 2: Reportes', version: '1.3.2', desc: 'KPIs y reportes automáticos' },
  { name: 'Módulo 3: Comunicación', version: '1.0.5', desc: 'WhatsApp/Email masivo' },
];

export default function ModulesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Módulos Descargables</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modulos.map((mod) => (
          <Card key={mod.name} className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-lg">{mod.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-2">{mod.desc}</p>
              <p className="text-xs text-gray-500 mb-4">Versión {mod.version}</p>
              <Button size="sm"><Download className="mr-2 h-4 w-4" /> Descargar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
