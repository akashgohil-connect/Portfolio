"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "@/data/cat-suggestions";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { CatBubble } from "./CatBubble";

const COLS = 4;
const ROWS = 8;

// Desktop frame size; mobile values applied via responsive override below.
const DESKTOP_FRAME_W = 96;
const DESKTOP_FRAME_H = 92;
const MOBILE_FRAME_W = 64;
const MOBILE_FRAME_H = 62;

const DESKTOP_SPEED = 28;
const MOBILE_SPEED = 20;
const Y_DRIFT_SPEED = 6;

type CatState = "walk" | "sleep";

const WALK_ROW_RIGHT = 1;
const WALK_ROW_LEFT = 3;
const SLEEP_ROW = 7;

const ONE_SHOT_STATES: ReadonlySet<CatState> = new Set(["sleep"]);
const ONE_SHOT_LAST_FRAME: Record<CatState, number> = {
  walk: COLS - 1,
  sleep: 1,
};

const FRAME_INTERVAL: Record<CatState, number> = { walk: 150, sleep: 800 };
const STATE_DURATION_MS: Record<CatState, number> = { walk: 6000, sleep: 18000 };
const NEXT_STATE: Record<CatState, CatState> = { walk: "sleep", sleep: "walk" };

const SPEAK_DURATION_MS = 5000;
const SPEAK_INTERVAL_MIN_MS = 7000;
const SPEAK_INTERVAL_MAX_MS = 14000;

const walkRowFor = (dir: 1 | -1) => (dir === 1 ? WALK_ROW_RIGHT : WALK_ROW_LEFT);

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clearingBounds(y: number, frameW: number, frameH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Dock occupies bottom 70 px (h-[58px] + bottom-3 = 12). Reserve dock + cat
  // height + 16 px breathing.
  const DOCK_RESERVE = 70 + 16 + frameH;
  const botY = Math.min(vh * 0.86, vh - DOCK_RESERVE);
  const idealTopY = vh * 0.78;
  const topY = Math.min(idealTopY, botY - 30);
  const range = Math.max(1, botY - topY);
  const t = Math.max(0, Math.min(1, (y - topY) / range));
  const xLeftFrac = 0.18 + (0.06 - 0.18) * t;
  const xRightFrac = 0.85 + (0.95 - 0.85) * t;
  return {
    minY: topY,
    maxY: botY,
    minX: vw * xLeftFrac,
    maxX: vw * xRightFrac - frameW,
  };
}

export function Cat() {
  const isMobile = useIsMobile();
  const FRAME_W = isMobile ? MOBILE_FRAME_W : DESKTOP_FRAME_W;
  const FRAME_H = isMobile ? MOBILE_FRAME_H : DESKTOP_FRAME_H;
  const SHEET_W = COLS * FRAME_W;
  const SHEET_H = ROWS * FRAME_H;
  const SPEED = isMobile ? MOBILE_SPEED : DESKTOP_SPEED;

  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tooNarrow, setTooNarrow] = useState(false);
  const [state, setState] = useState<CatState>("walk");
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [row, setRow] = useState<number>(WALK_ROW_RIGHT);
  const [message, setMessage] = useState<string | null>(null);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const yDriftRef = useRef<1 | -1>(1);
  const directionRef = useRef<1 | -1>(1);
  const queueRef = useRef<string[]>([]);
  const lastMessageRef = useRef<string | null>(null);

  function pickMessage(): string {
    if (queueRef.current.length === 0) {
      const next = [...SUGGESTIONS];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      if (
        lastMessageRef.current &&
        next[0] === lastMessageRef.current &&
        next.length > 1
      ) {
        [next[0], next[1]] = [next[1], next[0]];
      }
      queueRef.current = next;
    }
    const choice = queueRef.current.shift()!;
    lastMessageRef.current = choice;
    return choice;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 360) {
      setTooNarrow(true);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced);

    const startY = rand(window.innerHeight * 0.78, window.innerHeight * 0.86);
    const b = clearingBounds(startY, FRAME_W, FRAME_H);
    const startX = rand(b.minX, b.maxX);
    xRef.current = startX;
    yRef.current = Math.min(startY, b.maxY);
    setPos({ x: startX, y: yRef.current });
    setMounted(true);
  }, [FRAME_W, FRAME_H]);

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

  useEffect(() => {
    if (!mounted || reducedMotion || state !== "walk") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let x = xRef.current + directionRef.current * SPEED * dt;
      let y = yRef.current + yDriftRef.current * Y_DRIFT_SPEED * dt;
      const b = clearingBounds(y, FRAME_W, FRAME_H);
      if (y < b.minY) {
        y = b.minY;
        yDriftRef.current = 1;
      } else if (y > b.maxY) {
        y = b.maxY;
        yDriftRef.current = -1;
      }
      const b2 = clearingBounds(y, FRAME_W, FRAME_H);
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
  }, [state, mounted, reducedMotion, FRAME_W, FRAME_H, SPEED]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let showId = 0;
    let hideId = 0;
    const schedule = () => {
      const wait = rand(SPEAK_INTERVAL_MIN_MS, SPEAK_INTERVAL_MAX_MS);
      showId = window.setTimeout(() => {
        setMessage(pickMessage());
        hideId = window.setTimeout(() => {
          setMessage(null);
          schedule();
        }, SPEAK_DURATION_MS);
      }, wait);
    };
    schedule();
    return () => {
      window.clearTimeout(showId);
      window.clearTimeout(hideId);
    };
  }, [mounted, reducedMotion]);

  if (tooNarrow || !mounted) return null;

  return (
    <>
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
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-none absolute"
            style={{
              left: pos.x + FRAME_W / 2 - 10,
              top: pos.y - 6,
              transform: "translateY(-100%)",
              zIndex: 2,
            }}
          >
            <CatBubble text={message} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
