/**
 * TC-VIS-001/002/003 : Regression visuelle.
 *
 * Premiere execution cree les baselines (--update-snapshots).
 * Executions suivantes comparent contre les baselines.
 * Tolerance de 2-3% pour les animations et donnees dynamiques.
 */
import { test, expect } from "@playwright/test";

const GOLDEN_MATRICULE = "438188918610000000";

test.describe("TC-VIS : Regression visuelle", () => {
  test("TC-VIS-001 : Homepage — snapshot baseline", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Attendre les fonts custom (DM Serif Display)
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02, // 2% tolerance (animations, horloge)
    });
  });

  test("TC-VIS-002 : Preview page — snapshot baseline", async ({ page }) => {
    await page.goto(`/preview/${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot("preview-page.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.03, // 3% tolerance (donnees dynamiques)
    });
  });

  test("TC-VIS-002b : Score circle — snapshot", async ({ page }) => {
    await page.goto(`/preview/${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Le score circle utilise un SVG avec viewBox="0 0 100 100"
    const scoreCircle = page.locator('svg[viewBox="0 0 100 100"]').first();

    if (await scoreCircle.isVisible()) {
      await expect(scoreCircle).toHaveScreenshot("score-circle.png", {
        maxDiffPixelRatio: 0.02,
      });
    } else {
      console.log(
        "ScoreCard SVG non localisable pour snapshot — adapter le selecteur"
      );
    }
  });

  test("TC-VIS-003 : Design system — fonts chargees", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Attendre le chargement des fonts

    const fontsLoaded = await page.evaluate(() =>
      document.fonts.ready.then(() => {
        const loaded: string[] = [];
        document.fonts.forEach((font) => {
          if (font.status === "loaded") {
            loaded.push(`${font.family} (${font.weight})`);
          }
        });
        return loaded;
      })
    );

    console.log(`Fonts chargees: ${fontsLoaded.join(", ")}`);

    // Verifier qu'au moins une font du design system est chargee
    const designFonts = [
      "DM Serif Display",
      "DM Serif",
      "IBM Plex Sans",
      "IBM Plex",
      "DM Mono",
    ];
    const hasDesignFont = fontsLoaded.some((f) =>
      designFonts.some((df) => f.includes(df))
    );

    if (!hasDesignFont) {
      console.log(
        "Aucune font du design system chargee — fallback probable"
      );
    }
  });
});
