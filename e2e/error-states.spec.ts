/**
 * TC-FE-005 E2E : Etats d'erreur et securite.
 *
 * Verifie : page 404 propre, pas de stack traces, pas de secrets,
 * pas de SUPABASE_SERVICE_ROLE dans le HTML client.
 */
import { test, expect } from "@playwright/test";

test.describe("TC-FE-005 E2E : Etats d'erreur", () => {
  test("TC-FE-005 E2E : page 404 propre", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");
    await page.waitForLoadState("networkidle");

    // Use innerText (visible text only) — textContent includes RSC script data
    const visibleText = await page.innerText("body");
    expect(visibleText).toBeTruthy();

    // No stack trace visible to the user
    expect(visibleText).not.toMatch(/at\s+\w+\s*\(/);
    expect(visibleText).not.toMatch(/TypeError|ReferenceError|SyntaxError/);
    expect(visibleText).not.toMatch(/node_modules/);

    // Should display 404 message
    expect(visibleText).toMatch(/404|not found|introuvable/i);
  });

  test("TC-FE-005 E2E : pas de secrets dans le HTML source", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const html = await page.content();

    // These patterns MUST NOT appear in client-side HTML
    const forbidden = [
      /SUPABASE_SERVICE_ROLE/,
      /service_role/,
      /sk_live_/,
      /sk_test_/,
      /STRIPE_SECRET_KEY/,
      /STRIPE_WEBHOOK_SECRET/,
      /whsec_/,
    ];

    for (const pattern of forbidden) {
      expect(html).not.toMatch(pattern);
    }
  });

  test("TC-FE-005 E2E : pas de secrets dans la page preview", async ({
    page,
  }) => {
    await page.goto("/preview/438188918610000000");
    await page.waitForLoadState("networkidle");
    const html = await page.content();

    const forbidden = [
      /SUPABASE_SERVICE_ROLE/,
      /service_role/,
      /sk_live_/,
      /sk_test_/,
    ];

    for (const pattern of forbidden) {
      expect(html).not.toMatch(pattern);
    }
  });

  test("TC-FE-005 E2E : /api/resolve POST sans body -> erreur propre", async ({
    request,
  }) => {
    const response = await request.post("/api/resolve", {
      data: {},
    });

    // Should return 400 with error message, not 500
    expect([400, 422]).toContain(response.status());
  });

  test("TC-FE-005 E2E : console.error minimal sur page accueil", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors (hydration warnings, etc.)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Hydration") &&
        !e.includes("Warning:") &&
        !e.includes("ResizeObserver")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
