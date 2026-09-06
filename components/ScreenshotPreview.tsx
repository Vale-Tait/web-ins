"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createUnavailablePreviewDataUrl, resolveScreenshotUrl } from "@/lib/analysis";
import type { LinkItem } from "@/lib/types";

type ScreenshotPreviewLink = Pick<LinkItem, "url" | "title" | "domain"> & {
  screenshotUrl?: LinkItem["screenshotUrl"] | null;
};

export function ScreenshotPreview({
  link,
  className,
  sizes = "100vw",
  alt,
  fallbackLabel = "Preview unavailable"
}: {
  link?: ScreenshotPreviewLink | null;
  className?: string;
  sizes?: string;
  alt?: string;
  fallbackLabel?: string;
}) {
  const url = link?.url;
  const screenshotUrl = link?.screenshotUrl;
  const src = useMemo(
    () => (url !== undefined ? resolveScreenshotUrl({ url, screenshotUrl }) : createUnavailablePreviewDataUrl(fallbackLabel)),
    [fallbackLabel, url, screenshotUrl]
  );
  const fallbackSrc = useMemo(() => createUnavailablePreviewDataUrl(fallbackLabel), [fallbackLabel]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displaySrc = failedSrc === src ? fallbackSrc : src;

  return (
    <Image
      fill
      unoptimized
      src={displaySrc}
      alt={alt ?? link?.title ?? link?.domain ?? ""}
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
