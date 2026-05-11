# Terminal Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring "premium typography demo" feel to the Terminal app — streamed command output, blinking block caret, ghost-text Tab autocomplete, refined palette, and a `neofetch` profile command.

**Architecture:** Single-file change at `src/components/apps/Terminal.tsx`. Reuse the existing intro typewriter pattern as a generic scheduler. Render caret + ghost inside the prompt row alongside the input. Add one new `Line` kind for `neofetch`. No new files, no test infrastructure (this codebase has none — verification is `tsc --noEmit` + `pnpm lint` + dev-server visual check).

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, framer-motion (already imported elsewhere; not needed here).

**Spec:** [docs/superpowers/specs/2026-05-11-terminal-polish-design.md](../specs/2026-05-11-terminal-polish-design.md)

---

## Task 1 — Palette + section refinements

Lowest-risk pure-visual change. Establishes the baseline look before the structural changes.

**Files:**
- Modify: `src/components/apps/Terminal.tsx`

- [ ] **Step 1: Update palette tokens**

Open `src/components/apps/Terminal.tsx`. Find the `C` token object (around line 31) and replace:

```ts
const C = {
  bg: "#15140f",
  bright: "#e6e3d8",
  muted: "#cfcdc2",
  dim: "#b8b6ab",
  faded: "#a4a194",
  green: "#7fb287",
  greenDim: "#4a6e54",
  amber: "#e0a23a",
  cyan: "#7ab9d4",
};
```

(only `dim` changed: `#9a9892` → `#b8b6ab`)

- [ ] **Step 2: Refine the `section` line renderer**

Find the `case "section":` block inside `LineView` (around line 238). Replace it with:

```tsx
    case "section":
      return (
        <pre className="whitespace-pre">
          <span
            style={{
              color: C.bright,
              letterSpacing: "0.14em",
              fontWeight: 600,
            }}
          >
            {line.label.toUpperCase()}
          </span>
          <span style={{ color: C.greenDim }}>
            {"  " + "─".repeat(Math.max(2, BANNER_WIDTH - line.label.length - 2))}
          </span>
        </pre>
      );
```

This drops the amber `▸ ` arrow and the standalone amber colour. The section label is now bright white with tracking; a thin dim rule extends to the banner width.

- [ ] **Step 3: Add subtle banner glow**

Find `case "banner":` in `LineView` (around line 194) and add `textShadow`:

```tsx
    case "banner":
      return (
        <pre
          className="whitespace-pre"
          style={{
            color: C.green,
            textShadow: `0 0 8px ${C.green}22`,
          }}
        >
          {line.text}
        </pre>
      );
```

- [ ] **Step 4: Type-check + lint**

Run:
```bash
pnpm exec tsc --noEmit
pnpm lint src/components/apps/Terminal.tsx
```
Expected: both clean.

- [ ] **Step 5: Visual verify**

Run `pnpm dev` (or use the running dev server). Open the Terminal app from the dock. Confirm:
- Intro banner has a soft green glow
- Section headers (e.g. inside `skills` output) render as bright uppercase with a thin dim trailing rule, no amber arrow
- Muted text reads cleanly against the dark background (slightly lifted)

- [ ] **Step 6: Commit**

```bash
git add src/components/apps/Terminal.tsx
git commit -m "Refine terminal palette and section header style"
```

---

## Task 2 — Refactor handlers to return Line[] + add scheduler

Restructures command output into a queue-based animator. No new user-visible behaviour yet — output still appears all at once initially. This is the foundation Task 3 uses.

**Files:**
- Modify: `src/components/apps/Terminal.tsx`

- [ ] **Step 1: Add the scheduler helper**

Inside `TerminalApp`, near the existing `useEffect` for the intro (around line 316), add a ref and a helper. After the existing `inputRef` declaration:

```ts
  const animCancelRef = useRef<(() => void) | null>(null);

  function scheduleLines(newLines: Line[], onDone?: () => void) {
    // Cancel any in-flight animation first.
    animCancelRef.current?.();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || newLines.length === 0) {
      setLines((prev) => [...prev, ...newLines]);
      animCancelRef.current = null;
      onDone?.();
      return;
    }

    let cancelled = false;
    let idx = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const cancel = () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
      // Flush any remaining lines synchronously so output isn't lost.
      const remaining = newLines.slice(idx);
      if (remaining.length > 0) {
        setLines((prev) => [...prev, ...remaining]);
      }
      animCancelRef.current = null;
    };

    const tick = () => {
      if (cancelled) return;
      if (idx >= newLines.length) {
        animCancelRef.current = null;
        onDone?.();
        return;
      }
      const line = newLines[idx];
      setLines((prev) => [...prev, line]);
      idx += 1;
      const len = lineLength(line);
      const delay =
        len === 0
          ? 14
          : line.kind === "banner"
            ? 20
            : line.kind === "rule" || line.kind === "section"
              ? 24
              : Math.min(45, 12 + len * 0.6);
      timerId = setTimeout(tick, delay);
    };

    animCancelRef.current = cancel;
    timerId = setTimeout(tick, 0);
  }
```

Note: pacing is tighter than the intro (which lingers for boot drama). Per-command output should feel snappy, not slow.

- [ ] **Step 2: Update `runCommand` to use scheduler**

Replace the entire `runCommand` function (around line 371). Find it and replace with:

```ts
  function runCommand(raw: string) {
    const cmd = raw.trim();
    // Echo line lands synchronously — feels immediate.
    setLines((prev) => [...prev, { kind: "input", text: `${PROMPT} ${cmd}` }]);
    if (!cmd) return;

    const [name, ...args] = cmd.split(/\s+/);
    const out: Line[] = [];
    const error = (text: string) => out.push({ kind: "output", text });

    switch (name.toLowerCase()) {
      case "help":
        out.push(...helpOutput());
        break;
      case "whoami":
        out.push(...whoamiOutput());
        break;
      case "about":
        out.push(...aboutOutput());
        break;
      case "skills":
        out.push(...skillsOutput());
        break;
      case "experience":
      case "exp":
        out.push(...experienceOutput());
        break;
      case "education":
        out.push(...educationOutput());
        break;
      case "projects":
      case "ls":
        out.push(...projectsOutput());
        break;
      case "contact":
        out.push(...contactOutput());
        break;
      case "resume":
        useWindows.getState().open("resume");
        out.push({ kind: "muted", text: "Opening resume…" });
        break;
      case "ascii":
      case "banner":
        out.push(...bannerLines(), { kind: "rule", text: RULE });
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
        out.push({ kind: "muted", text: `Opening ${project.title} in a new tab…` });
        break;
      }
      case "clear":
      case "cls":
        animCancelRef.current?.();
        setLines([]);
        return;
      case "exit":
      case "close":
        useWindows.getState().close("terminal");
        return;
      case "echo":
        out.push({ kind: "output", text: args.join(" ") });
        break;
      case "date":
        out.push({ kind: "output", text: new Date().toString() });
        break;
      default:
        error(`command not found: ${name}. Type 'help'.`);
    }

    scheduleLines(out);
  }
```

Two changes from the original:
1. Each command builds an `out: Line[]` array instead of calling `append(...)` directly.
2. `scheduleLines(out)` at the end streams it (or flushes instantly under reduced-motion).
3. `clear` cancels any in-flight animation before wiping.

- [ ] **Step 3: Remove the now-unused `append` helper**

Find `function append(...newLines: Line[])` (around line 367) and delete it.

- [ ] **Step 4: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint src/components/apps/Terminal.tsx
```
Expected: both clean.

- [ ] **Step 5: Visual verify**

Open Terminal. Type `help` → confirm output streams in line-by-line (snappy, not slow). Type `skills` → streams. Type a second command mid-stream → the previous output completes synchronously, then the new echo lands, then new output streams. Type `clear` → wipes screen, no leftover queue.

- [ ] **Step 6: Commit**

```bash
git add src/components/apps/Terminal.tsx
git commit -m "Stream terminal command output via scheduler"
```

---

## Task 3 — Add `neofetch` command

New line kind, renderer, command handler.

**Files:**
- Modify: `src/components/apps/Terminal.tsx`

- [ ] **Step 1: Extend the `Line` union**

Find the `type Line = ...` union (around line 8) and add a new variant. Replace the union with:

```ts
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
  | { kind: "neofetch"; ascii: string[]; rows: Array<[string, string]> }
  | { kind: "blank" };
```

- [ ] **Step 2: Add `lineLength` case for `neofetch`**

Find `function lineLength(line: Line): number` (around line 165) and add a case before the closing brace of the switch:

```ts
    case "neofetch":
      return line.ascii.reduce((max, l) => Math.max(max, l.length), 0)
        + line.rows.reduce((sum, [k, v]) => sum + k.length + v.length, 0);
```

This keeps the scheduler from breaking on the new kind.

- [ ] **Step 3: Add the `neofetch` renderer**

In `LineView` (around line 189), add a new case before the closing brace of its switch:

```tsx
    case "neofetch": {
      return (
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 py-1 sm:flex-nowrap">
          <pre
            className="whitespace-pre shrink-0"
            style={{
              color: C.green,
              textShadow: `0 0 8px ${C.green}22`,
            }}
          >
            {line.ascii.join("\n")}
          </pre>
          <div className="min-w-0 flex-1">
            {line.rows.map(([k, v]) => (
              <pre
                key={k}
                className="whitespace-pre-wrap break-words"
              >
                <span style={{ color: C.cyan, fontWeight: 600 }}>
                  {k.padEnd(10).slice(0, 10)}
                </span>
                <span style={{ color: C.dim }}>{"  "}</span>
                <span style={{ color: C.bright }}>{v}</span>
              </pre>
            ))}
          </div>
        </div>
      );
    }
```

- [ ] **Step 4: Add the `neofetch` output builder**

Just above `function helpOutput()` (around line 155), add:

```ts
function neofetchOutput(): Line[] {
  return [
    {
      kind: "neofetch",
      ascii: [
        "  ▄▀█ █▀▀",
        "  █▀█ █▄█",
        "",
        "  ──────",
      ],
      rows: [
        ["host", about.name],
        ["role", about.role],
        ["where", about.location],
        ["uptime", "2+ years"],
        ["stack", "Next.js · React · TypeScript · Tailwind · Framer Motion"],
        ["theme", "Tahoe Dim"],
        ["shell", "akash-sh"],
      ],
    },
  ];
}
```

- [ ] **Step 5: Wire `neofetch` into `runCommand` and `HELP_ITEMS`**

In `HELP_ITEMS` (around line 139), insert this entry between `"ascii"` and `"clear"`:

```ts
  ["neofetch", "system-style profile card"],
```

In `runCommand`'s switch (modified in Task 2), add a case before `default`:

```ts
      case "neofetch":
      case "fetch":
        out.push(...neofetchOutput());
        break;
```

- [ ] **Step 6: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint src/components/apps/Terminal.tsx
```
Expected: both clean.

- [ ] **Step 7: Visual verify**

Open Terminal. Type `neofetch` → ASCII monogram on the left, key/value stats on the right (Host, Role, etc.). On mobile (375px) the right column wraps below the ASCII (flex-wrap). Type `help` → confirm `neofetch` appears in the command list.

- [ ] **Step 8: Commit**

```bash
git add src/components/apps/Terminal.tsx
git commit -m "Add neofetch command to terminal"
```

---

## Task 4 — Blinking block caret

Hide the native caret; render our own block-style cursor at the end of the typed input.

**Files:**
- Modify: `src/components/apps/Terminal.tsx`

- [ ] **Step 1: Add the keyframe + class via inline `<style>`**

At the top of the `TerminalApp` component's return, add a `<style>` element. Find the outer `<div>` of the component's JSX (around line 477) and insert immediately inside it (before the scroll container):

```tsx
      <style>{`
        @keyframes terminalBlink { 50% { opacity: 0 } }
        .terminal-caret {
          display: inline-block;
          width: 0.6ch;
          height: 1.1em;
          margin-left: 1px;
          vertical-align: -2px;
          background: ${C.green};
          animation: terminalBlink 1.1s steps(2, end) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .terminal-caret { animation: none; }
        }
      `}</style>
```

- [ ] **Step 2: Update the prompt row to size input to content + render block caret**

Find the `{introDone && (...)}` block (around line 489) and replace its contents with:

```tsx
        {introDone && (
          <div className="flex items-center gap-2">
            <span style={{ color: C.green }}>{PROMPT}</span>
            <span className="relative flex min-w-0 flex-1 items-center">
              <span className="relative inline-grid">
                <span
                  aria-hidden
                  className="invisible whitespace-pre font-mono"
                  style={{ gridArea: "1 / 1" }}
                >
                  {input || " "}
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="bg-transparent font-mono outline-none"
                  style={{
                    gridArea: "1 / 1",
                    color: C.bright,
                    caretColor: "transparent",
                    width: "100%",
                  }}
                  aria-label="Terminal input"
                />
              </span>
              <span aria-hidden className="terminal-caret" />
            </span>
          </div>
        )}
```

The inline-grid mirror trick sizes the input to its content. The caret then sits naturally to its right.

- [ ] **Step 3: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint src/components/apps/Terminal.tsx
```
Expected: both clean.

- [ ] **Step 4: Visual verify**

Open Terminal. Confirm:
- A green block caret sits immediately after the last typed character
- Blinks at ~1.1s cycle
- Native caret is invisible
- Caret stays at the end of input as you type (the inline-grid mirror sizes the input)
- Clicking inside the input still focuses it; selecting / pasting still works
- On `prefers-reduced-motion: reduce`, caret is steady (no blink)

- [ ] **Step 5: Commit**

```bash
git add src/components/apps/Terminal.tsx
git commit -m "Add blinking block caret to terminal input"
```

---

## Task 5 — Ghost-text inline autocomplete

Compute completion from current input. Render greyed suffix between input and caret. Tab accepts; clicking the ghost also accepts.

**Files:**
- Modify: `src/components/apps/Terminal.tsx`

- [ ] **Step 1: Add the completion computer**

Just above `export function TerminalApp()` (around line 305), add:

```ts
const COMMAND_NAMES = [
  "help",
  "whoami",
  "about",
  "skills",
  "experience",
  "education",
  "projects",
  "contact",
  "resume",
  "ascii",
  "neofetch",
  "open",
  "clear",
  "exit",
  "echo",
  "date",
];

function computeCompletion(input: string, projectSlugs: string[]): string {
  if (input.length === 0) return "";
  // Don't autocomplete after a trailing space unless we're completing an arg.
  const parts = input.split(" ");
  if (parts.length === 1) {
    const prefix = parts[0];
    const match = COMMAND_NAMES.find(
      (c) => c !== prefix && c.startsWith(prefix),
    );
    return match ? match.slice(prefix.length) : "";
  }
  if (parts.length === 2 && parts[0] === "open") {
    const prefix = parts[1];
    if (prefix.length === 0) return "";
    const match = projectSlugs.find(
      (s) => s !== prefix && s.startsWith(prefix),
    );
    return match ? match.slice(prefix.length) : "";
  }
  return "";
}
```

- [ ] **Step 2: Wire completion + Tab + click-to-accept into the component**

Add this `useMemo` near the top of `TerminalApp` (after the existing state hooks):

```ts
  const projectSlugs = useMemo(() => PROJECTS.map((p) => p.slug), []);
  const completion = useMemo(
    () => computeCompletion(input, projectSlugs),
    [input, projectSlugs],
  );

  function acceptCompletion() {
    if (!completion) return;
    setInput(input + completion);
    inputRef.current?.focus();
  }
```

Add the `useMemo` import — find the existing `import { useEffect, useRef, useState } from "react";` line and replace with:

```ts
import { useEffect, useMemo, useRef, useState } from "react";
```

- [ ] **Step 3: Handle Tab in `onKeyDown`**

Find `function onKeyDown(...)` (around line 446) and add a case at the top of the function body (before the existing `if (e.key === "Enter")` branch):

```ts
    if (e.key === "Tab") {
      e.preventDefault();
      if (completion) {
        setInput(input + completion);
      }
      return;
    }
```

- [ ] **Step 4: Render the ghost span in the prompt row**

Find the prompt row JSX from Task 4. Insert the ghost span between the inline-grid wrapper and the caret. Replace the prompt block with:

```tsx
        {introDone && (
          <div className="flex items-center gap-2">
            <span style={{ color: C.green }}>{PROMPT}</span>
            <span className="relative flex min-w-0 flex-1 items-center">
              <span className="relative inline-grid">
                <span
                  aria-hidden
                  className="invisible whitespace-pre font-mono"
                  style={{ gridArea: "1 / 1" }}
                >
                  {input || " "}
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="bg-transparent font-mono outline-none"
                  style={{
                    gridArea: "1 / 1",
                    color: C.bright,
                    caretColor: "transparent",
                    width: "100%",
                  }}
                  aria-label="Terminal input"
                />
              </span>
              <span aria-hidden className="terminal-caret" />
              {completion && (
                <span
                  onMouseDown={(e) => {
                    e.preventDefault();
                    acceptCompletion();
                  }}
                  className="cursor-pointer whitespace-pre select-none font-mono"
                  style={{ color: C.faded, opacity: 0.6 }}
                  title="Tap to autocomplete"
                >
                  {completion}
                </span>
              )}
            </span>
          </div>
        )}
```

Visual order: input → caret → ghost. Ghost is `cursor-pointer` so taps accept on mobile (where Tab isn't reachable).

- [ ] **Step 5: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint src/components/apps/Terminal.tsx
```
Expected: both clean.

- [ ] **Step 6: Visual verify**

Open Terminal. Confirm:
- Type `sk` → greyed `ills` appears immediately after the caret
- Press Tab → input becomes `skills`, ghost disappears
- Press Enter → `skills` runs, output streams in
- Type `open i` → greyed slug appears (e.g. `o-vision`)
- Type `open ` with trailing space + nothing → no ghost
- Type `ls f` → no ghost (slug completion is `open`-only; `ls` is just an alias for `projects`)
- Type `xyz` → no ghost (no match)
- Type `help` (exact match) → no ghost (filter excludes exact matches)
- On mobile: type `sk`, tap the greyed `ills` → input becomes `skills` (no Tab key needed)
- Up/Down arrow history still works; history doesn't trigger ghost-text recomputation glitches

- [ ] **Step 7: Commit**

```bash
git add src/components/apps/Terminal.tsx
git commit -m "Add ghost-text Tab autocomplete to terminal"
```

---

## Final verification

- [ ] **Type-check the full project**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Lint**

```bash
pnpm lint
```
Expected: clean (or only pre-existing warnings unrelated to Terminal.tsx).

- [ ] **End-to-end smoke**

Open the dev server, open the Terminal:
1. Intro animates (banner glow, refined section style).
2. Type `sk` → ghost, Tab → fills, Enter → output streams.
3. Type `neofetch` → two-column profile renders.
4. Type a second command mid-stream → previous output flushes, new command runs cleanly.
5. Caret blinks at end of input.
6. `clear` wipes screen.
7. Reload page with `prefers-reduced-motion: reduce` set → animations instant, caret static.

- [ ] **Push**

```bash
git push origin main
```
