import { useOutletContext } from 'react-router'
import { Landmark, CreditCard, Receipt, TrendingUp, ShieldCheck, DollarSign, Scale } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function Honorarios() {
  const { config } = useOutletContext()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestión de Honorarios</h2>
         <button className="px-6 py-3 bg-[#ef4444] text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-black transition-all">
            Cerrar Liquidación Mensual
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-black border border-white/10 rounded-3xl p-8 grid grid-cols-2 gap-8">
               <div>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">Total Recaudado Mes</span>
                  <p className="text-4xl font-black text-white mt-1 leading-none">{formatCurrency(15400)}</p>
               </div>
               <div className="flex flex-col justify-end items-end">
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                     <TrendingUp className="w-4 h-4" /> Objetivos Logrados
                  </div>
               </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-6 font-mono">Resumen por Materia</h3>
               <div className="space-y-4">
                  {[
                    { label: 'Consultoría Civil', val: 7500, icon: Scale },
                    { label: 'Defensa Penal', val: 4500, icon: Gavel },
                    { label: 'Asesoría Laboral', val: 3400, icon: Briefcase },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group hover:border-[#ef4444]/30 border border-white/5 transition-all">
                       <div className="flex items-center gap-3">
                          <m.icon className="w-4 h-4 text-white/30 group-hover:text-[#ef4444] transition-colors" />
                          <span className="text-xs font-bold text-white uppercase">{m.label}</span>
                       </div>
                       <span className="text-sm font-black text-white">{formatCurrency(m.val)}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-6 h-full flex flex-col">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-1">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <h4 className="text-xs font-black uppercase text-white">Declaración SUNAT</h4>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-white/40">
                     <span>Recibos por Honorarios</span>
                     <span className="text-white">08</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase text-white/40">
                     <span>Facturas Jurídicas</span>
                     <span className="text-white">02</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-4">
                     <div className="h-full bg-red-500" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[9px] text-[#ef4444] font-black uppercase text-center mt-2 italic tracking-widest">100% Sincronizado</p>
               </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl p-8">
               <h4 className="text-[10px] font-black uppercase text-white/40 mb-4">Atajos de Caja</h4>
               <div className="space-y-3">
                  <button className="w-full py-4 text-[9px] font-black uppercase border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all text-white/60">Registrar Pago Adelantado</button>
                  <button className="w-full py-4 text-[9px] font-black uppercase border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all text-white/60">Liquidación de Gastos</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function Gavel({ className }) { return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5 5"/><path d="m3 21 3-3"/><path d="m9 15 10-10a2 2 0 1 1 3 3L12 18Z"/><path d="m15 4 5 5"/></svg> }
function Briefcase({ className }) { return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> }
