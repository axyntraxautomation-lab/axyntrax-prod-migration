import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { TenantProvider, useTenant } from "@/providers/TenantProvider";
import { BrandingStyles } from "@/providers/BrandingStyles";
import { Onboarding } from "@/pages/Onboarding";
import { Dashboard } from "@/pages/Dashboard";
import { Faq } from "@/pages/Faq";
import { LoadingScreen } from "@/pages/LoadingScreen";
import { ErrorScreen } from "@/pages/ErrorScreen";

function GatedRoutes() {
  const { state } = useTenant();
  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "error") return <ErrorScreen message={state.message} />;
  if (state.status === "needs_signup") {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    );
  }
  // ready
  const onboardingDone = state.me.onboarding?.estado === "completado";
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/faq" component={Faq} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/">
        <Redirect to={onboardingDone ? "/dashboard" : "/onboarding"} />
      </Route>
      <Route>
        <Redirect to={onboardingDone ? "/dashboard" : "/onboarding"} />
      </Route>
    </Switch>
  );
}

function App() {
  const baseHref = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <TenantProvider>
      <BrandingStyles />
      <WouterRouter base={baseHref}>
        <GatedRoutes />
      </WouterRouter>
    </TenantProvider>
  );
}

export default App;
