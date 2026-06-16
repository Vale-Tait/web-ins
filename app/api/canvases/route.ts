import { ok, fail } from "@/lib/api-response";
import { seedCanvases } from "@/lib/fixtures";

export async function GET() {
  return ok(seedCanvases);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  if (!body.name?.trim()) return fail("Canvas name is required");
  const now = new Date().toISOString();
  return ok({
    id: `canvas-${crypto.randomUUID()}`,
    name: body.name.trim(),
    thumbnailUrl: null,
    nodes: [],
    createdAt: now,
    updatedAt: now
  });
}
