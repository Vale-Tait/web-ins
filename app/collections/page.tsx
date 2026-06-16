"use client";

import { Suspense } from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { FolderCard } from "@/components/FolderCard";
import { useApp } from "@/components/AppProvider";

function CollectionsContent() {
  const { folders, links } = useApp();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.toLowerCase() ?? "";

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
            <FolderCard key={folder.id} folder={folder} links={links} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <ProductShell>
      <Suspense fallback={<section className="px-10 py-12 mono text-sm text-[var(--muted)]">Loading collections...</section>}>
        <CollectionsContent />
      </Suspense>
    </ProductShell>
  );
}
