import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  ExternalLink,
  Globe,
  LoaderCircle,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ProjectPreviewModal } from "@/components/project-preview-modal";

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

  async function load() {
    const [role, projectRows, settingRow] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    setAllowed(role.data === true);
    setProjects(projectRows.data ?? []);
    setSettings(settingRow.data);
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

  async function signOut() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
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

        {/* Grade de Configuração */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
                <Field label="Capa do Projeto (URL da Imagem)">
                  <Input
                    type="text"
                    value={form.image_url}
                    placeholder="https://exemplo.com/imagem.jpg ou caminho local"
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
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

          {/* Gerenciamento dos Textos da Central */}
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
        </div>

        {/* Listagem de Projetos Cadastrados */}
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
      </div>

      {/* Modal de Pré-visualização do Projeto */}
      <ProjectPreviewModal
        project={previewProject}
        isOpen={!!previewProject}
        onClose={() => setPreviewProject(null)}
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