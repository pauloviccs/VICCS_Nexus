import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Crop,
  Eye,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ProjectPreviewModal } from "@/components/project-preview-modal";
import { ImageCropModal } from "@/components/image-crop-modal";
import { SOCIAL_NETWORKS, SocialNav, type SocialLinksData } from "@/components/social-nav";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Settings = Database["public"]["Tables"]["site_settings"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel de Controle — NEXUS" },
      { name: "description", content: "Gerenciamento de projetos, textos e conteúdo do NEXUS." },
    ],
  }),
  component: DashboardPage,
});

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  category: "Sites",
  url: "",
  image_url: "",
  tags: "",
  featured: false,
  published: true,
  sort_order: 0,
};

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropInitialSrc, setCropInitialSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Abas de navegação do painel
  const [activeTab, setActiveTab] = useState<"projects" | "hero" | "social" | "all">("projects");
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({
    youtube: "",
    tiktok: "",
    twitch: "",
    kick: "",
    instagram: "",
    twitter: "",
    donate: "",
  });
  const [savingSocial, setSavingSocial] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato não suportado. Selecione um arquivo JPEG, PNG ou WebP.");
      return;
    }

    const objUrl = URL.createObjectURL(file);
    setCropInitialSrc(objUrl);
    setCropModalOpen(true);
    e.target.value = "";
  }

  function openCropForExistingImage() {
    if (!form.image_url) return;
    setCropInitialSrc(form.image_url);
    setCropModalOpen(true);
  }

  function handleCropComplete({ url }: { url: string; blob: Blob }) {
    setForm((prev) => ({ ...prev, image_url: url }));
  }

  async function load() {
    const [role, projectRows, settingRow] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    setAllowed(role.data === true);
    setProjects(projectRows.data ?? []);
    setSettings(settingRow.data);

    if (settingRow.data?.social_links) {
      const raw = (settingRow.data.social_links || {}) as Record<string, string>;
      setSocialLinks({
        youtube: raw["youtube"] || "",
        tiktok: raw["tiktok"] || "",
        twitch: raw["twitch"] || "",
        kick: raw["kick"] || "",
        instagram: raw["instagram"] || "",
        twitter: raw["twitter"] || "",
        donate: raw["donate"] || "",
      });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProject(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      category: form.category,
      url: form.url,
      image_url: form.image_url || null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured: form.featured,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
      created_by: user.id,
    };

    const result = editing
      ? await supabase.from("projects").update(payload).eq("id", editing)
      : await supabase.from("projects").insert(payload);

    setSaving(false);

    if (result.error) {
      toast.error(`Erro ao salvar: ${result.error.message}`);
      return;
    }

    toast.success(editing ? "Projeto atualizado com sucesso!" : "Novo projeto adicionado!");
    setForm(emptyForm);
    setEditing(null);
    await load();
  }

  function edit(project: Project) {
    setActiveTab("projects");
    setEditing(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      category: project.category,
      url: project.url,
      image_url: project.image_url ?? "",
      tags: project.tags.join(", "),
      featured: project.featured,
      published: project.published,
      sort_order: project.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!window.confirm("Deseja realmente remover este projeto? Esta ação é irreversível.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return;
    }
    toast.success("Projeto removido.");
    await load();
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        hub_name: settings.hub_name,
        eyebrow: settings.eyebrow,
        headline: settings.headline,
        description: settings.description,
        social_links: socialLinks,
        updated_by: user.id,
      })
      .eq("id", "main");

    setSaving(false);
    if (error) {
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    } else {
      toast.success("Textos do Hub e Hero atualizados com sucesso!");
    }
  }

  async function saveSocialLinks() {
    setSavingSocial(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        social_links: socialLinks,
        updated_by: user.id,
      })
      .eq("id", "main");

    setSavingSocial(false);
    if (error) {
      toast.error(`Erro ao salvar redes sociais: ${error.message}`);
    } else {
      toast.success("Links das redes sociais salvos com sucesso!");
      await load();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { unauthorized: false }, replace: true });
  }

  if (allowed === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <LoaderCircle className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="glass-deep max-w-md rounded-3xl p-8 border border-border">
          <h1 className="font-display text-3xl font-semibold">Acesso Restrito</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A conta <strong className="text-foreground">{user.email}</strong> não possui privilégios de administrador.
          </p>
          <Button className="mt-6 w-full" onClick={signOut}>
            Sair da Conta
          </Button>
        </div>
      </main>
    );
  }

  const configuredSocialCount = Object.values(socialLinks).filter(
    (u) => typeof u === "string" && u.trim().length > 0
  ).length;

  const renderHeroSettings = () => (
    <section className="glass-deep rounded-3xl p-6 sm:p-8 border border-border/40 shadow-xl flex flex-col justify-between">
      <div>
        <div className="mb-6 flex items-center gap-2.5 border-b border-border/30 pb-4">
          <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Textos da Central (Hero & Hub)</h2>
            <p className="text-xs text-muted-foreground">
              Modifique em tempo real as frases demarcadas na vitrine.
            </p>
          </div>
        </div>

        {settings && (
          <div className="space-y-4">
            <Field label="Nome da Central (Header e Rodapé)">
              <Input
                value={settings.hub_name}
                onChange={(e) => setSettings({ ...settings, hub_name: e.target.value })}
              />
            </Field>

            <Field label="Frase de Destaque (Badge / Eyebrow)">
              <Input
                value={settings.eyebrow}
                placeholder="Ex: Uma lente viva para cada criação"
                onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
              />
            </Field>

            <Field label="Título Principal (Headline do Hero)">
              <Textarea
                rows={2}
                value={settings.headline}
                placeholder="Ex: Um universo de projetos, reunido em um só lugar."
                onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
              />
            </Field>

            <Field label="Descrição Principal (Subtítulo do Hero)">
              <Textarea
                rows={3}
                value={settings.description}
                placeholder="Ex: Explore sites, sistemas, mods, experiências de web design..."
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border/30 pt-4">
        <Button onClick={saveSettings} disabled={saving} className="w-full font-semibold">
          {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Salvar Textos do Hub
        </Button>
      </div>
    </section>
  );

  const renderSocialSettings = () => (
    <section className="glass-deep rounded-3xl p-6 sm:p-8 border border-border/40 shadow-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Globe className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Redes Sociais & Canais Oficiais</h2>
            <p className="text-xs text-muted-foreground">
              Cadastre os links para YouTube, TikTok, Twitch, Kick, Instagram, X/Twitter e Doação (Donate).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/50 bg-foreground/5 px-3 py-1 text-xs text-muted-foreground">
            {configuredSocialCount} de 7 canais ativos
          </span>
        </div>
      </div>

      {/* Pré-visualização ao vivo em Liquid Glass */}
      <div className="mb-8 rounded-2xl border border-border/40 bg-background/50 p-5 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" /> Pré-visualização da Barra Liquid Glass no Cabeçalho
          </span>
          <span className="text-[11px] text-muted-foreground">Atualiza em tempo real</span>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 py-6 bg-background/30">
          <SocialNav links={socialLinks} showAll={true} />
        </div>
      </div>

      {/* Grade de Redes Sociais com SVGs e inputs */}
      <div className="grid gap-5 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((network) => {
          const val = socialLinks[network.id] || "";
          const isSet = Boolean(val.trim());

          return (
            <div
              key={network.id}
              className={`rounded-2xl border p-4 transition-all duration-200 ${
                isSet
                  ? "border-primary/30 bg-primary/5 shadow-xs"
                  : "border-border/40 bg-foreground/2 hover:border-border/60"
              }`}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`grid size-8 place-items-center rounded-lg border border-border/40 bg-background/60 text-foreground ${network.hoverColor}`}>
                    <network.icon className="size-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{network.name}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {network.id === "donate"
                        ? "Link para LivePix, Apoia.se, PayPal, Ko-fi, etc."
                        : "Link direto para seu perfil/canal"}
                    </p>
                  </div>
                </div>

                {isSet ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativo
                  </span>
                ) : (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    Oculto
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  value={val}
                  placeholder={
                    network.id === "donate"
                      ? "https://livepix.gg/... ou https://ko-fi.com/..."
                      : `https://${network.id === "twitter" ? "x.com" : network.id + ".com"}/...`
                  }
                  onChange={(e) =>
                    setSocialLinks((prev) => ({
                      ...prev,
                      [network.id]: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!isSet}
                  onClick={() => {
                    if (isSet) window.open(val, "_blank", "noopener,noreferrer");
                  }}
                  title={isSet ? "Testar link em nova aba" : "Preencha a URL para testar"}
                  className="h-9 shrink-0 px-2.5 text-xs"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/30 pt-5">
        <p className="text-xs text-muted-foreground">
          Ao salvar, os dados são persistidos no Supabase e os ícones com hover aparecem no topo do site.
        </p>
        <Button
          onClick={saveSocialLinks}
          disabled={savingSocial}
          className="font-semibold px-6 shadow-md shadow-primary/20"
        >
          {savingSocial ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Salvar Redes Sociais
        </Button>
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Topo do Painel */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <Link
              to="/"
              className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Voltar para o Hub Público
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight">Painel Administrativo NEXUS</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Conectado como <span className="font-mono text-foreground/80">{user.email}</span> (Administrador)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/" })}>
              <Globe className="mr-1.5 size-4" /> Visualizar Hub
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 size-4" /> Sair
            </Button>
          </div>
        </header>

        {/* Abas de Navegação do Painel */}
        <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-border/40 bg-foreground/5 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "projects"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            <Plus className="size-4" /> Projetos do Catálogo ({projects.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hero")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "hero"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            <Sparkles className="size-4" /> Textos da Central (Hero & Hub)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "social"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            <Globe className="size-4" /> Redes Sociais & Links ({configuredSocialCount}/7)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`ml-auto hidden md:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-foreground/15 text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visão Completa
          </button>
        </div>

        {/* Visão de Projetos */}
        {(activeTab === "projects" || activeTab === "all") && (
          <div className={activeTab === "all" ? "grid gap-8 lg:grid-cols-[1.1fr_0.9fr] mb-8" : "mb-8"}>
            {/* Formulário de Projeto */}
            <section className="glass-deep rounded-3xl p-6 sm:p-8 border border-border/40 shadow-xl">
            <div className="mb-6 flex items-center justify-between border-b border-border/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {editing ? "Editar Projeto" : "Novo Projeto / Postagem"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cadastre capas, links, tags e descrições exibidas na vitrine.
                  </p>
                </div>
              </div>
              {editing && (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  Modo Edição
                </span>
              )}
            </div>

            <form onSubmit={saveProject} className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome do Projeto">
                <Input
                  value={form.title}
                  placeholder="Ex: The Sims 4 Zombie Apocalypse Mod"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: editing
                        ? form.slug
                        : e.target.value
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""),
                    })
                  }
                  required
                />
              </Field>

              <Field label="Identificador (Slug único)">
                <Input
                  value={form.slug}
                  placeholder="ex: ts4-zombie-mod"
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </Field>

              <Field label="Categoria">
                <Input
                  value={form.category}
                  placeholder="Ex: Mods Sims 4, Web Design, Sistemas..."
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </Field>

              <Field label="Endereço de Acesso (URL)">
                <Input
                  type="url"
                  value={form.url}
                  placeholder="https://exemplo.com/meu-site"
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Capa do Projeto (URL da Imagem ou Arquivo Local)">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          value={form.image_url}
                          placeholder="https://exemplo.com/imagem.jpg ou faça upload local"
                          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                          className="pr-10"
                        />
                        {form.image_url && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: "" })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            title="Limpar URL"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 rounded-xl bg-background/50 hover:bg-background/80 shrink-0"
                        >
                          <Upload className="size-4 text-primary" /> Fazer Upload
                        </Button>

                        {form.image_url && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={openCropForExistingImage}
                            className="gap-2 rounded-xl shrink-0"
                            title="Abrir ferramenta de recorte e ajustes para esta capa"
                          >
                            <Crop className="size-4" /> Recortar / Ajustar
                          </Button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Mini Preview da Capa Selecionada */}
                    {form.image_url && (
                      <div className="relative flex items-center gap-4 rounded-xl border border-border/40 bg-muted/20 p-3">
                        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-black/40">
                          <img
                            src={form.image_url}
                            alt="Pré-visualização da capa"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {form.image_url.startsWith("data:")
                              ? "Imagem local recortada (WebP)"
                              : form.image_url.split("/").pop() || "Capa do Projeto"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {form.image_url.includes("supabase.co")
                              ? "✓ Armazenada no Supabase Storage (bucket: project-covers)"
                              : "URL externa ou recurso local"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setForm({ ...form, image_url: "" })}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Descrição Completa (exibida no card e no modal de preview)">
                  <Textarea
                    value={form.description}
                    rows={4}
                    placeholder="Descreva o propósito do projeto, funcionalidades, ecossistema e particularidades..."
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Tags (separadas por vírgula)">
                  <Input
                    value={form.tags}
                    placeholder="Sims 4, Gameplay, UI, Código, Next.js"
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:col-span-2 py-1">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="size-4 rounded accent-primary"
                  />
                  <span>Destacar na Página Inicial</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="size-4 rounded accent-primary"
                  />
                  <span>Visível publicamente (Publicado)</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 sm:col-span-2 pt-2">
                <Button type="submit" disabled={saving} className="font-semibold">
                  {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  {editing ? "Salvar Alterações" : "Adicionar Projeto"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setPreviewProject({
                      id: editing || "preview",
                      title: form.title || "Título de Demonstração",
                      slug: form.slug || "slug-demo",
                      description: form.description || "Descrição de demonstração para visualização do modal.",
                      category: form.category || "Geral",
                      url: form.url || "#",
                      image_url: form.image_url || null,
                      tags: form.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                      featured: form.featured,
                      published: form.published,
                      sort_order: Number(form.sort_order) || 0,
                      created_by: user.id,
                      created_at: "",
                      updated_at: "",
                    })
                  }
                >
                  <Eye className="mr-2 size-4" /> Testar Open Preview
                </Button>

                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null);
                      setForm(emptyForm);
                    }}
                  >
                    Cancelar Edição
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Se estiver em Visão Completa ('all'), exibe Textos da Central na segunda coluna */}
          {activeTab === "all" && renderHeroSettings()}
        </div>
      )}

      {/* Aba Isolada de Textos da Central */}
      {activeTab === "hero" && (
        <div className="max-w-3xl mx-auto mb-8">
          {renderHeroSettings()}
        </div>
      )}

      {/* Aba de Redes Sociais & Canais Oficiais */}
      {(activeTab === "social" || activeTab === "all") && (
        <div className={activeTab === "social" ? "max-w-4xl mx-auto mb-8" : "mb-8"}>
          {renderSocialSettings()}
        </div>
      )}

      {/* Listagem de Projetos Cadastrados (visível em 'projects' e 'all') */}
      {(activeTab === "projects" || activeTab === "all") && (
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">Projetos no Catálogo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {projects.length} {projects.length === 1 ? "projeto cadastrado" : "projetos cadastrados"} no banco de dados.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {projects.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
                Nenhum projeto cadastrado no banco. Utilize o formulário acima para adicionar o primeiro item.
              </div>
            ) : (
              projects.map((project) => (
                <article
                  key={project.id}
                  className="glass group flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-white/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt=""
                        className="size-14 rounded-xl object-cover border border-border/40 shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="grid size-14 place-items-center rounded-xl bg-muted/60 text-xs font-mono text-muted-foreground shrink-0">
                        SEM CAPA
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground truncate">{project.title}</h3>
                        <span className="rounded-full border border-border/60 bg-foreground/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {project.category}
                        </span>
                        {project.featured && (
                          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                            Destaque
                          </span>
                        )}
                        {!project.published && (
                          <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-semibold text-destructive">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {project.tags.map((t) => (
                            <span key={t} className="text-[10px] text-muted-foreground/75">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewProject(project)}
                      className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground text-xs"
                    >
                      <Eye className="mr-1.5 size-3.5" /> Open Preview
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => edit(project)} className="text-xs">
                      Editar
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      asChild
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <a href={project.url} target="_blank" rel="noreferrer" title="Abrir link do projeto">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(project.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir projeto"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
      </div>

      {/* Modal de Pré-visualização do Projeto */}
      <ProjectPreviewModal
        project={previewProject}
        isOpen={!!previewProject}
        onClose={() => setPreviewProject(null)}
      />

      {/* Modal de Recorte e Ajustes de Imagem */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        initialImageSrc={cropInitialSrc}
        onComplete={handleCropComplete}
      />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground/85">{label}</Label>
      {children}
    </div>
  );
}