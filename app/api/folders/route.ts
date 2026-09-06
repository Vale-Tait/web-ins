import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { createFolderRecord, listFolders, requireAuthenticatedUser } from "@/lib/supabase-repository";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    return ok(await listFolders(supabase, user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load folders";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) return fail("Folder name is required");
    return ok(await createFolderRecord(supabase, user.id, body.name));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create folder";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
