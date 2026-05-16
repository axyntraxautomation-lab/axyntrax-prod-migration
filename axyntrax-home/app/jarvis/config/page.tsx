'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Shield, Key, Facebook, Instagram, Linkedin, Save, AlertTriangle, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function MarkConfig() {
  const [config, setConfig] = useState({
    fb_page_id: '',
    fb_access_token: '',
    ig_account_id: '',
    linkedin_token: '',
    linkedin_org_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const docRef = doc(db, 'system_config', 'mark_credentials');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system_config', 'mark_credentials'), {
        ...config,
        updatedAt: Date.now()
      });
      alert('CONFIGURACIÓN NEURAL ACTUALIZADA: MARK ha sincronizado las llaves.');
    } catch (e) {
      alert('Error al guardar: ' + e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center text-[#00D4FF] font-mono animate-pulse">CARGANDO CORTEX DE MARK...</div>;

  return (
    <div className="min-h-screen bg-[#050508] text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
              <Zap className="text-[#00D4FF]" fill="#00D4FF" /> MARK <span className="text-slate-500">CONNECTIVITY</span>
            </h1>
            <p className="text-slate-400 mt-2">Centro de Sincronización de Llaves para Marketing Autónomo</p>
          </div>
          <Logo size={80} />
        </header>

        <div className="grid grid-cols-1 gap-8">
          
          {/* META SECTION */}
          <section className="bg-[#0A0A0F] border border-white/5 rounded-[40px] p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Facebook size={24} /></div>
              <h2 className="text-xl font-bold">Meta Ecosystem (FB & Instagram)</h2>
            </div>
            
            <div className="space-y-6">
              <InputField 
                label="Facebook Page ID" 
                value={config.fb_page_id} 
                onChange={(v) => setConfig({...config, fb_page_id: v})}
                placeholder="Ej: 1092837465..."
              />
              <InputField 
                label="Instagram Business ID" 
                value={config.ig_account_id} 
                onChange={(v) => setConfig({...config, ig_account_id: v})}
                placeholder="Ej: 17841400..."
              />
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Meta Access Token (System User)</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono outline-none focus:border-blue-500 transition-all h-24"
                  value={config.fb_access_token}
                  onChange={(e) => setConfig({...config, fb_access_token: e.target.value})}
                  placeholder="EAAO..."
                />
              </div>
            </div>
          </section>

          {/* LINKEDIN SECTION */}
          <section className="bg-[#0A0A0F] border border-white/5 rounded-[40px] p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400"><Linkedin size={24} /></div>
              <h2 className="text-xl font-bold">LinkedIn Professional</h2>
            </div>
            
            <div className="space-y-6">
              <InputField 
                label="LinkedIn Organization ID (URN)" 
                value={config.linkedin_org_id} 
                onChange={(v) => setConfig({...config, linkedin_org_id: v})}
                placeholder="Ej: urn:li:organization:12345"
              />
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">LinkedIn OAuth Token</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono outline-none focus:border-blue-600 transition-all h-24"
                  value={config.linkedin_token}
                  onChange={(e) => setConfig({...config, linkedin_token: e.target.value})}
                  placeholder="AQX..."
                />
              </div>
            </div>
          </section>

          {/* SECURITY ALERT */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-3xl flex gap-4 items-center">
            <AlertTriangle className="text-yellow-500 shrink-0" size={24} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              <strong>AVISO DE SEGURIDAD:</strong> Estos tokens otorgan a MARK la capacidad de publicar en tu nombre. 
              Asegúrate de que los tokens tengan permisos de <code className="bg-yellow-500/10 px-1 rounded text-yellow-500">pages_manage_posts</code> y <code className="bg-yellow-500/10 px-1 rounded text-yellow-500">w_member_social</code>.
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-6 rounded-[30px] bg-[#00D4FF] text-black font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(0,212,255,0.3)]"
          >
            {saving ? 'SINCRONIZANDO...' : <><Save size={20} /> GUARDAR CONFIGURACIÓN NEURAL</>}
          </button>

        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00D4FF] transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}
