import { describe, expect, it } from "vitest";
import { analyzeHtml, createAnalysisFixture } from "@/lib/analysis";

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

  it("detects framework, libraries, animation, fonts, and duration from real page markup", () => {
    const result = analyzeHtml({
      url: "https://example.com",
      linkId: "preview",
      headers: {
        "x-vercel-id": "iad1::abc",
        "cf-ray": "test"
      },
      html: `
        <html>
          <head>
            <meta name="generator" content="Next.js">
            <meta name="description" content="A motion-driven editorial site">
            <script src="/_next/static/chunks/app.js"></script>
            <script src="https://cdn.vercel-insights.com/v1/script.js"></script>
            <script src="/assets/gsap.min.js"></script>
            <script src="/assets/lenis.min.js"></script>
            <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap" rel="stylesheet">
            <style>
              @font-face { font-family: "Editorial New"; src: url("/fonts/editorial.woff2"); }
              body { font-family: "Editorial New", "Roboto Mono", monospace; color: #111827; background: #ffffff; transition: opacity 400ms ease; }
            </style>
          </head>
          <body data-reactroot>Example</body>
        </html>
      `
    });

    expect(result.analysis.techStack).toEqual(expect.arrayContaining(["Next.js", "React"]));
    expect(result.analysis.techStack).not.toContain("Vercel");
    expect(result.analysis.techStack).not.toContain("Cloudflare");
    expect(result.details.frameworks).toEqual(["Next.js"]);
    expect(result.details.libraries).toContain("React");
    expect("hosting" in result.details).toBe(false);
    expect(result.analysis.animations).toEqual(expect.arrayContaining(["GSAP", "Lenis", "CSS transitions"]));
    expect(result.analysis.fonts).toEqual(expect.arrayContaining(["Editorial New", "Roboto Mono"]));
    expect("colors" in result.details).toBe(false);
    expect("colors" in result.analysis).toBe(false);
    expect(result.durationLabel).toBe("400ms");
  });
});
