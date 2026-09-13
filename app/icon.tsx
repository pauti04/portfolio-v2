// ----------------------------------------------------------------------------
// The mark, 32 px — a route-blue node on the rail, on the ground. The same
// figure SiteNav carries next to "pauti04". Rendered once at build by next/og.
// Colours mirror app/themes/a.css (satori cannot read CSS variables).
// ----------------------------------------------------------------------------

import { ImageResponse } from "next/og";

// Rendered once at build; `output: "export"` requires the route to say so.
export const dynamic = "force-static";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "#1E2438",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 15,
            width: 2,
            borderRadius: 1,
            background: "#303B4A",
          }}
        />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#82AAFF" }} />
      </div>
    ),
    size,
  );
}
