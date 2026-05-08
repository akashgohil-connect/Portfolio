"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Globe, Menu } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKMARKS, PROJECTS } from "@/data/projects";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ArticleView } from "./Browser/ArticleView";
import { ProjectSidebar } from "./Browser/ProjectSidebar";

const BLOCKED_HOSTS = [
  "medium.com",
  "linkedin.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "github.com",
  "behance.net",
];

function isBlockedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return BLOCKED_HOSTS.some((h) => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function urlPillLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`.replace(
      /\/$/,
      "",
    );
  } catch {
    return url;
  }
}

function BlockedPreview({ url }: { url: string }) {
  const project = PROJECTS.find((p) => p.url === url);
  const bookmark = BOOKMARKS.find((b) => b.url === url);
  const host = hostnameOf(url);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
        <Globe size={22} strokeWidth={1.5} />
      </div>
      {project ? (
        <div>
          <h2 className="text-lg font-semibold">{project.title}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            {project.company} · {project.year}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-foreground-muted">
            {project.blurb}
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold">{bookmark?.title ?? host}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">{host}</p>
        </div>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
      >
        Open in new tab <ExternalLink size={12} />
      </a>
      <p className="max-w-md break-all text-[11px] text-foreground-subtle">
        {url}
      </p>
    </div>
  );
}

// Default landing URL — first project in the data file.
const DEFAULT_URL = PROJECTS[0].url;

export function BrowserApp() {
  const isMobile = useIsMobile();
  const [history, setHistory] = useState<string[]>([DEFAULT_URL]);
  const [cursor, setCursor] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentUrl = history[cursor];
  const blocked = useMemo(() => isBlockedUrl(currentUrl), [currentUrl]);
  const [forceFallback, setForceFallback] = useState(false);
  useEffect(() => setForceFallback(false), [currentUrl]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  function go(url: string) {
    if (!url) return;
    let normalized = url.trim();
    if (!/^https?:\/\//.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    if (normalized === currentUrl) {
      setDrawerOpen(false);
      return;
    }
    const next = history.slice(0, cursor + 1);
    next.push(normalized);
    setHistory(next);
    setCursor(next.length - 1);
    setDrawerOpen(false);
  }

  function back() {
    if (cursor > 0) setCursor(cursor - 1);
  }

  return (
    <div className="relative flex h-full bg-surface">
      {!isMobile && <ProjectSidebar currentUrl={currentUrl} onNavigate={go} />}

      {isMobile && (
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 z-20 bg-black/40"
              />
              <motion.aside
                key="drawer"
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                className="absolute inset-y-0 left-0 z-30"
              >
                <ProjectSidebar currentUrl={currentUrl} onNavigate={go} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      <div className="flex flex-1 flex-col">
        {/* Slim content header */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/60 px-3">
          {isMobile ? (
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted hover:bg-white/[0.06]"
            >
              <Menu size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={back}
              disabled={cursor === 0}
              aria-label="Back"
              className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div className="flex-1 truncate rounded-full bg-white/[0.04] px-3 py-1 text-center font-mono text-[11px] text-foreground-muted">
            {urlPillLabel(currentUrl)}
          </div>
          {blocked && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              className="flex h-6 w-6 items-center justify-center rounded text-foreground-subtle hover:text-foreground"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              {blocked ? (
                forceFallback ? (
                  <BlockedPreview url={currentUrl} />
                ) : (
                  <ArticleView
                    key={currentUrl}
                    url={currentUrl}
                    onFallback={() => setForceFallback(true)}
                  />
                )
              ) : (
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="h-full w-full bg-white"
                  title="Browser content"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
