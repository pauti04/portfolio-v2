import type { MetadataRoute } from "next";

// Static export: emitted as out/robots.txt at build.
export const dynamic = "force-static";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://pauti.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
