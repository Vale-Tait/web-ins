import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product loading states", () => {
  it("uses a shared loading surface for auth, hydration, and route loading", () => {
    const loadingComponentPath = join(root, "components/ProductLoading.tsx");
    expect(existsSync(loadingComponentPath)).toBe(true);

    const authGate = readFileSync(join(root, "components/AuthGate.tsx"), "utf8");
    const routeShell = readFileSync(join(root, "components/AppRouteShell.tsx"), "utf8");
    const appLoading = readFileSync(join(root, "app/loading.tsx"), "utf8");

    expect(authGate).toContain("fallback = <ProductLoadingFrame");
    expect(authGate).not.toContain("return null");
    expect(routeShell).toContain("function ProductDataGate");
    expect(routeShell).toContain("<ProductLoadingFrame");
    expect(routeShell).not.toContain("<RouteTransitionIndicator />");
    expect(appLoading).toContain("<ProductLoadingInline");
  });

  it("does not leave canvas routes blank while app data hydrates", () => {
    const canvasListPage = readFileSync(join(root, "app/canvas/page.tsx"), "utf8");
    const canvasEditorPage = readFileSync(join(root, "app/canvas/[id]/page.tsx"), "utf8");

    expect(canvasListPage).not.toContain("if (!hydrated) return <div />");
    expect(canvasEditorPage).not.toContain("if (!hydrated) return <div />");
  });

  it("shows accessible loading dots without the old grid, icon or track", () => {
    const loadingComponent = readFileSync(join(root, "components/ProductLoading.tsx"), "utf8");
    const globals = readFileSync(join(root, "app/globals.css"), "utf8");

    expect(loadingComponent).toContain('className="loading-dots"');
    expect(loadingComponent).toContain('role="status"');
    expect(loadingComponent).not.toContain("product-loading-grid");
    expect(loadingComponent).toContain('label = "Loading"');
    expect(loadingComponent).not.toContain("LoadingChrome");
    expect(loadingComponent).not.toContain("product-loading-rail");
    expect(loadingComponent).not.toContain("product-loading-header");
    expect(loadingComponent).not.toContain("product-loading-mark");
    expect(loadingComponent).not.toContain("product-loading-track");
    expect(loadingComponent).not.toContain("product-loading-detail");
    expect(globals).toContain("product-loading-grid");
    expect(globals).toContain("padding: calc(5.625rem + 2.5rem) 2.5rem 2.5rem calc(5.25rem + 2.5rem)");
    expect(globals).toContain("grid-template-columns");
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
