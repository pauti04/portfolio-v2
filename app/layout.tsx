import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Fraunces — the display face. A warm, slightly wonky old-style serif; it
// carries the city names and the mileage numerals without sounding like a
// terminal. Georgia is a genuinely close metric fallback.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Figtree — body. Humanist, open apertures, friendly numerals.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// IBM Plex Mono — data and demo internals. Warmer and less rectilinear than
// the usual grid monos, which suits the rest of the page.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pauti04.github.io"),
  title: "Parth Auti — software engineer, available December 2026",
  description:
    "Pune to Manipal to Charlotte: 9,083 miles, three cities, and seven systems that run — each one demonstrated live in this page. Parth Auti, B.S. Computer Science at UNC Charlotte, available December 2026.",
};

export const viewport: Viewport = {
  themeColor: "#17120e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
