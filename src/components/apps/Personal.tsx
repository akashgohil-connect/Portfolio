"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, FileText, Lock } from "lucide-react";
import { useState } from "react";

const VIEW_TRANSITION = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } as const;
const VIEW_INITIAL = { opacity: 0, y: 8 };
const VIEW_ANIMATE = { opacity: 1, y: 0 };
const VIEW_EXIT = { opacity: 0, y: -8 };

type SecretFile = {
  name: string;
  kind: "txt" | "exe";
  body: string | string[];
};

const FILES: SecretFile[] = [
  {
    name: "passwords.txt",
    kind: "txt",
    body: [
      "Nice try 😄",
      "",
      "Real ones are stored in 1Password — not on a portfolio site.",
      "But if you got this far, you're definitely the curious type. We'd get along.",
    ],
  },
  {
    name: "diary.txt",
    kind: "txt",
    body: [
      "Things I love (in no particular order):",
      "  · Cutting an interface in half and finding the better one underneath",
      "  · Cutting chai with extra ginger",
      "  · The exact moment a design system clicks for a developer",
      "  · Deleting code that nobody noticed was redundant",
      "  · Saying \"what if it were simpler\" in meetings",
    ],
  },
  {
    name: "do_not_open.exe",
    kind: "exe",
    body: "trap",
  },
  {
    name: "wholesome.txt",
    kind: "txt",
    body: [
      "If you're reading this — thanks for poking around.",
      "If you'd like to chat about design systems, AI-ready codebases, or",
      "anything in between, the email's in the Terminal.",
    ],
  },
];

export function PersonalApp() {
  const [open, setOpen] = useState<SecretFile | null>(null);
  const [trapStage, setTrapStage] = useState(0);

  function activate(file: SecretFile) {
    if (file.kind === "exe") {
      setTrapStage(1);
      setOpen(null);
      return;
    }
    setOpen(file);
  }

  const viewKey = trapStage > 0 ? `trap-${trapStage}` : open ? `file-${open.name}` : "folder";

  return (
    <div className="relative h-full overflow-hidden bg-surface">
      <AnimatePresence mode="wait" initial={false}>
        {trapStage > 0 && (
          <motion.div
            key={viewKey}
            initial={VIEW_INITIAL}
            animate={VIEW_ANIMATE}
            exit={VIEW_EXIT}
            transition={VIEW_TRANSITION}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
          >
            <AlertTriangle size={36} className="text-warning" />
            {trapStage === 1 && (
              <>
                <h3 className="text-lg font-semibold">Are you sure?</h3>
                <p className="max-w-xs text-sm text-foreground-muted">
                  This file is suspicious. Opening it may cause unexpected joy.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTrapStage(0)}
                    className="rounded border border-border bg-surface-muted px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrapStage(2)}
                    className="rounded bg-accent px-3 py-1.5 text-xs text-accent-foreground"
                  >
                    Open anyway
                  </button>
                </div>
              </>
            )}
            {trapStage === 2 && (
              <>
                <h3 className="text-lg font-semibold">Got you. 🎉</h3>
                <p className="max-w-sm text-sm text-foreground-muted">
                  Nothing happened. This whole site is a portfolio, not an OS —
                  but you already figured that out.
                </p>
                <button
                  type="button"
                  onClick={() => setTrapStage(0)}
                  className="rounded border border-border bg-white px-3 py-1.5 text-xs"
                >
                  Back to folder
                </button>
              </>
            )}
          </motion.div>
        )}

        {trapStage === 0 && open && (
          <motion.div
            key={viewKey}
            initial={VIEW_INITIAL}
            animate={VIEW_ANIMATE}
            exit={VIEW_EXIT}
            transition={VIEW_TRANSITION}
            className="absolute inset-0 flex flex-col bg-surface"
          >
            <div className="flex items-center justify-between border-b border-border bg-white/[0.04] px-3 py-1.5 text-xs">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-accent"
              >
                ← Back
              </button>
              <span className="font-medium">{open.name}</span>
              <span className="w-12" />
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-foreground">
              {Array.isArray(open.body) ? open.body.join("\n") : open.body}
            </pre>
          </motion.div>
        )}

        {trapStage === 0 && !open && (
          <motion.div
            key={viewKey}
            initial={VIEW_INITIAL}
            animate={VIEW_ANIMATE}
            exit={VIEW_EXIT}
            transition={VIEW_TRANSITION}
            className="absolute inset-0 flex flex-col bg-surface"
          >
            <div className="border-b border-border bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-wider text-foreground-subtle">
              Personal — {FILES.length} items
            </div>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
              }}
              className="flex flex-1 flex-wrap content-start gap-2 overflow-auto p-4"
            >
              {FILES.map((file) => (
                <motion.button
                  key={file.name}
                  type="button"
                  variants={{
                    hidden: { opacity: 0, y: -6, scale: 0.94 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  onClick={(e) => {
                    if (window.matchMedia("(pointer: coarse)").matches) activate(file);
                    else e.currentTarget.focus();
                  }}
                  onDoubleClick={() => activate(file)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") activate(file);
                  }}
                  className="group flex w-24 flex-col items-center gap-1 rounded-md p-2 outline-none focus-visible:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-md border border-border bg-surface-muted shadow-sm ${
                      file.kind === "exe" ? "text-danger" : "text-foreground-muted"
                    }`}
                  >
                    {file.kind === "exe" ? (
                      <Lock size={26} strokeWidth={1.5} />
                    ) : (
                      <FileText size={26} strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight">
                    {file.name}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
