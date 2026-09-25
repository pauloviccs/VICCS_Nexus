import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Chrome, LoaderCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import brandIcon from "@/assets/brand/VICCS_Design_Icon_BWR.svg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    unauthorized: search.unauthorized === true || search.unauthorized === "true",
  }),
  beforeLoad: async ({ search }) => {
    // Se o usuário foi redirecionado por falta de cargo admin, não faz auto-redirecionamento
    if (search.unauthorized) return;

    // Se já houver sessão ativa persistente no navegador, verifica se é admin
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (user) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      // Se já está logado e é administrador, vai direto ao painel sem pedir login novamente
      if (isAdmin) {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
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
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    search.unauthorized
      ? "Acesso Restrito: Sua conta não possui permissão de administrador. O acesso ao painel deve ser concedido manualmente no banco de dados."
      : ""
  );
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccessMessage(false);

    if (mode === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth",
      });
      setLoading(false);
      if (error) {
        setMessage(`Erro ao solicitar recuperação: ${error.message}`);
        return;
      }
      setIsSuccessMessage(true);
      setMessage("Link de recuperação enviado! Confira sua caixa de entrada no e-mail.");
      return;
    }

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        setLoading(false);
        const msg = error?.message?.toLowerCase() || "";
        if (msg.includes("invalid login credentials")) {
          return setMessage("Senha incorreta ou e-mail não correspondente. Verifique seus dados.");
        }
        if (msg.includes("email not confirmed")) {
          return setMessage("E-mail não confirmado. Verifique seu e-mail de ativação.");
        }
        return setMessage(error?.message || "Não foi possível entrar. Confira seus dados.");
      }

      // Validar privilégio de administrador no banco de dados
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });

      setLoading(false);

      if (!isAdmin) {
        // Usuário não possui cargo de administrador no banco de dados
        await supabase.auth.signOut();
        return setMessage(
          "Acesso negado: esta conta é de usuário comum e não possui permissão de administrador. Solicite liberação no banco de dados."
        );
      }

      // Sessão persistida: navega para o dashboard
      await navigate({ to: "/dashboard" });
      return;
    }

    // Fluxo de Cadastro (Sign Up)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });

    setLoading(false);

    if (error) return setMessage(error.message);

    if (!data.session) {
      setIsSuccessMessage(true);
      setMessage("Confira seu e-mail para confirmar seu cadastro de usuário.");
    } else {
      setIsSuccessMessage(true);
      setMessage(
        "Conta criada com sucesso com o cargo de 'user'. O acesso ao painel de controle requer aprovação e concessão de 'admin' no banco de dados."
      );
    }
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
    if (!result.redirected) {
      // Verificar role admin do usuário OAuth
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        if (!isAdmin) {
          await supabase.auth.signOut();
          setLoading(false);
          setMessage("Conta Google não cadastrada como administrador no banco de dados.");
          return;
        }
      }
      await navigate({ to: "/dashboard" });
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-12">
      <div className="refract pointer-events-none absolute inset-0" />
      <div className="glass-deep relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar ao hub
        </Link>
        <div className="mb-7 flex items-center gap-3">
          <span className="lens grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl">
            <img src={brandIcon} alt="" className="h-full w-full object-cover" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold">NEXUS</p>
            <p className="text-xs text-muted-foreground">Acesso administrativo</p>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold">
          {mode === "signin" && "Bem-vindo de volta."}
          {mode === "signup" && "Criar acesso."}
          {mode === "recovery" && "Recuperar senha."}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {mode === "recovery"
            ? "Digite seu e-mail cadastrado para receber o link de redefinição."
            : "Gerencie os projetos e os textos da sua central."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-11 bg-background/40"
            />
          </div>

          {mode !== "recovery" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recovery");
                      setMessage("");
                    }}
                    className="text-xs text-primary/80 hover:text-primary transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-background/40"
              />
            </div>
          )}

          {message && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed ${
                isSuccessMessage
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive-foreground"
              }`}
            >
              {isSuccessMessage ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <ShieldAlert className="size-4 shrink-0 text-destructive mt-0.5" />
              )}
              <span>{message}</span>
            </div>
          )}

          <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
            {loading && <LoaderCircle className="animate-spin" />}
            {mode === "signin" && "Entrar"}
            {mode === "signup" && "Criar conta"}
            {mode === "recovery" && "Enviar link de recuperação"}
          </Button>
        </form>

        {mode !== "recovery" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl bg-background/20"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <Chrome /> Continuar com Google
            </Button>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          {mode === "recovery" ? (
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setMode("signin");
                setMessage("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Voltar para o login
            </Button>
          ) : (
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "Primeiro acesso? Criar conta" : "Já tem uma conta? Entrar"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}