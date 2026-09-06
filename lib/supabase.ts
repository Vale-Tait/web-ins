import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabasePublicConfig();
  return createBrowserClient(url, key);
}

export async function createSupabaseServerClient() {
  const { url, key } = getSupabasePublicConfig();

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; Route Handlers can.
        }
      }
    }
  });
}
