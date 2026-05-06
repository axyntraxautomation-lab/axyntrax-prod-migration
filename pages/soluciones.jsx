import React from 'react';
import Navbar from '../components/Navbar';
import ModulosSection from '../components/ModulosSection';

export default function SolucionesPage() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', color: '#e8e8f0' }}>
      <Navbar activeLink="soluciones" />
      <div style={{ paddingTop: '90px' }}>
        <ModulosSection />
      </div>
      <footer style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: '#0d0d14' }}>
        <p style={{ color: '#8888aa', fontSize: '0.9rem' }}>© 2026 Axyntrax. Cecilia & ATLAS ✦</p>
      </footer>
    </div>
  );
}
