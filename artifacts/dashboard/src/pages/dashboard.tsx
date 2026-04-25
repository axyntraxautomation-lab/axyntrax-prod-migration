import { useGetDashboardKpis, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Key, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: kpis, isLoading: loadingKpis } = useGetDashboardKpis();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-muted-foreground">Vista general del estado de la agencia.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads (Hoy)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{kpis?.leadsToday || 0}</div>}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas (Mes)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{kpis?.salesMonth || 0}</div>}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias Activas</CardTitle>
            <Key className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{kpis?.activeLicenses || 0}</div>}
          </CardContent>
        </Card>

        <Card className="bg-card border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Licencias por Vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-destructive">{kpis?.expiringLicenses || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {activity?.map(item => (
                  <div key={item.id} className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                        {new Date(item.timestamp).toLocaleString('es-PE')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-card">
          <CardHeader>
            <CardTitle>Estado de Bots (AXYN CORE)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
               <div className="space-y-4">
               {[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
            ) : (
              <div className="space-y-4">
                {kpis?.botStatuses?.map(bot => (
                  <div key={bot.name} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{bot.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{bot.channel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${bot.status === 'online' ? 'bg-green-500' : bot.status === 'error' ? 'bg-destructive' : 'bg-muted'}`} />
                      <span className="text-xs">{bot.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
