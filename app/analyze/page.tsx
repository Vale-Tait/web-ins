"use client";

import { ArrowSquareOut, Check, Info, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PreviewArt } from "@/components/PreviewArt";
import { useApp } from "@/components/AppProvider";
import type { AnalysisDetails, AnalyzeResult } from "@/lib/analysis";
import type { Folder } from "@/lib/types";

type Result = {
  url: string;
  domain: string;
  screenshotUrl: string;
  analysis: AnalyzeResult;
  durationLabel: string;
  details?: AnalysisDetails;
};

type AnalyzeEnvelope = { data: Result } | { error: string };

function AnalyzeContent() {
  const { folders, dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>(["unsorted"]);
  const canAnalyze = url.trim().length > 0 && !isAnalyzing;

  useEffect(() => {
    if (!isAnalyzing) return;
    const timer = window.setInterval(() => {
      setAnalysisStep((current) => (current + 1) % analysisMessages.length);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);
    setAnalysisStep(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const payload = (await response.json()) as AnalyzeEnvelope;
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Unable to analyze website");
      }
      setResult(payload.data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unable to analyze website");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function saveResult() {
    if (!result) return;
    dispatch({
      type: "add-link",
      url: result.url,
      folderIds: selectedFolderIds.length ? selectedFolderIds : ["unsorted"],
      tags: ["Analyzed"],
      note: "Saved from Analyze.",
      analysis: result.analysis
    });
  }

  return (
    <>
      <section className="border-b border-[var(--line)] px-7 py-5 md:px-10">
        <p className="mono text-sm">
          <Link className="breadcrumb-item" href="/collections">Home</Link>
          <span className="mx-3 text-[var(--muted)]">/</span>
          <span className="text-[var(--text)]">Analyze</span>
        </p>
      </section>
      <section className="px-7 py-28 md:px-10">
        <div className="mx-auto max-w-[1180px]">
          <h1 className="mono text-[38px] font-semibold leading-tight">Analyze website</h1>
          <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-5">
            <p className="max-w-[760px] text-xl leading-8 text-[var(--muted)]">
              Paste any URL to reverse-engineer its design — screenshot, tech stack, fonts, frameworks, and animation libraries.
            </p>
            <Info size={18} className="text-[var(--muted)]" />
          </div>
          <form onSubmit={analyze} className="mt-9 grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px]">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="h-14 rounded-md border border-[var(--line)] bg-transparent px-5 text-lg outline-none focus:border-[var(--accent)]"
            />
            <button
              disabled={!canAnalyze}
              className="dialog-primary-button h-14 rounded-md font-semibold"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </form>
          {isAnalyzing ? (
            <AnalysisLoadingPanel message={analysisMessages[analysisStep]} />
          ) : null}
          {analysisError ? (
            <div className="mt-8 border border-[var(--line)] bg-[var(--panel)] px-6 py-5">
              <p className="mono text-sm font-semibold text-[var(--text)]">Unable to analyze this website.</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{analysisError}</p>
            </div>
          ) : null}
          {result ? (
            <div className="mt-12 grid overflow-visible border border-[var(--line)] bg-[var(--panel)] lg:grid-cols-[minmax(0,58%)_minmax(320px,42%)]">
              <div className="aspect-[16/10] overflow-hidden border-b border-[var(--line)] lg:border-b-0 lg:border-r">
                <PreviewArt domain={result.domain} url={result.url} screenshotUrl={result.screenshotUrl} />
              </div>
              <aside className="relative px-7 py-8 md:px-9">
                <div className="mb-11 flex items-start justify-between gap-4">
                  <h2 className="mono flex min-w-0 items-center gap-3 text-xl font-medium">
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 rounded-[3px] bg-[var(--muted-panel)] bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: `url("${getFaviconUrl(result.url)}")` }}
                    />
                    <span className="min-w-0 truncate">{result.domain}</span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${result.domain}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
                    >
                      <ArrowSquareOut size={17} />
                    </a>
                  </h2>
                  <AnalyzeSaveControl
                    key={result.url}
                    folders={folders}
                    selectedFolderIds={selectedFolderIds}
                    onSelectedFolderIdsChange={setSelectedFolderIds}
                    onSave={saveResult}
                  />
                </div>
                <AnalysisSummary result={result} />
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function AnalysisSummary({ result }: { result: Result }) {
  const details = result.details ?? {
    frameworks: result.analysis.techStack,
    libraries: [],
    animations: result.analysis.animations,
    fonts: result.analysis.fonts,
    durationLabel: result.durationLabel
  };
  const rows = [
    { label: "Framework", value: details.frameworks },
    { label: "Libraries", value: details.libraries },
    { label: "Animation", value: details.animations },
    { label: "Fonts", value: details.fonts },
    { label: "Duration", value: [details.durationLabel] }
  ].filter((row) => hasDetectedValue(row.value));

  return (
    <dl className="grid gap-8">
      {rows.map((row) => (
        <Metric key={row.label} label={row.label} value={row.value} />
      ))}
    </dl>
  );
}

const analysisMessages = [
  "Analyzing live website...",
  "Fetching homepage HTML and metadata...",
  "Detecting frameworks and script libraries...",
  "Reading fonts and motion patterns..."
];

function AnalysisLoadingPanel({ message }: { message: string }) {
  return (
    <div className="mt-12 grid overflow-hidden border border-[var(--line)] bg-[var(--panel)] lg:grid-cols-[minmax(0,58%)_minmax(320px,42%)]">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--line)] bg-[var(--muted-panel)] lg:border-b-0 lg:border-r">
        <div className="analysisPulse absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--line)]" />
      </div>
      <aside className="px-7 py-8 md:px-9">
        <p className="mono text-xl font-medium text-[var(--text)]">{message}</p>
        <div className="mt-10 grid gap-5">
          {analysisMessages.slice(1).map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${index <= analysisMessages.indexOf(message) ? "bg-[var(--text)]" : "bg-[var(--line)]"}`}
              />
              <span className="mono text-sm text-[var(--muted)]">{item}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function AnalyzeSaveControl({
  folders,
  selectedFolderIds,
  onSelectedFolderIdsChange,
  onSave
}: {
  folders: Folder[];
  selectedFolderIds: string[];
  onSelectedFolderIdsChange: (folderIds: string[]) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visibleFolders = folders.filter((folder) => folder.id !== "all" && folder.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleFolder(folderId: string) {
    setSaveState("idle");
    onSelectedFolderIdsChange(
      selectedFolderIds.includes(folderId)
        ? selectedFolderIds.filter((id) => id !== folderId)
        : [...selectedFolderIds, folderId]
    );
  }

  function commitSave() {
    onSave();
    setSaveState("saved");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mono h-10 rounded-md border border-[var(--line)] px-5 text-sm text-[var(--text)] transition hover:bg-[var(--muted-panel)]"
      >
        {saveState === "saved" ? "Saved" : "Save"}
      </button>
      {open ? (
        <div className="dialog-surface absolute right-0 top-12 z-30 w-[320px] overflow-hidden rounded-md">
          <div className="mono border-b border-[var(--line)] px-5 py-4 text-lg text-[var(--text)]">Save to.</div>
          <div className="p-3">
            <div className="flex h-11 items-center gap-2 rounded-md bg-[var(--muted-panel)] px-3">
              <MagnifyingGlass size={20} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search folders..."
                className="h-full flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              />
            </div>
          </div>
          <div className="soft-scrollbar max-h-56 overflow-auto px-2 pb-2">
            {visibleFolders.map((folder) => {
              const selected = selectedFolderIds.includes(folder.id);
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="mono flex h-10 w-full items-center justify-between rounded-[3px] px-3 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
                >
                  <span className="min-w-0 truncate">{folder.name}</span>
                  {selected ? <Check size={17} /> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--line)] p-2">
            <button
              type="button"
              onClick={commitSave}
              className="dialog-primary-button h-10 w-full rounded-md mono text-sm font-semibold"
            >
              Save to Folder
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFaviconUrl(url: string) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;
}

export default function AnalyzePage() {
  return <AnalyzeContent />;
}

function Metric({ label, value }: { label: string; value: string[] }) {
  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] items-baseline gap-7">
      <dt className="mono text-xs uppercase leading-6 text-[var(--muted)]">{label}</dt>
      <dd className="mono min-w-0 text-sm font-semibold leading-6">{value.join(" / ")}</dd>
    </div>
  );
}

function hasDetectedValue(values: string[]) {
  return values.some((value) => value && value !== "Not detected");
}
