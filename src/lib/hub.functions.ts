import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type HubProject = Database["public"]["Tables"]["projects"]["Row"];
export type HubSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export const getPublicHub = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

  if (projectsResult.error) throw projectsResult.error;
  if (settingsResult.error) throw settingsResult.error;
  return { projects: projectsResult.data, settings: settingsResult.data };
});