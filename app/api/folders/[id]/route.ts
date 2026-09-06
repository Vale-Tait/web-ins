import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireAuthenticatedUser, updateFolderRecord } from "@/lib/supabase-repository";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string; description?: string | null };
    if (!body.name?.trim()) return fail("Folder name is required");
    return ok(await updateFolderRecord(supabase, user.id, id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update folder";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
