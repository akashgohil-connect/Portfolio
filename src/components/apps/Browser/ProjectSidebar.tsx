"use client";

import { motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { BOOKMARKS, PROJECTS } from "@/data/projects";

const HOVER_SPRING = { type: "spring" as const, stiffness: 500, damping: 22 };

// Brand SVGs from simple-icons (CC0). Single path, fill="currentColor" so the
// glyph inherits the parent's text colour.
const LinkedinGlyph = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.063 2.063 0 1 1 0-4.127 2.063 2.063 0 0 1 0 4.127zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramGlyph = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const PINNED_BRANDS: Record<
  string,
  { Icon: ComponentType<SVGProps<SVGSVGElement>>; tint: string }
> = {
  LinkedIn: { Icon: LinkedinGlyph, tint: "rgba(40, 100, 200, 0.55)" },
  Instagram: { Icon: InstagramGlyph, tint: "rgba(200, 60, 130, 0.55)" },
};

type Props = {
  currentUrl: string;
  onNavigate: (url: string) => void;
};

export function ProjectSidebar({ currentUrl, onNavigate }: Props) {
  return (
    <aside
      className="flex h-full w-[220px] shrink-0 flex-col border-r border-border-strong bg-surface-muted"
      style={{ boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04)" }}
    >
      {/* Section label */}
      <div className="border-b border-border/60 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
        Selected Work
      </div>

      {/* Project tabs */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {PROJECTS.map((p) => {
          const active = currentUrl === p.url;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onNavigate(p.url)}
              className={`group relative flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                active
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span className="line-clamp-1 text-[13px] font-medium text-foreground">
                {p.title}
              </span>
              <span className="text-[11px] text-foreground-muted">
                {p.company} · {p.year}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Social pinned row */}
      <div className="border-t border-border/60 px-3 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Social
        </div>
        <div className="flex items-center gap-2">
          {BOOKMARKS.map((b) => {
            const brand = PINNED_BRANDS[b.title];
            if (!brand) return null;
            const { Icon, tint } = brand;
            return (
              <motion.a
                key={b.url}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={b.title}
                title={b.title}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                transition={HOVER_SPRING}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground"
                style={{ backgroundColor: tint }}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.a>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
