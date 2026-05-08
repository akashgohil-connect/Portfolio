"use client";

import { useEffect, useRef, useState } from "react";
import { about, education, experience, skills } from "@/data/about";
import { PROJECTS } from "@/data/projects";
import { useWindows } from "@/store/windows";

type Line =
  | { kind: "input"; text: string }
  | { kind: "output"; text: string }
  | { kind: "system"; text: string }
  | { kind: "banner"; text: string }
  | { kind: "rule"; text: string }
  | { kind: "section"; label: string }
  | { kind: "kv"; key: string; value: string }
  | { kind: "label"; text: string }
  | { kind: "muted"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "command"; cmd: string; desc: string }
  | { kind: "blank" };

const PROMPT = "akash@portfolio:~$";

const BANNER = String.raw`█▀█ █▄▀ ▄▀█ █▀ █░█   █▀▀ █▀█ █░█ █ █░░
█▀█ █░█ █▀█ ▄█ █▀█   █▄█ █▄█ █▀█ █ █▄▄`;

const BANNER_WIDTH = 38;
const RULE = "─".repeat(BANNER_WIDTH);

// Tokens
const C = {
  bg: "#15140f",
  bright: "#e6e3d8",
  muted: "#cfcdc2",
  dim: "#9a9892",
  faded: "#a4a194",
  green: "#7fb287",
  greenDim: "#4a6e54",
  amber: "#e0a23a",
  cyan: "#7ab9d4",
};

function bannerLines(): Line[] {
  return BANNER.split("\n").map((text) => ({ kind: "banner", text }));
}

const blank = (): Line => ({ kind: "blank" });

const INTRO: Line[] = [
  { kind: "system", text: "Last login: today" },
  blank(),
  ...bannerLines(),
  { kind: "rule", text: RULE },
  { kind: "system", text: ` ${about.role} · 2+ years · ${about.location}` },
  { kind: "rule", text: RULE },
  blank(),
  { kind: "input", text: `${PROMPT} cat about.txt` },
  { kind: "output", text: about.shortBio },
  blank(),
  { kind: "input", text: `${PROMPT} help` },
  {
    kind: "output",
    text: "Type a command. Try: skills · experience · projects · contact · clear",
  },
  blank(),
];

// --- Command output renderers --------------------------------------------

function whoamiOutput(): Line[] {
  return [
    { kind: "label", text: about.name },
    { kind: "muted", text: `${about.role} · ${about.location}` },
  ];
}

function aboutOutput(): Line[] {
  return about.longBio.flatMap<Line>((p, i) =>
    i === 0 ? [{ kind: "output", text: p }] : [blank(), { kind: "output", text: p }],
  );
}

function skillsOutput(): Line[] {
  const lines: Line[] = [{ kind: "section", label: "Skills" }, blank()];
  for (const [group, items] of Object.entries(skills)) {
    lines.push({ kind: "label", text: group });
    lines.push({ kind: "muted", text: `  ${items.join(" · ")}` });
    lines.push(blank());
  }
  return lines;
}

function experienceOutput(): Line[] {
  const lines: Line[] = [{ kind: "section", label: "Experience" }, blank()];
  experience.forEach((e, i) => {
    lines.push({ kind: "label", text: e.role });
    lines.push({ kind: "muted", text: `${e.company} · ${e.period}` });
    e.bullets.forEach((b) => lines.push({ kind: "bullet", text: b }));
    if (i < experience.length - 1) lines.push(blank());
  });
  return lines;
}

function educationOutput(): Line[] {
  const lines: Line[] = [{ kind: "section", label: "Education" }, blank()];
  education.forEach((e, i) => {
    lines.push({ kind: "label", text: e.qualification });
    lines.push({ kind: "muted", text: `${e.institution} · ${e.detail}` });
    if (i < education.length - 1) lines.push(blank());
  });
  return lines;
}

function projectsOutput(): Line[] {
  const lines: Line[] = [{ kind: "section", label: "Projects" }, blank()];
  PROJECTS.forEach((p, i) => {
    lines.push({ kind: "kv", key: p.slug, value: p.title });
    lines.push({ kind: "muted", text: `  ${p.company ?? ""} · ${p.year}` });
    lines.push({ kind: "muted", text: `  ${p.blurb}` });
    if (i < PROJECTS.length - 1) lines.push(blank());
  });
  lines.push(blank());
  lines.push({ kind: "muted", text: "Try: open <slug>" });
  return lines;
}

function contactOutput(): Line[] {
  const c = about.contact;
  return [
    { kind: "section", label: "Contact" },
    blank(),
    { kind: "kv", key: "email", value: c.email },
    { kind: "kv", key: "phone", value: c.phone },
    { kind: "kv", key: "linkedin", value: c.linkedin },
    { kind: "kv", key: "medium", value: c.medium },
  ];
}

const HELP_ITEMS: Array<[string, string]> = [
  ["help", "show this help"],
  ["whoami", "short bio"],
  ["about", "longer bio"],
  ["skills", "tooling and disciplines"],
  ["experience", "roles and responsibilities"],
  ["education", "academic background"],
  ["projects", "list selected projects"],
  ["open <slug>", "open a project in the Browser"],
  ["contact", "ways to reach me"],
  ["resume", "open the resume"],
  ["ascii", "print the ASCII banner"],
  ["clear", "clear the screen"],
  ["exit", "close the terminal"],
];

function helpOutput(): Line[] {
  return [
    { kind: "section", label: "Commands" },
    blank(),
    ...HELP_ITEMS.map<Line>(([cmd, desc]) => ({ kind: "command", cmd, desc })),
  ];
}

// --- Length helper for the typewriter delay ------------------------------

function lineLength(line: Line): number {
  switch (line.kind) {
    case "blank":
      return 0;
    case "banner":
    case "rule":
    case "input":
    case "output":
    case "system":
    case "label":
    case "muted":
    case "bullet":
      return line.text?.length ?? 0;
    case "section":
      return line.label.length;
    case "kv":
      return line.key.length + line.value.length;
    case "command":
      return line.cmd.length + line.desc.length;
  }
}

// --- Renderer ------------------------------------------------------------

function LineView({ line }: { line: Line }) {
  switch (line.kind) {
    case "blank":
      return <pre className="whitespace-pre"> </pre>;

    case "banner":
      return (
        <pre className="whitespace-pre" style={{ color: C.green }}>
          {line.text}
        </pre>
      );

    case "rule":
      return (
        <pre className="whitespace-pre" style={{ color: C.greenDim }}>
          {line.text}
        </pre>
      );

    case "input":
      return (
        <pre
          className="whitespace-pre-wrap break-words"
          style={{ color: C.bright }}
        >
          {line.text || " "}
        </pre>
      );

    case "output":
      return (
        <pre
          className="whitespace-pre-wrap break-words"
          style={{ color: C.muted }}
        >
          {line.text || " "}
        </pre>
      );

    case "system":
      return (
        <pre
          className="whitespace-pre-wrap break-words"
          style={{ color: C.faded }}
        >
          {line.text || " "}
        </pre>
      );

    case "section":
      return (
        <pre className="whitespace-pre">
          <span style={{ color: C.green }}>▸ </span>
          <span
            style={{
              color: C.amber,
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {line.label.toUpperCase()}
          </span>
        </pre>
      );

    case "label":
      return (
        <pre
          className="whitespace-pre-wrap break-words"
          style={{ color: C.bright, fontWeight: 600 }}
        >
          {line.text}
        </pre>
      );

    case "muted":
      return (
        <pre
          className="whitespace-pre-wrap break-words"
          style={{ color: C.dim }}
        >
          {line.text}
        </pre>
      );

    case "bullet":
      return (
        <pre className="whitespace-pre-wrap break-words pl-4 -indent-4">
          <span style={{ color: C.green }}>  › </span>
          <span style={{ color: C.muted }}>{line.text}</span>
        </pre>
      );

    case "kv": {
      const padded = line.key.padEnd(10).slice(0, 10);
      return (
        <pre className="whitespace-pre-wrap break-words">
          <span style={{ color: C.cyan }}>{`  ${padded}  `}</span>
          <span style={{ color: C.bright }}>{line.value}</span>
        </pre>
      );
    }

    case "command": {
      const padded = line.cmd.padEnd(14).slice(0, 14);
      return (
        <pre className="whitespace-pre-wrap break-words">
          <span style={{ color: C.green }}>{`  ${padded}  `}</span>
          <span style={{ color: C.dim }}>{line.desc}</span>
        </pre>
      );
    }
  }
}

// --- Component -----------------------------------------------------------

export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter intro.
  useEffect(() => {
    let cancelled = false;
    let idx = 0;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const t = setTimeout(() => {
        setLines(INTRO);
        setIntroDone(true);
      }, 0);
      return () => clearTimeout(t);
    }

    const tick = () => {
      if (cancelled || idx >= INTRO.length) {
        setIntroDone(true);
        return;
      }
      const line = INTRO[idx];
      setLines((prev) => [...prev, line]);
      idx += 1;
      const len = lineLength(line);
      const delay =
        len === 0
          ? 18
          : line.kind === "banner"
            ? 22
            : line.kind === "rule"
              ? 30
              : Math.min(60, 18 + len * 1.2);
      setTimeout(tick, delay);
    };
    const startId = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(startId);
    };
  }, []);

  // Auto-scroll on new lines.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  // Auto-focus input.
  useEffect(() => {
    if (introDone) inputRef.current?.focus();
  }, [introDone]);

  function append(...newLines: Line[]) {
    setLines((prev) => [...prev, ...newLines]);
  }

  function runCommand(raw: string) {
    const cmd = raw.trim();
    append({ kind: "input", text: `${PROMPT} ${cmd}` });
    if (!cmd) return;

    const [name, ...args] = cmd.split(/\s+/);
    const error = (text: string) => append({ kind: "output", text });

    switch (name.toLowerCase()) {
      case "help":
        append(...helpOutput());
        break;
      case "whoami":
        append(...whoamiOutput());
        break;
      case "about":
        append(...aboutOutput());
        break;
      case "skills":
        append(...skillsOutput());
        break;
      case "experience":
      case "exp":
        append(...experienceOutput());
        break;
      case "education":
        append(...educationOutput());
        break;
      case "projects":
      case "ls":
        append(...projectsOutput());
        break;
      case "contact":
        append(...contactOutput());
        break;
      case "resume":
        useWindows.getState().open("resume");
        append({ kind: "muted", text: "Opening resume…" });
        break;
      case "ascii":
      case "banner":
        append(...bannerLines(), { kind: "rule", text: RULE });
        break;
      case "open": {
        const slug = args[0];
        const project = PROJECTS.find((p) => p.slug === slug);
        if (!project) {
          error(`open: no project named '${slug ?? ""}'. Try 'projects'.`);
          break;
        }
        if (typeof window !== "undefined") {
          window.open(project.url, "_blank", "noopener,noreferrer");
        }
        append({ kind: "muted", text: `Opening ${project.title} in a new tab…` });
        break;
      }
      case "clear":
      case "cls":
        setLines([]);
        return;
      case "exit":
      case "close":
        useWindows.getState().close("terminal");
        return;
      case "echo":
        append({ kind: "output", text: args.join(" ") });
        break;
      case "date":
        append({ kind: "output", text: new Date().toString() });
        break;
      default:
        error(`command not found: ${name}. Type 'help'.`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const value = input;
      setInput("");
      setHistoryIdx(null);
      if (value.trim()) {
        setHistory((h) => [...h, value]);
      }
      runCommand(value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next =
        historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === null) return;
      const next = historyIdx + 1;
      if (next >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(next);
        setInput(history[next]);
      }
    }
  }

  return (
    <div
      className="flex h-full flex-col font-mono text-[13px] leading-[1.55]"
      style={{ background: C.bg, color: C.bright }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2"
      >
        {lines.map((line, i) => (
          <LineView key={i} line={line} />
        ))}
        {introDone && (
          <div className="flex items-center gap-2">
            <span style={{ color: C.green }}>{PROMPT}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 bg-transparent font-mono outline-none"
              style={{ color: C.bright, caretColor: C.bright }}
              aria-label="Terminal input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
