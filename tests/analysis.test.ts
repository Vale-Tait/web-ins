import { describe, expect, it } from "vitest";
import { createAnalysisFixture } from "@/lib/analysis";

describe("analysis fixture", () => {
  it("returns known fixture data for makemepulse", () => {
    const result = createAnalysisFixture("https://www.makemepulse.com/", "link-1");

    expect(result.linkId).toBe("link-1");
    expect(result.fonts).toContain("Biotif");
    expect(result.animations).toContain("GSAP");
  });

  it("returns fallback data for unknown domains", () => {
    const result = createAnalysisFixture("https://example.com");

    expect(result.techStack).toContain("Next.js");
  });
});
