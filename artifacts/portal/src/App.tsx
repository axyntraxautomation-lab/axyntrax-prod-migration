import { useEffect, type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import LandingPage from "@/pages/landing";
import ClientModulesPage from "@/pages/client-modules";
import ClientQuotesPage from "@/pages/client-quotes";
import AdminRequestsPage from "@/pages/admin-requests";
import AdminClientsPage from "@/pages/admin-clients";
import AdminCatalogPage from "@/pages/admin-catalog";
import AdminQuotesPage from "@/pages/admin-quotes";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PortalHeader } from "@/components/portal-header";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type Role = "client" | "admin";

function Protected({
  component: Component,
  role,
}: {
  component: ComponentType;
  role: Role;
}) {
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setLocation("/login");
      return;
    }
    if (session.kind !== role) {
      setLocation(session.kind === "admin" ? "/admin" : "/mis-modulos");
    }
  }, [loading, session, role, setLocation]);

  if (loading || !session || session.kind !== role) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PortalHeader />
      <Component />
    </div>
  );
}

function PortalRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route
        path="/mis-modulos"
        component={() => <Protected component={ClientModulesPage} role="client" />}
      />
      <Route
        path="/catalogo"
        component={() => <Protected component={ClientModulesPage} role="client" />}
      />
      <Route
        path="/mis-cotizaciones"
        component={() => <Protected component={ClientQuotesPage} role="client" />}
      />
      <Route
        path="/admin"
        component={() => <Protected component={AdminRequestsPage} role="admin" />}
      />
      <Route
        path="/admin/clientes"
        component={() => <Protected component={AdminClientsPage} role="admin" />}
      />
      <Route
        path="/admin/catalogo"
        component={() => <Protected component={AdminCatalogPage} role="admin" />}
      />
      <Route
        path="/admin/cotizaciones"
        component={() => <Protected component={AdminQuotesPage} role="admin" />}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <PortalRouter />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
