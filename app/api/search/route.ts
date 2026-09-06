import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWorkspaceData, requireAuthenticatedUser } from "@/lib/supabase-repository";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim() ?? "";
    const data = await getWorkspaceData(supabase, user.id);
    if (!query) return ok({ links: data.links, folders: data.folders });

    const folders = data.folders.filter((folder) => folder.name.toLowerCase().includes(query));
    const folderIds = new Set(folders.map((folder) => folder.id));
    const links = data.links.filter((link) => {
      return (
        link.domain.toLowerCase().includes(query) ||
        link.note.toLowerCase().includes(query) ||
        link.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        link.folderIds.some((id) => folderIds.has(id))
      );
    });

    return ok({ links, folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
