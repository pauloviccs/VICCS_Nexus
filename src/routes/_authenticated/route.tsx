import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Obter sessão salva no navegador (persistente)
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user;

    // Se não houver sessão ativa em cache, tenta validar remotamente
    let user = sessionUser;
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw redirect({ to: "/auth" });
      }
      user = userData.user;
    }

    // 2. Verificar se o usuário possui cargo de administrador no banco de dados
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      // Usuário comum não tem permissão de acesso ao painel de administração
      throw redirect({
        to: "/auth",
        search: { unauthorized: true },
      });
    }

    return { user };
  },
  component: () => <Outlet />,
});