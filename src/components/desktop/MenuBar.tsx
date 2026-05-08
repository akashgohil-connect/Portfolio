"use client";

import { useEffect, useState } from "react";

function formatTime(d: Date) {
  return d
    .toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");
}

export function MenuBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  return (
    <header className="glass-thin fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between border-b px-4 text-[12px]">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Akash</span>
        <span className="text-foreground">Finder</span>
        <span className="text-foreground hidden sm:inline">File</span>
        <span className="text-foreground hidden sm:inline">View</span>
        <span className="text-foreground hidden sm:inline">Help</span>
      </div>
      <div className="flex items-center gap-3 text-foreground">
        <span className="hidden sm:inline">Product Designer</span>
        <span suppressHydrationWarning>{now ? formatTime(now) : "—"}</span>
      </div>
    </header>
  );
}
