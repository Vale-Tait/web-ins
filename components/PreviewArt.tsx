"use client";

import { ScreenshotPreview } from "@/components/ScreenshotPreview";

export function PreviewArt({
  domain,
  url,
  screenshotUrl,
  dark = false
}: {
  domain: string;
  url?: string;
  screenshotUrl?: string | null;
  dark?: boolean;
}) {
  return (
    <div className={`relative h-full overflow-hidden rounded ${dark ? "bg-[#111]" : "bg-[#f4f4f4]"}`}>
      <ScreenshotPreview
        link={{
          url: url ?? `https://${domain}`,
          domain,
          title: domain,
          screenshotUrl
        }}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 520px"
      />
    </div>
  );
}
