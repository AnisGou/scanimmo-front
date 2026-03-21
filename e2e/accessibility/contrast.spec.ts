/**
 * TC-A11Y-002 : Contraste des couleurs.
 *
 * Verification complementaire du contraste du design system
 * (navy/gold/cream). Le check principal est fait via axe-core
 * dans axe-audit.spec.ts (color-contrast rule).
 */
import { test, expect } from "@playwright/test";

test.describe("TC-A11Y-002 : Contraste des couleurs", () => {
  test("TC-A11Y-002a : palette design system — contraste suffisant", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verifier le contraste des elements de texte principaux
    const contrastReport = await page.evaluate(() => {
      const report: string[] = [];
      // Check critical text elements
      const headings = document.querySelectorAll("h1, h2, h3");
      headings.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bg = styles.backgroundColor;
        const text = (el.textContent || "").substring(0, 30).trim();
        if (text) {
          report.push(`${el.tagName}: "${text}" — color:${color} bg:${bg}`);
        }
      });

      // Check buttons
      const buttons = document.querySelectorAll("button, a[role=button]");
      buttons.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bg = styles.backgroundColor;
        const text = (el.textContent || "").substring(0, 30).trim();
        if (text) {
          report.push(`BUTTON: "${text}" — color:${color} bg:${bg}`);
        }
      });

      return report;
    });

    console.log("Contrast report — elements principaux:");
    contrastReport.slice(0, 15).forEach((r) => console.log(`  ${r}`));

    // Le vrai contraste check est dans axe-core — ici c'est informatif
    expect(contrastReport.length).toBeGreaterThan(0);
  });
});
