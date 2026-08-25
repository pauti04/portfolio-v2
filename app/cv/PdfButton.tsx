"use client";

import { useEffect } from "react";

/**
 * Save-as-PDF control for the CV sheet. Also honors ?print=1 so external
 * links can deep-link straight into the print dialog.
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
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-[#c9c9c9] bg-white px-3 py-1.5 text-xs text-[#151515] transition-colors hover:border-[#151515] print:hidden"
    >
      Save as PDF
    </button>
  );
}
