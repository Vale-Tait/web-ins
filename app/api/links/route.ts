import { ok, fail } from "@/lib/api-response";
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLinkRecord, listLinks, requireAuthenticatedUser } from "@/lib/supabase-repository";
import type { AnalysisResult } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    return ok(await listLinks(supabase, user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load links";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await requireAuthenticatedUser(supabase);
    const body = (await request.json()) as {
      url?: string;
      folderIds?: string[];
      tags?: string[];
      note?: string;
      includeAnalysis?: boolean;
      analysis?: Partial<AnalysisResult>;
    };
    return ok(await createLinkRecord(supabase, user.id, body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save URL";
    return fail(message, message === "Unauthorized" ? 401 : 400);
  }
}
