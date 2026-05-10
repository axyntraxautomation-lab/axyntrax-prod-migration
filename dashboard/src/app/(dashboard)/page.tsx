import { KpiCard } from '@/components/dashboard/kpi-card';
import { Activity, Users, Download, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const kpis = [
    { title: 'Módulos Activos', value: '12', icon: Activity, change: '+2 esta semana' },
    { title: 'Trabajadores', value: '8', icon: Users, change: '2 en línea ahora' },
    { title: 'Descargas Hoy', value: '3', icon: Download, change: '+1 vs ayer' },
    { title: 'Ingresos (S/)', value: '1,990', icon: DollarSign, change: '+S/ 199 hoy' },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Gerencial</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (<KpiCard key={kpi.title} {...kpi} />))}
      </div>
    </div>
  );
}
