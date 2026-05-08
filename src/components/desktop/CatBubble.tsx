"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";

/**
 * Pixel-art speech bubble. Pure CSS — sharp 2 px black border via box-shadow
 * over a cream fill, with a small stepped tail at the bottom-left.
 */
export function CatBubble({ text }: { text: string }) {
  const isMobile = useIsMobile();
  return (
    <div className="relative inline-block select-none">
      <div
        className="relative font-medium text-[#0a0a0a]"
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: isMobile ? "9.5px" : "10.5px",
          lineHeight: "1.3",
          padding: "8px 12px",
          maxWidth: isMobile ? 220 : undefined,
          whiteSpace: isMobile ? "normal" : "nowrap",
          background: "#fbf6ec",
          boxShadow: [
            "-2px 0 0 0 #0a0a0a",
            "2px 0 0 0 #0a0a0a",
            "0 -2px 0 0 #0a0a0a",
            "0 2px 0 0 #0a0a0a",
            "0 4px 0 0 rgba(0,0,0,0.15)",
          ].join(", "),
        }}
      >
        {text}
      </div>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "10px",
          top: "100%",
          width: "6px",
          height: "3px",
          background: "#fbf6ec",
          boxShadow:
            "-2px 0 0 0 #0a0a0a, 0 0 0 0 #0a0a0a, 2px 0 0 0 #0a0a0a",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "7px",
          top: "calc(100% + 3px)",
          width: "3px",
          height: "3px",
          background: "#fbf6ec",
          boxShadow: "-2px 0 0 0 #0a0a0a, 0 2px 0 0 #0a0a0a",
        }}
      />
    </div>
  );
}
