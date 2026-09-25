import { useState, useRef, useCallback } from "react";
import characterSvg from "@/assets/brand/VICCS_CharacterSideProfile.svg";
import brandIcon from "@/assets/brand/VICCS_Design_Icon_BWR.svg";

import { cn } from "@/lib/utils";

export function HoloCharacterCard({ className }: { className?: string } = {}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({
    x: 50,
    y: 50,
    rx: 0,
    ry: 0,
    active: false,
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    // Tilt angle capped at +-12 deg to prevent dramatic clipping while giving full 3D feel
    const ry = (px - 0.5) * 24;
    const rx = (0.5 - py) * 24;

    setState({
      x: Math.round(px * 100),
      y: Math.round(py * 100),
      rx,
      ry,
      active: true,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rx: 0,
      ry: 0,
      active: false,
    }));
  }, []);

  return (
    <aside
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="VICCS Character Holo Card"
      className={cn(
        "holo-card-wrapper pointer-events-auto absolute right-0 xl:right-2 bottom-0 z-10 hidden lg:block select-none",
        className
      )}
      style={{
        perspective: "1000px",
        width: "380px",
        height: "520px",
      }}
    >
      <div
        suppressHydrationWarning
        className="holo-card relative h-full w-full rounded-3xl overflow-hidden border select-none pointer-events-none"
        style={{
          transform: state.active
            ? `rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale3d(1.02, 1.02, 1.02)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: state.active
            ? "transform 0.12s ease-out, box-shadow 0.25s ease-out, border-color 0.3s ease"
            : "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.6s ease, border-color 0.6s ease",
          transformStyle: "preserve-3d",
          borderColor: state.active
            ? "oklch(0.91 0.012 210 / 28%)"
            : "oklch(0.91 0.012 210 / 8%)",
          background: state.active
            ? "linear-gradient(155deg, oklch(0.24 0.04 240 / 65%), oklch(0.15 0.02 240 / 85%))"
            : "linear-gradient(155deg, oklch(0.2 0.03 240 / 20%), oklch(0.12 0.015 240 / 40%))",
          boxShadow: state.active
            ? `0 25px 60px -20px rgba(0, 0, 0, 0.85),
               0 0 35px -8px oklch(0.82 0.115 170 / 30%),
               inset 0 1px 0 rgba(255, 255, 255, 0.25),
               inset 0 0 25px oklch(0.82 0.115 170 / 12%)`
            : "0 10px 30px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(18px)",
        }}
      >
        {/* Holographic Prismatic Rainbow Foil */}
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
          style={{
            opacity: state.active ? 0.75 : 0.12,
            background: `linear-gradient(
              ${115 + state.x * 0.4}deg,
              transparent 15%,
              rgba(255, 0, 128, 0.22) 28%,
              rgba(0, 240, 255, 0.3) 48%,
              rgba(255, 220, 0, 0.25) 64%,
              rgba(168, 85, 247, 0.24) 78%,
              transparent 92%
            )`,
            mixBlendMode: "color-dodge",
          }}
        />

        {/* Dynamic Holographic Specular Glare */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: state.active ? 0.85 : 0,
            background: `radial-gradient(
              circle at ${state.x}% ${state.y}%,
              rgba(255, 255, 255, 0.45) 0%,
              rgba(255, 255, 255, 0.1) 35%,
              transparent 65%
            )`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Micro-diagonal Holo Grid Texture */}
        <div
          className="pointer-events-none absolute inset-0 z-15 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.05) 0px,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px,
              transparent 6px
            )`,
          }}
        />

        {/* Top Badge: Identity Header */}
        <div className="relative z-30 flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-white/10 p-1 border border-white/10">
              <img src={brandIcon} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="font-mono text-[10px] tracking-wider text-foreground/70 uppercase">
              VICCS // NEXUS
            </span>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[9px] font-medium tracking-widest text-accent">
            HOLO·3D
          </span>
        </div>

        {/* Character SVG with 3D Parallax Depth */}
        <div className="absolute inset-x-0 bottom-0 top-12 z-5 flex items-end justify-center overflow-hidden pointer-events-none select-none">
          <img
            src={characterSvg}
            alt="VICCS Character Side Profile"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="h-[450px] w-auto max-w-none object-contain transition-all duration-300 pointer-events-none select-none"
            style={{
              userSelect: "none",
              WebkitUserDrag: "none" as unknown as undefined,
              transform: state.active
                ? `translate3d(${state.ry * 0.35}px, ${-state.rx * 0.25}px, 20px) scale(1.03)`
                : "translate3d(0, 0, 0) scale(1)",
              filter: state.active
                ? "drop-shadow(0 15px 30px rgba(0, 0, 0, 0.7)) contrast(1.1) brightness(1.15)"
                : "opacity(0.3) contrast(0.9) brightness(0.9)",
              opacity: state.active ? 0.95 : 0.3,
            }}
          />
        </div>

        {/* Bottom Card Label */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between p-4 bg-gradient-to-t from-background/95 via-background/50 to-transparent">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            CHARACTER ARCHETYPE
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            SEC·01 // 3D
          </span>
        </div>
      </div>
    </aside>
  );
}
