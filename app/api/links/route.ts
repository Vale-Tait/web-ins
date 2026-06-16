import { ok, fail } from "@/lib/api-response";
import { createAnalysisFixture, createScreenshotPlaceholder } from "@/lib/analysis";
import { seedLinks } from "@/lib/fixtures";
import { getDomain, normalizeUrl } from "@/lib/url";

export async function GET() {
  return ok(seedLinks);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; folderIds?: string[]; tags?: string[]; note?: string };
    const url = normalizeUrl(body.url ?? "");
    const domain = getDomain(url);
    const id = `link-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    return ok({
      id,
      url,
      domain,
      title: domain,
      description: `Saved reference from ${domain}`,
      screenshotUrl: createScreenshotPlaceholder(domain),
      note: body.note ?? "",
      status: "ready",
      folderIds: body.folderIds?.length ? body.folderIds : ["unsorted"],
      tags: body.tags ?? [],
      analysis: createAnalysisFixture(url, id),
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to save URL");
  }
}
