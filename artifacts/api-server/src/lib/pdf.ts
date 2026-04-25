import PDFDocument from "pdfkit";

export interface QuoteItemPdf {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuotePdfInput {
  quoteId: number;
  createdAt: Date;
  validUntil: Date;
  client: { name: string; email: string; phone?: string | null };
  items: QuoteItemPdf[];
  currency: string;
  subtotal: number;
  igv: number;
  total: number;
}

const CYAN = "#06b6d4";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function fmtMoney(currency: string, n: number): string {
  return `${currency} ${n.toFixed(2)}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export interface LicensePdfInput {
  clientModuleId: number;
  client: { name: string; email?: string | null };
  moduleName: string;
  moduleSlug: string;
  industry: string;
  licenseKey: string;
  status: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
}

export async function renderLicensePdf(
  input: LicensePdfInput,
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header band
    doc.rect(0, 0, doc.page.width, 110).fill(CYAN);
    doc
      .fillColor("#ffffff")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("AXYNTRAX AUTOMATION", 56, 38);
    doc
      .fillColor("#e0f7fb")
      .fontSize(10)
      .font("Helvetica")
      .text("Certificado de Licencia de Módulo", 56, 72);

    let y = 150;
    doc
      .fillColor(TEXT)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(input.moduleName, 56, y);
    y += 26;
    doc
      .fillColor(MUTED)
      .fontSize(10)
      .font("Helvetica")
      .text(`Módulo: ${input.moduleSlug} · Rubro: ${input.industry}`, 56, y);
    y += 30;

    doc
      .fillColor(TEXT)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Titular de la licencia", 56, y);
    y += 16;
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(input.client.name, 56, y);
    y += 14;
    if (input.client.email) {
      doc.fillColor(MUTED).text(input.client.email, 56, y);
      y += 14;
    }
    y += 12;

    doc
      .fillColor(TEXT)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Clave de licencia", 56, y);
    y += 16;
    doc
      .rect(56, y, 480, 36)
      .lineWidth(1)
      .stroke(CYAN);
    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor(TEXT)
      .text(input.licenseKey, 64, y + 10);
    y += 56;

    doc
      .fillColor(MUTED)
      .fontSize(10)
      .font("Helvetica")
      .text(`Estado: ${input.status}`, 56, y);
    y += 14;
    if (input.activatedAt) {
      doc.text(`Activado: ${fmtDate(input.activatedAt)}`, 56, y);
      y += 14;
    }
    if (input.expiresAt) {
      doc.text(`Vence: ${fmtDate(input.expiresAt)}`, 56, y);
      y += 14;
    }
    y += 14;

    doc
      .fillColor(TEXT)
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Esta licencia es personal e intransferible. Su uso indebido, copia o distribución a terceros está prohibido y puede dar lugar a la suspensión inmediata del módulo y a las acciones legales correspondientes según la normativa peruana vigente. AXYNTRAX AUTOMATION mantiene el monitoreo remoto y puede aplicar actualizaciones de seguridad sin previo aviso.",
        56,
        y,
        { width: 480, align: "justify" },
      );

    doc
      .fillColor(MUTED)
      .fontSize(9)
      .text(
        `Certificado N° ${String(input.clientModuleId).padStart(8, "0")} · Emitido ${fmtDate(new Date())} · AXYNTRAX AUTOMATION · Arequipa, Perú`,
        56,
        doc.page.height - 70,
        { width: 480, align: "center" },
      );

    doc.end();
  });
}

export async function renderQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fillColor(CYAN)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("AXYNTRAX AUTOMATION", 48, 48);
    doc
      .fillColor(MUTED)
      .fontSize(9)
      .font("Helvetica")
      .text("Arequipa, Perú · automatizaciones de negocio con IA", 48, 76);

    doc
      .fillColor(TEXT)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(`Cotización N° ${String(input.quoteId).padStart(6, "0")}`, 48, 110);

    doc
      .fillColor(MUTED)
      .fontSize(10)
      .font("Helvetica")
      .text(`Fecha de emisión: ${fmtDate(input.createdAt)}`, 48, 132)
      .text(`Válida hasta: ${fmtDate(input.validUntil)}`, 48, 146);

    // Cliente
    doc
      .fillColor(TEXT)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Cliente", 48, 178);
    doc
      .fillColor(TEXT)
      .fontSize(10)
      .font("Helvetica")
      .text(input.client.name, 48, 194)
      .text(input.client.email, 48, 208);
    if (input.client.phone) doc.text(input.client.phone, 48, 222);

    // Tabla
    const tableTop = 260;
    doc
      .fillColor("#ffffff")
      .rect(48, tableTop, 499, 22)
      .fill(CYAN);
    doc
      .fillColor("#ffffff")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Módulo", 56, tableTop + 6)
      .text("Cant.", 340, tableTop + 6, { width: 40, align: "right" })
      .text("P. Unit.", 390, tableTop + 6, { width: 70, align: "right" })
      .text("Total", 470, tableTop + 6, { width: 70, align: "right" });

    let y = tableTop + 30;
    doc.fillColor(TEXT).font("Helvetica").fontSize(10);
    for (const it of input.items) {
      doc
        .text(it.name, 56, y, { width: 280 })
        .text(String(it.qty), 340, y, { width: 40, align: "right" })
        .text(fmtMoney(input.currency, it.unitPrice), 390, y, {
          width: 70,
          align: "right",
        })
        .text(fmtMoney(input.currency, it.lineTotal), 470, y, {
          width: 70,
          align: "right",
        });
      y += 22;
    }

    // Totales
    y += 16;
    doc
      .fontSize(10)
      .fillColor(MUTED)
      .text("Subtotal", 390, y, { width: 70, align: "right" });
    doc
      .fillColor(TEXT)
      .text(fmtMoney(input.currency, input.subtotal), 470, y, {
        width: 70,
        align: "right",
      });
    y += 16;
    doc
      .fillColor(MUTED)
      .text("IGV (18%)", 390, y, { width: 70, align: "right" });
    doc
      .fillColor(TEXT)
      .text(fmtMoney(input.currency, input.igv), 470, y, {
        width: 70,
        align: "right",
      });
    y += 18;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(CYAN)
      .text("Total mensual", 380, y, { width: 80, align: "right" });
    doc
      .fillColor(TEXT)
      .text(fmtMoney(input.currency, input.total), 470, y, {
        width: 70,
        align: "right",
      });

    // Footer
    doc
      .font("Helvetica")
      .fillColor(MUTED)
      .fontSize(9)
      .text(
        "Precios mensuales recurrentes. Activación inmediata al aceptar la cotización. " +
          "Para coordinar el alta del servicio respondé este correo o ingresá al portal AXYNTRAX.",
        48,
        720,
        { width: 499, align: "left" },
      );

    doc.end();
  });
}
