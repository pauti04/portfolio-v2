import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG 2.1 A/AA scan, zero violations tolerated. If a rule ever has to be
// waived, disable it here explicitly with a comment saying why.
const PAGES = ["/", "/cv", "/writing", "/writing/fifteen-green-runs"];

for (const path of PAGES) {
  test(`axe scan: ${path}`, async ({ page }) => {
    await page.goto(path);
    // let lazy demo islands hydrate so the scanned DOM is final
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      }))
    ).toEqual([]);
  });
}
