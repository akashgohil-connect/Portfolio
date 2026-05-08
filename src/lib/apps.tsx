import { Folder, Globe, Music, SquareTerminal, User } from "lucide-react";
import type { AppDef, AppId } from "@/lib/types";
import { TerminalApp } from "@/components/apps/Terminal";
import { ResumeApp, ResumeMobileHeaderRight } from "@/components/apps/Resume";
import { BrowserApp } from "@/components/apps/Browser";
import { SpotifyApp } from "@/components/apps/Spotify";

export const APPS: Record<AppId, AppDef> = {
  terminal: {
    id: "terminal",
    title: "Terminal",
    icon: SquareTerminal,
    iconColor: "#15140f",
    iconImage: "/icons/terminal.png",
    defaultSize: { width: 720, height: 460 },
    minSize: { width: 360, height: 240 },
    Component: TerminalApp,
    desktop: false,
    dock: true,
  },
  resume: {
    id: "resume",
    title: "Resume",
    icon: Folder,
    iconColor: "#e0a23a",
    iconImage: "/icons/resume.png",
    defaultSize: { width: 760, height: 920 },
    minSize: { width: 480, height: 480 },
    Component: ResumeApp,
    mobileHeaderRight: () => <ResumeMobileHeaderRight />,
    desktop: false,
    dock: true,
  },
  browser: {
    id: "browser",
    title: "Internet",
    icon: Globe,
    iconColor: "#2b6cb0",
    iconImage: "/icons/browser.png",
    defaultSize: { width: 1040, height: 680 },
    minSize: { width: 720, height: 480 },
    Component: BrowserApp,
    desktop: false,
    dock: true,
  },
  spotify: {
    id: "spotify",
    title: "Spotify",
    icon: Music,
    iconColor: "#1DB954",
    iconImage: "/icons/spotify.png",
    defaultSize: { width: 400, height: 540 },
    minSize: { width: 320, height: 360 },
    Component: SpotifyApp,
    desktop: false,
    dock: true,
  },
  about: {
    id: "about",
    title: "About",
    icon: User,
    iconColor: "#15140f",
    defaultSize: { width: 480, height: 360 },
    Component: () => null,
    desktop: false,
    dock: false,
  },
};

export const APP_ORDER: AppId[] = [
  "terminal",
  "resume",
  "browser",
  "spotify",
];

export function getApp(id: AppId): AppDef {
  return APPS[id];
}

export function isAppId(value: string): value is AppId {
  return value in APPS;
}
