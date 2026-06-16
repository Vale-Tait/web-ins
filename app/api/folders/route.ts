import { ok, fail } from "@/lib/api-response";
import { seedFolders } from "@/lib/fixtures";

export async function GET() {
  return ok(seedFolders);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  if (!body.name?.trim()) return fail("Folder name is required");
  const now = new Date().toISOString();
  return ok({
    id: `folder-${crypto.randomUUID()}`,
    name: body.name.trim(),
    description: null,
    isDefault: false,
    createdAt: now,
    updatedAt: now
  });
}
