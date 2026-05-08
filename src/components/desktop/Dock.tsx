"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { APPS, APP_ORDER } from "@/lib/apps";
import { DOCK_TOOLS, type DockTool } from "@/data/dock-tools";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useWindows } from "@/store/windows";

const FAN_SPRING = { type: "spring" as const, stiffness: 700, damping: 32 };
const FAN_STAGGER = 0.022;

const ICON_BASE = 44;
const ICON_MAX = 70;
const MAGNIFY_RANGE = 130; // px from icon center where magnification fades to base

const ITEM_STEP = 56;
const ITEM_BASE_OFFSET = 6;

const ARC_MAX_X = 200;
const ARC_MAX_ROTATE = 18;
const ARC_EXP = 2.6;

function fanOffset(i: number, total: number) {
  const t = (i + 1) / total;
  const k = Math.pow(t, ARC_EXP);
  return { x: k * ARC_MAX_X, rotate: k * ARC_MAX_ROTATE };
}

const SPRING_CONFIG = { mass: 0.1, stiffness: 180, damping: 14 };
const FAN_MAGNIFY_RANGE = 110;
const FAN_HOVER_SCALE = 1.18;
const FAN_HOVER_LIFT = -6;

type DockSlotProps = {
  mouseX: MotionValue<number>;
  onClick?: () => void;
  ariaLabel: string;
  ariaExpanded?: boolean;
  tooltip: string;
  iconColor?: string;
  badge?: ReactNode;
  children: ReactNode;
  innerRef?: React.RefObject<HTMLButtonElement | null>;
};

function DockSlot({
  mouseX,
  onClick,
  ariaLabel,
  ariaExpanded,
  tooltip,
  iconColor,
  badge,
  children,
  innerRef,
}: DockSlotProps) {
  const localRef = useRef<HTMLButtonElement>(null);
  const ref = innerRef ?? localRef;

  const distance = useTransform(mouseX, (val) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return Number.POSITIVE_INFINITY;
    return val - (r.x + r.width / 2);
  });

  const sizeRaw = useTransform(
    distance,
    [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE],
    [ICON_BASE, ICON_MAX, ICON_BASE],
  );
  const size = useSpring(sizeRaw, SPRING_CONFIG);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      style={{ width: size, height: size, color: iconColor }}
      className="group relative flex shrink-0 items-end justify-center"
    >
      <motion.span
        style={{ width: size, height: size }}
        className="pointer-events-none flex items-center justify-center"
      >
        {children}
      </motion.span>
      {badge}
      <span className="glass-dark pointer-events-none absolute -top-9 hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100 sm:block">
        {tooltip}
      </span>
    </motion.button>
  );
}

type FanItemProps = {
  tool: DockTool;
  index: number;
  total: number;
  fanOpen: boolean;
  mouseY: MotionValue<number>;
  onActivate: () => void;
};

function FanItem({ tool, index, total, fanOpen, mouseY, onActivate }: FanItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseY, (val) => {
    if (!fanOpen) return Number.POSITIVE_INFINITY;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return Number.POSITIVE_INFINITY;
    return val - (r.y + r.height / 2);
  });

  const scaleRaw = useTransform(
    distance,
    [-FAN_MAGNIFY_RANGE, 0, FAN_MAGNIFY_RANGE],
    [1, FAN_HOVER_SCALE, 1],
  );
  const liftRaw = useTransform(
    distance,
    [-FAN_MAGNIFY_RANGE, 0, FAN_MAGNIFY_RANGE],
    [0, FAN_HOVER_LIFT, 0],
  );

  const scale = useSpring(scaleRaw, SPRING_CONFIG);
  const lift = useSpring(liftRaw, SPRING_CONFIG);

  const y = -(ITEM_BASE_OFFSET + index * ITEM_STEP);
  const { x, rotate } = fanOffset(index, total);

  return (
    <motion.div
      ref={ref}
      role="button"
      onClick={onActivate}
      aria-label={tool.name}
      aria-hidden={!fanOpen}
      tabIndex={fanOpen ? 0 : -1}
      style={{
        bottom: "100%",
        left: "50%",
        transformOrigin: "bottom center",
        zIndex: index + 1,
        pointerEvents: fanOpen ? "auto" : "none",
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.6, rotate: 0 }}
      animate={
        fanOpen
          ? { x, y, opacity: 1, scale: 1, rotate }
          : { x: 0, y: 0, opacity: 0, scale: 0.6, rotate: 0 }
      }
      transition={{ ...FAN_SPRING, delay: index * FAN_STAGGER }}
      className="absolute -translate-x-1/2 will-change-transform"
    >
      <motion.div
        style={{ scale, y: lift }}
        className="relative will-change-transform"
      >
        <motion.span
          initial={{ opacity: 0, x: 6 }}
          animate={
            fanOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: 6 }
          }
          transition={{ duration: 0.12, delay: 0.06 + index * FAN_STAGGER }}
          className="glass-pill absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium text-foreground"
        >
          {tool.name}
        </motion.span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.iconImage}
          alt=""
          width={48}
          height={48}
          draggable={false}
          className="block h-12 w-12 max-w-none shrink-0 select-none rounded-[22%] object-contain shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
        />
      </motion.div>
    </motion.div>
  );
}

export function Dock() {
  const open = useWindows((s) => s.open);
  const windows = useWindows((s) => s.windows);
  const isMobile = useIsMobile();
  const [fanOpen, setFanOpen] = useState(false);
  const fanRef = useRef<HTMLDivElement>(null);
  const toolsBtnRef = useRef<HTMLButtonElement>(null);
  const mouseX = useMotionValue<number>(Number.POSITIVE_INFINITY);
  const mouseY = useMotionValue<number>(Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (!fanOpen) return;
    // Reset dock magnification the moment the fan opens so the dock stays calm.
    mouseX.set(Number.POSITIVE_INFINITY);
    function onPointerDown(e: PointerEvent) {
      if (!fanRef.current?.contains(e.target as Node)) setFanOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFanOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [fanOpen, mouseX]);

  return (
    <nav
      aria-label="Dock"
      className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.1 }}
        onMouseMove={(e) => {
          // While the fan is open, freeze dock magnification.
          mouseX.set(fanOpen ? Number.POSITIVE_INFINITY : e.clientX);
          mouseY.set(e.clientY);
        }}
        onMouseLeave={() => {
          mouseX.set(Number.POSITIVE_INFINITY);
          mouseY.set(Number.POSITIVE_INFINITY);
        }}
        className="glass-strong pointer-events-auto flex h-[58px] max-w-[calc(100vw-24px)] items-end gap-2 rounded-2xl border px-3 pb-2"
      >
        {APP_ORDER.map((id) => {
          const app = APPS[id];
          const Icon = app.icon;
          const isOpen = windows.some((w) => w.id === id);
          return (
            <DockSlot
              key={id}
              mouseX={mouseX}
              onClick={() => open(id)}
              ariaLabel={`Open ${app.title}`}
              tooltip={app.title}
              iconColor={app.iconColor}
              badge={
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 24 }}
                      className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-foreground"
                    />
                  )}
                </AnimatePresence>
              }
            >
              {app.iconImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.iconImage}
                  alt=""
                  draggable={false}
                  className="h-[88%] w-[88%] select-none rounded-[22%] object-contain drop-shadow-sm"
                />
              ) : (
                <span className="flex h-[88%] w-[88%] items-center justify-center rounded-xl border border-border bg-surface-muted shadow-sm">
                  <Icon size={22} strokeWidth={1.5} />
                </span>
              )}
            </DockSlot>
          );
        })}

        {!isMobile && (
          <>
            <span aria-hidden className="mb-1 h-7 w-px self-end bg-border" />

            <div ref={fanRef} className="relative">
              <DockSlot
                mouseX={mouseX}
                innerRef={toolsBtnRef}
                onClick={() => setFanOpen((v) => !v)}
                ariaLabel="Tools"
                ariaExpanded={fanOpen}
                tooltip="Tools"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/tools.png"
                  alt=""
                  draggable={false}
                  className="h-[88%] w-[88%] select-none rounded-[22%] object-contain drop-shadow-sm"
                />
              </DockSlot>

              {DOCK_TOOLS.map((tool, i) => (
                <FanItem
                  key={tool.name}
                  tool={tool}
                  index={i}
                  total={DOCK_TOOLS.length}
                  fanOpen={fanOpen}
                  mouseY={mouseY}
                  onActivate={() => setFanOpen(false)}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </nav>
  );
}
