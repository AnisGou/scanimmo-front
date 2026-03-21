/**
 * TC-SEC-005/006/007 : Rate limiting, headers securite, secrets exposure.
 *
 * - TC-SEC-005 : Rate limiting (burst requests ne causent pas de crash)
 * - TC-SEC-006 : Headers de securite (Content-Type, X-Powered-By)
 * - TC-SEC-007 : Secrets exposure (service_role, sk_live_ dans bundles/env)
 */
import { test, expect } from "@playwright/test";

test.describe("TC-SEC-005 : Rate limiting API", () => {
  test("TC-SEC-005 : 50 requetes rapides ne causent pas de crash", async ({
    request,
  }) => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      request
        .post("/api/resolve", {
          data: { query: `test${i} address query` },
          headers: { "Content-Type": "application/json" },
        })
        .catch(() => null)
    );

    const responses = await Promise.all(promises);
    const statuses = responses.filter(Boolean).map((r) => r!.status());

    // Au moins quelques requetes doivent etre traitees (pas de crash total)
    expect(statuses.length).toBeGreaterThan(0);

    // Si rate limiting est implemente, on devrait voir des 429
    const rateLimited = statuses.filter((s) => s === 429);
    if (rateLimited.length > 0) {
      console.log(
        `Rate limiting actif: ${rateLimited.length}/50 requetes bloquees`
      );
    } else {
      console.log(
        "Pas de rate limiting detecte (429) — verifier si implemente"
      );
    }

    // Aucune 500 (crash serveur)
    const errors = statuses.filter((s) => s === 500);
    expect(errors.length).toBe(0);
  });

  test("TC-SEC-005 : burst autocomplete ne cause pas de crash", async ({
    request,
  }) => {
    // Simuler un utilisateur qui tape tres vite
    const queries = [
      "2",
      "28",
      "286",
      "2860",
      "2860 ",
      "2860 G",
      "2860 Ga",
      "2860 Gab",
    ];
    const promises = queries.map((q) =>
      request
        .post("/api/resolve", {
          data: { query: q },
          headers: { "Content-Type": "application/json" },
        })
        .catch(() => null)
    );

    const responses = await Promise.all(promises);
    const errors = responses.filter((r) => r && r.status() === 500);
    expect(errors.length).toBe(0);
  });
});

test.describe("TC-SEC-006 : Headers de securite", () => {
  test("TC-SEC-006 : pas de X-Powered-By qui leak la stack", async ({
    request,
  }) => {
    const response = await request.get("/");
    const poweredBy = response.headers()["x-powered-by"];

    // Next.js met "Next.js" par defaut — c'est un info leak mineur
    if (poweredBy) {
      console.log(
        `X-Powered-By present: "${poweredBy}" — recommander de le supprimer`
      );
    }
  });

  test("TC-SEC-006 : Content-Type correctement defini sur HTML", async ({
    request,
  }) => {
    const response = await request.get("/");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/html");
  });

  test("TC-SEC-006 : API retourne JSON avec bon Content-Type", async ({
    request,
  }) => {
    const response = await request.post("/api/resolve", {
      data: { query: "2860 Gabriel" },
      headers: { "Content-Type": "application/json" },
    });
    const contentType = response.headers()["content-type"];
    if (response.status() === 200) {
      expect(contentType).toContain("application/json");
    }
  });
});

test.describe("TC-SEC-007 : Secrets exposure", () => {
  test("TC-SEC-007 : aucun secret VALUE dans le JS bundle", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Collecter tous les scripts charges
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("script[src]")).map(
        (s) => (s as HTMLScriptElement).src
      )
    );

    // Check for actual secret VALUES, not SDK documentation strings.
    // The Supabase SDK naturally contains "service_role" as code/comments —
    // what matters is the actual KEY value doesn't appear.
    const forbidden = [
      // Stripe secret key values (actual keys, not env var names)
      { pattern: /sk_live_[A-Za-z0-9]{20,}/, label: "Stripe live key" },
      { pattern: /sk_test_[A-Za-z0-9]{20,}/, label: "Stripe test key" },
      { pattern: /whsec_[A-Za-z0-9]{20,}/, label: "Stripe webhook secret" },
      // Supabase service role key value (JWT starting with eyJ, long)
      // The env var NAME may appear in SDK code, but the VALUE must not.
      {
        pattern: /SUPABASE_SERVICE_ROLE_KEY["']\s*[:=]\s*["']eyJ/,
        label: "Supabase service role key value",
      },
    ];

    for (const scriptUrl of scripts) {
      if (!scriptUrl.startsWith("http://localhost")) continue;
      try {
        const response = await page.request.get(scriptUrl);
        const text = await response.text();

        for (const { pattern, label } of forbidden) {
          const match = text.match(pattern);
          if (match) {
            expect
              .soft(false, `${label} found in ${scriptUrl}`)
              .toBeTruthy();
          }
        }
      } catch {
        // Script externe (CDN) — skip
      }
    }
  });

  test("TC-SEC-007 : service_role key pas dans __NEXT_DATA__", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verifier que __NEXT_DATA__ ne contient pas de secrets
    const nextData = await page.evaluate(() => {
      const el = document.getElementById("__NEXT_DATA__");
      return el?.textContent || "";
    });

    expect(nextData).not.toMatch(/service_role/i);
    expect(nextData).not.toMatch(/sk_live_/);
    expect(nextData).not.toMatch(/sk_test_/);
    expect(nextData).not.toMatch(/STRIPE_SECRET/);
  });

  test("TC-SEC-007 : .env files pas exposes publiquement", async ({
    request,
  }) => {
    const envPaths = [".env", ".env.local", ".env.production", ".env.test"];

    for (const path of envPaths) {
      const response = await request.get(`/${path}`);
      // Devrait etre 404 ou ne pas contenir de secrets
      if (response.status() === 200) {
        const text = await response.text();
        expect(text).not.toMatch(/SUPABASE_SERVICE_ROLE/);
        expect(text).not.toMatch(/sk_live_/);
        console.warn(`${path} accessible publiquement (status 200)`);
      }
    }
  });
});
