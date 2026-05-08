import React from 'react';

export default function Navbar({ activeLink }) {
  return (
    <nav style={{
      height: '90px',
      background: 'rgba(5, 5, 8, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
      position: 'fixed',
      width: '100%',
      top: 0,
      left: 0,
      zIndex: 1000,
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Axyntrax Logo" style={{ height: '55px', objectFit: 'contain' }} />
        </a>
        <ul style={{
          display: 'flex',
          gap: '32px',
          listStyle: 'none',
          alignItems: 'center',
          margin: 0,
          padding: 0
        }}>
          <li>
            <a href="/soluciones" style={{
              color: activeLink === 'soluciones' ? '#00f5ff' : '#e8e8f0',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: activeLink === 'soluciones' ? '600' : '500',
              transition: 'color 0.3s'
            }}>
              Soluciones
            </a>
          </li>
          <li>
            <a href="/#nosotros" style={{
              color: '#e8e8f0',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Sobre nosotros
            </a>
          </li>
          <li>
            <a href="/#descargas" style={{
              color: '#e8e8f0',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Descargas
            </a>
          </li>
          <li>
            <a href="/#precios" style={{
              color: '#e8e8f0',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'color 0.3s'
            }}>
              Precios
            </a>
          </li>
          <li>
            <a href="/activar" style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s'
            }}>
              Prueba Gratis
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
