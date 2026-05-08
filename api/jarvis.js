/**
 * JARVIS CORE — admin oculto (read-only leads).
 * Vercel: JARVIS_KEY (query ?key=). Lectura con SUPABASE_SERVICE_ROLE_KEY (RLS bloquea SELECT a anon).
 */
const axios = require('axios');

const JARVIS_KEY = String(process.env.JARVIS_KEY || '').trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

module.exports = async (req, res) => {
  const isHtml = (req.headers.accept || '').includes('text/html') || req.query.format === 'html';

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const key = String(req.query?.key ?? '').trim();
  if (!JARVIS_KEY || key !== JARVIS_KEY) {
    if (isHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(401).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Acceso Denegado — JARVIS</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
          <style>
            body {
              background-color: #0a0a0a;
              color: #ffffff;
              font-family: 'Outfit', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: rgba(255, 255, 255, 0.03);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 0, 128, 0.2);
              padding: 40px;
              border-radius: 20px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            h1 {
              color: #ff0055;
              margin-top: 0;
              font-weight: 800;
              letter-spacing: -0.5px;
            }
            p {
              color: #888;
              font-weight: 300;
              margin-bottom: 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>ACCESO DENEGADO</h1>
            <p>Se requiere una clave de autorización válida para acceder al panel de JARVIS.</p>
          </div>
        </body>
        </html>
      `);
    }
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[jarvis-leads] Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ ok: false, error: 'config' });
  }

  try {
    const { data } = await axios.get(`${SUPABASE_URL}/rest/v1/leads`, {
      params: {
        select: 'nombre,whatsapp,rubro',
        order: 'fecha.desc',
        limit: 50
      },
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json'
      },
      timeout: 15000
    });

    const rows = Array.isArray(data) ? data : [];

    if (isHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AXYNTRAX — JARVIS LEADS</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            :root {
              --bg: #050505;
              --card: #0c0c0c;
              --accent: #00f3ff;
              --accent-gradient: linear-gradient(135deg, #00f3ff, #0072ff);
              --border: rgba(255, 255, 255, 0.05);
            }
            body {
              background-color: var(--bg);
              color: #ffffff;
              font-family: 'Outfit', sans-serif;
              margin: 0;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .container {
              max-width: 1000px;
              width: 100%;
            }
            header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 1px;
              background: var(--accent-gradient);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .stats-pill {
              background: rgba(0, 243, 255, 0.1);
              border: 1px solid rgba(0, 243, 255, 0.2);
              padding: 8px 16px;
              border-radius: 50px;
              font-size: 14px;
              font-weight: 600;
              color: var(--accent);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .stats-pill span {
              width: 8px;
              height: 8px;
              background-color: var(--accent);
              border-radius: 50%;
              box-shadow: 0 0 10px var(--accent);
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0% { transform: scale(0.9); opacity: 0.6; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0.6; }
            }
            .dashboard-card {
              background-color: var(--card);
              border: 1px solid var(--border);
              border-radius: 24px;
              padding: 32px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            }
            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 24px;
            }
            h2 {
              font-size: 20px;
              font-weight: 600;
              margin: 0;
            }
            .btn-refresh {
              background: var(--accent-gradient);
              color: #000000;
              border: none;
              padding: 10px 20px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              font-family: 'Outfit', sans-serif;
            }
            .btn-refresh:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(0, 243, 255, 0.3);
            }
            .table-container {
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
            }
            th {
              padding: 16px;
              font-size: 14px;
              font-weight: 500;
              color: #666666;
              border-bottom: 1px solid var(--border);
            }
            td {
              padding: 18px 16px;
              font-size: 15px;
              border-bottom: 1px solid var(--border);
              transition: background-color 0.2s ease;
            }
            tr:hover td {
              background-color: rgba(255, 255, 255, 0.01);
            }
            .lead-name {
              font-weight: 600;
              color: #ffffff;
            }
            .lead-wa {
              color: var(--accent);
              text-decoration: none;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              transition: opacity 0.2s ease;
            }
            .lead-wa:hover {
              opacity: 0.8;
            }
            .badge-rubro {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 12px;
              color: #cccccc;
              text-transform: capitalize;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <div class="logo">AXYNTRAX</div>
              <div class="stats-pill">
                <span></span>
                ${rows.length} Leads Registrados
              </div>
            </header>
            <div class="dashboard-card">
              <div class="card-header">
                <h2>JARVIS LEADS DASHBOARD</h2>
                <button class="btn-refresh" onclick="window.location.reload()">Refrescar</button>
              </div>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>WhatsApp</th>
                      <th>Sector/Rubro</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map(r => `
                      <tr>
                        <td class="lead-name">${r.nombre}</td>
                        <td>
                          <a class="lead-wa" href="https://wa.me/${String(r.whatsapp).replace(/[^0-9]/g, '')}" target="_blank">
                            ${r.whatsapp} ↗
                          </a>
                        </td>
                        <td><span class="badge-rubro">${r.rubro ?? 'Varios'}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(200).json({
      ok: true,
      count: rows.length,
      leads: rows.map((r) => ({
        nombre: r.nombre,
        whatsapp: r.whatsapp,
        rubro: r.rubro ?? null
      }))
    });
  } catch (err) {
    console.error('[jarvis-leads]', err.response?.status, err.response?.data || err.message);
    return res.status(502).json({ ok: false, error: 'supabase' });
  }
};
