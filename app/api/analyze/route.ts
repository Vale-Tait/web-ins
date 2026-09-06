import { ok, fail } from "@/lib/api-response";
import { analyzeWebsite } from "@/lib/analysis";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; linkId?: string };
    return ok(await analyzeWebsite(body.url ?? "", body.linkId ?? "preview"));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to analyze URL");
  }
}
