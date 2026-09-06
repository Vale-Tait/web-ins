import { createUnavailablePreviewSvg, getScreenshotHomepageUrl } from "@/lib/analysis";
import { captureHomepageScreenshot } from "@/lib/screenshot-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_WIDTH = 1200;
const ASPECT_RATIO = 760 / 1200;
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;

type CachedScreenshot = {
  body: Uint8Array | string;
  contentType: string;
  expiresAt: number;
};

const screenshotCache = new Map<string, CachedScreenshot>();
const pendingCaptures = new Map<string, Promise<CachedScreenshot>>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") ?? "";
  const width = normalizeWidth(searchParams.get("w"));
  const height = Math.round(width * ASPECT_RATIO);

  try {
    const homepageUrl = getScreenshotHomepageUrl(rawUrl);
    const cacheKey = `${homepageUrl}|${width}`;
    const cached = await getCachedScreenshot(cacheKey, () => captureScreenshot(homepageUrl, width, height));
    return screenshotResponse(cached);
  } catch {
    return screenshotResponse(createFallbackScreenshot());
  }
}

function normalizeWidth(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_WIDTH;
  return Math.min(2000, Math.max(320, Math.round(parsed)));
}

async function getCachedScreenshot(cacheKey: string, capture: () => Promise<CachedScreenshot>) {
  const now = Date.now();
  const cached = screenshotCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached;

  const existing = pendingCaptures.get(cacheKey);
  if (existing) return existing;

  const pending = capture()
    .catch(() => createFallbackScreenshot())
    .then((result) => {
      screenshotCache.set(cacheKey, result);
      return result;
    })
    .finally(() => {
      pendingCaptures.delete(cacheKey);
    });

  pendingCaptures.set(cacheKey, pending);
  return pending;
}

async function captureScreenshot(homepageUrl: string, width: number, height: number): Promise<CachedScreenshot> {
  const screenshot = await captureHomepageScreenshot(homepageUrl, { width, height });
  return {
    body: new Uint8Array(screenshot),
    contentType: "image/png",
    expiresAt: Date.now() + SUCCESS_TTL_MS
  };
}

function createFallbackScreenshot(): CachedScreenshot {
  return {
    body: createUnavailablePreviewSvg(),
    contentType: "image/svg+xml; charset=utf-8",
    expiresAt: Date.now() + FAILURE_TTL_MS
  };
}

function screenshotResponse(screenshot: CachedScreenshot) {
  const body =
    typeof screenshot.body === "string"
      ? screenshot.body
      : toArrayBuffer(screenshot.body);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": screenshot.contentType,
      "Cache-Control":
        screenshot.contentType === "image/png"
          ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800"
          : "public, max-age=300"
    }
  });
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
