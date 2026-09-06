import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as analysis from "@/lib/analysis";

describe("website screenshot preview URLs", () => {
  it("creates an app screenshot URL for the website homepage", () => {
    const screenshot = analysis.createScreenshotPlaceholder("https://isadeburgh.com/work?ref=onepagelove");

    expect(screenshot).toBe(`/api/screenshots?url=${encodeURIComponent("https://isadeburgh.com/")}&w=1200`);
    expect(screenshot).not.toContain(encodeURIComponent("/work?ref=onepagelove"));
    expect(screenshot).not.toContain("s.wordpress.com/mshots/v1/");
    expect(screenshot).not.toContain("placehold.co");
  });

  it("resolves legacy placeholders to screenshot URLs while preserving custom screenshots", () => {
    expect(analysis).toHaveProperty("createWebsiteScreenshotUrl");
    expect(analysis).toHaveProperty("resolveScreenshotUrl");

    const { createWebsiteScreenshotUrl, resolveScreenshotUrl } = analysis as typeof analysis & {
      createWebsiteScreenshotUrl: (url: string, width?: number) => string;
      resolveScreenshotUrl: (link: { url: string; screenshotUrl: string }) => string;
    };

    expect(createWebsiteScreenshotUrl("https://example.com", 900)).toBe(
      `/api/screenshots?url=${encodeURIComponent("https://example.com/")}&w=900`
    );
    expect(resolveScreenshotUrl({ url: "https://example.com/page?x=1", screenshotUrl: "" })).toBe(
      createWebsiteScreenshotUrl("https://example.com/page?x=1")
    );
    expect(resolveScreenshotUrl({ url: "https://example.com/page?x=1", screenshotUrl: "https://placehold.co/1200x760/test.png" })).toBe(
      createWebsiteScreenshotUrl("https://example.com/page?x=1")
    );
    expect(resolveScreenshotUrl({ url: "https://example.com/page?x=1", screenshotUrl: "data:image/svg+xml;utf8,%3Csvg%3E" })).toBe(
      createWebsiteScreenshotUrl("https://example.com/page?x=1")
    );
    expect(resolveScreenshotUrl({ url: "https://example.com/page?x=1", screenshotUrl: "https://s.wordpress.com/mshots/v1/old?w=1200" })).toBe(
      createWebsiteScreenshotUrl("https://example.com/page?x=1")
    );
    expect(resolveScreenshotUrl({ url: "https://example.com", screenshotUrl: "https://cdn.example.com/custom.png" })).toBe(
      "https://cdn.example.com/custom.png"
    );
  });

  it("keeps every preview surface on the shared screenshot component", () => {
    const files = [
      "components/PreviewArt.tsx",
      "components/FolderCard.tsx",
      "components/canvas/canvasUtils.tsx"
    ].map((path) => readFileSync(join(process.cwd(), path), "utf8"));

    for (const file of files) {
      expect(file).toContain("ScreenshotPreview");
      expect(file).not.toContain("ISA DE BURGH");
      expect(file).not.toContain("makemepulse.");
      expect(file).not.toContain("placehold.co");
    }
  });

  it("provides a local unavailable fallback image", () => {
    const { createUnavailablePreviewDataUrl } = analysis as typeof analysis & {
      createUnavailablePreviewDataUrl: (label?: string) => string;
    };

    const fallback = createUnavailablePreviewDataUrl();

    expect(fallback).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(decodeURIComponent(fallback)).toContain("Preview unavailable");
  });
});
