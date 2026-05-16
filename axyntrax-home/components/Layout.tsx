import React from 'react';
import { Logo } from './Logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#00D4FF]/30">
      {/* Fixed Header with Logo */}
      <header className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center bg-gradient-to-b from-[#0A0A0F] to-transparent">
        <Logo size={40} className="scale-75 origin-left" />
        
        <div className="text-[10px] font-mono text-slate-500 tracking-tighter">
          AXYNTRAX v1.0.0 // SYSTEM_READY
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7B2FFF]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00D4FF]/5 blur-[150px] rounded-full pointer-events-none" />
    </div>
  );
}
