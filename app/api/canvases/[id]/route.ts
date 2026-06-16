import { ok, fail } from "@/lib/api-response";
import { seedCanvases } from "@/lib/fixtures";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const canvas = seedCanvases.find((item) => item.id === id);
  return canvas ? ok(canvas) : fail("Canvas not found", 404);
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
