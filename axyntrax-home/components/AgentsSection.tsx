"use client";

import { motion } from "framer-motion";
import { Bot, Satellite, Megaphone, CheckCircle2 } from "lucide-react";

const AGENTS = [
  {
    name: "CECILIA",
    role: "Atención 24/7",
    icon: Bot,
    color: "#00D4FF",
    desc: "Nuestra Directora de Atención al Cliente. Atiende leads, gestiona citas y resuelve dudas por WhatsApp, Facebook e Instagram sin descanso.",
    stats: "98% Satisfacción"
  },
  {
    name: "ATLAS",
    role: "Operaciones TI",
    icon: Satellite,
    color: "#7B2FFF",
    desc: "El guardián de su infraestructura. Monitorea la estabilidad del sistema, gestiona copias de seguridad y asegura un uptime del 99.9%.",
    stats: "0ms Latencia"
  },
  {
    name: "MARK",
    role: "Director Marketing",
    icon: Megaphone,
    color: "#00D4FF",
    desc: "Su estratega de contenido autónomo. Genera publicaciones, anuncios y campañas personalizadas para atraer clientes a su negocio cada 3 horas.",
    stats: "3h Frecuencia"
  }
];

export default function AgentsSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-black/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Ecosistema de Agentes IA</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Tres inteligencias especializadas trabajando en sincronía para orquestar cada aspecto de su empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-10 rounded-[40px] border-white/5 hover:border-[#00D4FF]/30 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Icon size={32} style={{ color: agent.color }} />
                </div>
                <h3 className="text-2xl font-bold mb-1 tracking-tighter">{agent.name}</h3>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6" style={{ color: agent.color }}>
                  {agent.role}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  {agent.desc}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-white/5 w-fit px-3 py-1 rounded-full">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {agent.stats}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
