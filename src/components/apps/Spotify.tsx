"use client";

import { useEffect, useRef } from "react";

const PLAYLIST_URI = "spotify:playlist:37i9dQZF1DWWQRwui0ExPn";
const SDK_SRC = "https://open.spotify.com/embed/iframe-api/v1";

// Spotify IFrame API loader — singleton across the app. Once the SDK script
// fires `onSpotifyIframeApiReady`, every queued callback receives the API.
type IFrameApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: { play: () => void; destroy?: () => void }) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameApi) => void;
  }
}

let cachedApi: IFrameApi | null = null;
let pendingCallbacks: Array<(api: IFrameApi) => void> = [];

function loadSpotifyApi(): Promise<IFrameApi> {
  return new Promise((resolve) => {
    if (cachedApi) {
      resolve(cachedApi);
      return;
    }
    pendingCallbacks.push(resolve);
    if (document.getElementById("spotify-iframe-api")) return;
    window.onSpotifyIframeApiReady = (api: IFrameApi) => {
      cachedApi = api;
      const queue = pendingCallbacks;
      pendingCallbacks = [];
      queue.forEach((cb) => cb(api));
    };
    const script = document.createElement("script");
    script.id = "spotify-iframe-api";
    script.src = SDK_SRC;
    script.async = true;
    document.body.appendChild(script);
  });
}

export function SpotifyApp() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let controller: { play: () => void; destroy?: () => void } | null = null;
    let cancelled = false;

    loadSpotifyApi().then((api) => {
      if (cancelled || !containerRef.current) return;
      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      containerRef.current.appendChild(mount);
      api.createController(
        mount,
        { uri: PLAYLIST_URI, width: "100%", height: "100%" },
        (c) => {
          controller = c;
          if (cancelled) return;
          // The dock-click that opened this window IS a user gesture, so this
          // play() call passes the browser autoplay gate.
          try {
            c.play();
          } catch {
            /* user can hit play manually */
          }
        },
      );
    });

    return () => {
      cancelled = true;
      controller?.destroy?.();
    };
  }, []);

  return (
    <div className="h-full bg-surface">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
