import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, LoaderCircle, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Settings = Database["public"]["Tables"]["site_settings"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Painel — NEXUS" },
    { name: "description", content: "Gerenciamento de projetos e conteúdo do NEXUS." },
    { property: "og:title", content: "Painel — NEXUS" },
    { property: "og:description", content: "Gerenciamento de projetos e conteúdo do NEXUS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DashboardPage,
});

const emptyForm = { title: "", slug: "", description: "", category: "Sites", url: "", image_url: "", tags: "", featured: false, published: true };

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

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

  useEffect(() => { void load(); }, []);

  async function saveProject(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setNotice("");
    const payload = { ...form, image_url: form.image_url || null, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), created_by: user.id };
    const result = editing
      ? await supabase.from("projects").update(payload).eq("id", editing)
      : await supabase.from("projects").insert(payload);
    setSaving(false);
    if (result.error) return setNotice(result.error.message);
    setForm(emptyForm); setEditing(null); setNotice("Projeto salvo."); await load();
  }

  function edit(project: Project) {
    setEditing(project.id);
    setForm({ title: project.title, slug: project.slug, description: project.description, category: project.category, url: project.url, image_url: project.image_url ?? "", tags: project.tags.join(", "), featured: project.featured, published: project.published });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!window.confirm("Remover este projeto?")) return;
    await supabase.from("projects").delete().eq("id", id); await load();
  }

  async function saveSettings() {
    if (!settings) return; setSaving(true);
    const { error } = await supabase.from("site_settings").update({ hub_name: settings.hub_name, eyebrow: settings.eyebrow, headline: settings.headline, description: settings.description, updated_by: user.id }).eq("id", "main");
    setSaving(false); setNotice(error ? error.message : "Textos do hub atualizados.");
  }

  async function signOut() {
    await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true });
  }

  if (allowed === null) return <main className="grid min-h-screen place-items-center bg-background"><LoaderCircle className="size-7 animate-spin text-primary" /></main>;
  if (!allowed) return <main className="grid min-h-screen place-items-center bg-background px-6 text-center"><div><h1 className="font-display text-3xl font-semibold">Acesso restrito</h1><p className="mt-2 text-muted-foreground">Esta conta não possui permissão administrativa.</p><Button className="mt-6" onClick={signOut}>Sair</Button></div></main>;

  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Ver central</Link><h1 className="font-display text-3xl font-semibold">Painel NEXUS</h1><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></div><Button variant="outline" onClick={signOut}><LogOut /> Sair</Button></header>
        {notice && <p className="glass mb-5 rounded-lg px-4 py-3 text-sm text-muted-foreground">{notice}</p>}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <section className="glass-deep rounded-2xl p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><Plus className="size-5 text-primary" /><h2 className="font-display text-xl font-semibold">{editing ? "Editar projeto" : "Novo projeto"}</h2></div>
            <form onSubmit={saveProject} className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} required /></Field>
              <Field label="Identificador"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></Field>
              <Field label="Categoria"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></Field>
              <Field label="Endereço do projeto"><Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required /></Field>
              <div className="sm:col-span-2"><Field label="Imagem (endereço público)"><Input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field></div>
              <div className="sm:col-span-2"><Field label="Tags, separadas por vírgula"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary" /> Destaque</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-primary" /> Publicado</label>
              <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}{editing ? "Salvar alterações" : "Adicionar projeto"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancelar</Button>}</div>
            </form>
          </section>
          <section className="glass-deep rounded-2xl p-5 sm:p-6"><h2 className="font-display text-xl font-semibold">Textos da central</h2>{settings && <div className="mt-5 space-y-4"><Field label="Nome"><Input value={settings.hub_name} onChange={(e) => setSettings({ ...settings, hub_name: e.target.value })} /></Field><Field label="Frase curta"><Input value={settings.eyebrow} onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })} /></Field><Field label="Título principal"><Textarea value={settings.headline} onChange={(e) => setSettings({ ...settings, headline: e.target.value })} /></Field><Field label="Descrição"><Textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></Field><Button onClick={saveSettings} disabled={saving}><Save /> Salvar textos</Button></div>}</section>
        </div>
        <section className="mt-5"><div className="mb-4 flex items-end justify-between"><div><h2 className="font-display text-2xl font-semibold">Projetos cadastrados</h2><p className="mt-1 text-sm text-muted-foreground">{projects.length} itens</p></div></div>
          <div className="grid gap-3">{projects.length === 0 && <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">Nenhum projeto cadastrado. Use o formulário acima para adicionar o primeiro.</div>}{projects.map((project) => <article key={project.id} className="glass flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-semibold">{project.title}</h3><span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{project.category}</span>{!project.published && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Rascunho</span>}</div><p className="mt-1 truncate text-sm text-muted-foreground">{project.description}</p></div><div className="flex gap-2"><Button size="icon" variant="ghost" asChild><a href={project.url} target="_blank" rel="noreferrer" aria-label="Abrir projeto"><ExternalLink /></a></Button><Button size="sm" variant="outline" onClick={() => edit(project)}>Editar</Button><Button size="icon" variant="ghost" onClick={() => remove(project.id)} aria-label="Excluir projeto"><Trash2 /></Button></div></article>)}</div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }