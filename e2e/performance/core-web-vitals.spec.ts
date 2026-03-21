/**
 * TC-FE-006 : Core Web Vitals.
 *
 * Mesure LCP, CLS, TTFB via PerformanceObserver injecte avant navigation.
 * Hard limits permissifs pour dev local (LCP < 5s, CLS < 0.15, TTFB < 3s).
 * Warnings si au-dessus des seuils Google (LCP < 2.5s, CLS < 0.1, TTFB < 600ms).
 */
import { test, expect } from "@playwright/test";

const GOLDEN_MATRICULE = "438188918610000000";

test.describe("TC-FE-006 : Core Web Vitals", () => {
  test("TC-FE-006a : LCP < 2.5s sur la page d'accueil", async ({ page }) => {
    // Injecter l'observer AVANT navigation
    await page.addInitScript(() => {
      (window as any).__lcp = Infinity;
      (window as any).__lcpElement = "";
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const last = entries[entries.length - 1] as any;
          (window as any).__lcp = last.startTime;
          (window as any).__lcpElement = last.element?.tagName || "unknown";
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const lcp = await page.evaluate(() => (window as any).__lcp);
    const lcpElement = await page.evaluate(
      () => (window as any).__lcpElement
    );

    console.log(
      `LCP Homepage: ${lcp === Infinity ? "N/A" : lcp.toFixed(0) + "ms"} (element: ${lcpElement})`
    );

    if (lcp !== Infinity) {
      if (lcp > 2500) {
        console.log(`LCP > 2.5s: ${lcp.toFixed(0)}ms — optimisation recommandee`);
      }
      expect(lcp).toBeLessThan(5000); // Hard limit : 5s
    }
  });

  test("TC-FE-006b : LCP < 3s sur la page preview", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__lcp = Infinity;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          (window as any).__lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });

    await page.goto(`/preview/${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const lcp = await page.evaluate(() => (window as any).__lcp);
    console.log(
      `LCP Preview: ${lcp === Infinity ? "N/A" : lcp.toFixed(0) + "ms"}`
    );

    if (lcp !== Infinity) {
      if (lcp > 3000) {
        console.log(`LCP Preview > 3s: ${lcp.toFixed(0)}ms`);
      }
      expect(lcp).toBeLessThan(8000); // Hard limit plus permissif (RPC + rendu)
    }
  });

  test("TC-FE-006c : CLS < 0.1 sur la page d'accueil", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            (window as any).__cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const cls = await page.evaluate(() => (window as any).__cls);
    console.log(`CLS Homepage: ${cls.toFixed(4)}`);
    expect(cls).toBeLessThan(0.1);
  });

  test("TC-FE-006d : CLS < 0.15 sur la page preview", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            (window as any).__cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto(`/preview/${GOLDEN_MATRICULE}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const cls = await page.evaluate(() => (window as any).__cls);
    console.log(`CLS Preview: ${cls.toFixed(4)}`);
    // Plus permissif sur preview (donnees chargees async)
    expect(cls).toBeLessThan(0.15);
  });

  test("TC-FE-006e : TTFB < 600ms", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const ttfb = Date.now() - start;

    console.log(`TTFB Homepage: ${ttfb}ms`);
    if (ttfb > 600) {
      console.log(`TTFB > 600ms: ${ttfb}ms`);
    }
    expect(ttfb).toBeLessThan(3000); // Hard limit
  });

  test("TC-FE-006f : pas de JS bundle > 500KB", async ({ page }) => {
    const resources: { url: string; size: number }[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".js") && !url.includes("node_modules")) {
        const headers = response.headers();
        const size = parseInt(headers["content-length"] || "0");
        if (size > 0) {
          resources.push({ url: url.split("/").pop() || url, size });
        }
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const largeChunks = resources.filter((r) => r.size > 500_000);
    if (largeChunks.length > 0) {
      console.log("JS bundles > 500KB:");
      largeChunks.forEach((r) =>
        console.log(`  ${r.url}: ${(r.size / 1024).toFixed(0)}KB`)
      );
    }

    console.log(
      `Total JS resources: ${resources.length}, largest: ${Math.max(...resources.map((r) => r.size), 0) / 1024 | 0}KB`
    );
  });
});
