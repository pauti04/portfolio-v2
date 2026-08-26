import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke suite for NINE THOUSAND MILES.
//
// The acceptance contract, in order of the page:
//   1. the opening screen answers who / what / when with no interaction and no
//      JavaScript at all — name, "December 2026", GitHub, resume, email;
//   2. the three chapters exist by id and carry their city names;
//   3. the distance markers render their real figures (362 / 8,720 / 9,083);
//   4. every project stop on the route exists by id with a run control;
//   5. /cv carries education and experience, and both writeups render.
//
// Numbers are asserted against the screen-reader copies of the markers, which
// are rendered at their final value and never touched by the count-up — the
// assertion is therefore identical with motion on, off, or absent.
// ---------------------------------------------------------------------------

/** Route order, including the companion stop that shares ChainCheck's core. */
const STOP_IDS = [
  "stop-rasoibot",
  "stop-chaincheck",
  "stop-chaincheck-action",
  "stop-costdna",
  "stop-netpulse",
  "stop-bourse",
  "stop-reflight",
] as const;

const CHAPTERS = [
  { id: "chapter-pune", city: "Pune" },
  { id: "chapter-manipal", city: "Manipal" },
  { id: "chapter-charlotte", city: "Charlotte" },
] as const;

test.describe("the opening screen — answered before you touch anything", () => {
  test.use({ javaScriptEnabled: false });

  test("who, what and when are in the static markup", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Parth/);

    // who
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Parth Auti",
    );

    // what — the work leads, above the fold
    const opening = page.locator("header").first();
    await expect(opening).toContainText("Seven systems");

    // when — the availability answer, no scrolling, no animation
    await expect(opening).toContainText("December 2026");
  });

  test("the journey is one section, not the whole page", async ({ page }) => {
    await page.goto("/");
    // the work comes first in the document, the road here follows it
    const work = page.locator("#work");
    const journey = page.locator("#journey");
    await expect(work).toHaveCount(1);
    await expect(journey).toHaveCount(1);
    await expect(journey).toContainText("9,083 miles");
    // the route line exists, and only inside the journey section
    await expect(journey.locator(".route-spine")).toHaveCount(1);
    await expect(page.locator(".route-spine")).toHaveCount(1);
    // every project stop sits in the work section, none inside the journey
    await expect(work.locator("article[id^='stop-']")).toHaveCount(7);
    await expect(journey.locator("article[id^='stop-']")).toHaveCount(0);
  });

  test("GitHub, resume and email links are present without interaction", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.locator("header").first().getByRole("navigation").first();

    await expect(nav.getByRole("link", { name: /github\.com\/pauti04/ })).toHaveAttribute(
      "href",
      /github\.com\/pauti04/,
    );
    await expect(nav.getByRole("link", { name: /parth\.auti@gmail\.com/ })).toHaveAttribute(
      "href",
      "mailto:parth.auti@gmail.com",
    );
    // the resume lives at /cv
    await expect(nav.getByRole("link", { name: /^cv$/i })).toHaveAttribute(
      "href",
      /\/cv/,
    );
  });
});

test.describe("the route", () => {
  test("all three chapters exist by id and name their city", async ({ page }) => {
    await page.goto("/");
    for (const { id, city } of CHAPTERS) {
      const chapter = page.locator(`#${id}`);
      await expect(chapter).toHaveCount(1);
      await expect(chapter.getByRole("heading", { level: 2 }).first()).toContainText(
        city,
      );
    }
  });

  test("the distance markers carry the real mileage", async ({ page }) => {
    await page.goto("/");
    // Pune → Manipal, Manipal → Charlotte, and the total in the opening line.
    for (const miles of ["362 miles", "8,720 miles", "9,083 miles"]) {
      await expect(page.getByText(miles, { exact: true }).first()).toBeAttached();
    }
  });

  test("every project stop renders with a run control", async ({ page }) => {
    await page.goto("/");
    for (const id of STOP_IDS) {
      const stop = page.locator(`#${id}`);
      await expect(stop).toHaveCount(1);
      await stop.scrollIntoViewIfNeeded();
      await expect(stop.getByRole("button", { name: /run/i }).first()).toBeVisible();
      await expect(stop.locator(".provenance").first()).toHaveText(
        /live|recorded|verified at build/,
      );
    }
  });

  test("the arrival section ends on December 2026 and one control for all of them", async ({
    page,
  }) => {
    await page.goto("/");
    const arrival = page.locator("#arrival");
    await expect(arrival).toHaveCount(1);
    await arrival.scrollIntoViewIfNeeded();
    await expect(arrival).toContainText("December 2026");
    await expect(
      arrival.getByRole("button", { name: /run all/i }),
    ).toBeVisible();
  });
});

test.describe("routes", () => {
  test("/cv renders education and experience", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Parth Auti",
    );
    await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
    await expect(
      page.getByText("University of North Carolina at Charlotte").first(),
    ).toBeVisible();
    // the audited job title, never inflated
    await expect(
      page.getByText("Software Engineering Intern").first(),
    ).toBeVisible();
  });

  test("both writeups render", async ({ page }) => {
    await page.goto("/writing/fifteen-green-runs");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/sunday/i);

    await page.goto("/writing/netpulse-rpki-trie");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /patricia trie/i,
    );
  });
});
