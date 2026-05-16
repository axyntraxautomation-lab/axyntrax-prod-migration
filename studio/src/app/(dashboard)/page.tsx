import { KpiCard } from '@/components/dashboard/kpi-card';
import { Activity, Users, Download, DollarSign, Brain, ShieldCheck, Factory, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const kpis = [
    { title: 'Módulos Activos', value: '12', icon: Activity, change: '+2 esta semana' },
    { title: 'Trabajadores', value: '8', icon: Users, change: '2 en línea ahora' },
    { title: 'Descargas Hoy', value: '3', icon: Download, change: '+1 vs ayer' },
    { title: 'Ingresos (S/)', value: '1,990', icon: DollarSign, change: '+S/ 199 hoy' },
  ];

  const agents = [
    { name: 'JARVIS', role: 'Orquestador', status: 'ONLINE', icon: Brain, color: 'text-blue-400', desc: 'Vigilando ecosistema y correo axyntraxautomation@gmail.com' },
    { name: 'ATLAS', role: 'Seguridad', status: 'ACTIVO', icon: ShieldCheck, color: 'text-emerald-400', desc: 'Escaneo completado hace 2 min. Hilos íntegros.' },
    { name: 'MATRIX', role: 'Proyectos', status: 'LISTO', icon: Factory, color: 'text-purple-400', desc: 'Fábrica de presupuestos y diseños web en espera.' },
    { name: 'CECILIA', role: 'Ventas B2B', status: 'EN LÍNEA', icon: MessageSquare, color: 'text-pink-400', desc: 'Ventas vía WhatsApp activas. 3 leads captados hoy.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Centro de Comando JARVIS</h1>
        <p className="text-gray-400">Resumen ejecutivo del ecosistema Axyntrax Automation.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (<KpiCard key={kpi.title} {...kpi} />))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-cyan-400" /> Estado de los 4 Agentes IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <Card key={agent.name} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <agent.icon className={`h-6 w-6 ${agent.color}`} />
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 tracking-wider">
                  {agent.status}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 leading-relaxed">{agent.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
