import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWorkspaceData, requireAuthenticatedUser } from "@/lib/supabase-repository";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    return ok(await getWorkspaceData(supabase, user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workspace data";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
