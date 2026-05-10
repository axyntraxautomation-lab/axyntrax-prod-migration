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
