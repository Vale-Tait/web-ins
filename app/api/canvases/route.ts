import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { createCanvasRecord, listCanvases, requireAuthenticatedUser } from "@/lib/supabase-repository";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    return ok(await listCanvases(supabase, user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load canvases";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) return fail("Canvas name is required");
    return ok(await createCanvasRecord(supabase, user.id, body.name));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create canvas";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
