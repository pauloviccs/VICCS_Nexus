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
import character from "@/assets/brand/VICCS_CharacterSideProfile.svg";

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
          <nav className="glass hidden items-center gap-1 rounded-full p-1.5 md:flex"><a href="#catalogo" className="rounded-full bg-foreground/10 px-4 py-1.5 text-sm">Catálogo</a><a href="#sobre" className="rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground">Sobre</a></nav>
          <Link to="/auth" className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"><span className="size-1.5 rounded-full bg-muted-foreground" />Admin</Link>
        </header>

        <section id="sobre" className="relative pb-10 pt-6 sm:pt-10"><img src={character} alt="" className="pointer-events-none absolute -right-20 bottom-0 hidden h-[520px] w-auto opacity-20 mix-blend-luminosity lg:block" /><div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div className="max-w-3xl"><img src={brandLogo} alt="VICCS Design" className="mb-7 h-8 w-auto brightness-0 invert opacity-80" /><div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1"><Sparkles className="size-3 text-accent" /><span className="text-xs text-foreground/70">{settings?.eyebrow ?? "Uma lente viva para cada criação"}</span></div><h1 className="max-w-[18ch] text-balance font-display text-4xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">{settings?.headline ?? "Um universo de projetos, reunido em um só lugar."}</h1><p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground lg:text-lg">{settings?.description ?? "Explore sites, sistemas, mods, experiências de web design, código e skills para IDE."}</p></div>
            <div className="glass-deep w-full shrink-0 rounded-2xl p-5 lg:w-[390px]"><label className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projetos, mods, skills…" className="w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground" /></label><p className="mb-3 mt-5 text-[10px] uppercase text-muted-foreground">Filtrar por categoria</p><div className="flex flex-wrap gap-2">{categories.map((item) => <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"} className="h-8 rounded-full" onClick={() => setCategory(item)}>{item}</Button>)}</div></div>
          </div></section>

        <section id="catalogo" className="pb-16"><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{shown.length} {shown.length === 1 ? "projeto" : "projetos"}</p>{!loaded.projects.length && <span className="glass rounded-full px-3 py-1 text-[10px] uppercase text-muted-foreground">Conteúdo demonstrativo</span>}</div>
          {shown.length === 0 ? <div className="glass rounded-2xl p-12 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-3 text-muted-foreground">Nenhum projeto encontrado.</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-12">{shown.map((project, index) => <ProjectCard key={project.id} project={project} featured={index === 0 && project.featured} demo={!loaded.projects.length} />)}</div>}
        </section>
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 sm:flex-row"><p className="text-sm text-muted-foreground">{settings?.hub_name ?? "NEXUS"} — cada lente abre uma nova criação.</p><Link to="/auth" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Settings2 className="size-3.5" /> Acesso administrativo</Link></footer>
      </div>
    </main>
  );
}

function ProjectCard({ project, featured, demo }: { project: HubProject; featured: boolean; demo: boolean }) {
  const image = project.image_url || webDesign;
  const span = featured ? "md:col-span-7 md:row-span-2" : project.category.includes("Sims") ? "md:col-span-5" : "md:col-span-4";
  const content = <article className={`lens card group relative flex h-full flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${span}`}><div className="mb-4 flex items-center justify-between"><span className="text-[10px] uppercase text-muted-foreground">{project.category}</span><span className="flex items-center gap-1 text-[10px] text-muted-foreground">{demo ? "Preview" : "Abrir"}<ArrowUpRight className="size-3" /></span></div><div className={`overflow-hidden rounded-xl bg-muted ${featured ? "aspect-video" : "aspect-[16/10]"}`}><img src={image} alt="" width={featured ? 1280 : 1024} height={featured ? 720 : 640} loading={featured ? "eager" : "lazy"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div><div className="mt-5"><h2 className={`font-display font-semibold ${featured ? "text-2xl" : "text-lg"}`}>{project.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p><div className="mt-4 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-foreground/5 px-2.5 py-1 text-[10px] text-foreground/70">{tag}</span>)}</div></div></article>;
  return demo ? content : <a href={project.url} target="_blank" rel="noreferrer" className={`${span} block`}>{content}</a>;
}