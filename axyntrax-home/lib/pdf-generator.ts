import { jsPDF } from 'jspdf';

interface QuoteData {
  nombre: string;
  empresa: string;
  telefono: string;
  modulo: string;
  precioBase: number;
  extras: { name: string; price: number }[];
}

export async function generateQuotePDF(data: QuoteData): Promise<Buffer> {
  const doc = new jsPDF();
  
  // --- HEADER: TECH BAR ---
  doc.setFillColor(5, 5, 10);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Cyan Accent Line
  doc.setFillColor(0, 212, 255);
  doc.rect(0, 43, 210, 2, 'F');
  
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('AXYNTRAX', 20, 25);
  doc.setTextColor(255, 255, 255);
  doc.text('AUTOMATION', 75, 25);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('SISTEMA DE ORQUESTACIÓN EMPRESARIAL CON IA', 20, 35);

  // --- QUOTE INFO BOX ---
  doc.setFillColor(245, 248, 250);
  doc.roundedRect(130, 55, 65, 30, 3, 3, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN #', 135, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.floor(Math.random()*10000).toString().padStart(6, '0')}`, 165, 65);
  doc.text('FECHA:', 135, 75);
  doc.text(`${new Date().toLocaleDateString()}`, 155, 75);

  // --- CLIENT SECTION ---
  doc.setTextColor(10, 10, 15);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESENTADO A:', 20, 60);
  doc.line(20, 62, 55, 62);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`CLIENTE: ${data.nombre.toUpperCase()}`, 20, 72);
  doc.text(`EMPRESA: ${data.empresa.toUpperCase()}`, 20, 78);
  doc.text(`ID SERVICIO: AX-ORQ-${data.modulo.substring(0,3).toUpperCase()}`, 20, 84);

  // --- TABLE HEADER ---
  doc.setFillColor(10, 10, 15);
  doc.rect(20, 100, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLUCIÓN TECNOLÓGICA', 25, 108);
  doc.text('INVERSIÓN MENSUAL', 150, 108);

  // --- ITEMS ---
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`MÓDULO: ${data.modulo}`, 25, 122);
  doc.text(`S/ ${data.precioBase.toFixed(2)}`, 150, 122);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Incluye 3 submódulos base, soporte 24/7 de Cecilia AI y acceso a Jarvis Panel.', 25, 128);

  let y = 140;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  data.extras.forEach(extra => {
    doc.text(`+ Complemento: ${extra.name}`, 25, y);
    doc.text(`S/ ${extra.price.toFixed(2)}`, 150, y);
    y += 10;
  });

  // --- SUMMARY ---
  const total = data.precioBase + data.extras.reduce((acc, curr) => acc + curr.price, 0);
  doc.setFillColor(245, 248, 250);
  doc.rect(130, y + 5, 60, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 135, y + 15);
  doc.text(`${total.toFixed(2)}`, 165, y + 15);
  
  doc.text('IGV (18%):', 135, y + 25);
  doc.text(`${(total * 0.18).toFixed(2)}`, 165, y + 25);
  
  doc.setTextColor(0, 180, 216);
  doc.setFontSize(14);
  doc.text('TOTAL:', 135, y + 38);
  doc.text(`S/ ${(total * 1.18).toFixed(2)}`, 160, y + 38);

  // --- SIGNATURE & FOOTER ---
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('VALIDADO POR:', 20, 240);
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 15);
  doc.text('Cecilia Neural Assistant', 20, 250);
  doc.line(20, 252, 70, 252);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Esta es una cotización generada automáticamente por la red neural de Axyntrax Automation.', 20, 275);
  doc.text('Arequipa - Perú | RUC 10406750324 | axyntrax-automation.net', 20, 280);

  return Buffer.from(doc.output('arraybuffer'));
}
