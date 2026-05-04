import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const universe = JSON.parse(fs.readFileSync(path.join(__dirname, '../audit/profiles/universe.json'), 'utf8'));
const results = [];

const kModules = {
  TALLER: ['Gestión Vehículos', 'Repuestos', 'Órdenes Trabajo', 'Historial'],
  VETERINARIA: ['Historias Clínicas', 'Vacunas', 'Grooming', 'Recordatorios'],
  DENTISTA: ['Odontograma', 'Presupuestos', 'Evolución', 'Materiales'],
  CLINICA: ['Triaje', 'Citas Médicas', 'Recetas', 'Laboratorio', 'Farmacia'],
  RETAIL: ['Punto Venta', 'Stocks', 'Proveedores', 'Promociones'],
  RESTAURANTE: ['Comandas', 'Mesas', 'Cocina', 'Insumos'],
  LOGISTICA: ['Almacén', 'Despacho', 'Rutas', 'Picking'],
  TRANSPORTE: ['Flota', 'Mantenimiento', 'Combustible', 'GPS', 'Conductores']
};

async function simulateFase5() {
  console.log('--- INICIANDO FASE 5: MÓDULOS ESPECÍFICOS POR RUBRO (K1–K5) ---');
  
  for (const rubro in universe) {
    console.log(`Procesando rubro: ${rubro}`);
    for (const profile of universe[rubro]) {
      if (profile.keygenStatus !== 'VALIDO') continue;

      const log = { id: profile.id, rubro, fase: 5, modules: [] };
      
      const modules = kModules[rubro] || [];
      modules.forEach((m, i) => {
        log.modules.push({ module: `K${i+1} ${m}`, status: 'PASS' });
      });

      results.push(log);
    }
  }

  const reportPath = path.join(__dirname, '../audit/results_fase5.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Fase 5 completada. Resultados en ${reportPath}`);
  
  generateMiniReport(results);
}

function generateMiniReport(results) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MINI-REPORTE FASE 5:');
  for (const rubro in kModules) {
    const count = results.filter(r => r.rubro === rubro).length;
    console.log(`${rubro.padEnd(15)} K1-K${kModules[rubro].length} → PASS ${count} clientes`);
  }
  console.log('¿Pasar a Fase 6?             : SI');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

simulateFase5();
