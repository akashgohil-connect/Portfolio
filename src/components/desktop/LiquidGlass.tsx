"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Port of the Framer "Liquid Glass" component (LiquidGlass-Prod-gRUy.js).
 * Generates a per-instance SVG displacement map and references it through
 * `backdrop-filter: url(#filterId)`. Three RGB-channel feDisplacementMap
 * passes recreate Apple's chromatic-dispersion edge bend.
 */

export type LiquidGlassConfig = {
  /** Displacement strength on the backdrop (px). 160 ≈ Tahoe default. */
  scale?: number;
  /** Visual border radius. Match the wrapped element's radius. */
  radius?: number;
  /** Inner-rim thickness as a fraction of min(w,h). 0–0.5. */
  border?: number;
  /** Lightness of the inner rim (0–100). */
  lightness?: number;
  /** Final feGaussianBlur stdDeviation (post displacement softening). */
  displace?: number;
  /** Alpha of the inner rim. 0–1. */
  alpha?: number;
  /** Pre-blur of the displacement map (creates the lens curve). */
  blur?: number;
  /** Chromatic-dispersion offset between channels (px). */
  dispersion?: number;
  /** Frost wash on top of the backdrop. 0–1. */
  frost?: number;
  /** Specular gradient-border colour. */
  borderColor?: string;
};

const DEFAULT_CONFIG: Required<LiquidGlassConfig> = {
  scale: 160,
  radius: 50,
  border: 0.05,
  lightness: 53,
  displace: 0.38,
  alpha: 0.9,
  blur: 5,
  dispersion: 50,
  frost: 0.1,
  borderColor: "rgba(120, 120, 120, 0.7)",
};

type Props = LiquidGlassConfig & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function LiquidGlass({
  children,
  className,
  style,
  ...overrides
}: Props) {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ width: 400, height: 200 });
  const rawId = useId();
  const filterId = `liquid-glass-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        setDim({ width: r.width, height: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displacementUri = useMemo(() => {
    const w = dim.width / 2;
    const h = dim.height / 2;
    const borderPx = Math.min(w, h) * (config.border * 0.5);
    const r = Math.min(config.radius, dim.width / 2, dim.height / 2);
    const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect x="0" y="0" width="${w}" height="${h}" fill="black"/><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#red)"/><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#blue)" style="mix-blend-mode: difference"/><rect x="${borderPx}" y="${borderPx}" width="${w - borderPx * 2}" height="${h - borderPx * 2}" rx="${r}" fill="hsl(0 0% ${config.lightness}% / ${config.alpha})" style="filter:blur(${config.blur}px)"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [dim, config.border, config.radius, config.lightness, config.alpha, config.blur]);

  const dispScale = config.scale + config.dispersion;

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: config.radius,
          background: `hsl(0 0% 100% / ${config.frost})`,
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <svg
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feImage
                href={displacementUri}
                x="0"
                y="0"
                width="100%"
                height="100%"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={dispScale}
                xChannelSelector="R"
                yChannelSelector="B"
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="red"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={dispScale}
                xChannelSelector="R"
                yChannelSelector="B"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="green"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={dispScale}
                xChannelSelector="R"
                yChannelSelector="B"
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 1 0  0 0 0 1 0"
                result="blue"
              />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur in="output" stdDeviation={config.displace} />
            </filter>
          </defs>
        </svg>
      </div>
      <div
        aria-hidden
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: config.radius,
          pointerEvents: "none",
          background: `linear-gradient(315deg, ${config.borderColor} 0%, rgba(120,120,120,0) 30%, rgba(120,120,120,0) 70%, ${config.borderColor} 100%) border-box`,
          mask:
            "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          border: "1px solid transparent",
          zIndex: 1,
          ...style,
        }}
      />
      {children}
    </>
  );
}
