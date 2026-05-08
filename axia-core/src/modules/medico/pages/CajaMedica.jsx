import { useOutletContext } from 'react-router'
import { Landmark, CreditCard, Receipt, TrendingUp, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function CajaMedica() {
  const { config } = useOutletContext()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Caja del Día</h2>
         <button className="px-6 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-turquoise transition-all">
            Realizar Cierre de Caja
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-black border border-white/10 rounded-3xl p-8 grid grid-cols-2 gap-8">
               <div>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Recaudación Total</span>
                  <p className="text-4xl font-black text-white mt-1">{formatCurrency(4850)}</p>
               </div>
               <div className="flex flex-col justify-end items-end">
                  <div className="flex items-center gap-2 text-turquoise text-[10px] font-black uppercase">
                     <TrendingUp className="w-4 h-4" /> +15% vs ayer
                  </div>
               </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6">Desglose por Metodo</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Efectivo', val: 1200, icon: Landmark },
                    { label: 'Tarjeta (Visa/MC)', val: 2450, icon: CreditCard },
                    { label: 'Transferencia / Yape', val: 1200, icon: Receipt },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <m.icon className="w-4 h-4 text-white/30" />
                          <span className="text-xs font-bold text-white uppercase">{m.label}</span>
                       </div>
                       <span className="text-sm font-black text-white">{formatCurrency(m.val)}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-turquoise/10 border border-turquoise/20 rounded-3xl p-8">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-turquoise" />
                  <h4 className="text-xs font-black uppercase text-white">Sincronización SUNAT</h4>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-white/40">Boletas Emitidas</span>
                     <span className="text-white">14</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-white/40">Facturas Emitidas</span>
                     <span className="text-white">2</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-4">
                     <div className="h-full bg-turquoise" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[9px] text-turquoise font-bold uppercase text-center mt-2">Documentos enviados con éxito</p>
               </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8 flex-1">
               <h4 className="text-[10px] font-black uppercase text-white/40 mb-4">Acciones de Caja</h4>
               <button className="w-full py-4 text-[10px] font-black uppercase border border-white/10 rounded-xl hover:bg-white hover:text-black transition-all mb-3 text-white">Ingreso Extraodinario</button>
               <button className="w-full py-4 text-[10px] font-black uppercase border border-white/10 rounded-xl hover:bg-white hover:text-black transition-all text-white">Gasto de Caja Chica</button>
            </div>
         </div>
      </div>
    </div>
  )
}
