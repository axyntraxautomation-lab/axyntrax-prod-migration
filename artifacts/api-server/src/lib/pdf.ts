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
