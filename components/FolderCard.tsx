"use client";

import Link from "next/link";
import { memo, useState, type CSSProperties } from "react";
import { EditFolderDialog } from "@/components/EditFolderDialog";
import { ScreenshotPreview } from "@/components/ScreenshotPreview";
import type { Folder, LinkItem } from "@/lib/types";

const basePreviewStyle: CSSProperties = {
  width: 138,
  height: 163,
  transformOrigin: "center bottom",
  transition: "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
};

const previewLayouts: Record<1 | 2 | 3, CSSProperties[]> = {
  1: [
    {
      ...basePreviewStyle,
      left: 12,
      top: 18,
      transform: "translateZ(-2px) rotate(-0.45deg)",
    },
  ],
  2: [
    {
      ...basePreviewStyle,
      left: 0,
      top: 19,
      transform: "translateZ(-2px) rotate(-7deg)",
    },
    {
      ...basePreviewStyle,
      left: 92,
      top: 23,
      transform: "translateZ(-8px) rotate(0deg)",
    },
  ],
  3: [
    {
      ...basePreviewStyle,
      left: 0,
      top: 19,
      transform: "translateZ(-2px) rotate(-7deg)",
    },
    {
      ...basePreviewStyle,
      left: 63,
      top: 24,
      transform: "translateZ(-8px) rotate(0deg)",
    },
    {
      ...basePreviewStyle,
      left: 125,
      top: 29,
      transform: "translateZ(-14px) rotate(7deg)",
    },
  ],
};

function FolderPreviewCard({ link, style }: { link: LinkItem; style: CSSProperties }) {
  return (
    <div className="absolute bg-card border border-border rounded-none shadow-md" style={style}>
      <ScreenshotPreview link={link} sizes="138px" className="object-cover border-b border-border/30" alt="" />
    </div>
  );
}

export const FolderCard = memo(function FolderCard({ folder, folderLinks }: { folder: Folder; folderLinks: LinkItem[] }) {
  const [editing, setEditing] = useState(false);
  const count = folderLinks.length;
  const previews = folderLinks.slice(0, 3);
  const previewStyles = previews.length > 0 ? previewLayouts[Math.min(previews.length, 3) as 1 | 2 | 3] : [];

  return (
    <div className="z-8 p-4 w-full lg:w-auto">
      <div className="relative w-full lg:w-[340px] h-[244px] group" style={{ perspective: "1200px" }}>
        <Link
          href={`/collections/${folder.id}`}
          className="relative w-full h-full block cursor-pointer transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:-rotate-x-14"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 rounded-md border border-border"
            style={{
              transform: "translateZ(-15px)",
              background: "var(--folder-back-bg, linear-gradient(135deg, rgba(248, 249, 250, 0.78), rgba(241, 243, 245, 0.9)))",
              borderColor: "var(--folder-front-border, var(--line))",
            }}
          />

          <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-center" style={{ transformStyle: "preserve-3d" }}>
            <div className="relative" style={{ width: 263, height: 188 }}>
              {previews.map((link, index) => (
                <FolderPreviewCard key={link.id} link={link} style={previewStyles[index]} />
              ))}
            </div>
          </div>

          <div
            className="folder-glass-front absolute inset-x-0 bottom-0 h-[70%] rounded-md transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] border group-hover:translate-y-2 group-hover:translate-z-15 group-hover:-rotate-x-25"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              borderColor: "rgba(17, 24, 39, 0.055)",
              backdropFilter: "blur(18px) saturate(125%)",
              WebkitBackdropFilter: "blur(18px) saturate(125%)",
              willChange: "transform",
              zIndex: 10,
            }}
          >
            <div
              className="absolute inset-0 z-10"
              style={{
                transformOrigin: "center bottom",
              }}
            >
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-mono text-base font-semibold truncate text-foreground antialiased">{folder.name}</h3>
                <p className="font-mono text-sm font-medium text-muted-foreground antialiased">
                  {count} {count === 1 ? "item" : "items"} {folder.id === "all" ? "" : "2d"}
                </p>
              </div>
            </div>
          </div>

        </Link>
        {folder.id !== "all" ? (
          <div className="absolute top-2 right-[-3px] z-50 flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <button
              type="button"
              data-slot="button"
              aria-label={`Edit ${folder.name}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEditing(true);
              }}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] bg-primary px-3 font-mono text-xs text-primary-foreground outline-none transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-2.5 hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.25 19.75 5.55 15.2 16.95 3.8a1.85 1.85 0 0 1 2.62 2.62L8.17 17.82 4.25 19.75Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M15.65 5.1 18.25 7.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
        {editing ? <EditFolderDialog folder={folder} onClose={() => setEditing(false)} /> : null}
      </div>
    </div>
  );
});
