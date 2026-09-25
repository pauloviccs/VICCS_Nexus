import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type HubProject = Database["public"]["Tables"]["projects"]["Row"];
export type HubSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export const getPublicHub = createServerFn({ method: "GET" }).handler(async () => {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://vwrobrfkvwsdfjmyrdvp.supabase.co";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable__pqei70PYV9fkeXvUyu0Vw_x0ue9wCj";

  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const [projectsResult, settingsResult] = await Promise.all([
      client
        .from("projects")
        .select("id,title,slug,description,category,url,image_url,tags,featured,published,sort_order,created_by,created_at,updated_at")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true }),
      client.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    ]);

    if (projectsResult.error) {
      console.warn("[Hub] Aviso ao consultar projetos:", projectsResult.error.message);
    }
    if (settingsResult.error) {
      console.warn("[Hub] Aviso ao consultar configurações:", settingsResult.error.message);
    }

    return {
      projects: projectsResult.data ?? [],
      settings: settingsResult.data ?? null,
    };
  } catch (err) {
    console.warn("[Hub] Erro de conexão com Supabase:", err);
    return { projects: [], settings: null };
  }
});