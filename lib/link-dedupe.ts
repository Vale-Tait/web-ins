import type { LinkItem } from "@/lib/types";
import { normalizeUrl } from "@/lib/url";

export function getLinkUrlKey(urlInput: string) {
  try {
    const url = new URL(normalizeUrl(urlInput));
    url.hash = "";
    return url.toString();
  } catch {
    return urlInput.trim().toLowerCase();
  }
}

export function mergeUniqueValues(primary: string[], secondary: string[]) {
  return Array.from(new Set([...primary, ...secondary].map((value) => value.trim()).filter(Boolean)));
}

export function mergeLinkRecords(primary: LinkItem, duplicate: LinkItem): LinkItem {
  return {
    ...primary,
    folderIds: mergeUniqueValues(primary.folderIds, duplicate.folderIds),
    tags: mergeUniqueValues(primary.tags, duplicate.tags),
    updatedAt: latestIso(primary.updatedAt, duplicate.updatedAt)
  };
}

export function dedupeLinksByUrl(links: LinkItem[]) {
  const merged = new Map<string, LinkItem>();

  for (const link of links) {
    const key = getLinkUrlKey(link.url);
    const existing = merged.get(key);
    merged.set(key, existing ? mergeLinkRecords(existing, link) : link);
  }

  return Array.from(merged.values());
}

export function upsertLinkInList(links: LinkItem[], incoming: LinkItem) {
  const incomingKey = getLinkUrlKey(incoming.url);
  const existing = links.find((link) => link.id === incoming.id || getLinkUrlKey(link.url) === incomingKey);
  const mergedIncoming = existing ? mergeLinkRecords(incoming, existing) : incoming;
  const rest = links.filter((link) => link.id !== incoming.id && getLinkUrlKey(link.url) !== incomingKey);
  return [mergedIncoming, ...rest];
}

function latestIso(first: string, second: string) {
  return Date.parse(second) > Date.parse(first) ? second : first;
}
