"use client";

import { ArrowLeft, ArrowRight, ExternalLink, Globe, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKMARKS, PROJECTS } from "@/data/projects";
import { ArticleView } from "./Browser/ArticleView";

const HOME_URL = "about:start";

// Hosts that send X-Frame-Options: DENY (or equivalent CSP) and can never be
// iframed. We render a styled preview card for these instead of showing the
// browser's native "refused to connect" page.
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

function StartPage({ onGo }: { onGo: (url: string) => void }) {
  return (
    <div className="h-full overflow-auto bg-surface px-6 py-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-lg font-semibold">Selected Work</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Case studies and live products. Click to open.
        </p>
        <ul className="mt-4 space-y-2">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => onGo(p.url)}
                className="group flex w-full items-start gap-3 rounded-md border border-border bg-surface-muted p-3 text-left transition-colors hover:border-border-strong"
              >
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-foreground-muted">
                  <Globe size={16} />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.title}</span>
                    <span className="text-[11px] text-foreground-subtle">
                      {p.company} · {p.year}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-foreground-muted">
                    {p.blurb}
                  </span>
                </span>
                <ExternalLink
                  size={14}
                  className="mt-1.5 shrink-0 text-foreground-subtle group-hover:text-foreground"
                />
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-sm font-semibold">Bookmarks</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {BOOKMARKS.map((b) => (
            <a
              key={b.url}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs hover:border-border-strong"
            >
              {b.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrowserApp() {
  const [history, setHistory] = useState<string[]>([HOME_URL]);
  const [cursor, setCursor] = useState(0);
  const [addressInput, setAddressInput] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = history[cursor];
  const blocked = useMemo(
    () => currentUrl !== HOME_URL && isBlockedUrl(currentUrl),
    [currentUrl],
  );
  // ArticleView calls onFallback() when Readability can't extract content
  // (e.g. profile pages, image-only posts) — we drop back to the static card.
  const [forceFallback, setForceFallback] = useState(false);
  useEffect(() => setForceFallback(false), [currentUrl]);

  function go(url: string) {
    if (!url) return;
    let normalized = url.trim();
    if (normalized !== HOME_URL && !/^https?:\/\//.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const next = history.slice(0, cursor + 1);
    next.push(normalized);
    setHistory(next);
    setCursor(next.length - 1);
    setAddressInput(normalized === HOME_URL ? "" : normalized);
  }

  function back() {
    if (cursor > 0) setCursor(cursor - 1);
  }
  function forward() {
    if (cursor < history.length - 1) setCursor(cursor + 1);
  }
  function refresh() {
    if (iframeRef.current && currentUrl !== HOME_URL) {
      iframeRef.current.src = currentUrl;
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Chrome */}
      <div className="border-b border-border bg-white/[0.04] px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={back}
            disabled={cursor === 0}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-black/5 disabled:opacity-30"
            aria-label="Back"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={forward}
            disabled={cursor >= history.length - 1}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-black/5 disabled:opacity-30"
            aria-label="Forward"
          >
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={currentUrl === HOME_URL}
            className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:bg-black/5 disabled:opacity-30"
            aria-label="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              go(addressInput || HOME_URL);
            }}
          >
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder={currentUrl === HOME_URL ? "Search or enter URL" : currentUrl}
              className="w-full rounded-md border border-border bg-surface-muted px-3 py-1 text-xs text-foreground outline-none focus:border-accent"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          </form>
          <button
            type="button"
            onClick={() => go(HOME_URL)}
            className="rounded px-2 py-1 text-xs text-foreground-muted hover:bg-black/5"
          >
            Home
          </button>
        </div>
        {/* Bookmarks bar */}
        <div className="mt-1 flex items-center gap-1 overflow-x-auto pb-0.5">
          {BOOKMARKS.map((b) => (
            <a
              key={b.url}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded px-2 py-0.5 text-[11px] text-foreground-muted hover:bg-black/5"
            >
              {b.title}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {currentUrl === HOME_URL ? (
          <StartPage onGo={go} />
        ) : blocked ? (
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
      </div>
    </div>
  );
}
