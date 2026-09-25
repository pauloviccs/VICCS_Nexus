import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicHub, type HubProject } from "@/lib/hub.functions";
import featuredImage from "@/assets/featured-optical.jpg";
import simsInterior from "@/assets/sims-interior.jpg";
import simsCharacter from "@/assets/sims-character.jpg";
import webDesign from "@/assets/web-design.jpg";
import ideSkills from "@/assets/ide-skills.jpg";
import brandIcon from "@/assets/brand/VICCS_Design_Icon_BWR.svg";
import brandLogo from "@/assets/brand/VICCS_Design_Logo_txt.svg";
import { HoloCharacterCard } from "@/components/holo-character-card";
import { ProjectPreviewModal } from "@/components/project-preview-modal";

const demoProjects: HubProject[] = [
  { id: "demo-1", title: "Aurora Design System", slug: "aurora", description: "Uma biblioteca visual para produtos digitais coesos, rápidos e expressivos.", category: "Sistemas", url: "#", image_url: featuredImage, tags: ["Web", "Design System"], featured: true, published: true, sort_order: 0, created_by: null, created_at: "", updated_at: "" },
  { id: "demo-2", title: "Hearth & Habitats", slug: "hearth", description: "Construções, sobrevivência e histórias para um mundo tomado por zumbis.", category: "Mods Sims 4", url: "#", image_url: simsInterior, tags: ["Sims 4", "Mods"], featured: false, published: true, sort_order: 1, created_by: null, created_at: "", updated_at: "" },
  { id: "demo-3", title: "Afterlight Survivors", slug: "afterlight", description: "Personagens e mecânicas para narrativas de sobrevivência.", category: "Mods Sims 4", url: "#", image_url: simsCharacter, tags: ["CAS", "Gameplay"], featured: false, published: true, sort_order: 2, created_by: null, created_at: "", updated_at: "" },
  { id: "demo-4", title: "Lumen Studio", slug: "lumen", description: "Interfaces imersivas com hierarquia precisa e presença visual.", category: "Web Design", url: "#", image_url: webDesign, tags: ["UI", "Sites"], featured: false, published: true, sort_order: 3, created_by: null, created_at: "", updated_at: "" },
  { id: "demo-5", title: "Prism IDE Kit", slug: "prism", description: "Skills, snippets e fluxos para ambientes de desenvolvimento.", category: "Skills IDE", url: "#", image_url: ideSkills, tags: ["IDE", "Código"], featured: false, published: true, sort_order: 4, created_by: null, created_at: "", updated_at: "" },
];

export const Route = createFileRoute("/")({
  loader: () => getPublicHub(),
  head: () => ({ meta: [
    { title: "NEXUS — Central de projetos digitais" },
    { name: "description", content: "Sites, sistemas, mods de The Sims 4, web design, portfólio, código e skills reunidos em um hub." },
    { property: "og:title", content: "NEXUS — Central de projetos digitais" },
    { property: "og:description", content: "Explore uma coleção viva de projetos, sistemas, mods e experiências digitais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const loaded = Route.useLoaderData();
  const projects = loaded.projects.length ? loaded.projects : demoProjects;
  const settings = loaded.settings;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selectedProject, setSelectedProject] = useState<HubProject | null>(null);
  const glow = useRef<HTMLDivElement>(null);
  const categories = ["Todos", ...Array.from(new Set(projects.map((p) => p.category)))];
  const shown = useMemo(() => projects.filter((p) => (category === "Todos" || p.category === category) && `${p.title} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [projects, query, category]);

  useEffect(() => {
    const move = (event: PointerEvent) => { if (glow.current) glow.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`; };
    window.addEventListener("pointermove", move); return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="refract pointer-events-none absolute inset-0" /><div ref={glow} className="cursor-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-[1360px] px-5 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <a href="#catalogo" className="flex items-center gap-3"><span className="lens grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl"><img src={brandIcon} alt="" className="h-full w-full object-cover" /></span><span className="flex flex-col leading-none"><strong className="font-display text-lg font-semibold">{settings?.hub_name ?? "NEXUS"}</strong><span className="mt-1 text-[10px] uppercase text-muted-foreground">by VICCS Design</span></span></a>
          <nav className="glass flex items-center gap-1 rounded-full p-1.5"><a href="#catalogo" className="rounded-full bg-foreground/10 px-4 py-1.5 text-sm">Catálogo</a><a href="#sobre" className="rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground">Sobre</a></nav>
        </header>

        <section id="sobre" className="relative min-h-[500px] py-10 sm:py-14 lg:min-h-[600px] lg:py-16 lg:flex lg:flex-col lg:justify-center">
          <HoloCharacterCard className="right-0 xl:right-4 top-1/2 -translate-y-1/2" />
          <div className="relative z-10 max-w-xl lg:max-w-2xl xl:max-w-3xl pr-4">
            <img src={brandLogo} alt="VICCS Design" className="mb-7 h-8 w-auto brightness-0 invert opacity-80" />
            <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1">
              <Sparkles className="size-3 text-accent" />
              <span className="text-xs text-foreground/70">{settings?.eyebrow ?? "Uma lente viva para cada criação"}</span>
            </div>
            <h1 className="max-w-[18ch] text-balance font-display text-4xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              {settings?.headline ?? "Um universo de projetos, reunido em um só lugar."}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground lg:text-lg">
              {settings?.description ?? "Explore sites, sistemas, mods, experiências de web design, código e skills para IDE."}
            </p>
          </div>
        </section>

        <section id="catalogo" className="pb-16 pt-6 sm:pt-8">
          {/* Menu Horizontal de Filtros e Busca Liquid Glass */}
          <div className="glass-deep mb-6 rounded-2xl p-3 sm:p-4 border border-border/40 shadow-xl">
            <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
              {/* Campo de Busca */}
              <div className="relative w-full md:w-80 lg:w-96 shrink-0">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar projetos, mods, skills…"
                  className="w-full rounded-xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-sm text-foreground outline-hidden transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background/60 focus:ring-1 focus:ring-primary/30"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categorias em fluxo horizontal */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none sm:py-0">
                <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:inline-block mr-1">
                  Categorias:
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {categories.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={category === item ? "default" : "outline"}
                      className={`h-8 rounded-full px-3.5 text-xs transition-all whitespace-nowrap ${
                        category === item
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                          : "border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                      }`}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contador de Projetos & Badge */}
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="text-sm font-medium text-muted-foreground">
              {shown.length} {shown.length === 1 ? "projeto" : "projetos"}
            </p>
            {!loaded.projects.length && (
              <span className="glass rounded-full px-3 py-1 text-[10px] uppercase text-muted-foreground">
                Conteúdo demonstrativo
              </span>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Search className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Nenhum projeto encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {shown.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  featured={index === 0 && project.featured}
                  onOpenPreview={setSelectedProject}
                />
              ))}
            </div>
          )}
        </section>
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">{settings?.hub_name ?? "NEXUS"} — cada lente abre uma nova criação.</p>
          <Link to="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Settings2 className="size-3.5" /> Acesso administrativo
          </Link>
        </footer>
      </div>

      {/* Modal de Visualização Completa de Projeto */}
      <ProjectPreviewModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </main>
  );
}

function ProjectCard({
  project,
  featured,
  onOpenPreview,
}: {
  project: HubProject;
  featured: boolean;
  onOpenPreview: (project: HubProject) => void;
}) {
  const image = project.image_url || webDesign;
  const span = featured
    ? "md:col-span-7 md:row-span-2"
    : project.category.includes("Sims")
    ? "md:col-span-5"
    : "md:col-span-4";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenPreview(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPreview(project);
        }
      }}
      className={`lens card group relative flex h-full flex-col overflow-hidden rounded-2xl p-4 sm:p-5 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40 ${span}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {project.category}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(project);
          }}
          className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          Open Preview
          <ArrowUpRight className="size-3" />
        </button>
      </div>

      {/* Imagem do Projeto */}
      <div
        className={`overflow-hidden rounded-xl bg-muted relative ${
          featured
            ? "flex-1 min-h-[260px] sm:min-h-[320px] lg:min-h-[380px]"
            : "aspect-[16/10] shrink-0"
        }`}
      >
        <img
          src={image}
          alt={project.title}
          width={featured ? 1280 : 1024}
          height={featured ? 720 : 640}
          loading={featured ? "eager" : "lazy"}
          draggable={false}
          className="h-full w-full object-cover select-none transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {featured && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80" />
        )}
      </div>

      {/* Conteúdo com layout equilibrado sem vácuo */}
      <div
        className={`mt-4 flex ${
          featured
            ? "shrink-0 flex-col gap-3.5"
            : "flex-1 flex-col justify-between"
        }`}
      >
        <div>
          <h2
            className={`font-display font-semibold text-foreground ${
              featured ? "text-2xl sm:text-3xl" : "text-lg"
            }`}
          >
            {project.title}
          </h2>
          <p
            className={`mt-2 text-muted-foreground ${
              featured
                ? "text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4"
                : "text-sm leading-6 line-clamp-2"
            }`}
          >
            {project.description}
          </p>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-foreground/5 px-2.5 py-1 text-[10px] text-foreground/70"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {featured && (
          <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Sparkles className="size-3.5 text-accent" /> Projeto Principal do Hub
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
              Ver Detalhes <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}