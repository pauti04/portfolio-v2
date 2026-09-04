// ----------------------------------------------------------------------------
// The mark, 180 px, for the iOS home screen. Same drawing as app/icon.tsx at
// scale; no rounded corners of its own — iOS applies its mask. Colours mirror
// app/themes/a.css.
// ----------------------------------------------------------------------------

import { ImageResponse } from "next/og";

// Rendered once at build; `output: "export"` requires the route to say so.
export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "#0A0D12",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            bottom: 22,
            left: 85,
            width: 10,
            borderRadius: 5,
            background: "#303B4A",
          }}
        />
        <div style={{ width: 68, height: 68, borderRadius: 34, background: "#4C86FF" }} />
      </div>
    ),
    size,
  );
}
