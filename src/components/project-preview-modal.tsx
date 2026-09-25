import { useEffect } from "react";
import { ArrowUpRight, ExternalLink, Globe, Sparkles, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HubProject } from "@/lib/hub.functions";
import webDesignFallback from "@/assets/web-design.jpg";

interface ProjectPreviewModalProps {
  project: HubProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPreviewModal({ project, isOpen, onClose }: ProjectPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const imageSrc = project.image_url || webDesignFallback;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 animate-in fade-in duration-200"
    >
      {/* Backdrop com blur de vidro profundo */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Container com estética Liquid Glass */}
      <div className="glass-deep relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar visualização"
          className="absolute right-4 top-4 z-30 grid size-10 place-items-center rounded-full border border-white/20 bg-background/60 text-muted-foreground backdrop-blur-lg transition-all hover:bg-white/15 hover:text-foreground active:scale-95"
        >
          <X className="size-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Capa com proporção ampla e iluminação líquida */}
          <div className="relative aspect-video w-full overflow-hidden bg-muted/40 sm:max-h-[380px]">
            <img
              src={imageSrc}
              alt={project.title}
              draggable={false}
              className="h-full w-full object-cover select-none"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

            {/* Badges sobrepostos na capa */}
            <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap items-center gap-2">
              <span className="glass rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {project.category}
              </span>
              {project.featured && (
                <span className="glass flex items-center gap-1 rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                  <Sparkles className="size-3" />
                  Destaque
                </span>
              )}
            </div>
          </div>

          {/* Detalhes do Projeto */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                VISUALIZAÇÃO DE PROJETO // PREVIEW
              </span>
              <h2
                id="modal-project-title"
                className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground"
              >
                {project.title}
              </h2>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mr-1">
                  <Tag className="size-3" /> Tags:
                </span>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/80 bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Descrição Detalhada */}
            <div className="space-y-2 border-t border-border/40 pt-5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Sobre a criação
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* Identificador / Metadados */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-foreground/5 p-4 text-xs text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Identificador: </span>
                <code className="font-mono text-primary">{project.slug}</code>
              </div>
              {project.url && (
                <div className="flex items-center gap-1.5 truncate max-w-full">
                  <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{project.url}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé fixo do Modal */}
        <div className="glass flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            Voltar ao Hub
          </Button>

          {project.url && project.url !== "#" ? (
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
            >
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                Acessar Projeto
                <ArrowUpRight className="ml-2 size-4" />
              </a>
            </Button>
          ) : (
            <Button
              size="lg"
              disabled
              variant="outline"
              className="rounded-xl border-border/50 text-muted-foreground"
            >
              Link em Preparação
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
