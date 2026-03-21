import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ReportData } from "./generate-pdf-v2";

function asText(value: unknown, fallback = "Non disponible"): string {
  if (value == null || value === "") {
    return fallback;
  }
  return String(value);
}

export async function generateFallbackPdf(data: ReportData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const width = page.getWidth();
  const height = page.getHeight();

  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - 56;
  const left = 48;
  const maxWidth = width - left * 2;

  page.drawText("Scanimmo", {
    x: left,
    y,
    size: 24,
    font: serif,
    color: rgb(0.06, 0.17, 0.29),
  });

  y -= 28;
  page.drawText("Rapport simplifie", {
    x: left,
    y,
    size: 16,
    font: sansBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  y -= 22;
  page.drawText(`Adresse: ${asText(data.adresse)}`, {
    x: left,
    y,
    size: 11,
    font: sans,
    maxWidth,
  });

  y -= 16;
  page.drawText(`Matricule: ${data.matricule}`, {
    x: left,
    y,
    size: 11,
    font: sans,
  });

  y -= 16;
  page.drawText(`Municipalite: ${asText(data.municipalite)}`, {
    x: left,
    y,
    size: 11,
    font: sans,
  });

  y -= 16;
  page.drawText(`Niveau de rapport: ${data.tier}`, {
    x: left,
    y,
    size: 11,
    font: sans,
  });

  y -= 34;
  page.drawRectangle({
    x: left,
    y: y - 54,
    width: maxWidth,
    height: 72,
    borderColor: rgb(0.82, 0.82, 0.82),
    borderWidth: 1,
  });

  page.drawText(`${Math.round(data.score)} / 100`, {
    x: left + 18,
    y: y - 12,
    size: 28,
    font: sansBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(asText(data.score_label), {
    x: left + 20,
    y: y - 36,
    size: 12,
    font: sans,
    color: rgb(0.35, 0.35, 0.35),
  });

  y -= 92;
  page.drawText("Facteurs principaux", {
    x: left,
    y,
    size: 14,
    font: sansBold,
  });

  y -= 20;
  const factors = data.score_factors.length > 0 ? data.score_factors : ["Aucun facteur detaille disponible"];
  for (const factor of factors.slice(0, 5)) {
    page.drawText(`- ${factor}`, {
      x: left + 10,
      y,
      size: 11,
      font: sans,
      maxWidth: maxWidth - 10,
    });
    y -= 16;
  }

  y -= 10;
  page.drawText("Resume proprieté", {
    x: left,
    y,
    size: 14,
    font: sansBold,
  });

  y -= 20;
  const summaryLines = [
    `Zonage: ${asText(data.zone_code)}`,
    `Superficie: ${asText(data.superficie_m2)} m2`,
    `Valeur totale: ${asText(data.valeur_totale)} $`,
    `Pente moyenne: ${asText(data.pente_moyenne_pct)} %`,
    `Zone inondable 0-20 ans: ${data.zone_inondable_0_20 ? "Oui" : "Non"}`,
    `Contamination: ${asText(data.contamination_statut, "Non disponible")}`,
  ];

  for (const line of summaryLines) {
    page.drawText(line, {
      x: left + 10,
      y,
      size: 11,
      font: sans,
      maxWidth: maxWidth - 10,
    });
    y -= 16;
  }

  y -= 16;
  page.drawText(
    "Version simplifiee generee automatiquement. Certaines sections riches peuvent etre indisponibles en mode degrade.",
    {
      x: left,
      y,
      size: 9,
      font: sans,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth,
      lineHeight: 12,
    },
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
