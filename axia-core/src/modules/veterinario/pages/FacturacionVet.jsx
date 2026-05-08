import { useOutletContext } from 'react-router'
import { Landmark, CreditCard, Receipt, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function FacturacionVet() {
  const { config } = useOutletContext()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Caja y Facturación</h2>
         <button className="px-6 py-3 bg-[#f59e0b] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all shadow-lg shadow-amber-500/20">
            Realizar Cierre de Caja
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-black border border-white/10 rounded-3xl p-8 grid grid-cols-2 gap-8">
               <div>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ingresos del Día</span>
                  <p className="text-4xl font-black text-white mt-1">{formatCurrency(3250)}</p>
               </div>
               <div className="flex flex-col justify-end items-end">
                  <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase">
                     <TrendingUp className="w-4 h-4" /> Activo
                  </div>
               </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6 font-mono">Desglose por Servicio</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Consultas Medicas', val: 1500, icon: DollarSign },
                    { label: 'Ventas PetShop', val: 850, icon: Receipt },
                    { label: 'Cirugías / Estética', val: 900, icon: ShieldCheck },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
                       <div className="flex items-center gap-3">
                          <m.icon className="w-4 h-4 text-white/30 group-hover:text-amber-500 transition-colors" />
                          <span className="text-xs font-bold text-white uppercase">{m.label}</span>
                       </div>
                       <span className="text-sm font-black text-white">{formatCurrency(m.val)}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h4 className="text-xs font-black uppercase text-white">Estado SUNAT</h4>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-white/40">
                     <span>Comprobantes Hoy</span>
                     <span className="text-white">12</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-4">
                     <div className="h-full bg-amber-500" style={{ width: '85%' }} />
                  </div>
                  <p className="text-[9px] text-amber-500/60 font-bold uppercase text-center mt-2 italic">85% Sincronizado</p>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
               <h4 className="text-[10px] font-black uppercase text-white/40 mb-4">Medios de Pago</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black rounded-2xl border border-white/5 text-center">
                     <p className="text-xs font-black text-white">S/. 1,200</p>
                     <p className="text-[8px] text-white/20 uppercase mt-1">Efectivo</p>
                  </div>
                  <div className="p-4 bg-black rounded-2xl border border-white/5 text-center">
                     <p className="text-xs font-black text-white">S/. 2,050</p>
                     <p className="text-[8px] text-white/20 uppercase mt-1">POS / QR</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
