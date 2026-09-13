import type { MetadataRoute } from "next";

// Static export: emitted as out/sitemap.xml at build. Every public route,
// with trailing slashes to match next.config's trailingSlash.
export const dynamic = "force-static";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://pauti.dev";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/cv/", priority: 0.8 },
  { path: "/writing/", priority: 0.6 },
  { path: "/writing/fifteen-green-runs/", priority: 0.7 },
  { path: "/writing/netpulse-rpki-trie/", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: `${ORIGIN}${BASE}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
