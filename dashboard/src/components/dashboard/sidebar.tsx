'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, Calendar, MessageCircle, Settings, CreditCard } from 'lucide-react';
const nav = [
  { href: '/dashboard', label: 'KPIs', icon: LayoutDashboard },
  { href: '/dashboard/workers', label: 'Trabajadores', icon: Users },
  { href: '/dashboard/modules', label: 'Módulos', icon: Package },
  { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard/chat', label: 'Cecilia', icon: MessageCircle },
  { href: '/dashboard/billing', label: 'Facturación', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
];
export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4">
      <h1 className="text-xl font-bold text-cyan-400 mb-6">AXYNTRAX</h1>
      <nav className="space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${path === href ? 'bg-cyan-950 text-cyan-400' : 'text-gray-400 hover:bg-gray-800'}`}><Icon className="h-4 w-4" /> {label}</Link>
        ))}
      </nav>
    </aside>
  );
}
