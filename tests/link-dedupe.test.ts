import { describe, expect, it } from "vitest";
import { dedupeLinksByUrl, getLinkUrlKey, upsertLinkInList } from "@/lib/link-dedupe";
import type { LinkItem } from "@/lib/types";

const now = "2026-06-18T08:00:00.000Z";

function makeLink(patch: Partial<LinkItem> & Pick<LinkItem, "id" | "url">): LinkItem {
  return {
    id: patch.id,
    url: patch.url,
    domain: "editorialnew.com",
    title: "editorialnew.com",
    description: "Saved reference",
    screenshotUrl: "/api/screenshots?url=https%3A%2F%2Feditorialnew.com%2F&w=1200",
    note: "",
    status: "ready",
    folderIds: ["unsorted"],
    tags: [],
    analysis: {
      id: `analysis-${patch.id}`,
      linkId: patch.id,
      fonts: [],
      animations: [],
      techStack: [],
      colors: [],
      createdAt: now,
      updatedAt: now
    },
    createdAt: now,
    updatedAt: now,
    ...patch
  };
}

describe("link URL dedupe", () => {
  it("uses the normalized URL without hash as the duplicate key", () => {
    expect(getLinkUrlKey("editorialnew.com#hero")).toBe("https://editorialnew.com/");
  });

  it("merges duplicate links by URL while preserving folder and tag membership", () => {
    const links = dedupeLinksByUrl([
      makeLink({ id: "link-newer", url: "https://editorialnew.com/", folderIds: ["unsorted"], tags: ["Analyzed"] }),
      makeLink({ id: "link-older", url: "https://editorialnew.com/#intro", folderIds: ["folder-a"], tags: ["Editorial"] })
    ]);

    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("link-newer");
    expect(links[0].folderIds).toEqual(["unsorted", "folder-a"]);
    expect(links[0].tags).toEqual(["Analyzed", "Editorial"]);
  });

  it("upserts a returned link into the local list instead of adding a duplicate card", () => {
    const existing = makeLink({ id: "link-1", url: "https://editorialnew.com/", folderIds: ["unsorted"] });
    const returned = makeLink({ id: "link-1", url: "https://editorialnew.com/", folderIds: ["unsorted", "folder-a"] });

    const links = upsertLinkInList([existing], returned);

    expect(links).toHaveLength(1);
    expect(links[0].folderIds).toEqual(["unsorted", "folder-a"]);
  });
});
