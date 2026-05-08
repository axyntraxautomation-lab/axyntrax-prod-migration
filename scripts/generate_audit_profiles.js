import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rubros = [
  'TALLER', 'VETERINARIA', 'DENTISTA', 'CLINICA', 
  'RETAIL', 'RESTAURANTE', 'LOGISTICA', 'TRANSPORTE'
];

const ciudades = ['Arequipa', 'Lima', 'Cusco', 'Trujillo', 'Piura'];
const metodos = ['YAPE', 'PLIN', 'TARJETA', 'TRANSFERENCIA'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProfile(rubro, index) {
  let perfil = '';
  let plan = '';
  
  if (index <= 10) { perfil = 'excelente'; plan = 'ENTERPRISE'; }
  else if (index <= 20) { perfil = 'medio'; plan = 'PRO'; }
  else if (index <= 30) { perfil = 'bajo'; plan = 'BASIC'; }
  else { perfil = 'perdida'; plan = 'TRIAL'; }

  const id = `CLI-${rubro}-${index.toString().padStart(3, '0')}`;
  const ruc = `20${Math.random().toString().slice(2, 11).padEnd(9, '0')}`;
  const telefono = `9${Math.random().toString().slice(2, 10).padEnd(8, '0')}`;
  const email = `test${rubro.toLowerCase()}${index}${getRandomInt(10,99)}@gmail.com`;
  
  // Escenarios especiales
  let keygenStatus = 'VALIDO';
  if ([5, 12, 19, 26, 33].includes(index)) keygenStatus = 'EXPIRADO';
  if ([7, 15, 23].includes(index)) keygenStatus = 'INVALIDO';
  
  let specialTag = null;
  if ([9, 17].includes(index)) specialTag = 'PAGO_DOBLE';
  if ([21, 25, 29, 35].includes(index)) specialTag = 'REEMBOLSO';
  if ([11, 16, 22].includes(index)) specialTag = 'UPGRADE';
  if ([1, 8, 14].includes(index)) specialTag = 'REFERIDOR';

  return {
    id,
    nombre: `Cliente ${rubro} ${index}`,
    empresa: `Negocio ${rubro} ${index} SAC`,
    ruc,
    telefono,
    email,
    ciudad: ciudades[getRandomInt(0, 4)],
    rubro,
    perfil,
    plan,
    metodo_pago: metodos[getRandomInt(0, 3)],
    keygen: `AXY-${rubro}-2026-${Math.random().toString().slice(2, 8)}`,
    password: `Test2026@${Math.random().toString(36).slice(2, 6)}`,
    meses_data: 3,
    keygenStatus,
    specialTag
  };
}

const allProfiles = {};

rubros.forEach(rubro => {
  allProfiles[rubro] = [];
  for (let i = 1; i <= 40; i++) {
    allProfiles[rubro].push(generateProfile(rubro, i));
  }
});

const outputPath = path.join(__dirname, '../audit/profiles/universe.json');
fs.writeFileSync(outputPath, JSON.stringify(allProfiles, null, 2));

console.log(`320 perfiles generados en ${outputPath}`);
