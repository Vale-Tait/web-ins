import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAnalysisFixture, createScreenshotPlaceholder } from "@/lib/analysis";
import { defaultCanvasViewport } from "@/lib/canvas-defaults";
import { getLinkUrlKey, mergeUniqueValues } from "@/lib/link-dedupe";
import {
  buildFolderIdMap,
  canvasNodeToRow,
  mapCanvasRowsToApp,
  mapFolderIdsToDatabase,
  mapFolderRowsToApp,
  mapLinkRowsToApp,
  type CanvasRow,
  type FolderRow,
  type LinkRow
} from "@/lib/supabase-data";
import type { AppData, CanvasNodeData, Folder, InspirationCanvas, LinkItem } from "@/lib/types";
import { getDomain, normalizeUrl } from "@/lib/url";

type DbClient = SupabaseClient;

function throwIfError(error: { message?: string } | null | undefined) {
  if (error) throw new Error(error.message ?? "Supabase request failed");
}

export async function getAuthenticatedUser(supabase: DbClient): Promise<User | null> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function requireAuthenticatedUser(supabase: DbClient): Promise<User> {
  const user = await getAuthenticatedUser(supabase);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function ensureDefaultFolder(supabase: DbClient, userId: string): Promise<FolderRow> {
  const existing = await supabase
    .from("folders")
    .select("id,name,description,is_default,created_at,updated_at")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  throwIfError(existing.error);
  if (existing.data) return existing.data as FolderRow;

  const inserted = await supabase
    .from("folders")
    .insert({ user_id: userId, name: "Unsorted", description: null, is_default: true })
    .select("id,name,description,is_default,created_at,updated_at")
    .single();
  // Another bootstrap request may have created the default after our read.
  if (inserted.error?.code === "23505") {
    const concurrent = await supabase
      .from("folders")
      .select("id,name,description,is_default,created_at,updated_at")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();
    throwIfError(concurrent.error);
    if (concurrent.data) return concurrent.data as FolderRow;
  }
  throwIfError(inserted.error);
  return inserted.data as FolderRow;
}

export async function listFolderRows(supabase: DbClient, userId: string): Promise<FolderRow[]> {
  await ensureDefaultFolder(supabase, userId);
  const result = await supabase
    .from("folders")
    .select("id,name,description,is_default,created_at,updated_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  throwIfError(result.error);
  return (result.data ?? []) as FolderRow[];
}

export async function listFolders(supabase: DbClient, userId: string): Promise<Folder[]> {
  return mapFolderRowsToApp(await listFolderRows(supabase, userId));
}

export async function createFolderRecord(supabase: DbClient, userId: string, name: string): Promise<Folder> {
  const result = await supabase
    .from("folders")
    .insert({ user_id: userId, name: name.trim(), description: null, is_default: false })
    .select("id,name,description,is_default,created_at,updated_at")
    .single();
  throwIfError(result.error);
  return mapFolderRowsToApp([result.data as FolderRow])[1];
}

export async function updateFolderRecord(
  supabase: DbClient,
  userId: string,
  id: string,
  patch: { name?: string; description?: string | null }
): Promise<Folder> {
  const folderRows = await listFolderRows(supabase, userId);
  const idMap = buildFolderIdMap(folderRows);
  const dbId = idMap.appToDb[id] ?? id;
  const result = await supabase
    .from("folders")
    .update({ name: patch.name?.trim(), description: patch.description ?? null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", dbId)
    .eq("is_default", false)
    .select("id,name,description,is_default,created_at,updated_at")
    .single();
  throwIfError(result.error);
  return mapFolderRowsToApp([result.data as FolderRow])[1];
}

async function syncLinkFolders(supabase: DbClient, linkId: string, dbFolderIds: string[]) {
  const deleted = await supabase.from("link_folders").delete().eq("link_id", linkId);
  throwIfError(deleted.error);
  if (!dbFolderIds.length) return;
  const inserted = await supabase.from("link_folders").insert(dbFolderIds.map((folder_id) => ({ link_id: linkId, folder_id })));
  throwIfError(inserted.error);
}

async function syncLinkTags(supabase: DbClient, userId: string, linkId: string, tags: string[]) {
  const deleted = await supabase.from("link_tags").delete().eq("link_id", linkId);
  throwIfError(deleted.error);
  const names = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  if (!names.length) return;

  const upserted = await supabase
    .from("tags")
    .upsert(names.map((name) => ({ user_id: userId, name })), { onConflict: "user_id,name" })
    .select("id,name");
  throwIfError(upserted.error);
  const tagRows = (upserted.data ?? []) as { id: string; name: string }[];
  if (!tagRows.length) return;

  const inserted = await supabase.from("link_tags").insert(tagRows.map((tag) => ({ link_id: linkId, tag_id: tag.id })));
  throwIfError(inserted.error);
}

async function getFolderMap(supabase: DbClient, userId: string) {
  return buildFolderIdMap(await listFolderRows(supabase, userId));
}

async function findExistingLinkIdByUrl(supabase: DbClient, userId: string, domain: string, url: string) {
  const result = await supabase
    .from("links")
    .select("id,url")
    .eq("user_id", userId)
    .eq("domain", domain)
    .order("created_at", { ascending: false })
    .limit(100);
  throwIfError(result.error);

  const key = getLinkUrlKey(url);
  return ((result.data ?? []) as Array<{ id: string; url: string }>).find((row) => getLinkUrlKey(row.url) === key)?.id ?? null;
}

async function upsertLinkAnalysis(supabase: DbClient, analysis: LinkItem["analysis"]) {
  const result = await supabase.from("analysis_results").upsert(
    {
      link_id: analysis.linkId,
      fonts: analysis.fonts,
      animations: analysis.animations,
      tech_stack: analysis.techStack,
      colors: analysis.colors
    },
    { onConflict: "link_id" }
  );
  throwIfError(result.error);
}

function emptyAnalysis(linkId: string, now: string): LinkItem["analysis"] {
  return {
    id: crypto.randomUUID(),
    linkId,
    fonts: [],
    animations: [],
    techStack: [],
    colors: [],
    createdAt: now,
    updatedAt: now
  };
}

function incomingAnalysis(linkId: string, analysis: Partial<LinkItem["analysis"]>, now: string): LinkItem["analysis"] {
  return {
    id: analysis.id ?? crypto.randomUUID(),
    linkId,
    fonts: analysis.fonts ?? [],
    animations: analysis.animations ?? [],
    techStack: analysis.techStack ?? [],
    colors: analysis.colors ?? [],
    createdAt: analysis.createdAt ?? now,
    updatedAt: analysis.updatedAt ?? now
  };
}

export async function listLinks(supabase: DbClient, userId: string): Promise<LinkItem[]> {
  const folderMap = await getFolderMap(supabase, userId);
  const result = await supabase
    .from("links")
    .select(
      "id,url,domain,title,description,screenshot_url,note,status,created_at,updated_at,link_folders(folder_id),link_tags(tags(name)),analysis_results(id,link_id,fonts,animations,tech_stack,colors,created_at,updated_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIfError(result.error);
  return mapLinkRowsToApp((result.data ?? []) as LinkRow[], folderMap.dbToApp);
}

export async function getLinkRecord(supabase: DbClient, userId: string, id: string): Promise<LinkItem | null> {
  const links = await listLinks(supabase, userId);
  return links.find((link) => link.id === id) ?? null;
}

export async function createLinkRecord(
  supabase: DbClient,
  userId: string,
  body: { url?: string; folderIds?: string[]; tags?: string[]; note?: string; includeAnalysis?: boolean; analysis?: Partial<LinkItem["analysis"]> }
): Promise<LinkItem> {
  const url = normalizeUrl(body.url ?? "");
  const domain = getDomain(url);
  const now = new Date().toISOString();
  const folderMap = await getFolderMap(supabase, userId);
  const requestedFolderIds = body.folderIds?.length ? body.folderIds : ["unsorted"];
  const existingLinkId = await findExistingLinkIdByUrl(supabase, userId, domain, url);

  if (existingLinkId) {
    const currentLink = await getLinkRecord(supabase, userId, existingLinkId);
    const mergedFolderIds = mergeUniqueValues(currentLink?.folderIds ?? [], requestedFolderIds);
    const mergedTags = mergeUniqueValues(currentLink?.tags ?? [], body.tags ?? []);
    const updated = await supabase
      .from("links")
      .update({
        note: body.note?.trim() ? body.note : currentLink?.note ?? "",
        updated_at: now
      })
      .eq("user_id", userId)
      .eq("id", existingLinkId);
    throwIfError(updated.error);

    const dbFolderIds = mapFolderIdsToDatabase(mergedFolderIds, folderMap);
    await syncLinkFolders(supabase, existingLinkId, dbFolderIds.length ? dbFolderIds : folderMap.unsortedDbId ? [folderMap.unsortedDbId] : []);
    await syncLinkTags(supabase, userId, existingLinkId, mergedTags);
    if (body.analysis) await upsertLinkAnalysis(supabase, incomingAnalysis(existingLinkId, body.analysis, now));

    const link = await getLinkRecord(supabase, userId, existingLinkId);
    if (!link) throw new Error("Unable to load saved link");
    return link;
  }

  const inserted = await supabase
    .from("links")
    .insert({
      user_id: userId,
      url,
      domain,
      title: domain,
      description: `Saved reference from ${domain}`,
      screenshot_url: createScreenshotPlaceholder(url),
      note: body.note ?? "",
      status: "ready"
    })
    .select("id")
    .single();
  throwIfError(inserted.error);
  const linkId = (inserted.data as { id: string }).id;

  const dbFolderIds = mapFolderIdsToDatabase(requestedFolderIds, folderMap);
  await syncLinkFolders(supabase, linkId, dbFolderIds.length ? dbFolderIds : folderMap.unsortedDbId ? [folderMap.unsortedDbId] : []);
  await syncLinkTags(supabase, userId, linkId, body.tags ?? []);

  const analysis =
    body.includeAnalysis === false
      ? emptyAnalysis(linkId, now)
      : body.analysis
      ? incomingAnalysis(linkId, body.analysis, now)
      : createAnalysisFixture(url, linkId);
  await upsertLinkAnalysis(supabase, analysis);

  const link = await getLinkRecord(supabase, userId, linkId);
  if (!link) throw new Error("Unable to load saved link");
  return link;
}

export async function updateLinkRecord(
  supabase: DbClient,
  userId: string,
  id: string,
  patch: Partial<LinkItem>
): Promise<LinkItem> {
  const linkPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof patch.url === "string") {
    const url = normalizeUrl(patch.url);
    linkPatch.url = url;
    linkPatch.domain = getDomain(url);
  }
  if (typeof patch.title === "string") linkPatch.title = patch.title;
  if (typeof patch.description === "string") linkPatch.description = patch.description;
  if (typeof patch.screenshotUrl === "string") linkPatch.screenshot_url = patch.screenshotUrl;
  if (typeof patch.note === "string") linkPatch.note = patch.note;
  if (patch.status) linkPatch.status = patch.status;

  const updated = await supabase.from("links").update(linkPatch).eq("user_id", userId).eq("id", id);
  throwIfError(updated.error);

  if (patch.folderIds) {
    const folderMap = await getFolderMap(supabase, userId);
    const dbFolderIds = mapFolderIdsToDatabase(patch.folderIds.length ? patch.folderIds : ["unsorted"], folderMap);
    await syncLinkFolders(supabase, id, dbFolderIds.length ? dbFolderIds : folderMap.unsortedDbId ? [folderMap.unsortedDbId] : []);
  }

  if (patch.tags) await syncLinkTags(supabase, userId, id, patch.tags);

  const link = await getLinkRecord(supabase, userId, id);
  if (!link) throw new Error("Link not found");
  return link;
}

export async function deleteLinkRecord(supabase: DbClient, userId: string, id: string, folderId?: string | null) {
  if (folderId && folderId !== "all") {
    const folderMap = await getFolderMap(supabase, userId);
    const dbFolderId = folderMap.appToDb[folderId] ?? folderId;
    const deleted = await supabase.from("link_folders").delete().eq("link_id", id).eq("folder_id", dbFolderId);
    throwIfError(deleted.error);
    return getLinkRecord(supabase, userId, id);
  }
  const deleted = await supabase.from("links").delete().eq("user_id", userId).eq("id", id);
  throwIfError(deleted.error);
  return { id, deleted: true };
}

export async function listCanvases(supabase: DbClient, userId: string): Promise<InspirationCanvas[]> {
  const folderMap = await getFolderMap(supabase, userId);
  const result = await supabase
    .from("canvases")
    .select(
      "id,name,thumbnail_url,viewport,created_at,updated_at,canvas_nodes(id,canvas_id,type,link_id,source_folder_id,content,x,y,width,height,scale,device_view,status,interaction_mode,iframe_key,load_failed,z_index,created_at,updated_at)"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  throwIfError(result.error);
  return mapCanvasRowsToApp((result.data ?? []) as CanvasRow[], folderMap.dbToApp);
}

export async function getCanvasRecord(supabase: DbClient, userId: string, id: string): Promise<InspirationCanvas | null> {
  const canvases = await listCanvases(supabase, userId);
  return canvases.find((canvas) => canvas.id === id) ?? null;
}

export async function createCanvasRecord(supabase: DbClient, userId: string, name: string): Promise<InspirationCanvas> {
  const result = await supabase
    .from("canvases")
    .insert({ user_id: userId, name: name.trim(), thumbnail_url: null, viewport: defaultCanvasViewport })
    .select("id,name,thumbnail_url,viewport,created_at,updated_at")
    .single();
  throwIfError(result.error);
  return mapCanvasRowsToApp([{ ...(result.data as CanvasRow), canvas_nodes: [] }], {})[0];
}

export async function updateCanvasRecord(
  supabase: DbClient,
  userId: string,
  id: string,
  patch: Partial<InspirationCanvas>
): Promise<InspirationCanvas> {
  const canvasPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof patch.name === "string") canvasPatch.name = patch.name.trim();
  if ("thumbnailUrl" in patch) canvasPatch.thumbnail_url = patch.thumbnailUrl ?? null;
  if (patch.viewport) canvasPatch.viewport = patch.viewport;

  const updated = await supabase.from("canvases").update(canvasPatch).eq("user_id", userId).eq("id", id);
  throwIfError(updated.error);

  if (patch.nodes) {
    const folderMap = await getFolderMap(supabase, userId);
    const deleted = await supabase.from("canvas_nodes").delete().eq("canvas_id", id);
    throwIfError(deleted.error);
    if (patch.nodes.length) {
      const inserted = await supabase
        .from("canvas_nodes")
        .insert(patch.nodes.map((node) => canvasNodeToRow({ ...node, canvasId: id } as CanvasNodeData, folderMap.appToDb)));
      throwIfError(inserted.error);
    }
  }

  const canvas = await getCanvasRecord(supabase, userId, id);
  if (!canvas) throw new Error("Canvas not found");
  return canvas;
}

export async function deleteCanvasRecord(supabase: DbClient, userId: string, id: string) {
  const deleted = await supabase.from("canvases").delete().eq("user_id", userId).eq("id", id);
  throwIfError(deleted.error);
  return { id, deleted: true };
}

export async function getWorkspaceData(supabase: DbClient, userId: string): Promise<AppData> {
  const [folders, links, canvases] = await Promise.all([listFolders(supabase, userId), listLinks(supabase, userId), listCanvases(supabase, userId)]);
  return { folders, links, canvases };
}
