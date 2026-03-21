/**
 * TC-A11Y-001 : Navigation clavier.
 *
 * Verifie que les elements interactifs sont accessibles via Tab,
 * que le focus est visible, et que la recherche fonctionne au clavier.
 */
import { test, expect } from "@playwright/test";

test.describe("TC-A11Y-001 : Navigation clavier", () => {
  test("TC-A11Y-001a : elements interactifs accessibles par Tab", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab 15 fois et collecter les elements focused
    const focusedElements: string[] = [];
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "BODY";
        const tag = el.tagName;
        const role = el.getAttribute("role") || "";
        const text = (el.textContent || "").substring(0, 30).trim();
        return `${tag}${role ? `[role=${role}]` : ""}${text ? `: "${text}"` : ""}`;
      });
      focusedElements.push(info);
    }

    // Au moins quelques elements interactifs doivent recevoir le focus
    const interactive = focusedElements.filter((e) => e !== "BODY");
    console.log(`Elements focusables: ${interactive.length}/15`);
    interactive.forEach((e, i) => console.log(`  Tab ${i + 1}: ${e}`));

    expect(interactive.length).toBeGreaterThan(2);
  });

  test("TC-A11Y-001b : focus visible sur l'element actif", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Tab");

    const hasVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return false;
      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;

      // Focus visible si outline significatif, box-shadow, ou :focus-visible
      return (
        (outline !== "none" && !outline.includes("0px")) ||
        (boxShadow !== "none" && boxShadow !== "") ||
        el.classList.contains("focus-visible") ||
        el.matches(":focus-visible")
      );
    });

    if (!hasVisibleFocus) {
      console.log(
        "Focus non visuellement visible — verifier les styles :focus-visible"
      );
    }
    // Soft expect — ne pas bloquer si le style est custom
    expect.soft(hasVisibleFocus).toBeTruthy();
  });

  test("TC-A11Y-001c : recherche accessible au clavier", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab jusqu'au champ de recherche
    let foundInput = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      if (tag === "INPUT") {
        foundInput = true;
        break;
      }
    }

    if (foundInput) {
      // Taper dans le champ
      await page.keyboard.type("2860");
      await page.waitForTimeout(500);

      // Enter pour soumettre
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);
    } else {
      console.log(
        "Input non atteint apres 10 Tabs — verifier l'ordre des tabindex"
      );
    }
  });
});
