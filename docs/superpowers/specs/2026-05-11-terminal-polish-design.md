# Terminal polish pass — design

## Context

The portfolio's Terminal app at [src/components/apps/Terminal.tsx](../../../src/components/apps/Terminal.tsx) already has a typewriter intro, ASCII banner, ~12 commands, history navigation, and custom render kinds. Reference: Framer Marketplace "Terminal Demo: Premium Typography Component." Goal — bring four polish hallmarks of that reference into our terminal: refined visual styling, per-command typed output, ghost-text Tab autocomplete, and a `neofetch`-style profile command.

Intent: feels premium, not "becomes a real shell." Single-file change.

## Scope

1. **Animated command output** — every command's output streams in line-by-line, not just the intro.
2. **Blinking block caret** — hide native, render our own.
3. **Visual polish** — palette + section header treatment + subtle banner glow.
4. **Ghost-text inline autocomplete** — commands and `open <slug>`. Tab accepts; touch fallback.
5. **`neofetch` command** — two-column ASCII monogram + key/value profile.

Out of scope: theme switching, modular file split (commands.ts / theme.ts), sound effects, CRT scanlines, multi-tab terminal, real shell semantics.

## Architecture

Everything stays in `src/components/apps/Terminal.tsx`. New helpers added inline. No new files.

### 1. Animated command output

Extract the existing intro typewriter into a reusable helper:

```ts
function scheduleLines(
  newLines: Line[],
  onDone?: () => void,
): () => void {
  // returns a cancel fn; schedules setTimeout chain identical to intro logic;
  // honours prefers-reduced-motion -> appends all at once
}
```

Refactor `runCommand` so each handler returns `Line[]` instead of calling `append(...)` directly. `runCommand` then:
1. Pushes the `input` echo line immediately.
2. Calls `scheduleLines(outputLines)` to stream the response.

State: track the active cancel function in a ref. If user submits a new command mid-animation, cancel + flush the remaining queue immediately (append synchronously) before the new echo line lands. Avoids losing output.

### 2. Blinking block caret

Hide native: `style={{ caretColor: "transparent" }}` on the input. Render our own:

```tsx
<span className="terminal-caret" />
```

CSS in component (inline `<style>` or Tailwind arbitrary):
```css
@keyframes terminalBlink { 50% { opacity: 0 } }
.terminal-caret { animation: terminalBlink 1.1s steps(2, end) infinite; }
```

Block style: 0.6ch wide × 1.2em tall, `background: #7fb287` (green), positioned **immediately after typed value, before the ghost** — i.e. visual order is `input → caret → ghost`. Mirrors macOS Terminal / fish behaviour.

### 3. Palette + section refinements

- **Section headers**: drop `▸ AMBER` style. Render as bright uppercase tracking, with a thin dim rule under: `BRIGHT UPPERCASE  ────────`.
- **Dim color**: `#9a9892` → `#b8b6ab` (better readability against `#15140f` bg).
- **Banner glow**: add `text-shadow: 0 0 8px ${green}22` on banner lines only. Subtle.
- Keep everything else.

### 4. Ghost-text inline autocomplete

State derivation (no new state needed):
```ts
const completion = useMemo(() => computeCompletion(input), [input]);
```

Logic:
- Tokenize input on whitespace.
- If 1 token: prefix-match against command names. First match wins. Return the suffix only (text NOT yet typed).
- If first token is `open` or `ls` and second token is in progress: prefix-match against `PROJECTS.map(p => p.slug)`. Return the suffix.
- Otherwise no completion.

Render:
```tsx
<div className="flex items-center gap-2">
  <span style={{ color: green }}>{PROMPT}</span>
  <span className="relative flex-1 flex items-center">
    {/* input sized to its content via mirror trick */}
    <Sized input />
    <span className="terminal-caret" />
    {completion && (
      <span className="ghost" onClick={acceptCompletion}>
        {completion}
      </span>
    )}
  </span>
</div>
```
Order matters: caret sits between input and ghost so it visually marks the insertion point.

The ghost span is positioned **inline after the input's value width**. Use a measurement technique: render a hidden `<span>` mirroring the typed value, then position the ghost absolutely or via an inline flex layout where the input is `width: ch-based` shrunk to content. Simplest path: wrap input in a `inline-grid` container with a hidden sizing span; input + ghost both sit on top in a stack.

Detailed approach — sizing input by content:
```tsx
<span className="inline-grid">
  <span className="invisible whitespace-pre" aria-hidden>
    {input || " "}
  </span>
  <input
    style={{ gridArea: "1 / 1" }}
    ...
  />
</span>
<span className="ghost">{completion}</span>
<span className="terminal-caret" />
```
The input shares grid cell 1/1 with a hidden mirror that determines its width. The ghost + caret then sit inline immediately after.

**Tab key**: if `completion` non-empty, `e.preventDefault()` + `setInput(input + completion)`. No-op otherwise.

**Touch fallback**: ghost span is clickable; on click, runs the same accept handler.

### 5. `neofetch` command

New line kind:
```ts
| { kind: "neofetch"; ascii: string[]; rows: Array<[string, string]> }
```

Renderer: a flex row with the ascii block on the left (pre, green) and the rows stacked on the right (key in cyan, value in bright). On mobile the columns stack vertically.

ASCII monogram — small (~8 rows × ~14 cols), distinct from the boot banner:

```
 ▄▀█ █▀▀
 █▀█ █▄█
```

Rows (data from [`src/data/about.ts`](../../../src/data/about.ts) + [`src/data/projects.ts`](../../../src/data/projects.ts)):
- Host       — Akash Gohil
- Role       — Product Designer
- Location   — Mumbai, India
- Uptime     — 2+ years
- Stack      — Next.js · React · TypeScript · Tailwind · Framer Motion
- Theme      — Tahoe Dim
- Shell      — akash-sh

Add `neofetch` to `HELP_ITEMS`. Wire in `runCommand` switch.

## Data flow

```
keypress -> onChange -> setInput(value)
                          -> useMemo computes `completion`
                          -> render row with input + ghost + caret
Tab       -> if completion: setInput(input + completion)
Enter     -> cancel active animation queue
          -> push history
          -> append input echo line synchronously
          -> scheduleLines(outputForCommand(parsed))
```

## Verification

1. `pnpm exec tsc --noEmit` clean
2. Open Terminal:
   - Intro animates as today
   - Type `sk` → "ills" appears as grey ghost
   - Tab → fills `skills`; Enter → output streams line-by-line
   - Type `open i` → project-slug ghost (e.g. `o-vision`)
   - Press Tab with no ghost → no-op
   - Caret blinks at 1.1s cycle continuously, even between keystrokes
   - Up/Down history still works
   - `neofetch` → two-column block renders
3. `prefers-reduced-motion: reduce` → all command output appears instant; caret still blinks (CSS, low cost, doesn't move)
4. Mobile (375): ghost text visible; tap ghost to accept; layout doesn't overflow
5. Submit a command mid-animation of a previous command → previous output completes synchronously, new echo + new output queue starts cleanly

## Non-goals

- Theme presets (single palette stays)
- File split / module extraction
- Multi-tab / multi-session terminal
- Sound effects, CRT scanlines, VHS effects
- Real shell semantics (env vars, pipes, redirection, `cd`)
- Inline command-hint dropdown (decided against; ghost text only)
