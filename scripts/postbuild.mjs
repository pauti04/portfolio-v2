// ----------------------------------------------------------------------------
// postbuild: give the social image a file extension.
//
// next/og emits app/opengraph-image.tsx as an EXTENSIONLESS file in out/
// (out/opengraph-image). GitHub Pages serves extensionless files as
// application/octet-stream, and Facebook/LinkedIn's scrapers refuse an
// og:image whose Content-Type is not image/*. So: copy it to
// opengraph-image.png and point every og:image / twitter:image at the .png.
//
// Idempotent, and a no-op when there is no social image to fix — it must
// never be the reason a build fails.
// ----------------------------------------------------------------------------

import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "out");
const NAME = "opengraph-image";
// Same problem for the two next/metadata icons: emitted extensionless, served
// as application/octet-stream by Pages. Browsers honour the <link type>, but
// a .png copy + rewritten hrefs is the correct, boring fix.
const ICONS = ["icon", "apple-icon"];
const src = join(OUT, NAME);

if (!existsSync(OUT) || !existsSync(src) || !statSync(src).isFile()) {
  console.log(`postbuild: no ${NAME} in out/ — nothing to do`);
  process.exit(0);
}

copyFileSync(src, `${src}.png`);

// Rewrite ".../opengraph-image" and ".../opengraph-image?<hash>" → ".png" in
// every emitted HTML file, but never touch a URL that already ends in .png.
const urlRe = /\/opengraph-image(?!\.png)(\?[^"'\s<>]*)?(?=["'\s<>])/g;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith(".html")) yield p;
  }
}

let touched = 0;
let rewrites = 0;
for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, "utf8");
  let n = 0;
  const next = html.replace(urlRe, (_m, q = "") => {
    n += 1;
    return `/opengraph-image.png${q}`;
  });
  if (n) {
    writeFileSync(file, next);
    touched += 1;
    rewrites += n;
  }
}

for (const icon of ICONS) {
  const isrc = join(OUT, icon);
  if (!existsSync(isrc) || !statSync(isrc).isFile()) continue;
  copyFileSync(isrc, `${isrc}.png`);
  const iconRe = new RegExp(`/${icon}(?!\\.png)(\\?[^"'\\s<>]*)?(?=["'\\s<>])`, "g");
  for (const file of htmlFiles(OUT)) {
    const html = readFileSync(file, "utf8");
    const next = html.replace(iconRe, (_m, q = "") => `/${icon}.png${q}`);
    if (next !== html) writeFileSync(file, next);
  }
  console.log(`postbuild: ${icon} → ${icon}.png`);
}

console.log(`postbuild: ${NAME} → ${NAME}.png · ${rewrites} url(s) rewritten in ${touched} html file(s)`);
