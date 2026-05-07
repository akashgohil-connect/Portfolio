"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_W = 96;
const FRAME_H = 92;
const COLS = 4;
const ROWS = 8;
const SHEET_W = COLS * FRAME_W;
const SHEET_H = ROWS * FRAME_H;

const SPEED = 28; // px / sec while walking
const Y_DRIFT_SPEED = 6; // slow vertical wander while walking

type CatState = "walk" | "sleep";

// Rows (0-indexed):
//   1 = walking right, 3 = walking left, 7 = curl-up + sleep on a single row.
const WALK_ROW_RIGHT = 1;
const WALK_ROW_LEFT = 3;
const SLEEP_ROW = 7;

// One-shot states clamp on a per-state last frame; loop states cycle.
const ONE_SHOT_STATES: ReadonlySet<CatState> = new Set(["sleep"]);

// Sleep row: only frames 0–1 are used (frames 2 and 3 are unused).
const ONE_SHOT_LAST_FRAME: Record<CatState, number> = {
  walk: COLS - 1, // unused for loop state
  sleep: 1,
};

const FRAME_INTERVAL: Record<CatState, number> = {
  walk: 150,
  sleep: 800,
};

// sleep covers both the curl-up motion and the held lying frame:
//   2 frames × 800 ms = 1.6 s of curl-up, then ~16.4 s held = 18 s total.
const STATE_DURATION_MS: Record<CatState, number> = {
  walk: 6000,
  sleep: 18000,
};

const NEXT_STATE: Record<CatState, CatState> = {
  walk: "sleep",
  sleep: "walk",
};

const walkRowFor = (dir: 1 | -1) => (dir === 1 ? WALK_ROW_RIGHT : WALK_ROW_LEFT);

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Trapezoid clearing — narrower at the back of the grass, wider at the front.
function clearingBounds(y: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const topY = vh * 0.78;
  const botY = vh * 0.86;
  const t = Math.max(0, Math.min(1, (y - topY) / (botY - topY)));
  const xLeftFrac = 0.18 + (0.06 - 0.18) * t;
  const xRightFrac = 0.85 + (0.95 - 0.85) * t;
  return {
    minY: topY,
    maxY: botY,
    minX: vw * xLeftFrac,
    maxX: vw * xRightFrac - FRAME_W,
  };
}

export function Cat() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [state, setState] = useState<CatState>("walk");
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [row, setRow] = useState<number>(WALK_ROW_RIGHT);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const yDriftRef = useRef<1 | -1>(1);
  const directionRef = useRef<1 | -1>(1);

  // One-time init: spawn somewhere inside the clearing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced);

    const startY = rand(window.innerHeight * 0.78, window.innerHeight * 0.86);
    const b = clearingBounds(startY);
    const startX = rand(b.minX, b.maxX);
    xRef.current = startX;
    yRef.current = startY;
    setPos({ x: startX, y: startY });
    setMounted(true);
  }, []);

  // Sprite frame ticker. Loop states cycle 0..COLS-1; one-shot states advance
  // once and clamp on their per-state last frame.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const interval = FRAME_INTERVAL[state];
    const id = window.setInterval(() => {
      setFrame((f) => {
        if (ONE_SHOT_STATES.has(state)) {
          return Math.min(f + 1, ONE_SHOT_LAST_FRAME[state]);
        }
        return (f + 1) % COLS;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [state, mounted, reducedMotion]);

  // Fixed round-robin state machine: each state runs for an exact duration.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const id = window.setTimeout(() => {
      const next = NEXT_STATE[state];
      if (next === "walk") {
        const newDir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        directionRef.current = newDir;
        yDriftRef.current = Math.random() < 0.5 ? 1 : -1;
        setRow(walkRowFor(newDir));
      } else {
        setRow(SLEEP_ROW);
      }
      setState(next);
      setFrame(0);
    }, STATE_DURATION_MS[state]);
    return () => window.clearTimeout(id);
  }, [state, mounted, reducedMotion]);

  // Movement loop — only active during walk. Edge bounces flip direction AND
  // swap to the opposite walk row so the sprite faces correctly.
  useEffect(() => {
    if (!mounted || reducedMotion || state !== "walk") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let x = xRef.current + directionRef.current * SPEED * dt;
      let y = yRef.current + yDriftRef.current * Y_DRIFT_SPEED * dt;
      const b = clearingBounds(y);
      if (y < b.minY) {
        y = b.minY;
        yDriftRef.current = 1;
      } else if (y > b.maxY) {
        y = b.maxY;
        yDriftRef.current = -1;
      }
      const b2 = clearingBounds(y);
      if (x < b2.minX) {
        x = b2.minX;
        directionRef.current = 1;
        setRow(WALK_ROW_RIGHT);
      } else if (x > b2.maxX) {
        x = b2.maxX;
        directionRef.current = -1;
        setRow(WALK_ROW_LEFT);
      }
      xRef.current = x;
      yRef.current = y;
      setPos({ x, y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, mounted, reducedMotion]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: pos.x,
        top: pos.y,
        width: FRAME_W,
        height: FRAME_H,
        backgroundImage: "url(/Wallpaper/cat/Cat.png)",
        backgroundSize: `${SHEET_W}px ${SHEET_H}px`,
        backgroundPosition: `-${frame * FRAME_W}px -${row * FRAME_H}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        zIndex: 1,
      }}
    />
  );
}
