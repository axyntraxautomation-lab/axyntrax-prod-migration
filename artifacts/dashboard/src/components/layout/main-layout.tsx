import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLogout, useGetCurrentUser } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Wallet, 
  Mail, 
  BarChart3, 
  MessageSquare, 
  Package,
  Settings, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/inbox", label: "Bandeja", icon: MessageSquare },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/keygen", label: "KeyGen", icon: Key },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/email", label: "Email", icon: Mail },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const logoutMutation = useLogout();
  const { data: user } = useGetCurrentUser();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2 p-4">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} className="w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}`}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
      
      <div className="my-4 border-t border-border" />
      
      <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Módulos AI
      </div>
      <Link href="/axyn-core" className="w-full">
        <Button
          variant={location === "/axyn-core" ? "secondary" : "ghost"}
          className={`w-full justify-start border border-transparent ${location === "/axyn-core" ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "text-primary hover:bg-primary/10 hover:text-primary"}`}
        >
          <div className="mr-2 h-5 w-5 flex items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[10px]">A</div>
          AXYN CORE
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-6 shadow-sm">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card border-border">
              <div className="h-16 flex items-center border-b border-border px-6">
                <img src="/axyntrax-logo.jpeg" alt="AXYNTRAX" className="h-8 object-contain" />
              </div>
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="hidden md:flex items-center">
          <img src="/axyntrax-logo.jpeg" alt="AXYNTRAX" className="h-8 object-contain" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-sm">
            <span className="font-semibold">{user?.name}</span>
            <span className="text-muted-foreground text-xs uppercase">{user?.role}</span>
          </div>
          
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-border bg-card md:flex md:flex-col">
          <div className="flex-1 overflow-y-auto py-2">
            <NavLinks />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full pb-24">
            {children}
          </div>
        </main>
      </div>

      {/* Global Footer */}
      <footer className="fixed bottom-0 z-20 w-full border-t border-border bg-card p-3 text-center text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between px-6">
        <div>Miguel Montero — Fundador & CEO · axyntrax-automation.com · +51 991 740 590</div>
        <div>© 2026 AXYNTRAX AUTOMATION</div>
      </footer>
    </div>
  );
}
