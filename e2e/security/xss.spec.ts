/**
 * TC-SEC-003 : Immunite XSS.
 *
 * Verifie que les vecteurs XSS classiques injectes via le champ de recherche
 * et les parametres d'URL ne declenchent pas d'execution de script.
 * React echappe automatiquement le HTML, mais on verifie le DOM reel.
 */
import { test, expect } from "@playwright/test";

const SEARCH_PLACEHOLDER = "2860, rue Gabriel-Le Prevost, Quebec...";

const XSS_VECTORS = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert(1)>",
  "javascript:alert(1)",
  "<svg onload=alert(1)>",
  "{{constructor.constructor('alert(1)')()}}",
  "'-alert(1)-'",
  "<iframe src='javascript:alert(1)'>",
  "2860%00<script>alert(1)</script>",
  '<div onmouseover="alert(1)">hover me</div>',
  "data:text/html,<script>alert(1)</script>",
];

test.describe("TC-SEC-003 : Immunite XSS", () => {
  for (const [idx, vector] of XSS_VECTORS.entries()) {
    test(`TC-SEC-003 [${idx}] : "${vector.substring(0, 35)}..."`, async ({
      page,
    }) => {
      // Intercepter les alertes — si XSS fonctionne, alert() serait appele
      let alertTriggered = false;
      page.on("dialog", async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Injecter via le champ de recherche
      const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER);

      if (await searchInput.isVisible()) {
        await searchInput.fill(vector);
        // Soumettre (Enter)
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1000);

        // Verifier qu'aucun alert n'a ete declenche
        expect(alertTriggered).toBeFalsy();

        // Verifier que le vecteur n'est pas rendu comme HTML brut executant du JS
        const hasInjectedAlert = await page.evaluate(() =>
          Array.from(document.querySelectorAll("script:not([src])")).some(
            (s) => s.textContent?.includes("alert")
          )
        );
        expect(hasInjectedAlert).toBeFalsy();
      }
    });
  }

  test("TC-SEC-003 : XSS via URL parameter /preview/<script>", async ({
    page,
  }) => {
    let alertTriggered = false;
    page.on("dialog", async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    // Tester l'injection via les parametres d'URL
    await page.goto("/preview/<script>alert(1)</script>");
    await page.waitForTimeout(1000);
    expect(alertTriggered).toBeFalsy();
  });

  test("TC-SEC-003 : XSS via URL parameter /preview/ encoded", async ({
    page,
  }) => {
    let alertTriggered = false;
    page.on("dialog", async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    await page.goto("/preview/%3Cscript%3Ealert(1)%3C/script%3E");
    await page.waitForTimeout(1000);
    expect(alertTriggered).toBeFalsy();
  });
});
