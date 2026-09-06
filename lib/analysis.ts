import type { AnalysisResult } from "@/lib/types";
import { getDomain, normalizeUrl } from "@/lib/url";

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

export type AnalysisDetails = {
  frameworks: string[];
  libraries: string[];
  animations: string[];
  fonts: string[];
  durationLabel: string;
};

export type AnalyzeResult = Omit<AnalysisResult, "colors">;

export type WebsiteAnalysis = {
  url: string;
  domain: string;
  screenshotUrl: string;
  analysis: AnalyzeResult;
  durationLabel: string;
  details: AnalysisDetails;
};

export function analyzeHtml({
  url,
  linkId = "preview",
  html
}: {
  url: string;
  linkId?: string;
  html: string;
  headers?: Headers | Record<string, string | null | undefined>;
}): WebsiteAnalysis {
  const normalizedUrl = normalizeUrl(url);
  const domain = getDomain(normalizedUrl);
  const source = html.slice(0, 1_500_000);
  const lower = source.toLowerCase();
  const now = new Date().toISOString();
  const durationMs = detectMaxDurationMs(source);

  const frameworks = uniqueValues([
    ...detectByPattern(lower, [
      ["Next.js", /(?:\/_next\/|__next_data__|next-router|next\.js)/],
      ["Nuxt", /(?:\/_nuxt\/|data-n-head|nuxt)/],
      ["SvelteKit", /(?:sveltekit|__sveltekit)/],
      ["Astro", /(?:astro-island|astro:)/],
      ["Remix", /(?:remix-run|__remix)/],
      ["Webflow", /(?:webflow\.js|webflow\.io|data-wf-page)/],
      ["WordPress", /(?:wp-content|wp-includes|wordpress)/],
      ["Shopify", /(?:cdn\.shopify\.com|shopify\.theme|myshopify)/],
      ["Framer", /(?:framerusercontent|framer\.com|data-framer)/]
    ])
  ]);

  const libraries = uniqueValues([
    ...detectByPattern(lower, [
      ["React", /(?:data-reactroot|react-dom|react\.production|react-refresh|__react|\/_next\/)/],
      ["Vue.js", /(?:vue\.runtime|vue-router|data-v-|__vue__|\/_nuxt\/)/],
      ["Svelte", /(?:svelte-|__svelte)/],
      ["Vite", /(?:\/@vite\/|vite\/client|type=\"module\" crossorigin)/],
      ["Three.js", /(?:three\.module|three\.min|threejs|three\.js)/]
    ])
  ]);

  const animations = uniqueValues([
    ...detectByPattern(lower, [
      ["GSAP", /(?:gsap|scrolltrigger)/],
      ["Lenis", /(?:lenis)/],
      ["Locomotive Scroll", /(?:locomotive-scroll)/],
      ["Lottie", /(?:lottie|bodymovin)/],
      ["Framer Motion", /(?:framer-motion|motion\.)/],
      ["CSS transitions", /(?:transition\s*:|transition-duration\s*:|animation\s*:|animation-duration\s*:|@keyframes)/]
    ])
  ]);

  const fonts = uniqueValues([...detectFontFaceFamilies(source), ...detectGoogleFontFamilies(source), ...detectCssFontFamilies(source)]).slice(0, 6);
  const techStack = uniqueValues([...frameworks, ...libraries]);

  const durationLabel = durationMs ? formatDuration(durationMs) : "Not detected";
  const details: AnalysisDetails = {
    frameworks,
    libraries,
    animations: animations.length ? animations : ["Not detected"],
    fonts: fonts.length ? fonts : ["Not detected"],
    durationLabel
  };

  return {
    url: normalizedUrl,
    domain,
    screenshotUrl: createScreenshotPlaceholder(normalizedUrl),
    durationLabel,
    details,
    analysis: {
      id: `analysis-${linkId}`,
      linkId,
      fonts: details.fonts,
      animations: details.animations,
      techStack: techStack.length ? techStack : ["Not detected"],
      createdAt: now,
      updatedAt: now
    }
  };
}

export async function analyzeWebsite(urlInput: string, linkId = "preview"): Promise<WebsiteAnalysis> {
  const normalizedUrl = normalizeUrl(urlInput);
  assertSafeAnalyzeUrl(normalizedUrl);

  const controller = new AbortController();
  const timeout = windowSafeSetTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(normalizedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "WebInspirationBot/1.0 (+https://localhost/analyze)"
      }
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch website: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.toLowerCase().includes("text/html")) {
      throw new Error("The URL did not return an HTML page.");
    }

    const html = await response.text();
    const supplementalSource = await fetchSupplementalAssets(normalizedUrl, html, controller.signal);
    return analyzeHtml({ url: normalizedUrl, linkId, html: `${html}\n${supplementalSource}`, headers: response.headers });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Website analysis timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function getScreenshotHomepageUrl(url: string) {
  const normalizedUrl = normalizeUrl(url);
  const parsed = new URL(normalizedUrl);
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

export function createWebsiteScreenshotUrl(url: string, width = 1200) {
  const homepageUrl = getScreenshotHomepageUrl(url);
  const safeWidth = Math.min(2000, Math.max(320, Math.round(width)));
  const params = new URLSearchParams({ url: homepageUrl, w: String(safeWidth) });
  return `/api/screenshots?${params.toString()}`;
}

export function createRemoteWebsiteScreenshotUrl(url: string, width = 1200) {
  const homepageUrl = getScreenshotHomepageUrl(url);
  const safeWidth = Math.min(2000, Math.max(320, Math.round(width)));
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(homepageUrl)}?w=${safeWidth}`;
}

export function createUnavailablePreviewSvg(label = "Preview unavailable") {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
      <rect width="1200" height="760" fill="#f4f4f5"/>
      <rect x="438" y="286" width="324" height="188" rx="16" fill="#ffffff" stroke="#d9dde3" stroke-width="2"/>
      <path d="M520 424 578 350l48 58 34-40 60 56" fill="none" stroke="#a0a8b4" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="686" cy="344" r="24" fill="#c2c8d1"/>
      <text x="600" y="548" text-anchor="middle" fill="#7b8494" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="34" font-weight="700">${escapeSvgText(label)}</text>
    </svg>
  `;
}

export function createUnavailablePreviewDataUrl(label = "Preview unavailable") {
  const svg = createUnavailablePreviewSvg(label);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isLegacyScreenshotUrl(value?: string | null) {
  const screenshotUrl = value?.trim();
  if (!screenshotUrl) return true;
  return (
    /^data:image\/svg\+xml/i.test(screenshotUrl) ||
    /(^https?:\/\/)?placehold\.co\//i.test(screenshotUrl) ||
    /(^https?:\/\/)?s\.wordpress\.com\/mshots\/v1\//i.test(screenshotUrl)
  );
}

export function resolveScreenshotUrl(link: { url: string; screenshotUrl?: string | null }) {
  const screenshotUrl = link.screenshotUrl?.trim();
  if (screenshotUrl && !isLegacyScreenshotUrl(screenshotUrl)) return screenshotUrl;

  try {
    return createWebsiteScreenshotUrl(link.url);
  } catch {
    return createUnavailablePreviewDataUrl();
  }
}

export function createScreenshotPlaceholder(url: string) {
  return createWebsiteScreenshotUrl(url);
}

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return char;
    }
  });
}

function detectByPattern(source: string, patterns: Array<[string, RegExp]>) {
  return patterns.flatMap(([label, pattern]) => (pattern.test(source) ? [label] : []));
}

async function fetchSupplementalAssets(pageUrl: string, html: string, signal: AbortSignal) {
  const assetUrls = collectSupplementalAssetUrls(pageUrl, html).slice(0, 10);
  const chunks: string[] = [];
  let totalLength = 0;

  for (const assetUrl of assetUrls) {
    if (totalLength > 900_000) break;
    try {
      const response = await fetch(assetUrl, {
        signal,
        headers: {
          Accept: "text/css,application/javascript,text/javascript,*/*;q=0.5",
          "User-Agent": "WebInspirationBot/1.0 (+https://localhost/analyze)"
        }
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType && !/(css|javascript|ecmascript|text\/plain)/.test(contentType)) continue;
      const text = (await response.text()).slice(0, 180_000);
      totalLength += text.length;
      chunks.push(`\n/* ${assetUrl} */\n${text}`);
    } catch {
      // Ignore blocked or slow assets; homepage analysis still returns useful partial data.
    }
  }

  return chunks.join("\n");
}

function collectSupplementalAssetUrls(pageUrl: string, html: string) {
  const urls: string[] = [];
  const assetPatterns = [
    /<link[^>]+href=["']([^"']+\.(?:css)(?:\?[^"']*)?)["'][^>]*>/gi,
    /<script[^>]+src=["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["'][^>]*>/gi
  ];

  for (const pattern of assetPatterns) {
    for (const match of html.matchAll(pattern)) {
      try {
        const parsed = new URL(match[1], pageUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) continue;
        urls.push(parsed.toString());
      } catch {
        // Skip malformed asset URLs.
      }
    }
  }

  return uniqueValues(urls);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function detectFontFaceFamilies(source: string) {
  const families: string[] = [];
  for (const match of source.matchAll(/@font-face\s*{[^}]*font-family\s*:\s*["']?([^;"'}]+)["']?/gi)) {
    families.push(cleanFontName(match[1]));
  }
  return families.filter(Boolean);
}

function detectGoogleFontFamilies(source: string) {
  const families: string[] = [];
  for (const match of source.matchAll(/fonts\.googleapis\.com\/css2?[^"')\s>]+/gi)) {
    const href = match[0].replace(/&amp;/g, "&");
    const query = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
    for (const family of new URLSearchParams(query).getAll("family")) {
      families.push(cleanFontName(family.split(":")[0].replace(/\+/g, " ")));
    }
  }
  return families.filter(Boolean);
}

function detectCssFontFamilies(source: string) {
  const families: string[] = [];
  const ignored = new Set(["serif", "sans-serif", "monospace", "system-ui", "inherit", "initial", "ui-sans-serif", "ui-serif", "ui-monospace"]);
  for (const match of source.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    for (const rawFamily of match[1].split(",")) {
      const family = cleanFontName(rawFamily);
      if (family && !ignored.has(family.toLowerCase())) families.push(family);
    }
  }
  return families.filter(Boolean);
}

function cleanFontName(value = "") {
  return value.replace(/["']/g, "").replace(/!important/gi, "").trim();
}

function detectMaxDurationMs(source: string) {
  const durations: number[] = [];
  const durationPattern = /(?:transition|animation)(?:-duration)?\s*:[^;}{]*?(\d*\.?\d+)\s*(ms|s)/gi;
  for (const match of source.matchAll(durationPattern)) {
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) continue;
    durations.push(match[2].toLowerCase() === "s" ? amount * 1000 : amount);
  }
  return durations.length ? Math.max(...durations) : null;
}

function formatDuration(durationMs: number) {
  if (durationMs >= 1000) return `${Number((durationMs / 1000).toFixed(2))}s`;
  return `${Math.round(durationMs)}ms`;
}

function assertSafeAnalyzeUrl(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs can be analyzed.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIPv4(hostname)
  ) {
    throw new Error("Local or private network URLs cannot be analyzed.");
  }
}

function isPrivateIPv4(hostname: string) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split(".").map(Number);
  if (parts.some((part) => part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0;
}

function windowSafeSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}
