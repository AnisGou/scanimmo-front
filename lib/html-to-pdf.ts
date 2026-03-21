/**
 * Convertit HTML en PDF buffer
 * @description Utilise Puppeteer pour generer un PDF depuis HTML
 */

const CHROMIUM_RELEASE = "v143.0.0";
let cachedExecutablePath: string | null = null;

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

function getChromiumPackUrl(): string {
  if (process.env.CHROMIUM_PACK_URL) {
    return process.env.CHROMIUM_PACK_URL;
  }

  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `https://github.com/Sparticuz/chromium/releases/download/${CHROMIUM_RELEASE}/chromium-v143.0.0-pack.${arch}.tar`;
}

async function getVercelExecutablePath(
  chromium: { executablePath: (location?: string) => Promise<string> },
): Promise<string> {
  if (cachedExecutablePath) {
    return cachedExecutablePath;
  }

  cachedExecutablePath = await chromium.executablePath(getChromiumPackUrl());
  return cachedExecutablePath;
}

async function launchBrowser() {
  if (isVercelRuntime()) {
    const [{ default: chromium }, puppeteerModule] = await Promise.all([
      import("@sparticuz/chromium-min"),
      import("puppeteer-core"),
    ]);

    const puppeteer = puppeteerModule.default;
    const executablePath = await getVercelExecutablePath(chromium);

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
  let stage = "launch_browser";

  try {
    browser = await launchBrowser();

    stage = "new_page";
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1810 });

    // Charger le HTML sans attendre un idle reseau strict, puis laisser
    // les polices terminer si elles sont disponibles.
    stage = "set_content";
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    stage = "wait_for_fonts";
    await waitForFonts(page);

    // Generer le PDF - marges gerees par le HTML.
    stage = "page_pdf";
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      timeout: 60_000,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("[pdf] Erreur conversion HTML -> PDF:", { stage, error });
    throw new Error(`pdf_render:${stage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
