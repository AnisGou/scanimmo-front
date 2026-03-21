/**
 * Convertit HTML en PDF buffer
 * @description Utilise Puppeteer pour generer un PDF depuis HTML
 */

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

async function launchBrowser() {
  if (isVercelRuntime()) {
    const [{ default: chromium }, puppeteerModule] = await Promise.all([
      import("@sparticuz/chromium"),
      import("puppeteer-core"),
    ]);

    const puppeteer = puppeteerModule.default;
    const executablePath = await chromium.executablePath();

    return puppeteer.launch({
      args: puppeteer.defaultArgs({
        args: chromium.args,
        headless: "shell",
      }),
      executablePath,
      headless: "shell",
    });
  }

  const puppeteerModule = await import("puppeteer");
  const puppeteer = puppeteerModule.default;

  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function waitForFonts(page: { evaluate: (fn: () => Promise<void>) => Promise<void> }) {
  try {
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });
  } catch (error) {
    console.warn("[pdf] Polices non confirmees avant rendu PDF", error);
  }
}

export async function convertHtmlToPdf(html: string): Promise<Buffer> {
  let browser;

  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1810 });

    // Charger le HTML sans attendre un idle reseau strict, puis laisser
    // les polices terminer si elles sont disponibles.
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await waitForFonts(page);

    // Generer le PDF - marges gerees par le HTML.
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      timeout: 60_000,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("[pdf] Erreur conversion HTML -> PDF:", error);
    throw new Error("Erreur generation PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
