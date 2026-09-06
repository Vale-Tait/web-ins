import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("analyze folder selection", () => {
  it("saves analyzed links to multiple selected folders", () => {
    const analyzePage = readFileSync(join(root, "app/analyze/page.tsx"), "utf8");
    const multiSelect = readFileSync(join(root, "components/FolderMultiSelect.tsx"), "utf8");
    const saveUrlDialog = readFileSync(join(root, "components/SaveUrlDialog.tsx"), "utf8");

    expect(analyzePage).toContain("function AnalyzeSaveControl");
    expect(analyzePage).toContain("const [selectedFolderIds, setSelectedFolderIds]");
    expect(analyzePage).toContain("folderIds: selectedFolderIds.length ? selectedFolderIds : [\"unsorted\"]");
    expect(analyzePage).toContain("analysis: result.analysis");
    expect(analyzePage).toContain('fetch("/api/analyze"');
    expect(analyzePage).toContain("Analyzing live website...");
    expect(analyzePage).toContain("analysisPulse");
    expect(analyzePage).toContain("function AnalysisSummary");
    expect(analyzePage).not.toContain("Hosting / CDN");
    expect(analyzePage).not.toContain('{ label: "Colors"');
    expect(analyzePage).not.toContain("Reading fonts, colors");
    expect(analyzePage).not.toContain("hosting:");
    expect(analyzePage).not.toContain("colors:");
    expect(analyzePage).not.toContain("hosting signals");
    expect(analyzePage).not.toContain("swatches");
    expect(analyzePage).toContain("items-baseline");
    expect(analyzePage).not.toContain("createAnalysisFixture");
    expect(analyzePage).toContain("getFaviconUrl(result.url)");
    expect(analyzePage).toContain("Save to.");
    expect(analyzePage).toContain("Saved");
    expect(analyzePage).not.toContain("<FolderMultiSelect");
    expect(analyzePage).not.toContain("<select");

    expect(multiSelect).toContain("Search folders...");
    expect(multiSelect).toContain('type="checkbox"');
    expect(multiSelect).toContain("{folder.name}");
    expect(multiSelect).toContain('folder.id !== "all"');
    expect(multiSelect).not.toContain("disabled={folder.id === \"all\"}");
    expect(multiSelect).not.toContain('folder.id === "all" ?');

    expect(saveUrlDialog).toContain("<FolderMultiSelect");
  });

  it("optimistically updates link folder changes before waiting on the API", () => {
    const appProvider = readFileSync(join(root, "components/AppProvider.tsx"), "utf8");
    const dispatchBody = appProvider.slice(appProvider.indexOf("const dispatch = useCallback"));
    const updateLinkCase = dispatchBody.slice(dispatchBody.indexOf('case "update-link"'), dispatchBody.indexOf('case "delete-link"'));

    expect(updateLinkCase).toContain("const previousLink");
    expect(updateLinkCase).toContain("baseDispatch(action);");
    expect(updateLinkCase.indexOf("baseDispatch(action);")).toBeLessThan(updateLinkCase.indexOf("apiRequest<LinkItem>"));
    expect(updateLinkCase).toContain("previousLink");
  });

  it("persists analyzed metadata when an analyzed link is saved", () => {
    const appProvider = readFileSync(join(root, "components/AppProvider.tsx"), "utf8");
    const repository = readFileSync(join(root, "lib/supabase-repository.ts"), "utf8");

    expect(appProvider).toContain("analysis?: Partial<LinkItem[\"analysis\"]>");
    expect(appProvider).toContain("analysis: action.analysis");
    expect(appProvider).toContain("upsertLinkInList(data.links, link)");
    expect(repository).toContain("analysis?: Partial<LinkItem[\"analysis\"]>");
    expect(repository).toContain("body.analysis");
    expect(repository).toContain("colors: analysis.colors ?? []");
    expect(repository).toContain("findExistingLinkIdByUrl");
    expect(repository).toContain("upsertLinkAnalysis");
  });
});
