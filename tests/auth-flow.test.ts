import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { clearAuthSession, getAuthSession, saveAuthSession } from "@/lib/auth-store";

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

  it("protects product shells and canvas routes behind the auth gate", () => {
    const productShell = readFileSync(join(root, "components/ProductShell.tsx"), "utf8");
    const canvasListPage = readFileSync(join(root, "app/canvas/page.tsx"), "utf8");
    const canvasEditorPage = readFileSync(join(root, "app/canvas/[id]/page.tsx"), "utf8");

    expect(productShell).toContain('import { AuthGate } from "@/components/AuthGate"');
    expect(productShell).toContain("<AuthGate>");
    expect(canvasListPage).toContain('import { ProductShell } from "@/components/ProductShell"');
    expect(canvasListPage).toContain("<ProductShell>");
    expect(canvasEditorPage).toContain('import { AuthGate } from "@/components/AuthGate"');
    expect(canvasEditorPage).toContain("<AuthGate>");
  });

  it("routes the User navigation item to the settings page", () => {
    const topNav = readFileSync(join(root, "components/ProductTopNav.tsx"), "utf8");

    expect(topNav).toContain('href="/settings"');
    expect(topNav).toContain('pathname.startsWith("/settings")');
    expect(topNav).not.toContain('href="/auth"');
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

  it("stores and clears the local auth session", () => {
    expect(getAuthSession()).toBeNull();

    saveAuthSession({ email: "vale@example.com", firstName: "Vale", lastName: "User" });
    expect(getAuthSession()).toEqual({ email: "vale@example.com", firstName: "Vale", lastName: "User" });

    clearAuthSession();
    expect(getAuthSession()).toBeNull();
  });
});
