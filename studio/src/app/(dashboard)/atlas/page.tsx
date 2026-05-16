import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AtlasPage() {
  const scanHistory = [
    { time: "10:00 AM", target: "WhatsApp API v2", hash: "VALID", status: "CLEAN" },
    { time: "09:55 AM", target: "Dashboard Source", hash: "VALID", status: "CLEAN" },
    { time: "09:50 AM", target: "Public Installer .bats", hash: "VALID", status: "CLEAN" },
    { time: "09:45 AM", target: "JARVIS Core Logic", hash: "VALID", status: "CLEAN" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-400" /> Guardian ATLAS
        </h1>
        <p className="text-gray-400 mt-1">Monitoreo de integridad de código y bloqueador automático de licencias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-emerald-950/20 border-emerald-900 text-emerald-400">
            <CardHeader className="flex items-center flex-row justify-between pb-2"><CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle><ShieldCheck className="h-4 w-4" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">INTEGRO</div></CardContent>
         </Card>
         <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex items-center flex-row justify-between pb-2"><CardTitle className="text-sm font-medium">Próximo Scan (Cron)</CardTitle><RefreshCw className="h-4 w-4 text-gray-500 animate-spin-slow" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">3m 20s</div></CardContent>
         </Card>
         <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex items-center flex-row justify-between pb-2"><CardTitle className="text-sm font-medium">Alertas Bloqueadas</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-600" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">0</div></CardContent>
         </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle>Registro de Auditoría (Logs en Tiempo Real)</CardTitle></CardHeader>
        <CardContent>
          <div className="font-mono text-xs space-y-2 text-emerald-500 bg-black p-4 rounded border border-gray-800 max-h-64 overflow-y-auto">
            {scanHistory.map((s, i) => (
              <div key={i} className="flex gap-4">
                 <span className="opacity-50">[{s.time}]</span>
                 <span className="text-white">Auditing {s.target}...</span>
                 <span className="font-bold">HASH_{s.hash}</span>
                 <span className="ml-auto text-emerald-300">[SUCCESS]</span>
              </div>
            ))}
            <div className="animate-pulse">_ Esperando próximo ciclo...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
