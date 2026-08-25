import { test, expect } from "@playwright/test";

// Smoke suite. Asserts the acceptance-test-report contract of the page:
// the viewport-1 answer needs no interaction, the seven checks exist by id,
// the strip reflects the build-time verification, and every route renders.

test.describe("viewport 1 — answer without interaction", () => {
  test("name, availability, and links are present on load", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Parth/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Parth Auti builds systems and measures them."
    );
    // availability line
    await expect(
      page.getByText("available December 2026").first()
    ).toBeVisible();
    // contact links: GitHub / Resume (/cv) / Email
    const nav = page.getByRole("navigation", { name: "contact" });
    await expect(nav.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      /github\.com\/pauti04/
    );
    await expect(nav.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      /\/cv/
    );
    await expect(
      nav.getByRole("link", { name: /parth\.auti@gmail\.com/ })
    ).toHaveAttribute("href", "mailto:parth.auti@gmail.com");
    // the small-caps thesis line
    await expect(
      page.getByText("Every claim on this page is executable")
    ).toBeVisible();
  });

  test("status strip shows the build-verified state and RUN ALL", async ({
    page,
  }) => {
    await page.goto("/");
    const strip = page.getByRole("region", { name: "verification status" });
    await expect(strip).toContainText("7 checks");
    await expect(strip).toContainText("verified at build");
    await expect(
      strip.getByRole("button", { name: /run all checks/i })
    ).toBeVisible();
    // seven labeled circles, each seeded green from lib/verification.json
    const entries = strip.getByRole("listitem");
    await expect(entries).toHaveCount(7);
    for (let i = 0; i < 7; i++) {
      await expect(entries.nth(i)).toContainText("pass");
    }
  });
});

test.describe("claims ledger", () => {
  test("all seven claim cards exist, anchored by CHK id", async ({ page }) => {
    await page.goto("/");
    for (const id of [
      "chk-01",
      "chk-02",
      "chk-03",
      "chk-04",
      "chk-05",
      "chk-06",
      "chk-07",
    ]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test("the flagship card carries claim, evidence, and verify sections", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator("#chk-01");
    await expect(card).toContainText(
      "Fifteen consecutive green replay runs booked a real meeting on a Sunday, unattended."
    );
    await expect(
      card.getByRole("region", { name: "CHK-01 evidence" })
    ).toHaveCount(1);
    await expect(
      card.getByRole("region", { name: "CHK-01 verify" })
    ).toHaveCount(1);
  });
});

test.describe("footer", () => {
  test("the does-not-claim ledger lists its four bullets", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", {
      name: /what this site does not claim/i,
    });
    await expect(section.getByRole("listitem")).toHaveCount(4);
    await expect(section).toContainText("No production traffic at scale");
  });
});

test.describe("routes", () => {
  test("/cv renders", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText("University of North Carolina at Charlotte").first()
    ).toBeVisible();
  });

  test("both writeups render", async ({ page }) => {
    await page.goto("/writing/fifteen-green-runs");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /sunday/i
    );

    await page.goto("/writing/netpulse-rpki-trie");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /patricia trie/i
    );
  });
});
