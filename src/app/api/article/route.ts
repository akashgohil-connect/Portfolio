import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";

// Hosts the route will attempt to extract from. Anything else is rejected so
// the endpoint can't be repurposed as a generic web proxy.
const ALLOWED_HOSTS = [
  "medium.com",
  "linkedin.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "github.com",
  "behance.net",
  "wikipedia.org",
];

// Medium blocks server-side scraping but the RSS feed is open. The user's
// articles are syndicated here with the full body in <content:encoded>.
const MEDIUM_RSS_USER = "akashgohil.connect";
const MEDIUM_RSS_URL = `https://medium.com/feed/@${MEDIUM_RSS_USER}`;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function isAllowed(url: URL) {
  return ALLOWED_HOSTS.some((h) => url.hostname.endsWith(h));
}

// Medium URLs end in `-{12-hex postId}` (e.g. `...-6c350ea8a38f`). Pull it.
function mediumPostIdFromUrl(url: URL): string | null {
  const match = url.pathname.match(/-([0-9a-f]{8,})\/?$/);
  return match ? match[1] : null;
}

type Article = {
  title: string;
  byline?: string | null;
  siteName?: string | null;
  publishedTime?: string | null;
  excerpt?: string | null;
  content: string;
};

async function viaReadability(url: URL): Promise<Article | null> {
  const upstream = await fetch(url.toString(), {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!upstream.ok) return null;
  const html = await upstream.text();
  const dom = new JSDOM(html, { url: url.toString() });
  const article = new Readability(dom.window.document).parse();
  if (!article || !article.content) return null;
  const purify = DOMPurify(dom.window as unknown as Window & typeof globalThis);
  return {
    title: article.title ?? "Untitled",
    byline: article.byline,
    siteName: article.siteName,
    publishedTime: article.publishedTime,
    excerpt: article.excerpt,
    content: purify.sanitize(article.content, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick"],
    }),
  };
}

function unwrapCdata(s: string): string {
  return s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = xml.match(re);
  return m ? unwrapCdata(m[1]) : null;
}

async function viaMediumRss(url: URL): Promise<Article | null> {
  const postId = mediumPostIdFromUrl(url);
  if (!postId) return null;
  const res = await fetch(MEDIUM_RSS_URL, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const xml = await res.text();

  // Split into <item> blocks and find the one whose guid contains the post ID.
  const items = xml.split(/<item>/).slice(1).map((s) => s.split(/<\/item>/)[0]);
  const item = items.find((i) => i.includes(postId));
  if (!item) return null;

  const title = extractTag(item, "title") ?? "Untitled";
  const link = extractTag(item, "link");
  const creator = extractTag(item, "dc:creator");
  const pubDate = extractTag(item, "pubDate");
  const content = extractTag(item, "content:encoded");
  if (!content) return null;

  // RSS is plain HTML — sanitise via JSDOM-backed DOMPurify.
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: link ?? url.toString(),
  });
  const purify = DOMPurify(dom.window as unknown as Window & typeof globalThis);
  const clean = purify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });

  return {
    title,
    byline: creator,
    siteName: "Medium",
    publishedTime: pubDate ? new Date(pubDate).toISOString() : null,
    content: clean,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return NextResponse.json({ error: "Bad protocol" }, { status: 400 });
  }
  if (!isAllowed(parsed)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  let article: Article | null = null;
  try {
    if (parsed.hostname.endsWith("medium.com")) {
      article = await viaMediumRss(parsed);
    } else {
      article = await viaReadability(parsed);
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Fetch failed", detail: String(err) },
      { status: 502 },
    );
  }

  if (!article) {
    return NextResponse.json({ error: "No article content" }, { status: 422 });
  }

  return NextResponse.json(article, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
