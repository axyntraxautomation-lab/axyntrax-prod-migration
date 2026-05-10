import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays className="h-6 w-6" /> Calendario</h1>
      <Card className="bg-gray-900 border-gray-800 p-6 text-center text-gray-400">
        Integración con Google Calendar disponible próximamente.
      </Card>
    </div>
  );
}
