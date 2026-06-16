import { ok } from "@/lib/api-response";
import { seedData } from "@/lib/fixtures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (!query) return ok({ links: seedData.links, folders: seedData.folders });

  const folders = seedData.folders.filter((folder) => folder.name.toLowerCase().includes(query));
  const folderIds = new Set(folders.map((folder) => folder.id));
  const links = seedData.links.filter((link) => {
    return (
      link.domain.toLowerCase().includes(query) ||
      link.note.toLowerCase().includes(query) ||
      link.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      link.folderIds.some((id) => folderIds.has(id))
    );
  });

  return ok({ links, folders });
}
