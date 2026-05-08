"use client";

const PLAYLIST_ID = "5hQgIJRchp8zcU8CLVrRej";
const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator`;

export function SpotifyApp() {
  return (
    <div className="h-full bg-surface p-3">
      <iframe
        src={EMBED_URL}
        title="Spotify Player"
        className="h-full w-full rounded-xl"
        style={{ border: 0 }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
