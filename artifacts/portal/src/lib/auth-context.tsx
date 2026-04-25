import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  portalApi,
  setUnauthorizedHandler,
  type PortalSession,
} from "./portal-api";

type AuthState = {
  session: PortalSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setSession: (s: PortalSession | null) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const s = await portalApi.me();
      setSession(s);
    } catch {
      setSession(null);
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
    });
    void (async () => {
      await refresh();
      setLoading(false);
    })();
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const logout = async () => {
    try {
      await portalApi.logout();
    } finally {
      setSession(null);
    }
  };

  return (
    <Ctx.Provider value={{ session, loading, refresh, logout, setSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
