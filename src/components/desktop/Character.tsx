"use client";

import { useEffect, useState } from "react";

type Cycle = {
  src: string;
  frames: number;
};

// Each cycle is a horizontal strip; per-cycle frame count derived from the
// source PNG widths (cycles 1–3 have 5 frames, cycle 4 has 4).
const CYCLES: Cycle[] = [
  { src: "/Wallpaper/Character/cycle%201.png", frames: 5 },
  { src: "/Wallpaper/Character/cycle%202.png", frames: 5 },
  { src: "/Wallpaper/Character/cycle%203.png", frames: 5 },
  { src: "/Wallpaper/Character/cycle%204.png", frames: 4 },
];

// Display dimensions for one frame. ~0.68× of source (410×258), roughly 2× the
// cat — clearly the protagonist of the scene without leaving the clearing.
const DISPLAY_W = 280;
const DISPLAY_H = 176;

const FRAME_INTERVAL_MS = 280; // pace of frames within a cycle
const CYCLE_DURATION_MS = 6000; // each cycle plays for 6 s before next

export function Character() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setMounted(true);
  }, []);

  // Frame ticker — loops within the current cycle.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const cycle = CYCLES[cycleIdx];
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % cycle.frames),
      FRAME_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [cycleIdx, mounted, reducedMotion]);

  // Cycle ticker — advances to the next cycle on a fixed cadence.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const id = window.setTimeout(() => {
      setCycleIdx((i) => (i + 1) % CYCLES.length);
      setFrame(0);
    }, CYCLE_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [cycleIdx, mounted, reducedMotion]);

  if (!mounted) return null;

  const cycle = CYCLES[cycleIdx];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        // Centre of the grass clearing: horizontal mid-screen, vertically
        // sitting on the grass line (bottom of the cat's clearing band).
        left: `calc(50% - ${DISPLAY_W / 2}px)`,
        top: `calc(86vh - ${DISPLAY_H}px)`,
        width: DISPLAY_W,
        height: DISPLAY_H,
        backgroundImage: `url("${cycle.src}")`,
        // Scale the sheet so each frame is exactly DISPLAY_W wide and the
        // single-row sheet height equals DISPLAY_H.
        backgroundSize: `${DISPLAY_W * cycle.frames}px ${DISPLAY_H}px`,
        backgroundPosition: `-${frame * DISPLAY_W}px 0px`,
        backgroundRepeat: "no-repeat",
        zIndex: 1,
      }}
    />
  );
}
