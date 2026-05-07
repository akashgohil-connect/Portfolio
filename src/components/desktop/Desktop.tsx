"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { APPS } from "@/lib/apps";
import { useWindows } from "@/store/windows";
import { useUrlSync } from "@/hooks/useUrlSync";
import { Cat } from "./Cat";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { Window } from "./Window";

export function Desktop() {
  const windows = useWindows((s) => s.windows);
  useUrlSync();

  // Find the current top-most (focused) window.
  const focusedId =
    windows.length > 0
      ? windows.reduce((top, w) => (w.zIndex > top.zIndex ? w : top), windows[0]).id
      : null;

  // Esc closes the focused window.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || !focusedId) return;
      useWindows.getState().close(focusedId);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedId]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="wallpaper relative h-dvh w-dvw overflow-hidden no-native-context">
        <Cat />
        <MenuBar />

        <AnimatePresence>
          {windows.map((win) => (
            <Window
              key={win.id}
              app={APPS[win.id]}
              win={win}
              isFocused={focusedId === win.id}
            />
          ))}
        </AnimatePresence>

        <Dock />
      </div>
    </MotionConfig>
  );
}
