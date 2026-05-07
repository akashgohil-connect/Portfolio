"use client";

import { create } from "zustand";
import type { AppId, WindowState } from "@/lib/types";
import { getApp } from "@/lib/apps";

type Bounds = WindowState["bounds"];

type WindowsState = {
  windows: WindowState[];
  zCounter: number;
  open: (id: AppId) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  toggleMinimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  setBounds: (id: AppId, bounds: Bounds) => void;
};

const VIEWPORT_PADDING = 24;
const MENUBAR_HEIGHT = 28;
const DOCK_HEIGHT = 64;

function defaultBoundsFor(id: AppId, existingCount: number): Bounds {
  const app = getApp(id);
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const width = Math.min(app.defaultSize.width, vw - VIEWPORT_PADDING * 2);
  const height = Math.min(
    app.defaultSize.height,
    vh - MENUBAR_HEIGHT - DOCK_HEIGHT - VIEWPORT_PADDING * 2,
  );
  if (app.defaultPosition) {
    return { ...app.defaultPosition, width, height };
  }
  // Cascade.
  const offset = (existingCount % 6) * 28;
  const x = Math.max(VIEWPORT_PADDING, (vw - width) / 2 - 60 + offset);
  const y = Math.max(
    MENUBAR_HEIGHT + VIEWPORT_PADDING,
    (vh - height) / 2 - 40 + offset,
  );
  return { x, y, width, height };
}

export const useWindows = create<WindowsState>((set, get) => ({
  windows: [],
  zCounter: 10,
  open: (id) => {
    const existing = get().windows.find((w) => w.id === id);
    if (existing) {
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === id
            ? { ...w, minimized: false, zIndex: s.zCounter + 1 }
            : w,
        ),
        zCounter: s.zCounter + 1,
      }));
      return;
    }
    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          bounds: defaultBoundsFor(id, s.windows.length),
          zIndex: s.zCounter + 1,
          minimized: false,
          maximized: false,
        },
      ],
      zCounter: s.zCounter + 1,
    }));
  },
  close: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  focus: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex: s.zCounter + 1 } : w,
      ),
      zCounter: s.zCounter + 1,
    })),
  toggleMinimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w,
      ),
    })),
  toggleMaximize: (id) =>
    set((s) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      return {
        windows: s.windows.map((w) => {
          if (w.id !== id) return w;
          if (w.maximized && w.preMaximizeBounds) {
            return {
              ...w,
              maximized: false,
              bounds: w.preMaximizeBounds,
              preMaximizeBounds: undefined,
            };
          }
          return {
            ...w,
            maximized: true,
            preMaximizeBounds: w.bounds,
            bounds: {
              x: VIEWPORT_PADDING / 2,
              y: MENUBAR_HEIGHT + 4,
              width: vw - VIEWPORT_PADDING,
              height: vh - MENUBAR_HEIGHT - DOCK_HEIGHT - 4,
            },
          };
        }),
      };
    }),
  setBounds: (id, bounds) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, bounds } : w,
      ),
    })),
}));
