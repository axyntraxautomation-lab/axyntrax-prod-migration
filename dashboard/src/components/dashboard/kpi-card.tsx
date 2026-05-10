import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export function KpiCard({ title, value, icon: Icon, change }: { title: string; value: string; icon: LucideIcon; change: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle><Icon className="h-4 w-4 text-cyan-400" /></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-gray-500">{change}</p></CardContent>
    </Card>
  );
}
