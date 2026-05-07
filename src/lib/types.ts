import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type AppId =
  | "terminal"
  | "resume"
  | "browser"
  | "personal"
  | "spotify"
  | "about";

export type AppDef = {
  id: AppId;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  /** Optional raster/SVG icon shown instead of the Lucide icon. */
  iconImage?: string;
  defaultSize: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  minSize?: { width: number; height: number };
  /** Rendered inside the window body. */
  Component: ComponentType;
  /** Show on the desktop. */
  desktop?: boolean;
  /** Show in the dock as a quick-launch. */
  dock?: boolean;
};

export type WindowState = {
  id: AppId;
  bounds: { x: number; y: number; width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  /** Stored bounds before maximize, so we can restore. */
  preMaximizeBounds?: { x: number; y: number; width: number; height: number };
};
