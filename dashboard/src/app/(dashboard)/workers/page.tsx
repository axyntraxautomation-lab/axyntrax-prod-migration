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
