# ================================================================
# AXYNTRAX AUTOMATION - Inicializador del Dashboard Gerencial v2.0
# Ejecutar desde: AXYNTRAX_AUTOMATION_Suite\
# Este script NO borra nada del proyecto actual
# ================================================================
$ErrorActionPreference = "Stop"
Write-Host "🚀 Construyendo el nuevo Dashboard Gerencial..." -ForegroundColor Cyan

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "api/whatsapp.py")) {
    Write-Host "❌ Debes ejecutar este script desde la raíz de AXYNTRAX_AUTOMATION_Suite" -ForegroundColor Red
    exit 1
}

# 1. Crear proyecto Next.js en carpeta dashboard
Write-Host "`n📦 Creando proyecto Next.js 14 con TypeScript..." -ForegroundColor Yellow
npx create-next-app@latest dashboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
Set-Location dashboard

# 2. Instalar todas las dependencias necesarias
Write-Host "`n📥 Instalando dependencias..." -ForegroundColor Yellow
npm install @supabase/supabase-js @supabase/ssr openai --force
npm install lucide-react date-fns recharts --force
npm install zod react-hook-form @hookform/resolvers sonner --force
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-avatar @radix-ui/react-badge --force
npm install react-day-picker --force

# 3. Inicializar Shadcn/ui con todos los componentes
Write-Host "`n🎨 Configurando componentes de interfaz..." -ForegroundColor Yellow
# Use npx -y for headless execution
npx -y shadcn-ui@latest init -d --force
npx -y shadcn-ui@latest add button card input label table dialog dropdown-menu avatar badge calendar chart separator -y

# 4. Crear estructura de carpetas
Write-Host "`n📁 Creando estructura de carpetas..." -ForegroundColor Yellow
$directorios = @(
    "src/app/(auth)/login",
    "src/app/(auth)/register",
    "src/app/(dashboard)/workers",
    "src/app/(dashboard)/modules",
    "src/app/(dashboard)/calendar",
    "src/app/(dashboard)/chat",
    "src/app/(dashboard)/settings",
    "src/app/(dashboard)/billing",
    "src/app/api/keys/validate",
    "src/app/api/modules/download",
    "src/app/api/kpis",
    "src/app/api/chat",
    "src/app/api/workers",
    "src/components/ui",
    "src/components/dashboard",
    "src/lib",
    "src/types",
    "public/modules"
)
foreach ($dir in $directorios) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# 5. Generar todos los archivos del sistema
Write-Host "`n📝 Generando archivos del dashboard..." -ForegroundColor Yellow

# --- Libs ---
@'
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

export async function askDeepSeek(
  systemPrompt: string,
  userMessage: string,
  jsonMode = false
): Promise<string> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    temperature: jsonMode ? 0.0 : 0.7,
    max_tokens: jsonMode ? 150 : 300,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });
  return response.choices[0]?.message?.content || '';
}

export const CECILIA_MASTER_PROMPT = `Eres Cecilia Master, asistente ejecutiva de Axyntrax Automation dentro del dashboard gerencial.
- Analizas KPIs en tiempo real y aconsejas al gerente
- Alertas sobre tendencias y oportunidades
- Sugieres acciones concretas basadas en datos
- Derivación: soporte@axyntrax-automation.net
- Tono: profesional, peruano, directo, máximo 3 líneas`;
'@ | Out-File -FilePath "src/lib/deepseek.ts" -Encoding UTF8

@'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
'@ | Out-File -FilePath "src/lib/supabase.ts" -Encoding UTF8

# --- Tipos ---
@'
export type Company = {
  id: string; name: string; industry: string; master_key: string; email: string; created_at: string;
};
export type Worker = {
  id: string; company_id: string; role: string; assigned_modules: string[]; worker_key: string; email: string;
};
export type ModuleInfo = {
  id: string; name: string; version: string; download_url: string; active: boolean;
};
export type KPI = {
  id: string; metric: string; value: number; timestamp: string;
};
'@ | Out-File -FilePath "src/types/index.ts" -Encoding UTF8

# --- Layouts ---
@'
import '../globals.css';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
      <Toaster richColors />
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/layout.tsx" -Encoding UTF8

# --- Páginas ---
@'
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
'@ | Out-File -FilePath "src/app/(dashboard)/page.tsx" -Encoding UTF8

@'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Card className="w-96 bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white text-center">AXYNTRAX</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3" />
          <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-4" />
          <Button className="w-full">Entrar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(auth)/login/page.tsx" -Encoding UTF8

@'
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';

export default function WorkersPage() {
  const workers = [
    { name: 'Ana Torres', role: 'Módulo 1', key: 'key_ax_001', status: 'Activo' },
    { name: 'Luis Gómez', role: 'Módulo 2', key: 'key_ax_002', status: 'Activo' },
  ];
  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Trabajadores</h1><Button><Plus className="mr-2 h-4 w-4" /> Agregar</Button></div>
      <Table>
        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Módulo</TableHead><TableHead>Key</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
        <TableBody>{workers.map((w) => (<TableRow key={w.key}><TableCell>{w.name}</TableCell><TableCell>{w.role}</TableCell><TableCell className="font-mono text-xs">{w.key}</TableCell><TableCell className={w.status === 'Activo' ? 'text-green-400' : 'text-red-400'}>{w.status}</TableCell></TableRow>))}</TableBody>
      </Table>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/workers/page.tsx" -Encoding UTF8

@'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

const modulos = [
  { name: 'Módulo 1: Automatización', version: '2.1.0', desc: 'RPA de tareas repetitivas' },
  { name: 'Módulo 2: Reportes', version: '1.3.2', desc: 'KPIs y reportes automáticos' },
  { name: 'Módulo 3: Comunicación', version: '1.0.5', desc: 'WhatsApp/Email masivo' },
];

export default function ModulesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Módulos Descargables</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modulos.map((mod) => (
          <Card key={mod.name} className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-lg">{mod.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-2">{mod.desc}</p>
              <p className="text-xs text-gray-500 mb-4">Versión {mod.version}</p>
              <Button size="sm"><Download className="mr-2 h-4 w-4" /> Descargar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/modules/page.tsx" -Encoding UTF8

@'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hola Gerente, soy Cecilia Master. Hoy tienes 3 módulos activos y S/ 1,990 en ingresos. ¿En qué te ayudo?' },
  ]);
  return (
    <div className="flex flex-col h-[80vh]">
      <h1 className="text-2xl font-bold mb-4">Cecilia Master</h1>
      <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto mb-4">
        {chat.map((c, i) => (<div key={i} className={`mb-3 ${c.role === 'user' ? 'text-right' : ''}`}><span className={`inline-block px-4 py-2 rounded-lg text-sm ${c.role === 'user' ? 'bg-cyan-600' : 'bg-gray-800'}`}>{c.content}</span></div>))}
      </div>
      <div className="flex gap-2">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe a Cecilia..." />
        <Button><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/chat/page.tsx" -Encoding UTF8

@'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>
      <Card className="bg-gray-900 border-gray-800 max-w-xl">
        <CardHeader><CardTitle>Configuración de Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Correo para notificaciones" />
          <Input placeholder="Clave Maestra (generada por JARVIS)" disabled />
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/settings/page.tsx" -Encoding UTF8

@'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays className="h-6 w-6" /> Calendario</h1>
      <Card className="bg-gray-900 border-gray-800 p-6 text-center text-gray-400">
        Integración con Google Calendar disponible próximamente.
      </Card>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/calendar/page.tsx" -Encoding UTF8

@'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BillingPage() {
  const licencias = [
    { email: 'ana@clinica.pe', modulo: 'Módulo 1', pagado: 'S/ 99.00', igv: 'S/ 15.10', estado: 'Activa' },
    { email: 'luis@restaurante.pe', modulo: 'Módulo 2', pagado: 'S/ 99.00', igv: 'S/ 15.10', estado: 'Activa' },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Facturación y Licencias</h1>
      <Table>
        <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Módulo</TableHead><TableHead>Pagado</TableHead><TableHead>IGV</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
        <TableBody>{licencias.map((l, i) => (<TableRow key={i}><TableCell>{l.email}</TableCell><TableCell>{l.modulo}</TableCell><TableCell>{l.pagado}</TableCell><TableCell>{l.igv}</TableCell><TableCell className="text-green-400">{l.estado}</TableCell></TableRow>))}</TableBody>
      </Table>
    </div>
  );
}
'@ | Out-File -FilePath "src/app/(dashboard)/billing/page.tsx" -Encoding UTF8

# --- Componentes ---
@'
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
'@ | Out-File -FilePath "src/components/dashboard/kpi-card.tsx" -Encoding UTF8

@'
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
'@ | Out-File -FilePath "src/components/dashboard/sidebar.tsx" -Encoding UTF8

# --- API Routes ---
@'
import { NextResponse } from 'next/server';
import { askDeepSeek, CECILIA_MASTER_PROMPT } from '@/lib/deepseek';

export async function POST(req: Request) {
  const { message } = await req.json();
  const reply = await askDeepSeek(CECILIA_MASTER_PROMPT, message);
  return NextResponse.json({ reply });
}
'@ | Out-File -FilePath "src/app/api/chat/route.ts" -Encoding UTF8

@'
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const { key } = await req.json();
  if (key === process.env.JARVIS_MASTER_KEY) return NextResponse.json({ valid: true });
  return NextResponse.json({ valid: false }, { status: 403 });
}
'@ | Out-File -FilePath "src/app/api/keys/validate/route.ts" -Encoding UTF8

# --- Configuración de entorno ---
@'
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
DEEPSEEK_API_KEY=sk-tu-deepseek-key
JARVIS_MASTER_KEY=change_me
'@ | Out-File -FilePath ".env.local" -Encoding UTF8

# 6. Actualizar vercel.json raíz
Set-Location ..
@'
{
  "builds": [
    { "src": "api/whatsapp.py", "use": "@vercel/python", "config": { "runtime": "python3.9" } },
    { "src": "api/messenger.py", "use": "@vercel/python", "config": { "runtime": "python3.9" } },
    { "src": "dashboard/package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/api/whatsapp", "dest": "/api/whatsapp.py" },
    { "src": "/api/messenger", "dest": "/api/messenger.py" },
    { "src": "/dashboard", "dest": "/dashboard" },
    { "src": "/dashboard/(.*)", "dest": "/dashboard/$1" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
'@ | Out-File -FilePath "vercel.json" -Encoding UTF8

Write-Host "`n✅ Dashboard generado exitosamente" -ForegroundColor Green
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configurar credenciales en dashboard/.env.local"
Write-Host "2. Ejecutar 'cd dashboard && npm run dev' para probar"
Write-Host "3. Commit y push para desplegar en Vercel"
