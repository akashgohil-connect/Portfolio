"use client";

import { useEffect } from "react";
import { useWindows } from "@/store/windows";
import { isAppId } from "@/lib/apps";

/** On mount: open windows from `?app=`. On change: keep the URL in sync. */
export function useUrlSync() {
  const windows = useWindows((s) => s.windows);
  const open = useWindows((s) => s.open);

  // Hydrate from URL once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appsParam = params.getAll("app");
    appsParam.forEach((value) => {
      if (isAppId(value)) open(value);
    });
    // Intentionally one-shot — only initial deep-link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync open windows back into the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("app");
    windows
      .filter((w) => !w.minimized)
      .forEach((w) => params.append("app", w.id));
    const next = params.toString();
    const url = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [windows]);
}
