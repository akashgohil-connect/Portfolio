"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import articlesCache from "@/data/articles.json";

type Article = {
  title: string;
  byline?: string | null;
  siteName?: string | null;
  publishedTime?: string | null;
  excerpt?: string | null;
  content: string;
};

const CACHE = articlesCache as Record<string, Article>;

type Status =
  | { kind: "loading" }
  | { kind: "ok"; article: Article }
  | { kind: "error"; message: string };

export function ArticleView({
  url,
  onFallback,
}: {
  url: string;
  onFallback: () => void;
}) {
  // Static cache (built at deploy time by scripts/build-articles.mjs) lets the
  // user's own Medium articles render instantly with no runtime fetch — works
  // reliably in production where Medium often blocks cloud-provider IPs.
  const cached = CACHE[url];
  const [status, setStatus] = useState<Status>(() =>
    cached ? { kind: "ok", article: cached } : { kind: "loading" },
  );

  useEffect(() => {
    if (cached) {
      setStatus({ kind: "ok", article: cached });
      return;
    }
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
  }, [url, cached, onFallback]);

  if (status.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-surface text-foreground-muted">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  if (status.kind === "error") return null; // parent will render fallback

  const a = status.article;
  return (
    <div className="h-full w-full overflow-auto bg-surface">
      <article
        className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
      >
        <header className="mb-6 border-b border-border pb-6">
          <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
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
        </header>
        <div
          className="
            prose prose-invert max-w-none break-words
            prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
            prose-blockquote:text-foreground prose-blockquote:border-l-border
            prose-figcaption:text-foreground-muted prose-em:text-foreground
            prose-strong:text-foreground prose-a:text-accent prose-code:text-foreground
            prose-pre:bg-surface-muted prose-th:text-foreground prose-td:text-foreground
            prose-img:rounded-md
            [&_*]:max-w-full!
            [&_img]:h-auto [&_img]:w-auto
            [&_figure]:my-6
            [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap
            [&_table]:block [&_table]:overflow-x-auto
          "
          dangerouslySetInnerHTML={{ __html: a.content }}
        />
      </article>
    </div>
  );
}
