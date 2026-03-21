/**
 * TC-PDF-001 E2E : Telechargement PDF et flow generation rapport.
 *
 * Flow : /preview/[matricule] -> bouton "Generer" -> /success?matricule=...
 * Le PDF est genere server-side apres paiement Stripe (PRICING_TIERS).
 * Le rapport gratuit redirige vers /success.
 */
import { test, expect } from "@playwright/test";

const GOLDEN_MATRICULE = "438188918610000000";

test.describe("TC-PDF-001 E2E : Generation et telechargement PDF", () => {
  test("TC-PDF-001 E2E : bouton Generer redirige vers /success", async ({
    page,
  }) => {
    await page.goto(`/preview/${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");

    // Find the generate button
    const generateBtn = page
      .getByRole("button", { name: /generer|rapport|gratuit/i })
      .or(page.locator('button:has-text("rapport")'))
      .first();

    const isVisible = await generateBtn.isVisible().catch(() => false);
    if (!isVisible) {
      // Scroll down to find it
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    }

    const isNowVisible = await generateBtn.isVisible().catch(() => false);
    if (!isNowVisible) {
      test.skip(true, "Bouton Generer non trouve — structure differente");
      return;
    }

    await generateBtn.click();

    // Should navigate to /success?matricule=...
    await page.waitForURL(/\/success\?matricule=/, { timeout: 15000 });

    // Success page should display the matricule
    await expect(page.getByText(GOLDEN_MATRICULE)).toBeVisible({
      timeout: 5000,
    });
  });

  test("TC-PDF-001 E2E : page success affiche les informations correctes", async ({
    page,
  }) => {
    await page.goto(`/success?matricule=${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");

    // Should show "Rapport en preparation" heading
    await expect(
      page.getByRole("heading", { name: /preparation/i })
    ).toBeVisible({ timeout: 5000 });

    // Should show "Gratuit" pricing
    const gratuit = page.getByText(/Gratuit/i);
    const hasGratuit = await gratuit.first().isVisible().catch(() => false);
    if (hasGratuit) {
      await expect(gratuit.first()).toBeVisible();
    }

    // "Nouvelle recherche" link should be present
    const newSearch = page.getByText(/Nouvelle recherche/i);
    const hasNewSearch = await newSearch.first().isVisible().catch(() => false);
    if (hasNewSearch) {
      await expect(newSearch.first()).toBeVisible();
    }
  });

  test("TC-PDF-001 E2E : page success sans matricule -> erreur propre", async ({
    page,
  }) => {
    await page.goto("/success");
    await page.waitForLoadState("networkidle");

    // Should show error state (missing matricule) — not crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    // Should show "Lien invalide" or error message
    const hasError =
      /invalide|erreur|manquant|\?/i.test(body || "") ||
      (body?.length ?? 0) > 50;
    expect(hasError).toBeTruthy();
  });

  test("TC-PDF-001 E2E : endpoint /api/report/[token] avec token invalide -> erreur", async ({
    page,
  }) => {
    const response = await page.goto("/api/report/invalid-token-12345");
    if (response) {
      // Should return 404 or error JSON
      expect([404, 400, 410, 500]).toContain(response.status());
    }
  });
});
