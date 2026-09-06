"use client";

import { Suspense } from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FolderCard } from "@/components/FolderCard";
import { useApp } from "@/components/AppProvider";
import { ProductLoadingInline } from "@/components/ProductLoading";
import type { LinkItem } from "@/lib/types";

const emptyLinks: LinkItem[] = [];

function CollectionsContent() {
  const { folders, links } = useApp();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  const linksByFolder = useMemo(() => {
    const grouped = new Map<string, LinkItem[]>();
    for (const link of links) {
      for (const id of new Set(link.folderIds)) {
        const items = grouped.get(id);
        if (items) items.push(link);
        else grouped.set(id, [link]);
      }
    }
    grouped.set("all", links);
    return grouped;
  }, [links]);

  const visibleFolders = useMemo(
    () => folders.filter((folder) => !search || folder.name.toLowerCase().includes(search)),
    [folders, search]
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-4 pb-24 md:px-10 md:pb-6 md:pt-9 lg:px-14 lg:pt-11">
        {search ? <p className="mono mb-4 px-4 text-xs text-[var(--muted)]">Filtered by: {search}</p> : null}
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-10 items-center lg:items-start">
          {visibleFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} folderLinks={linksByFolder.get(folder.id) ?? emptyLinks} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<ProductLoadingInline />}>
      <CollectionsContent />
    </Suspense>
  );
}
