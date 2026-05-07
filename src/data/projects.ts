export type Project = {
  slug: string;
  title: string;
  company?: string;
  year: string;
  blurb: string;
  /** External URL — Medium article, live product, etc. */
  url: string;
  /**
   * Some hosts block iframes (Medium, LinkedIn). Set to `external`
   * for those — the Browser app will offer "Open externally" instead of
   * trying to render an iframe.
   */
  mode: "iframe" | "external";
};

export const PROJECTS: Project[] = [
  {
    slug: "io-vision",
    title: "I/O Vision",
    company: "Faclon Labs",
    year: "2025",
    blurb:
      "Computer vision platform — add cameras, apply AI detection, monitor real-time insights.",
    url: "https://medium.com/@akashgohil.connect/i-o-vision-designing-a-computer-vision-platform-for-industrial-plants-6c350ea8a38f",
    mode: "external",
  },
  {
    slug: "design-system-ai-codebase",
    title: "Design System → AI-ready Codebase",
    company: "Faclon Labs",
    year: "2025",
    blurb:
      "Converted the production design system into an AI-friendly codebase using Claude Code & Codex.",
    url: "https://medium.com/@akashgohil.connect/i-was-waiting-for-my-designs-to-ship-so-i-stopped-waiting-and-started-coding-6886e12b62c4",
    mode: "external",
  },
  {
    slug: "faclon-platform",
    title: "Faclon Platform — UI/UX Iteration",
    company: "Faclon Labs",
    year: "2025",
    blurb:
      "Reduced complexity across an established product while preserving brand identity.",
    url: "https://medium.com/@akashgohil.connect/designing-the-faclon-labs-design-system-a-foundation-for-modern-industrial-software-767b56a81ab2",
    mode: "external",
  },
];

export type Bookmark = {
  title: string;
  url: string;
  mode: "iframe" | "external";
};

/** Pre-populated bookmarks for the Browser app. */
export const BOOKMARKS: Bookmark[] = [
  {
    title: "LinkedIn",
    url: "https://www.linkedin.com/in/akashgohil/",
    mode: "external",
  },
  {
    title: "Instagram",
    url: "https://www.instagram.com/akash.pdf/",
    mode: "external",
  },
];
