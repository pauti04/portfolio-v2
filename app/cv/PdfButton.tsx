"use client";

import { useEffect } from "react";

/**
 * Save-as-PDF control for the CV sheet. Wears the site's one quiet button
 * (.btn-quiet: hairline pill, hover, pressed, --route focus ring) and is never
 * printed. Also honors ?print=1 so external links can deep-link straight into
 * the print dialog.
 */
export default function PdfButton() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1") {
      const id = setTimeout(() => window.print(), 250);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <button type="button" onClick={() => window.print()} className="btn-quiet print:hidden">
      Save as PDF
    </button>
  );
}
