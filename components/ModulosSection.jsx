import React, { useState } from 'react';
import { modulos } from '../data/modulos';

export default function ModulosSection() {
  const [activeModulo, setActiveModulo] = useState(modulos[0].id);

  const formatPrecio = (base) => {
    const igv = base * 0.18;
    const total = base + igv;
    return {
      base: base.toFixed(2),
      igv: igv.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const selected = modulos.find(m => m.id === activeModulo) || modulos[0];

  return (
    <section id="modulos-productos" style={{
      background: 'radial-gradient(circle at center, #111124 0%, #05050a 100%)',
      color: '#e8e8f0',
      padding: '100px 20px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '900',
            color: '#00f5ff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            background: 'rgba(0, 245, 255, 0.08)',
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 245, 255, 0.15)'
          }}>
            ⚡ MÓDULOS DE ÚLTIMA GENERACIÓN
          </span>
          <h2 style={{
            fontSize: '2.8rem',
            fontWeight: '900',
            marginTop: '20px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffffff, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Ecosistemas Inteligentes por Industria
          </h2>
          <p style={{ color: '#8888aa', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
            Elige el módulo ideal para tu negocio. Cada industria cuenta con sub-módulos dedicados que automatizan tu operación al 100%.
          </p>
        </div>

        {/* Selector de Industrias */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '50px'
        }}>
          {modulos.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModulo(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '16px',
                border: activeModulo === m.id ? `2px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.05)',
                background: activeModulo === m.id ? `${m.color}15` : '#0d0d14',
                color: activeModulo === m.id ? '#ffffff' : '#8888aa',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <span>{m.icono}</span>
              <span>{m.nombre}</span>
              {m.isNew && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#06b6d4',
                  color: '#000',
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
                }}>
                  NUEVO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel Expandido del Módulo Activo */}
        <div style={{
          background: 'rgba(13, 13, 22, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '32px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <span style={{ fontSize: '3rem' }}>{selected.icono}</span>
            <div>
              <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>
                Módulo {selected.nombre}
              </h3>
              <p style={{ color: selected.color, fontWeight: '600', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Atención Autónoma & Control Integrado
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px'
          }}>
            
            {/* Lado Izquierdo: Sub-Módulos */}
            <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', color: '#ffffff' }}>
                Sub-módulos Desbloqueables
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    background: `${selected.color}20`,
                    color: selected.color,
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    flexShrink: 0
                  }}>A</div>
                  <div>
                    <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{selected.subModulos.A.nombre} (Plan Bronce)</h5>
                    <p style={{ color: '#8888aa', fontSize: '0.9rem', marginTop: '4px' }}>{selected.subModulos.A.descripcion}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    background: `${selected.color}20`,
                    color: selected.color,
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    flexShrink: 0
                  }}>B</div>
                  <div>
                    <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{selected.subModulos.B.nombre} (Plan Plata)</h5>
                    <p style={{ color: '#8888aa', fontSize: '0.9rem', marginTop: '4px' }}>{selected.subModulos.B.descripcion}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    background: `${selected.color}20`,
                    color: selected.color,
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    flexShrink: 0
                  }}>C</div>
                  <div>
                    <h5 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ffffff' }}>{selected.subModulos.C.nombre} (Plan Oro)</h5>
                    <p style={{ color: '#8888aa', fontSize: '0.9rem', marginTop: '4px' }}>{selected.subModulos.C.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Botonera de Onboarding */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <a href="/activar" style={{
                  background: `linear-gradient(135deg, ${selected.color}, #7c3aed)`,
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  flex: 1,
                  boxShadow: `0 8px 24px ${selected.color}30`
                }}>
                  Iniciar Prueba 45 días
                </a>
                <a href="/instalacion" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  flex: 1
                }}>
                  Guía de Instalación
                </a>
              </div>
            </div>

            {/* Lado Derecho: Planes */}
            <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', color: '#ffffff' }}>
                Estructura de Inversión
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                
                {/* Bronce */}
                <div style={{
                  background: '#161625',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h5 style={{ color: '#8888aa', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>BRONCE</h5>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', margin: '12px 0 4px' }}>
                      S/. {selected.precios.bronce}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#8888aa' }}>
                      + S/. {formatPrecio(selected.precios.bronce).igv} IGV
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: '#8888aa', marginTop: '16px', lineHeight: '2' }}>
                    <li>✅ Sub-módulo A</li>
                    <li>✅ 1 Usuario Admin</li>
                    <li>✅ Cecilia Base</li>
                    <li>❌ Atlas Avanzado</li>
                  </ul>
                </div>

                {/* Plata */}
                <div style={{
                  background: 'rgba(124, 58, 237, 0.08)',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#8b5cf6',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '20px'
                  }}>
                    RECOMENDADO
                  </div>
                  <div>
                    <h5 style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>PLATA</h5>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', margin: '12px 0 4px' }}>
                      S/. {selected.precios.plata}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#a78bfa' }}>
                      + S/. {formatPrecio(selected.precios.plata).igv} IGV
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: '#8888aa', marginTop: '16px', lineHeight: '2' }}>
                    <li>✅ Sub-módulos A + B</li>
                    <li>✅ Hasta 5 Usuarios</li>
                    <li>✅ Cecilia White-Label</li>
                    <li>✅ Atlas Activo</li>
                  </ul>
                </div>

                {/* Oro */}
                <div style={{
                  background: '#161625',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h5 style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>ORO</h5>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', margin: '12px 0 4px' }}>
                      S/. {selected.precios.oro}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#8888aa' }}>
                      + S/. {formatPrecio(selected.precios.oro).igv} IGV
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: '#8888aa', marginTop: '16px', lineHeight: '2' }}>
                    <li>✅ Sub-módulos A + B + C</li>
                    <li>✅ Usuarios Ilimitados</li>
                    <li>✅ Cecilia Especializada</li>
                    <li>✅ Atlas Completo</li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Ecosistema IA (Cecilia + Atlas) debajo de los módulos */}
        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Cecilia Block */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(13, 13, 22, 0.8) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            padding: '40px',
            borderRadius: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem' }}>👩‍💼</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>Cecilia IA Integrada</h4>
            </div>
            <p style={{ color: '#8888aa', lineHeight: '1.7', fontSize: '0.95rem' }}>
              Nuestra asistente virtual autónoma especializada por industria. Cecilia conoce el contexto específico de tu negocio, guía el proceso de onboarding paso a paso tras la instalación del instalador .exe y atiende solicitudes de soporte técnico 24/7 en línea directamente desde tu panel de control.
            </p>
          </div>

          {/* Atlas Block */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(13, 13, 22, 0.8) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            padding: '40px',
            borderRadius: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>Atlas Ciberseguridad</h4>
            </div>
            <p style={{ color: '#8888aa', lineHeight: '1.7', fontSize: '0.95rem' }}>
              El perro guardián del ecosistema Axyntrax. Atlas opera de forma silenciosa e ininterrumpida en segundo plano dentro del instalador para monitorear y bloquear automáticamente cualquier intento de manipulación del código, ingeniería inversa o hackeo, manteniendo la integridad de tus datos de forma autónoma.
            </p>
          </div>

        </div>

        {/* CTA Final */}
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '16px', color: '#ffffff' }}>
            ¿Listo para llevar tu industria al siguiente nivel?
          </h3>
          <p style={{ color: '#8888aa', marginBottom: '32px' }}>
            Prueba gratis por 45 días sin compromisos. Instalador .exe disponible para todos los módulos.
          </p>
          <a href="/activar" style={{
            background: 'linear-gradient(135deg, #00f5ff, #6366f1)',
            color: '#000000',
            padding: '16px 40px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '900',
            fontSize: '1.05rem',
            boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
            display: 'inline-block',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>
            Activa tu módulo — 45 días gratis
          </a>
        </div>

      </div>
    </section>
  );
}
