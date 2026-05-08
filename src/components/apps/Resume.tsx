"use client";

import { Download } from "lucide-react";

const RESUME_FILE = "Akash_Gohil_Resume_2026.pdf";
const RESUME_URL = `/${RESUME_FILE}`;
// #toolbar=0&navpanes=0 hides Chrome's PDF chrome for a cleaner inline render.
// Firefox/Safari ignore the fragment and use their own viewer chrome.
const PREVIEW_URL = `${RESUME_URL}#toolbar=0&navpanes=0`;

export function ResumeApp() {
  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      <div className="hidden items-center justify-between border-b border-border bg-white/[0.04] px-3 py-1.5 text-xs sm:flex">
        <span className="font-medium">{RESUME_FILE}</span>
        <a
          href={RESUME_URL}
          download={RESUME_FILE}
          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-accent-foreground hover:opacity-90"
        >
          <Download size={12} /> Download
        </a>
      </div>
      <iframe
        src={PREVIEW_URL}
        className="block h-full w-full flex-1 bg-white"
        title="Resume preview"
      />
    </div>
  );
}

/**
 * Right-action for the mobile back-bar — shows a Download anchor instead of
 * burying it inside the iframe sub-header (which is hidden on mobile).
 */
export function ResumeMobileHeaderRight() {
  return (
    <a
      href={RESUME_URL}
      download={RESUME_FILE}
      className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-accent-foreground hover:opacity-90"
    >
      <Download size={12} /> Save
    </a>
  );
}
