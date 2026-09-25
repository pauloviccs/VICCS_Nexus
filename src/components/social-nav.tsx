import React from "react";

export type SocialLinksData = {
  youtube?: string;
  tiktok?: string;
  twitch?: string;
  kick?: string;
  instagram?: string;
  twitter?: string;
  donate?: string;
};

export interface SocialNavProps {
  links?: SocialLinksData | Record<string, string> | null | undefined;
  className?: string | undefined;
  showAll?: boolean | undefined;
}

export interface SocialNetworkItem {
  id: keyof SocialLinksData;
  name: string;
  hoverColor: string;
  hoverGlow: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

export const SOCIAL_NETWORKS: SocialNetworkItem[] = [
  {
    id: "youtube",
    name: "YouTube",
    hoverColor: "hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    hoverColor: "hover:text-[#00f2fe] hover:border-[#00f2fe]/50 hover:bg-[#00f2fe]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46 6.27 6.27 0 0 0 1.88-4.46V8.77a8.28 8.28 0 0 0 4.85 1.54V6.86a4.85 4.85 0 0 1-1-.17z" />
      </svg>
    ),
  },
  {
    id: "twitch",
    name: "Twitch",
    hoverColor: "hover:text-[#a970ff] hover:border-[#a970ff]/50 hover:bg-[#a970ff]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(169,112,255,0.5)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2.149 0L.537 4.119v16.036h5.051V24h3.818l3.771-3.845h3.045L23.463 13V0H2.149zm19.164 12.06l-3.045 3.075h-3.818l-3.045 3.074v-3.074H6.702V2.194h14.611V12.06zM17.343 5.48h-2.149v5.48h2.149V5.48zm-5.051 0h-2.149v5.48h2.149V5.48z" />
      </svg>
    ),
  },
  {
    id: "kick",
    name: "Kick",
    hoverColor: "hover:text-[#53FC18] hover:border-[#53FC18]/50 hover:bg-[#53FC18]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(83,252,24,0.6)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 2h5.5v5.5L12 2h6l-6.5 8 7 12h-6.2L8 14.5V22H2V2z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    hoverColor: "hover:text-[#E1306C] hover:border-[#E1306C]/50 hover:bg-[#E1306C]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(225,48,108,0.5)]",
    icon: ({ className = "size-4" }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    id: "twitter",
    name: "X / Twitter",
    hoverColor: "hover:text-white hover:border-white/50 hover:bg-white/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "donate",
    name: "Doação / Donate",
    hoverColor: "hover:text-[#F59E0B] hover:border-[#F59E0B]/50 hover:bg-[#F59E0B]/10",
    hoverGlow: "group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    icon: ({ className = "size-4" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
];

export function SocialNav({ links, className = "", showAll = false }: SocialNavProps) {
  const safeLinks = (links || {}) as SocialLinksData;
  const hasAnyLink = Object.values(safeLinks).some((url) => typeof url === "string" && url.trim().length > 0);

  // Se nenhuma rede foi cadastrada e não foi requisitado exibir todas, exibe todas com comportamento suave ou as cadastradas
  const visibleNetworks = SOCIAL_NETWORKS.filter((net) => {
    if (showAll) return true;
    if (hasAnyLink) {
      return Boolean(safeLinks[net.id] && safeLinks[net.id]?.trim().length);
    }
    // Fallback inicial amigável enquanto o admin ainda não preencheu
    return true;
  });

  return (
    <nav
      aria-label="Redes Sociais e Canais Oficiais"
      className={`glass group/dock inline-flex items-center gap-1 sm:gap-1.5 rounded-full p-1.5 border border-border/40 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-border/60 hover:shadow-primary/10 ${className}`}
    >
      {visibleNetworks.map((net) => {
        const rawUrl = safeLinks[net.id]?.trim();
        const url = rawUrl || "#";
        const isClickable = Boolean(rawUrl && rawUrl !== "#");

        return (
          <a
            key={net.id}
            href={url}
            target={isClickable ? "_blank" : undefined}
            rel={isClickable ? "noopener noreferrer" : undefined}
            title={isClickable ? `${net.name}: ${url}` : `${net.name} (Adicionar link no painel)`}
            aria-label={net.name}
            className={`group relative grid size-8 sm:size-8.5 place-items-center rounded-full border border-transparent text-muted-foreground transition-all duration-200 hover:scale-110 active:scale-95 ${
              net.hoverColor
            } ${!isClickable ? "opacity-60 cursor-pointer" : ""}`}
            onClick={(e) => {
              if (!isClickable) {
                // Previne salto de âncora se ainda não tem link preenchido
                e.preventDefault();
              }
            }}
          >
            <div className={`transition-all duration-200 ${net.hoverGlow}`}>
              <net.icon className="size-4" />
            </div>
            {/* Tooltip elegante em hover */}
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/95 px-2 py-0.5 text-[10px] font-medium text-foreground opacity-0 shadow-md backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 border border-border/40 z-30">
              {net.name}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
