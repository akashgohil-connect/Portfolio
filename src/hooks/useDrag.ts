"use client";

import { useCallback, useRef } from "react";

type DragHandlers = {
  onStart?: (event: React.PointerEvent) => void;
  onMove: (delta: { dx: number; dy: number }, event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
  /** If false, drag is ignored. */
  enabled?: boolean;
};

export function useDrag({ onStart, onMove, onEnd, enabled = true }: DragHandlers) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      // Only primary button.
      if (event.button !== 0 && event.pointerType === "mouse") return;
      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture(event.pointerId);
      startRef.current = { x: event.clientX, y: event.clientY };
      onStart?.(event);

      const handleMove = (ev: PointerEvent) => {
        const start = startRef.current;
        if (!start) return;
        onMove({ dx: ev.clientX - start.x, dy: ev.clientY - start.y }, ev);
      };
      const handleUp = (ev: PointerEvent) => {
        startRef.current = null;
        target.removeEventListener("pointermove", handleMove);
        target.removeEventListener("pointerup", handleUp);
        target.removeEventListener("pointercancel", handleUp);
        onEnd?.(ev);
      };
      target.addEventListener("pointermove", handleMove);
      target.addEventListener("pointerup", handleUp);
      target.addEventListener("pointercancel", handleUp);
    },
    [enabled, onStart, onMove, onEnd],
  );

  return { onPointerDown };
}
