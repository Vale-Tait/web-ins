import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const dialogFiles = [
  "components/SaveUrlDialog.tsx",
  "components/CreateFolderDialog.tsx",
  "components/EditFolderDialog.tsx",
  "components/SearchDialog.tsx",
  "components/LinkTile.tsx",
  "app/collections/[folderId]/page.tsx",
  "app/links/[id]/page.tsx"
];

describe("dialog theme styling", () => {
  it("does not hard-code light dialog surfaces or text in floating windows", () => {
    const source = dialogFiles.map((file) => readFileSync(join(root, file), "utf8")).join("\n");

    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-[#111827]");
    expect(source).not.toContain("text-[#20242b]");
  });

  it("defines theme-aware dialog tokens and dark scrollbars", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");

    expect(css).toContain(".dialog-surface");
    expect(css).toContain(".dialog-field");
    expect(css).toContain('[data-theme="dark"] .soft-scrollbar');
    expect(css).toContain('[data-theme="dusk"] .soft-scrollbar');
  });

  it("removes rounded rectangle shadows from all floating window surfaces", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    const themeRail = readFileSync(join(root, "components/ThemeRail.tsx"), "utf8");
    const dialogSurfaceBlock = css.match(/\.dialog-surface\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const floatingMenuBlock = css.match(/\.floating-menu-surface\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const darkFloatingMenuBlock = css.match(/\[data-theme="dark"\]\s+\.floating-menu-surface,\s*\n\[data-theme="dusk"\]\s+\.floating-menu-surface\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(dialogSurfaceBlock).toContain("box-shadow: none");
    expect(floatingMenuBlock).toContain("box-shadow: none");
    expect(darkFloatingMenuBlock).toContain("box-shadow: none");
    expect(css).not.toContain(".dialog-surface {\n  border: 1px solid var(--line);\n  background-color: var(--panel);\n  color: var(--text);\n  box-shadow: 0 32px 80px");
    expect(floatingMenuBlock).not.toContain("box-shadow: 0 12px 32px");
    expect(darkFloatingMenuBlock).not.toContain("box-shadow: 0 12px 32px");
    expect(themeRail).not.toContain("shadow-[var(--shadow)]");
  });

  it("keeps the app scaled to the requested 75 percent browser-zoom feel", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    const shell = readFileSync(join(root, "components/ProductShell.tsx"), "utf8");

    expect(css).toContain("--app-scale: 0.75");
    expect(css).toContain(".app-scale-root");
    expect(css).toContain("overflow: hidden");
    expect(css).toContain("width: calc(100vw / var(--app-scale))");
    expect(css).toContain("height: calc(100dvh / var(--app-scale))");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("transform: scale(var(--app-scale))");
    expect(shell).toContain("app-scale-root");
  });
});
