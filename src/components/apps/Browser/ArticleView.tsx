"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Article = {
  title: string;
  byline?: string | null;
  siteName?: string | null;
  publishedTime?: string | null;
  excerpt?: string | null;
  content: string;
};

type Status =
  | { kind: "loading" }
  | { kind: "ok"; article: Article }
  | { kind: "error"; message: string };

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ArticleView({
  url,
  onFallback,
}: {
  url: string;
  onFallback: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: "loading" });
    fetch(`/api/article?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return (await res.json()) as Article;
      })
      .then((article) => {
        if (cancelled) return;
        if (!article.content) {
          onFallback();
          return;
        }
        setStatus({ kind: "ok", article });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // Anything goes wrong → bounce to the simple preview card instead.
        onFallback();
        setStatus({ kind: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [url, onFallback]);

  if (status.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-surface text-foreground-muted">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  if (status.kind === "error") return null; // parent will render fallback

  const a = status.article;
  const host = hostnameOf(url);
  return (
    <div className="h-full overflow-auto bg-surface">
      <article className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-6 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold leading-tight text-foreground">
            {a.title}
          </h1>
          <p className="mt-2 text-xs text-foreground-subtle">
            {a.byline ? `${a.byline} · ` : ""}
            {a.publishedTime
              ? new Date(a.publishedTime).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Read on {a.siteName ?? host} <ExternalLink size={11} />
          </a>
        </header>
        <div
          className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-accent prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-surface-muted prose-img:rounded-md"
          dangerouslySetInnerHTML={{ __html: a.content }}
        />
      </article>
    </div>
  );
}
