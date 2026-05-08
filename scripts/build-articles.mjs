// One-shot script that fetches each Medium project article via the user's RSS
// feed and writes the cleaned, sanitized HTML into src/data/articles.json so
// the in-app Browser can render them without runtime fetches in production.
//
// Run manually: `node scripts/build-articles.mjs`
// Or via prebuild: triggered automatically before `next build`.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RSS_URL = "https://medium.com/feed/@akashgohil.connect";
const PROJECTS_PATH = path.join(ROOT, "src/data/projects.ts");
const OUTPUT_PATH = path.join(ROOT, "src/data/articles.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function unwrapCdata(s) {
  return s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
}
function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? unwrapCdata(m[1]) : null;
}
function postIdFromUrl(urlString) {
  const u = new URL(urlString);
  const m = u.pathname.match(/-([0-9a-f]{8,})\/?$/);
  return m ? m[1] : null;
}

const projectsTs = await fs.readFile(PROJECTS_PATH, "utf8");
const urlRegex = /url:\s*"([^"]+)"/g;
const allUrls = [...projectsTs.matchAll(urlRegex)].map((m) => m[1]);
const mediumUrls = allUrls.filter((u) => {
  try {
    return new URL(u).hostname.endsWith("medium.com");
  } catch {
    return false;
  }
});

console.log(`Project URLs: ${allUrls.length} (${mediumUrls.length} on Medium)`);

if (mediumUrls.length === 0) {
  await fs.writeFile(OUTPUT_PATH, "{}\n");
  console.log("No Medium URLs — wrote empty cache.");
  process.exit(0);
}

console.log(`Fetching RSS: ${RSS_URL}`);
const res = await fetch(RSS_URL, { headers: { "User-Agent": UA } });
if (!res.ok) {
  console.error(`RSS fetch failed: HTTP ${res.status}`);
  process.exit(1);
}
const xml = await res.text();

const items = xml
  .split(/<item>/)
  .slice(1)
  .map((s) => s.split(/<\/item>/)[0]);

const dom = new JSDOM("<!doctype html><body></body>");
const purify = DOMPurify(dom.window);

const articles = {};
for (const url of mediumUrls) {
  const postId = postIdFromUrl(url);
  if (!postId) {
    console.warn(`  skipped ${url} (no post ID)`);
    continue;
  }
  const item = items.find((i) => i.includes(postId));
  if (!item) {
    console.warn(`  skipped ${postId} (no RSS item)`);
    continue;
  }
  const title = extractTag(item, "title") ?? "Untitled";
  const creator = extractTag(item, "dc:creator");
  const pubDate = extractTag(item, "pubDate");
  const content = extractTag(item, "content:encoded");
  if (!content) {
    console.warn(`  skipped ${postId} (no content:encoded)`);
    continue;
  }
  const clean = purify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
  articles[url] = {
    title,
    byline: creator,
    siteName: "Medium",
    publishedTime: pubDate ? new Date(pubDate).toISOString() : null,
    content: clean,
  };
  console.log(`  cached: ${title} (${clean.length} chars)`);
}

await fs.writeFile(OUTPUT_PATH, JSON.stringify(articles, null, 2));
console.log(
  `Wrote ${Object.keys(articles).length} articles → src/data/articles.json`,
);
