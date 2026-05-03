import { FileDown, FileText, Share2, Printer, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const BaseReports = ({ reports = [], primaryColor = '#00CED1' }) => {
  return (
    <div className="bg-black border border-white/10 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Gestion de Reportes</h3>
          <p className="text-[9px] text-white/30 font-bold uppercase mt-1">Exportacion Segura Axia</p>
        </div>
        <FileDown className="w-5 h-5 text-turquoise" style={{ color: primaryColor }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                <FileText className="w-5 h-5 text-white/40 group-hover:text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">{report.label}</p>
                <p className="text-[9px] text-white/30 font-black uppercase mt-0.5">{report.description || 'Generado Automaticamente'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                 <Printer className="w-4 h-4" />
               </button>
               <button className="p-2 bg-white text-black rounded-lg hover:scale-110 transition-all shadow-lg">
                 <FileDown className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
         <CheckCircle className="w-4 h-4 text-turquoise" style={{ color: primaryColor }} />
         <p className="text-[10px] font-medium text-white/40">Todos los reportes cumplen con la normativa de auditoria de AxyntraX v4.0</p>
      </div>
    </div>
  )
}
