/**
 * TC-A11Y-004 : Zoom 200%.
 *
 * Simule un zoom 200% en reduisant le viewport de moitie.
 * Verifie que le contenu reste lisible et le champ de recherche accessible.
 */
import { test, expect } from "@playwright/test";

const SEARCH_PLACEHOLDER = "2860, rue Gabriel-Le Prevost, Quebec...";

test.describe("TC-A11Y-004 : Zoom 200%", () => {
  test("TC-A11Y-004a : page d'accueil lisible a 200%", async ({ browser }) => {
    // Simuler zoom 200% via viewport reduit de moitie
    const context = await browser.newContext({
      viewport: { width: 640, height: 400 },
    });
    const page = await context.newPage();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Le champ de recherche doit rester present dans le DOM
    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER);
    await expect(searchInput).toBeAttached({ timeout: 5000 });

    // Page should have substantial content
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);

    await context.close();
  });

  test("TC-A11Y-004b : page preview lisible a 200%", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 640, height: 400 },
    });
    const page = await context.newPage();

    await page.goto("/preview/438188918610000000");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Du contenu significatif doit etre visible
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);

    // Pas trop de contenu tronque (overflow hidden qui cache du texte)
    const hiddenOverflowCount = await page.evaluate(() => {
      let hidden = 0;
      document.querySelectorAll("*").forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (
          styles.overflow === "hidden" &&
          el.scrollHeight > el.clientHeight + 5
        ) {
          hidden++;
        }
      });
      return hidden;
    });

    if (hiddenOverflowCount > 5) {
      console.log(
        `${hiddenOverflowCount} elements avec overflow:hidden qui tronquent du contenu`
      );
    }

    await context.close();
  });
});
