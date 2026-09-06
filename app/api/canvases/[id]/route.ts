import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { deleteCanvasRecord, getCanvasRecord, requireAuthenticatedUser, updateCanvasRecord } from "@/lib/supabase-repository";
import type { InspirationCanvas } from "@/lib/types";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const canvas = await getCanvasRecord(supabase, user.id, id);
    return canvas ? ok(canvas) : fail("Canvas not found", 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load canvas";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const body = (await request.json()) as Partial<InspirationCanvas>;
    return ok(await updateCanvasRecord(supabase, user.id, id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update canvas";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    return ok(await deleteCanvasRecord(supabase, user.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete canvas";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
