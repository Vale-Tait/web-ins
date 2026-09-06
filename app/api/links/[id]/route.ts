import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { deleteLinkRecord, getLinkRecord, requireAuthenticatedUser, updateLinkRecord } from "@/lib/supabase-repository";
import type { LinkItem } from "@/lib/types";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const link = await getLinkRecord(supabase, user.id, id);
    return link ? ok(link) : fail("Link not found", 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load link";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const body = (await request.json()) as Partial<LinkItem>;
    return ok(await updateLinkRecord(supabase, user.id, id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update link";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    return ok(await deleteLinkRecord(supabase, user.id, id, searchParams.get("folderId")));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete link";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
