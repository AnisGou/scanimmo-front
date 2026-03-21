/**
 * Convertit HTML en PDF buffer
 * @description Utilise Puppeteer pour générer un PDF depuis HTML
 */

import puppeteer from "puppeteer-core";

export async function convertHtmlToPdf(html: string): Promise<Buffer> {
  let browser;

  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Charger le HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Générer le PDF — marges gérées par le HTML
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ Erreur conversion HTML → PDF:", error);
    throw new Error("Erreur génération PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
