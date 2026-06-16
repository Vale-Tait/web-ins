import { ok, fail } from "@/lib/api-response";
import { createAnalysisFixture, createScreenshotPlaceholder } from "@/lib/analysis";
import { getDomain, normalizeUrl } from "@/lib/url";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; linkId?: string };
    const url = normalizeUrl(body.url ?? "");
    const domain = getDomain(url);
    return ok({
      url,
      domain,
      screenshotUrl: createScreenshotPlaceholder(domain),
      analysis: createAnalysisFixture(url, body.linkId ?? "preview")
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to analyze URL");
  }
}
