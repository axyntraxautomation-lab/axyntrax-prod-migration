"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function WspFloatingButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setShowTooltip(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-start">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            className="mb-4 ml-2 bg-white px-4 py-2 rounded-2xl rounded-bl-none shadow-2xl border border-[#25D366]/20 flex items-center gap-3 cursor-pointer"
            onClick={() => window.open("https://wa.me/51991740590?text=Hola, necesito soporte directo de un asesor Axyntrax.", "_blank")}
          >
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
              <MessageCircle size={14} className="text-white" />
            </div>
            <p className="text-[11px] font-bold text-black uppercase tracking-tight">
              ¿Asesor <span className="text-[#25D366]">Humano</span>?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="https://wa.me/51991740590?text=Hola, necesito soporte directo de un asesor Axyntrax."
        target="_blank"
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl bg-[#25D366] text-white border border-white/20"
      >
        <MessageCircle size={28} />
      </motion.a>
    </div>
  );
}
