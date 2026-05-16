import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>
      <Card className="bg-gray-900 border-gray-800 max-w-xl">
        <CardHeader><CardTitle>Configuración de Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Correo para notificaciones" />
          <Input placeholder="Clave Maestra (generada por JARVIS)" disabled />
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
