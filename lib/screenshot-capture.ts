import { existsSync } from "node:fs";
import type { Browser, Page } from "playwright";
import { getScreenshotHomepageUrl } from "@/lib/analysis";

type CaptureOptions = {
  width: number;
  height: number;
};

let browserPromise: Promise<Browser> | null = null;

export async function captureHomepageScreenshot(url: string, options: CaptureOptions) {
  const homepageUrl = getScreenshotHomepageUrl(url);
  assertSafeHttpUrl(homepageUrl);

  const { chromium } = await import("playwright");
  const browser = await getBrowser(chromium);
  if (!browser.isConnected()) {
    browserPromise = null;
    return captureHomepageScreenshot(homepageUrl, options);
  }
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: 1
  });

  try {
    await page.route("**/*", async (route) => {
      const requestUrl = route.request().url();
      if (!isSafeHttpUrl(requestUrl)) {
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    await page.goto(homepageUrl, { waitUntil: "domcontentloaded", timeout: 18_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    await waitForHomepageContent(page);
    await waitForNoBlockingLoader(page);

    if (await hasBlockingLoader(page)) {
      throw new Error("Blocking loader still visible");
    }
    if (await isPageVisuallyEmpty(page)) {
      throw new Error("Homepage content did not become visible");
    }

    await page
      .addStyleTag({
        content: "*,*::before,*::after{animation-play-state:paused!important;transition-duration:0s!important;scroll-behavior:auto!important}"
      })
      .catch(() => undefined);
    const connectedBeforeScreenshot = browser.isConnected();
    const pageClosedBeforeScreenshot = page.isClosed();
    try {
      return await page.screenshot({
        type: "png",
        fullPage: false
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to take screenshot";
      throw new Error(
        `Screenshot failed connectedBefore=${connectedBeforeScreenshot} pageClosedBefore=${pageClosedBeforeScreenshot} connectedAfter=${browser.isConnected()} pageClosedAfter=${page.isClosed()}: ${message}`
      );
    }
  } catch (error) {
    if (!browser.isConnected()) browserPromise = null;
    throw error;
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function getBrowser(chromium: typeof import("playwright").chromium) {
  browserPromise ??= chromium.launch({
    headless: true,
    executablePath: resolveChromiumExecutablePath(),
    args: ["--disable-dev-shm-usage", "--no-sandbox"]
  });
  try {
    const browser = await browserPromise;
    if (browser.isConnected()) return browser;
  } catch {
    browserPromise = null;
    throw new Error("Unable to launch browser for screenshot capture");
  }

  browserPromise = null;
  return getBrowser(chromium);
}

function resolveChromiumExecutablePath() {
  const envPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  const candidates =
    process.platform === "win32"
      ? [
          `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
        ];

  return candidates.find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
}

async function waitForHomepageContent(page: Page) {
  await page.waitForFunction(() => document.readyState === "complete", undefined, { timeout: 8_000 }).catch(() => undefined);
  await page
    .waitForFunction(
      () => {
        const body = document.body;
        if (!body) return false;
        const textLength = body.innerText.replace(/\s+/g, " ").trim().length;
        const meaningfulElements = Array.from(document.querySelectorAll("main, article, section, header, nav, h1, h2, p, a, img, video, canvas"))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 20 && rect.height > 20 && style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
          })
          .length;
        return textLength > 40 || meaningfulElements >= 3;
      },
      undefined,
      { timeout: 12_000 }
    )
    .catch(() => undefined);
}

async function waitForNoBlockingLoader(page: Page) {
  await page.waitForFunction(`!(${blockingLoaderExpression})()`, undefined, { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(1_200);
}

async function hasBlockingLoader(page: Page) {
  return page.evaluate(`(${blockingLoaderExpression})()`);
}

async function isPageVisuallyEmpty(page: Page) {
  return page.evaluate(() => {
    const body = document.body;
    if (!body) return true;
    const textLength = body.innerText.replace(/\s+/g, " ").trim().length;
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    const visibleMeaningfulElements = Array.from(document.querySelectorAll("img, picture, video, canvas, svg, main, section, article, h1, h2, p, a"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
        if (rect.width < 24 || rect.height < 24) return false;
        if (rect.width * rect.height < viewportArea * 0.01) return false;
        return true;
      })
      .length;
    return textLength < 8 && visibleMeaningfulElements < 2;
  });
}

function assertSafeHttpUrl(value: string) {
  if (!isSafeHttpUrl(value)) throw new Error("Only public http(s) URLs can be captured");
}

function isSafeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return !isPrivateHostname(parsed.hostname);
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4) return false;

  const [, aRaw, bRaw] = ipv4;
  const a = Number(aRaw);
  const b = Number(bRaw);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

const blockingLoaderExpression = String(function hasBlockingLoaderInPage() {
  const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
  const selectors = [
    '[class*="loader" i]',
    '[class*="loading" i]',
    '[class*="preloader" i]',
    '[class*="spinner" i]',
    '[id*="loader" i]',
    '[id*="loading" i]',
    '[id*="preloader" i]',
    '[aria-busy="true"]'
  ];

  return selectors.some((selector) =>
    Array.from(document.querySelectorAll(selector)).some((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
      if (rect.width <= 0 || rect.height <= 0) return false;
      const coversLargeArea = rect.width * rect.height > viewportArea * 0.22;
      const fixedOverlay = style.position === "fixed" && rect.width > window.innerWidth * 0.55 && rect.height > window.innerHeight * 0.55;
      return coversLargeArea || fixedOverlay;
    })
  );
});
