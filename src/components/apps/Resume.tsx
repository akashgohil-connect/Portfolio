"use client";

import { Download } from "lucide-react";

const RESUME_FILE = "Akash_Gohil_Resume_2026.docx";
const PREVIEW_URL = "/resume.html";
const DOWNLOAD_URL = `/${RESUME_FILE}`;

export function ResumeApp() {
  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="flex items-center justify-between border-b border-border bg-white/[0.04] px-3 py-1.5 text-xs">
        <span className="font-medium">{RESUME_FILE}</span>
        <a
          href={DOWNLOAD_URL}
          download={RESUME_FILE}
          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-accent-foreground hover:opacity-90"
        >
          <Download size={12} /> Download
        </a>
      </div>
      <iframe
        src={PREVIEW_URL}
        className="flex-1 bg-white"
        title="Resume preview"
      />
    </div>
  );
}
