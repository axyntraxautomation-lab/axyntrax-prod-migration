import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetCurrentUser } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/main-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CRMList from "@/pages/crm";
import CRMDetail from "@/pages/crm/[id]";
import Keygen from "@/pages/keygen";
import Inbox from "@/pages/inbox";
import Finanzas from "@/pages/finanzas";
import Email from "@/pages/email";
import Analytics from "@/pages/analytics";
import AxynCore from "@/pages/axyn-core";
import Settings from "@/pages/settings";
import Publicidad from "@/pages/publicidad";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { data: user, isLoading, isError } = useGetCurrentUser();
  const [, setLocation] = useLocation();
  const unauthorized = !isLoading && (isError || !user);

  useEffect(() => {
    if (unauthorized) {
      setLocation("/login");
    }
  }, [unauthorized, setLocation]);

  if (isLoading || unauthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src="/axyntrax-logo.jpeg" alt="AXYNTRAX" className="h-12 animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <Component {...rest} />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/crm" component={() => <ProtectedRoute component={CRMList} />} />
      <Route path="/crm/:id">
        {(params) => <ProtectedRoute component={CRMDetail} id={params.id} />}
      </Route>
      <Route path="/keygen" component={() => <ProtectedRoute component={Keygen} />} />
      <Route path="/inbox" component={() => <ProtectedRoute component={Inbox} />} />
      <Route path="/finanzas" component={() => <ProtectedRoute component={Finanzas} />} />
      <Route path="/email" component={() => <ProtectedRoute component={Email} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/axyn-core" component={() => <ProtectedRoute component={AxynCore} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/publicidad" component={() => <ProtectedRoute component={Publicidad} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
