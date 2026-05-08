"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import type { AppDef, WindowState } from "@/lib/types";
import { useWindows } from "@/store/windows";
import { useDrag } from "@/hooks/useDrag";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { WindowControls } from "./WindowControls";

type Props = {
  app: AppDef;
  win: WindowState;
  isFocused: boolean;
};

const MIN_W_FALLBACK = 280;
const MIN_H_FALLBACK = 200;

export function Window({ app, win, isFocused }: Props) {
  const isMobile = useIsMobile();
  const setBounds = useWindows((s) => s.setBounds);
  const focus = useWindows((s) => s.focus);
  const close = useWindows((s) => s.close);
  const toggleMinimize = useWindows((s) => s.toggleMinimize);
  const toggleMaximize = useWindows((s) => s.toggleMaximize);
  const startBoundsRef = useRef(win.bounds);

  const titleBarDrag = useDrag({
    enabled: !isMobile && !win.maximized,
    onStart: () => {
      startBoundsRef.current = win.bounds;
      focus(app.id);
    },
    onMove: ({ dx, dy }) => {
      const start = startBoundsRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const x = Math.max(-start.width + 80, Math.min(vw - 80, start.x + dx));
      const y = Math.max(28, Math.min(vh - 40, start.y + dy));
      setBounds(app.id, { ...start, x, y });
    },
  });

  const Body = app.Component;
  const minW = app.minSize?.width ?? MIN_W_FALLBACK;
  const minH = app.minSize?.height ?? MIN_H_FALLBACK;

  // Mobile: full-screen window with simplified header.
  if (isMobile) {
    return (
      <motion.div
        layoutId={`window-${app.id}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.9 }}
        className="fixed inset-0 z-30 flex flex-col bg-surface"
        style={{ zIndex: win.zIndex }}
        onPointerDown={() => focus(app.id)}
        role="dialog"
        aria-label={app.title}
      >
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-muted px-4">
          <button
            type="button"
            onClick={() => close(app.id)}
            className="shrink-0 text-sm text-accent"
          >
            ← Back
          </button>
          <h2 className="flex-1 truncate text-center text-sm font-medium">
            {app.title}
          </h2>
          <div className="flex min-w-[44px] shrink-0 justify-end">
            {app.mobileHeaderRight?.()}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Body />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={`window-${app.id}`}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{
        opacity: win.minimized ? 0 : 1,
        scale: win.minimized ? 0.7 : 1,
        y: win.minimized ? 80 : 0,
        pointerEvents: win.minimized ? "none" : "auto",
      }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.9 }}
      className="absolute flex flex-col overflow-hidden rounded-[var(--radius-window)] bg-surface"
      style={{
        left: win.bounds.x,
        top: win.bounds.y,
        width: win.bounds.width,
        height: win.bounds.height,
        minWidth: minW,
        minHeight: minH,
        zIndex: win.zIndex,
        boxShadow: isFocused
          ? "var(--shadow-window-focused)"
          : "var(--shadow-window)",
        transformOrigin: "50% 90%",
      }}
      onPointerDown={() => focus(app.id)}
      role="dialog"
      aria-label={app.title}
    >
      <header
        {...titleBarDrag}
        onDoubleClick={() => toggleMaximize(app.id)}
        className={`flex h-9 shrink-0 select-none items-center gap-3 border-b border-border bg-white/[0.04] px-3 ${
          win.maximized ? "" : "cursor-grab active:cursor-grabbing"
        } ${isFocused ? "" : "opacity-90"}`}
      >
        <WindowControls
          focused={isFocused}
          onClose={() => close(app.id)}
          onMinimize={() => toggleMinimize(app.id)}
          onMaximize={() => toggleMaximize(app.id)}
        />
        <div className="pointer-events-none absolute left-0 right-0 text-center">
          <span
            className={`text-xs font-medium ${
              isFocused ? "text-foreground" : "text-foreground-subtle"
            }`}
          >
            {app.title}
          </span>
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <Body />
      </div>
    </motion.div>
  );
}
