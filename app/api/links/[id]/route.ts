import { ok, fail } from "@/lib/api-response";
import { seedLinks } from "@/lib/fixtures";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const link = seedLinks.find((item) => item.id === id);
  return link ? ok(link) : fail("Link not found", 404);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return ok({ id, ...body, updatedAt: new Date().toISOString() });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return ok({ id, deleted: true });
}
