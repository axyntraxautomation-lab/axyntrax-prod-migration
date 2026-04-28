import { Switch, Route, Redirect, Router as WouterRouter, useParams } from "wouter";
import { TenantProvider, useTenant } from "@/providers/TenantProvider";
import { BrandingStyles } from "@/providers/BrandingStyles";
import { Onboarding } from "@/pages/Onboarding";
import { Dashboard } from "@/pages/Dashboard";
import { Faq } from "@/pages/Faq";
import { LoadingScreen } from "@/pages/LoadingScreen";
import { ErrorScreen } from "@/pages/ErrorScreen";

function SlugGate({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>();
  const { state } = useTenant();
  if (state.status !== "ready") return <>{children}</>;
  if (params.slug && params.slug !== state.me.tenant.slug) {
    return <Redirect to={`/t/${state.me.tenant.slug}/dashboard`} />;
  }
  return <>{children}</>;
}

function GatedRoutes() {
  const { state } = useTenant();
  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "error") return <ErrorScreen message={state.message} />;
  if (state.status === "needs_signup") {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/t/:slug/onboarding" component={Onboarding} />
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    );
  }
  // ready
  const onboardingDone = state.me.onboarding?.estado === "completado";
  const slug = state.me.tenant.slug;
  const home = `/t/${slug}/${onboardingDone ? "dashboard" : "onboarding"}`;
  return (
    <Switch>
      {/* Slug-prefixed canonical routes (/t/:slug/...). */}
      <Route path="/t/:slug/onboarding">
        <SlugGate><Onboarding /></SlugGate>
      </Route>
      <Route path="/t/:slug/dashboard">
        <SlugGate><Dashboard /></SlugGate>
      </Route>
      <Route path="/t/:slug/faq">
        <SlugGate><Faq /></SlugGate>
      </Route>
      <Route path="/t/:slug">
        <Redirect to={home} />
      </Route>
      {/* Legacy unprefixed routes redirect to canonical slug routes. */}
      <Route path="/onboarding">
        <Redirect to={`/t/${slug}/onboarding`} />
      </Route>
      <Route path="/dashboard">
        <Redirect to={`/t/${slug}/dashboard`} />
      </Route>
      <Route path="/faq">
        <Redirect to={`/t/${slug}/faq`} />
      </Route>
      <Route path="/">
        <Redirect to={home} />
      </Route>
      <Route>
        <Redirect to={home} />
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
