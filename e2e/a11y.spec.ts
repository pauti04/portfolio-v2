import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG 2.1 A/AA scan, zero violations tolerated, run in both viewport projects
// (desktop + mobile) from playwright.config.ts. If a rule ever has to be
// waived, disable it here explicitly with a comment saying why.
//
// The journey page hydrates seven demo islands; the scan waits for the network
// to settle and then a beat more, so the scanned DOM is the final one.
const PAGES = ["/", "/cv", "/writing", "/writing/fifteen-green-runs"];

for (const path of PAGES) {
  test(`axe scan: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      })),
    ).toEqual([]);
  });
}
