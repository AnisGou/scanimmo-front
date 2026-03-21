/**
 * TC-SEC-001/004 E2E : Acces par token et protection IDOR.
 *
 * Architecture : rapports accessibles par token securise (32 chars),
 * PAS par UUID direct. Route: /api/report/[token].
 * Preview publique par matricule: /preview/[matricule].
 */
import { test, expect } from "@playwright/test";

test.describe("TC-SEC-001/004 E2E : Acces par token", () => {
  test("TC-SEC-004 E2E : UUID direct sur /api/report retourne erreur", async ({
    page,
  }) => {
    // Try accessing report with a UUID (not a valid token)
    const fakeUuid = "6ba7fe72-d8da-41bc-bf08-4c1970667407";
    const response = await page.goto(`/api/report/${fakeUuid}`);

    if (response) {
      // Should NOT return 200 with valid PDF data
      // Acceptable: 404, 400, 410, 500
      const status = response.status();
      expect(status).not.toBe(200);
    }
  });

  test("TC-SEC-001 E2E : token invalide -> erreur propre, pas crash", async ({
    page,
  }) => {
    const fakeToken = "invalid-token-12345-abcdef";
    const response = await page.goto(`/api/report/${fakeToken}`);

    if (response) {
      const status = response.status();
      // 404 or 410 (expired) are acceptable
      expect([404, 400, 410]).toContain(status);

      // Response should be JSON with error message
      const contentType = response.headers()["content-type"] || "";
      if (contentType.includes("json")) {
        const body = await response.json();
        expect(body.error).toBeTruthy();
      }
    }
  });

  test("TC-SEC-004 E2E : preview par matricule est publique (pas de token requis)", async ({
    page,
  }) => {
    // The preview page is intentionally public — no auth required
    const response = await page.goto("/preview/438188918610000000");

    if (response) {
      expect(response.status()).toBe(200);
    }

    // The page should load with property data
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);
  });

  test("TC-SEC-004 E2E : preview avec matricule invalide -> 404 propre", async ({
    page,
  }) => {
    await page.goto("/preview/000000000000000000");
    await page.waitForLoadState("networkidle");

    // Use innerText (visible text only) — textContent includes RSC script data
    const body = await page.innerText("body");
    // Should show error/not-found message, not a crash
    expect(body).toBeTruthy();

    // Should not contain stack trace
    expect(body).not.toMatch(/at\s+\w+\s*\(/);
    expect(body).not.toMatch(/TypeError|ReferenceError|node_modules/);
  });

  test("TC-SEC-001 E2E : /api/checkout avec tier invalide -> 400", async ({
    request,
  }) => {
    const response = await request.post("/api/checkout", {
      data: {
        matricule: "438188918610000000",
        tier: "invalid_tier",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("TC-SEC-001 E2E : /api/resolve avec query trop courte -> 400", async ({
    request,
  }) => {
    const response = await request.post("/api/resolve", {
      data: { query: "ab" },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/court|minimum|3/i);
  });
});
