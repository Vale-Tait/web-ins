import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { clearAuthSession, getAuthSession } from "@/lib/auth-store";

const root = process.cwd();

describe("auth entry flow", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts unauthenticated users on the standalone login page", () => {
    const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
    const authPage = readFileSync(join(root, "app/auth/page.tsx"), "utf8");

    expect(homePage).toContain('redirect("/auth")');
    expect(authPage).not.toContain("ProductShell");
    expect(authPage).not.toContain("ThemeRail");
    expect(authPage).not.toContain("ProductTopNav");
    expect(authPage).not.toContain("Continue to demo workspace");
    expect(authPage).toContain("Already a member?");
    expect(authPage).toContain("First name");
    expect(authPage).toContain("Confirm password");
  });

  it("protects product routes through a persistent root route shell", () => {
    const rootLayout = readFileSync(join(root, "app/layout.tsx"), "utf8");
    const routeShellPath = join(root, "components/AppRouteShell.tsx");
    expect(existsSync(routeShellPath)).toBe(true);
    const routeShell = readFileSync(routeShellPath, "utf8");
    const productShell = readFileSync(join(root, "components/ProductShell.tsx"), "utf8");
    const canvasListPage = readFileSync(join(root, "app/canvas/page.tsx"), "utf8");
    const canvasEditorPage = readFileSync(join(root, "app/canvas/[id]/page.tsx"), "utf8");

    expect(rootLayout).toContain("<AppRouteShell>");
    expect(routeShell).toContain("<AuthGate fallback=");
    expect(routeShell).toContain("<AppProvider>");
    expect(routeShell).toContain("isCanvasWorkspacePath");
    expect(productShell).toContain('import { AuthGate } from "@/components/AuthGate"');
    expect(productShell).toContain("<AuthGate>");
    expect(canvasListPage).not.toContain("<ProductShell>");
    expect(canvasEditorPage).not.toContain("<AppProvider>");
    expect(canvasEditorPage).not.toContain("<AuthGate>");
  });

  it("routes the User navigation item to the settings page", () => {
    const topNav = readFileSync(join(root, "components/ProductTopNav.tsx"), "utf8");

    expect(topNav).toContain('href="/settings"');
    expect(topNav).toContain('pathname.startsWith("/settings")');
    expect(topNav).not.toContain('href="/auth"');
  });

  it("checks the product auth gate once after entering the product area", () => {
    const authGate = readFileSync(join(root, "components/AuthGate.tsx"), "utf8");

    expect(authGate).toContain("initialPathnameRef");
    expect(authGate).toContain("const requestedPathname = initialPathnameRef.current");
    expect(authGate).toContain("}, [router]);");
    expect(authGate).not.toContain("[pathname, router]");
  });

  it("hydrates product data through a single bootstrap request", () => {
    const appProvider = readFileSync(join(root, "components/AppProvider.tsx"), "utf8");

    expect(appProvider).toContain('apiRequest<AppData>("/api/app-data")');
    expect(appProvider).not.toContain('apiRequest<AppData["folders"]>("/api/folders")');
    expect(appProvider).not.toContain('apiRequest<AppData["links"]>("/api/links")');
    expect(appProvider).not.toContain('apiRequest<AppData["canvases"]>("/api/canvases")');
  });

  it("keeps auth theme system-only while product pages keep the theme menu", () => {
    const appProvider = readFileSync(join(root, "components/AppProvider.tsx"), "utf8");
    const themeRail = readFileSync(join(root, "components/ThemeRail.tsx"), "utf8");
    const demoStore = readFileSync(join(root, "lib/demo-store.ts"), "utf8");
    const authStyles = readFileSync(join(root, "app/auth/auth.module.css"), "utf8");

    expect(authStyles).toContain("@media (prefers-color-scheme: dark)");
    expect(appProvider).toContain("matchMedia");
    expect(appProvider).toContain("prefers-color-scheme: dark");
    expect(demoStore).toContain("themeKey");
    expect(demoStore).toContain("window.localStorage.getItem(themeKey)");
    expect(demoStore).toContain("window.localStorage.setItem(themeKey");
    expect(themeRail).toContain("const themes");
    expect(themeRail).toContain("set-theme");
    expect(themeRail).toContain("Theme");
    expect(themeRail).toContain("shadow-none");
  });

  it("uses the compact auth form proportions from the login reference", () => {
    const authStyles = readFileSync(join(root, "app/auth/auth.module.css"), "utf8");

    expect(authStyles).toContain("width: min(100%, 674px)");
    expect(authStyles).toContain("--auth-scale: 0.75");
    expect(authStyles).toContain("transform: scale(var(--auth-scale))");
    expect(authStyles).toContain("transform-origin: center");
    expect(authStyles).toContain("height: 54px");
    expect(authStyles).toContain("font-size: 22px");
    expect(authStyles).toContain("min-width: 132px");
    expect(authStyles).toContain("height: 45px");
  });

  it("has a user settings page with only password change and logout actions", () => {
    const settingsPath = join(root, "app/settings/page.tsx");
    expect(existsSync(settingsPath)).toBe(true);
    const settingsPage = readFileSync(settingsPath, "utf8");

    expect(settingsPage).toContain("Change Password");
    expect(settingsPage).toContain("Logout");
    expect(settingsPage).not.toContain("Theme");
    expect(settingsPage).not.toContain("Profile");
  });

  it("uses Supabase auth instead of a local auth session", async () => {
    const authStore = readFileSync(join(root, "lib/auth-store.ts"), "utf8");

    expect(await getAuthSession()).toBeNull();
    await clearAuthSession();

    expect(authStore).toContain("supabase.auth.signUp");
    expect(authStore).toContain("supabase.auth.signInWithPassword");
    expect(authStore).toContain("supabase.auth.signOut");
    expect(authStore).not.toContain("window.localStorage.setItem");
  });
});
