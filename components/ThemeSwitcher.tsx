"use client";

// ---------------------------------------------------------------------------
// TEMPORARY: the direction picker.
//
// Four complete themes live in app/themes/. This flips between them so a
// direction can be chosen by looking at the real page rather than at swatches.
// It is not part of the finished site — to remove it, delete this file, its
// mount in app/layout.tsx, the `.theme-switcher` block in app/globals.css,
// and three of the four theme files.
//
// What it has to get right:
//   · the choice survives a reload — localStorage, read back before the first
//     paint by the boot script in app/layout.tsx, never from here, or the
//     page would flash theme "a" first;
//   · <html data-theme> is the single source of truth, subscribed to rather
//     than mirrored into state, so the server render (which knows nothing of
//     localStorage) hydrates cleanly and then corrects itself;
//   · real buttons: Tab reaches them, Enter/Space activate, each states its
//     own pressed state;
//   · it never prints.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "pa-theme";

type ThemeId = "a" | "b" | "c" | "d";

const THEMES: ReadonlyArray<{ id: ThemeId; name: string; note: string }> = [
  { id: "a", name: "Blueprint", note: "precise grotesque, drafting blue" },
  { id: "b", name: "Press", note: "editorial serif, bone stock" },
  { id: "c", name: "Terminal", note: "mono-forward, phosphor" },
  { id: "d", name: "Studio", note: "variable grotesque, charcoal" },
];

const isThemeId = (v: string | null): v is ThemeId =>
  v === "a" || v === "b" || v === "c" || v === "d";

/** Keep the browser-chrome colour honest about whichever theme is showing. */
function syncThemeColor() {
  const ground = getComputedStyle(document.documentElement)
    .getPropertyValue("--ground")
    .trim();
  if (!ground) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = ground;
}

/** Watch <html data-theme> instead of keeping a second copy of it in state. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const readTheme = () => document.documentElement.getAttribute("data-theme");

// The server cannot know what is in localStorage, so it renders nothing
// pressed; React re-reads the real attribute immediately after hydration.
const readThemeOnServer = () => null;

export default function ThemeSwitcher() {
  const current = useSyncExternalStore(subscribe, readTheme, readThemeOnServer);
  const active = isThemeId(current) ? current : null;

  useEffect(() => {
    syncThemeColor();
  }, [active]);

  const choose = useCallback((id: ThemeId) => {
    // Setting the attribute IS the state change — the store above sees it.
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* private mode — the choice simply does not persist */
    }
  }, []);

  return (
    <div
      role="group"
      aria-label="Preview control: choose a visual direction for this site. Temporary, not part of the design."
      className="theme-switcher"
      data-theme-switcher=""
    >
      <span aria-hidden="true" className="theme-switcher__tag">
        preview
      </span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => choose(t.id)}
          aria-pressed={active === t.id}
          title={`Preview the "${t.name}" direction — ${t.note}`}
          className="theme-switcher__btn"
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
