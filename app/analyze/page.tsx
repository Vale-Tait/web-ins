"use client";

import { Info } from "@phosphor-icons/react";
import { useState } from "react";
import Link from "next/link";
import { ProductShell } from "@/components/ProductShell";
import { PreviewArt } from "@/components/PreviewArt";
import { useApp } from "@/components/AppProvider";
import { createAnalysisFixture } from "@/lib/analysis";
import { getDomain, normalizeUrl } from "@/lib/url";
import type { AnalysisResult } from "@/lib/types";

type Result = {
  url: string;
  domain: string;
  analysis: AnalysisResult;
};

function AnalyzeContent() {
  const { folders, dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [folderId, setFolderId] = useState("unsorted");
  const canAnalyze = url.trim().length > 0;

  function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(url);
    setResult({
      url: normalized,
      domain: getDomain(normalized),
      analysis: createAnalysisFixture(normalized)
    });
  }

  function saveResult() {
    if (!result) return;
    dispatch({
      type: "add-link",
      url: result.url,
      folderIds: [folderId],
      tags: ["Analyzed"],
      note: "Saved from Analyze."
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
        <div className="mx-auto max-w-[930px]">
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
              Analyze
            </button>
          </form>
          {result ? (
            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="aspect-[16/10] overflow-hidden border border-[var(--line)]">
                <PreviewArt domain={result.domain} />
              </div>
              <aside className="rounded-lg border border-[var(--line)] p-5">
                <h2 className="mono mb-5 text-xl font-semibold">{result.domain}</h2>
                <Metric label="Framework" value={result.analysis.techStack.join(" / ")} />
                <Metric label="Animation" value={result.analysis.animations.join(" / ")} />
                <Metric label="Fonts" value={result.analysis.fonts.join(" / ")} />
                <select
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  className="mt-6 h-10 w-full rounded-md border border-[var(--line)] bg-transparent px-3 mono text-sm"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
                <button onClick={saveResult} className="mt-3 h-10 w-full rounded-md bg-[var(--button)] text-sm font-semibold text-[var(--button-text)]">
                  Save to Folder
                </button>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default function AnalyzePage() {
  return (
    <ProductShell>
      <AnalyzeContent />
    </ProductShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <p className="mono mb-2 text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mono text-sm font-semibold">{value}</p>
    </div>
  );
}
