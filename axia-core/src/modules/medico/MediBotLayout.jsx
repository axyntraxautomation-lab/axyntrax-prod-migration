import { useEffect, useState } from 'react'
import { BaseModuleLayout } from '@/components/base/BaseModuleLayout'
import { validateLicense } from '@/lib/keygen'
import { ShieldAlert, Loader2 } from 'lucide-react'

export const MediBotLayout = () => {
  const [auth, setAuth] = useState({ loading: true, valid: false })

  useEffect(() => {
    async function checkLicense() {
      // En una implementación real, esto vendría del store de auth o fingerprint
      const result = await validateLicense('LOCAL-TEST-KEY', 'FINGERPRINT-001')
      
      // Validar si el tenant tiene permitido el módulo 'medico' o 'clinica'
      const hasAccess = result.valid && (
        result.tenant?.allowedModules?.includes('medico') || 
        result.tenant?.allowedModules?.includes('clinica')
      )

      setAuth({ loading: false, valid: hasAccess })
    }
    checkLicense()
  }, [])

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-turquoise animate-spin" />
      </div>
    )
  }

  if (!auth.valid) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
         <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
         </div>
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Acceso Restringido</h2>
         <p className="text-white/40 text-sm max-w-md">
            Tu licencia actual no incluye el modulo **MediBot**. 
            Contacta a soporte técnico de AxyntraX para activar este servicio.
         </p>
         <button 
           onClick={() => window.location.href = '/admin'}
           className="mt-8 px-6 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:bg-turquoise transition-all"
         >
            Volver al Centro de Mando
         </button>
      </div>
    )
  }

  return <BaseModuleLayout />
}
