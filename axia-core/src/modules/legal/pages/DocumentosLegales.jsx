import { useOutletContext } from 'react-router'
import { FileText, Clock, AlertTriangle, CheckCircle2, Search, Download } from 'lucide-react'
import { BaseTables } from '@/components/base/BaseTables'

export default function DocumentosLegales() {
  const { config } = useOutletContext()
  
  const columns = [
    { key: 'doc_name', label: 'Documento / Escrito' },
    { key: 'case', label: 'Expediente' },
    { key: 'deadline', label: 'Plazo Limite' },
    { 
      key: 'status', 
      label: 'Estado',
      render: (val) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
          val === 'Pendiente' ? "bg-amber-500/10 text-amber-500" : 
          val === 'Urgente' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
        )}>
          {val}
        </span>
      )
    },
  ]

  const data = [
    { doc_name: 'Contestación de Demanda', case: '00124-2026', deadline: '24/04/2026', status: 'Urgente' },
    { doc_name: 'Recurso de Apelación', case: '00542-2025', deadline: '28/04/2026', status: 'Pendiente' },
    { doc_name: 'Contrato de Arrendamiento', case: 'G-102', deadline: '21/04/2026', status: 'Listo' },
  ]

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestión de Documentos</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">
             <Download className="w-4 h-4" /> Exportar Lista
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Plazos Venciendo', value: '02', icon: AlertTriangle, color: 'text-red-500' },
            { label: 'Pendientes Firma', value: '15', icon: Clock, color: 'text-amber-500' },
            { label: 'Completados Hoy', value: '08', icon: CheckCircle2, color: 'text-green-500' },
          ].map((s, i) => (
            <div key={i} className="bg-black border border-white/5 rounded-2xl p-6 flex items-center gap-4">
               <s.icon className={cn("w-6 h-6", s.color)} />
               <div>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">{s.label}</p>
                  <p className="text-xl font-black text-white">{s.value}</p>
               </div>
            </div>
          ))}
       </div>

       <BaseTables 
         columns={columns}
         data={data}
         primaryColor={config.primaryColor}
         onAction={(item) => console.log('Download or Sign:', item)}
       />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
