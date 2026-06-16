import type { AnalysisResult } from "@/lib/types";
import { getDomain } from "@/lib/url";

const presets: Record<string, Omit<AnalysisResult, "id" | "linkId" | "createdAt" | "updatedAt">> = {
  "makemepulse.com": {
    fonts: ["Biotif", "Neue Haas Grotesk"],
    animations: ["GSAP", "Lottie", "Locomotive Scroll"],
    techStack: ["Nuxt", "React", "Vue.js"],
    colors: ["#101010", "#f7f7f4", "#a5a494"]
  },
  "isadeburgh.com": {
    fonts: ["Editorial New", "PP Neue Montreal"],
    animations: ["Lenis", "CSS transitions"],
    techStack: ["Next.js", "React", "Vercel"],
    colors: ["#ffffff", "#111111", "#d7d7d7"]
  },
  "studionuts.com.br": {
    fonts: ["Founders Grotesk", "ABC Diatype"],
    animations: ["Framer Motion", "GSAP"],
    techStack: ["Next.js", "React", "Cloudflare"],
    colors: ["#f7f7f7", "#202020", "#9b9b9b"]
  }
};

export function createAnalysisFixture(url: string, linkId = "preview"): AnalysisResult {
  const now = new Date().toISOString();
  const domain = getDomain(url);
  const preset = presets[domain] ?? {
    fonts: ["PP Neue Montreal", "Geist Mono"],
    animations: ["CSS transitions", "Motion"],
    techStack: ["Next.js", "React", "Vercel"],
    colors: ["#ffffff", "#171717", "#9ca3af"]
  };

  return {
    id: `analysis-${linkId}`,
    linkId,
    createdAt: now,
    updatedAt: now,
    ...preset
  };
}

export function createScreenshotPlaceholder(domain: string) {
  const encoded = encodeURIComponent(domain);
  return `https://placehold.co/1200x760/f7f7f7/111111/png?text=${encoded}`;
}
