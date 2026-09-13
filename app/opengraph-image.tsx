// ----------------------------------------------------------------------------
// The social card — 1200 × 630, rendered once at build by next/og and written
// into out/ as a static PNG (this route has no params, so `output: "export"`
// is happy with it). Next attaches it to og:image and twitter:image.
//
// Everything on it is read from lib/, not retyped here: the name and the
// availability line from CONTACT, the three cities from CHAPTERS. The one
// authored string is the positioning line, copied byte-for-byte from the
// Opening in app/page.tsx.
// ----------------------------------------------------------------------------

import { ImageResponse } from "next/og";

import { CONTACT } from "@/lib/claims";
import { CHAPTERS, JOURNEY } from "@/lib/journey";

// Rendered once at build; `output: "export"` requires the route to say so.
export const dynamic = "force-static";

export const alt = `${CONTACT.name} — ${JOURNEY.spine}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Blueprint palette, mirrored from app/themes/a.css. satori cannot read CSS
// custom properties, so the hex values are repeated here — and only here.
const GROUND = "#1E2438";
const INK = "#F3F6F9";
const INK_SOFT = "#AFBAC6";
const MUTED = "#8593A1";
const ROUTE = "#82AAFF";

/** As set in app/page.tsx → Opening(). */
const POSITIONING = "Eight systems that run, and every one of them runs right here.";

const CITIES = CHAPTERS.map((c) => c.city);

// ---------------------------------------------------------------------------
// Fonts. satori needs real font bytes; next/font's self-hosted files are not
// reachable from here, so the same two Google faces are fetched once at build
// (the old-Safari UA makes Google serve TrueType, which satori can read).
// Any failure falls back to next/og's bundled face — the card still builds.
// ---------------------------------------------------------------------------

const TTF_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

async function googleTtf(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      { headers: { "User-Agent": TTF_UA } },
    );
    if (!css.ok) return null;
    const m = (await css.text()).match(
      /src:\s*url\((https:[^)]+)\)\s*format\('(?:truetype|opentype)'\)/,
    );
    if (!m) return null;
    const ttf = await fetch(m[1]);
    return ttf.ok ? await ttf.arrayBuffer() : null;
  } catch {
    return null;
  }
}

type Font = { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" };

async function loadFonts(): Promise<Font[]> {
  const [archivo400, archivo600, plex400] = await Promise.all([
    googleTtf("Archivo", 400),
    googleTtf("Archivo", 600),
    googleTtf("IBM Plex Mono", 400),
  ]);
  const fonts: Font[] = [];
  if (archivo400) fonts.push({ name: "Archivo", data: archivo400, weight: 400, style: "normal" });
  if (archivo600) fonts.push({ name: "Archivo", data: archivo600, weight: 600, style: "normal" });
  if (plex400) fonts.push({ name: "IBM Plex Mono", data: plex400, weight: 400, style: "normal" });
  return fonts;
}

// ---------------------------------------------------------------------------
// The card.
// ---------------------------------------------------------------------------

const ALIGN = ["flex-start", "center", "flex-end"] as const;

export default async function OpenGraphImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 56px",
          background: GROUND,
          color: INK,
          fontFamily: "Archivo, sans-serif",
        }}
      >
        {/* the route — the only saturated thing on the card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", position: "relative", width: "100%", height: 14 }}>
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 7,
                right: 7,
                height: 2,
                background: ROUTE,
                borderRadius: 1,
              }}
            />
            {CITIES.map((city, i) => (
              <div
                key={city}
                style={{ display: "flex", flex: 1, justifyContent: ALIGN[i] ?? "center" }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: ROUTE,
                    boxShadow: "0 0 0 5px rgba(76, 134, 255, 0.2)",
                  }}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: INK_SOFT,
            }}
          >
            {CITIES.map((city, i) => (
              <div
                key={city}
                style={{ display: "flex", flex: 1, justifyContent: ALIGN[i] ?? "center" }}
              >
                {city}
              </div>
            ))}
          </div>
        </div>

        {/* name + the line */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 20,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Software engineer · systems + ML
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 104,
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: -2.5,
              color: INK,
            }}
          >
            {CONTACT.name}
          </div>
          <div
            style={{
              marginTop: 30,
              maxWidth: 880,
              fontSize: 38,
              fontWeight: 400,
              lineHeight: 1.22,
              letterSpacing: -0.4,
              color: INK,
            }}
          >
            {POSITIONING}
          </div>
        </div>

        {/* availability */}
        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 21,
            color: INK_SOFT,
          }}
        >
          {CONTACT.monoLine}
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length ? { fonts } : {}),
    },
  );
}
