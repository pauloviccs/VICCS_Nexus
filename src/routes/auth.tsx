import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Chrome, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import brandIcon from "@/assets/brand/VICCS_Design_Icon_BWR.svg.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — NEXUS" },
      { name: "description", content: "Acesso seguro ao painel de gerenciamento do NEXUS." },
      { property: "og:title", content: "Acesso administrativo — NEXUS" },
      { property: "og:description", content: "Acesso seguro ao painel de gerenciamento do NEXUS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage("Não foi possível entrar. Confira seus dados.");
      await navigate({ to: "/dashboard" });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    if (!data.session) setMessage("Confira seu e-mail para confirmar o cadastro.");
    else await navigate({ to: "/dashboard" });
  }

  async function signInWithGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setLoading(false);
      setMessage("Não foi possível continuar com Google.");
      return;
    }
    if (!result.redirected) await navigate({ to: "/dashboard" });
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-12">
      <div className="refract pointer-events-none absolute inset-0" />
      <div className="glass-deep relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar ao hub
        </Link>
        <div className="mb-7 flex items-center gap-3">
          <span className="lens grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl"><img src={brandIcon.url} alt="" className="h-full w-full object-cover" /></span>
          <div><p className="font-display text-xl font-semibold">NEXUS</p><p className="text-xs text-muted-foreground">Acesso administrativo</p></div>
        </div>
        <h1 className="font-display text-3xl font-semibold">{mode === "signin" ? "Bem-vindo de volta." : "Criar acesso."}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Gerencie os projetos e os textos da sua central.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-background/40" /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 bg-background/40" /></div>
          {message && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>{loading && <LoaderCircle className="animate-spin" />}{mode === "signin" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <Button type="button" variant="outline" className="h-11 w-full rounded-xl bg-background/20" onClick={signInWithGoogle} disabled={loading}><Chrome /> Continuar com Google</Button>
        <Button type="button" variant="link" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-6 w-full text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Primeiro acesso? Criar conta" : "Já tem uma conta? Entrar"}
        </Button>
      </div>
    </main>
  );
}