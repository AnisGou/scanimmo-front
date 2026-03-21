/**
 * TC-SRC-001/002 E2E : Parcours recherche complet.
 *
 * Flow : "/" -> saisie adresse -> autocomplete -> selection -> /preview/[matricule]
 * Home page: inline SearchEngine with 3 tabs (Adresse, Matricule, GPS).
 * Placeholder: "2860, rue Gabriel-Le Prevost, Quebec..."
 * Button: "Analyser" (with arrow unicode)
 * Suggestions: <div> elements in absolute positioned dropdown, use onMouseDown.
 */
import { test, expect } from "@playwright/test";

const GOLDEN = {
  address_partial: "2860 Gabriel",
  address_match: "GABRIEL",
  matricule: "438188918610000000",
};

const SEARCH_PLACEHOLDER = "2860, rue Gabriel-Le Prevost, Quebec...";

test.describe("TC-SRC-001/002 E2E : Parcours recherche", () => {
  test("TC-SRC-001 E2E : saisie adresse -> suggestions -> selection -> preview", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER);
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Type partial address — triggers autocomplete after 200ms debounce
    await searchInput.click();
    await searchInput.fill(GOLDEN.address_partial);

    // Wait for the suggestion footer "X resultat(s)" to appear
    const resultFooter = page.getByText(/resultat/i);
    await expect(resultFooter).toBeVisible({ timeout: 8000 });

    // Click on the "Mun." label inside the first suggestion.
    // The suggestion item's parent div has onMouseDown handler that navigates.
    // Using ^Mun\. ensures we hit the inner div (not a parent container).
    const munLabel = page.getByText(/^Mun\.\s/).first();
    await expect(munLabel).toBeVisible();
    await munLabel.click();

    // Should navigate to /preview/[matricule]
    await page.waitForURL(/\/preview\/\d+/, { timeout: 15000 });

    // Verify preview page loaded
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("TC-SRC-001 E2E : bouton Analyser soumet la recherche via matricule exact", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to Matricule tab (use button role to avoid strict mode)
    await page.getByRole("button", { name: /matricule/i }).click();

    // Fill the matricule input
    const matInput = page.getByPlaceholder("438188918610000000");
    await expect(matInput).toBeVisible({ timeout: 3000 });
    await matInput.fill(GOLDEN.matricule);

    // Click Analyser button
    await page.locator('button:has-text("Analyser")').first().click();

    // Should navigate to preview
    await page.waitForURL(`/preview/${GOLDEN.matricule}`, { timeout: 15000 });
  });

  test("TC-SRC-002 E2E : debounce — suggestions apparaissent apres delai", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER);
    await searchInput.fill("2860 Gabriel");
    await searchInput.focus();

    // Wait for suggestions to appear (debounce 250ms + RPC latency)
    // The footer shows "X resultat(s)"
    const resultFooter = page.getByText(/resultat/i);
    await expect(resultFooter).toBeVisible({ timeout: 8000 });
  });

  test("TC-SRC-001 E2E : recherche invalide -> pas de navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to Matricule tab and enter invalid matricule
    await page.getByRole("button", { name: /matricule/i }).click();

    const matInput = page.getByPlaceholder("438188918610000000");
    await matInput.fill("000000000000000000");

    await page.locator('button:has-text("Analyser")').first().click();

    // Wait — should not navigate to preview (API returns error)
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain("/preview/");
  });

  test("TC-SRC-001 E2E : champ recherche rendu sur page accueil", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 3 tab buttons should be visible
    await expect(
      page.getByRole("button", { name: /adresse/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /matricule/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /gps/i })).toBeVisible();

    // Search input should be visible with correct placeholder
    const searchInput = page.getByPlaceholder(SEARCH_PLACEHOLDER);
    await expect(searchInput).toBeVisible();

    // Analyser button
    await expect(
      page.locator('button:has-text("Analyser")').first()
    ).toBeVisible();
  });
});
