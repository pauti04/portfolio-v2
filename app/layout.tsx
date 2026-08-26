import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Bricolage_Grotesque,
  Geist_Mono,
  IBM_Plex_Mono,
  Instrument_Sans,
  Instrument_Serif,
  Martian_Mono,
  Newsreader,
  Schibsted_Grotesk,
} from "next/font/google";

import ThemeSwitcher from "@/components/ThemeSwitcher";
import "./globals.css";

// ---------------------------------------------------------------------------
// THE TYPE CASE.
//
// Nine faces, self-hosted at build by next/font — no network at runtime, and
// each one carries a metric-adjusted local fallback, so no CLS. None of them
// is a default: no Inter, no Roboto, no Poppins, no Playfair.
//
// The layout does not decide which face is the display face. It only opens
// the case. Each file in app/themes/ maps three of these onto the contract
// variables --font-display / --font-body / --font-mono, and globals.css reads
// only those three — so swapping a theme swaps the whole typographic system.
//
// preload is true only for the faces theme "a" (Blueprint) uses, since that
// is what paints first. The rest are fetched when a visitor actually flips to
// a theme that needs them. This is a preview studio; once a direction is
// chosen, delete the eight unused loaders and preload the two survivors.
//
// (next/font requires every option to be a written literal, which is why the
// fallback stacks are repeated rather than hoisted into constants.)
// ---------------------------------------------------------------------------

// Archivo — a grotesque drawn for signage and government forms, so it holds
// its shape at 11px and at 120px. Loaded WITH its width axis, which is the
// whole point: a theme can set a headline in a genuinely narrow or extended
// cut of the same face instead of reaching for a second family.
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

// Instrument Serif — one weight, very high contrast, drawn tight. A display
// face and nothing else; it has no business setting a paragraph.
const instrumentSerif = Instrument_Serif({
  variable: "--ff-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Iowan Old Style", "Charter", "Georgia", "serif"],
});

// Newsreader — text serif with a real optical-size axis, so 15px body and a
// 30px pull-quote are different drawings rather than one drawing scaled.
const newsreader = Newsreader({
  variable: "--ff-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  fallback: ["Iowan Old Style", "Charter", "Georgia", "serif"],
});

// Instrument Sans — quiet, slightly condensed, wide-open counters. The sans
// that gets out of the way when a mono is doing the talking.
const instrumentSans = Instrument_Sans({
  variable: "--ff-instrument-sans",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Geist Mono — flat terminals, tall x-height, unmistakably contemporary.
const geistMono = Geist_Mono({
  variable: "--ff-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Martian Mono — a mono heavy and wide enough to work as a display face. The
// one genuinely loud thing in the case, and it is only loud in one theme.
const martianMono = Martian_Mono({
  variable: "--ff-martian-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Bricolage Grotesque — optical-size AND width axes, with real drawing quirks
// (the flicked l, the cut g). Characterful without being a novelty face.
const bricolage = Bricolage_Grotesque({
  variable: "--ff-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Schibsted Grotesk — Nordic newspaper grotesque: even colour down a
// paragraph, distinctive numerals, built to sit under a louder display face.
const schibsted = Schibsted_Grotesk({
  variable: "--ff-schibsted",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

const FONT_VARS = [
  archivo.variable,
  plexMono.variable,
  instrumentSerif.variable,
  newsreader.variable,
  instrumentSans.variable,
  geistMono.variable,
  martianMono.variable,
  bricolage.variable,
  schibsted.variable,
].join(" ");

// Runs as the first thing in <body>, after the render-blocking stylesheet in
// <head> has already parsed — so the persisted theme is on <html> before the
// first paint and there is no flash of theme "a".
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("pa-theme");if(t==="a"||t==="b"||t==="c"||t==="d"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://pauti04.github.io"),
  title: "Parth Auti — software engineer, available December 2026",
  description:
    "Pune to Manipal to Charlotte: 9,083 miles, three cities, and seven systems that run — each one demonstrated live in this page. Parth Auti, B.S. Computer Science at UNC Charlotte, available December 2026.",
};

// First-paint browser chrome only. ThemeSwitcher re-syncs this from the live
// computed --ground on mount and on every switch, so it never goes stale
// against whatever the theme files actually declare.
export const viewport: Viewport = {
  themeColor: "#eef1f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="a"
      suppressHydrationWarning
      className={`${FONT_VARS} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {children}
        <ThemeSwitcher />
      </body>
    </html>
  );
}
