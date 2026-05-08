import { logger } from "./logger";

export type SunatComprobanteInput = {
  tipo: "boleta" | "factura";
  serie: string;
  correlativo: number;
  emisor: {
    ruc: string;
    razonSocial: string;
    direccion: string;
  };
  receptor: {
    tipoDoc: "1" | "6";
    numDoc: string;
    razonSocial: string;
  };
  items: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  moneda: string;
  fechaEmision: Date;
};

export type SunatResult = {
  xml: string;
  sentToSunat: boolean;
  note: string | null;
};

const IGV_RATE = 0.18;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export function buildComprobanteXml(input: SunatComprobanteInput): string {
  const tipoDocCode = input.tipo === "factura" ? "01" : "03";
  const id = `${input.serie}-${String(input.correlativo).padStart(8, "0")}`;
  const fecha = input.fechaEmision.toISOString().slice(0, 10);

  let subtotal = 0;
  const itemsXml = input.items
    .map((it, idx) => {
      const value = it.cantidad * it.precioUnitario;
      subtotal += value;
      return `    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="NIU">${fmt(it.cantidad)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${escapeXml(input.moneda)}">${fmt(value)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escapeXml(it.descripcion)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${escapeXml(input.moneda)}">${fmt(it.precioUnitario)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`;
    })
    .join("\n");

  const igv = +(subtotal * IGV_RATE).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${id}</cbc:ID>
  <cbc:IssueDate>${fecha}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${tipoDocCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(input.moneda)}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${escapeXml(input.emisor.ruc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(input.emisor.razonSocial)}</cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressLine>${escapeXml(input.emisor.direccion)}</cbc:AddressLine>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${input.receptor.tipoDoc}">${escapeXml(input.receptor.numDoc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(input.receptor.razonSocial)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escapeXml(input.moneda)}">${fmt(igv)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escapeXml(input.moneda)}">${fmt(subtotal)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escapeXml(input.moneda)}">${fmt(igv)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escapeXml(input.moneda)}">${fmt(subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${escapeXml(input.moneda)}">${fmt(total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escapeXml(input.moneda)}">${fmt(total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${itemsXml}
</Invoice>`;
}

export async function emitirComprobante(input: SunatComprobanteInput): Promise<SunatResult> {
  const xml = buildComprobanteXml(input);
  const ruc = process.env.SUNAT_RUC;
  const usuario = process.env.SUNAT_USUARIO_SOL;
  const clave = process.env.SUNAT_CLAVE_SOL;
  const cert = process.env.SUNAT_CERT_PFX;
  if (!ruc || !usuario || !clave || !cert) {
    logger.info(
      "SUNAT: credenciales no configuradas — comprobante generado localmente, no enviado.",
    );
    return {
      xml,
      sentToSunat: false,
      note:
        "Comprobante generado localmente (UBL 2.1). El envío real a SUNAT/OSE requiere SUNAT_RUC, SUNAT_USUARIO_SOL, SUNAT_CLAVE_SOL y SUNAT_CERT_PFX.",
    };
  }
  return {
    xml,
    sentToSunat: false,
    note: "Envío SOAP a SUNAT pendiente de implementación con certificado real.",
  };
}
