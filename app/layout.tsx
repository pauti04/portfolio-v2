import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import SiteNav from "@/components/SiteNav";
import { CONTACT } from "@/lib/claims";
import "./globals.css";

// ---------------------------------------------------------------------------
// THE TYPE CASE.
//
// Two faces, self-hosted at build by next/font — no network at runtime, and
// each one carries a metric-adjusted local fallback, so no CLS. Both are
// preloaded, because both paint above the fold.
//
// The layout does not decide how they are used. It only opens the case:
// app/themes/a.css maps them onto the contract variables --font-display /
// --font-body / --font-mono, and globals.css reads only those three.
//
// (next/font requires every option to be a written literal, which is why the
// fallback stacks are spelled out rather than hoisted into constants.)
// ---------------------------------------------------------------------------

// Archivo — a grotesque drawn for signage and government forms, so it holds
// its shape at 11px and at 120px. Loaded WITH its width axis: a headline can
// be set in a genuinely narrower or wider cut of the same face instead of
// reaching for a second family.
const archivo = Archivo({
  variable: "--ff-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// IBM Plex Mono — engineering mono with humanist joints. Reads as a working
// tool rather than as a typographic costume.
const plexMono = IBM_Plex_Mono({
  variable: "--ff-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const FONT_VARS = `${archivo.variable} ${plexMono.variable}`;

// The fixed site nav (components/SiteNav.tsx) is exactly this tall. It is
// published on <html> as --nav-h so any route can read it; the nav itself
// leaves a spacer of this height in the flow on every route except "/".
const NAV_H = "3.25rem";

// The site is served from a sub-path on GitHub Pages (see .github/workflows/
// pages.yml). Absolute metadata URLs have to know that, and Turbopack does not
// prefix the file-based icon routes with basePath, so the icons are named here
// by hand — they still point at the PNGs app/icon.tsx and app/apple-icon.tsx
// render into out/ at build.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const TITLE = "Parth Auti — software engineer, available December 2026";
const DESCRIPTION =
  "Pune to Manipal to Charlotte: 9,083 miles, three cities, and seven systems that run — each one demonstrated live in this page. Parth Auti, B.S. Computer Science at UNC Charlotte, available December 2026.";

export const metadata: Metadata = {
  metadataBase: new URL(`${BASE}/`, "https://pauti04.github.io"),
  title: TITLE,
  description: DESCRIPTION,
  // The social image is file-based: app/opengraph-image.tsx. Next resolves it
  // against metadataBase and attaches it to both og:image and twitter:image,
  // so neither block names it here.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: CONTACT.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: `${BASE}/icon`, type: "image/png", sizes: "32x32" },
      { url: `${BASE}/favicon.ico`, sizes: "any" },
    ],
    apple: [{ url: `${BASE}/apple-icon`, type: "image/png", sizes: "180x180" }],
  },
};

// Browser chrome painted to the actual --ground (app/themes/a.css).
export const viewport: Viewport = {
  themeColor: "#0A0D12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${FONT_VARS} h-full antialiased`}
      style={{ "--nav-h": NAV_H } as CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
