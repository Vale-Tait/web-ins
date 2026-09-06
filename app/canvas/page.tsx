"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { CanvasListShell } from "@/components/canvas/CanvasListShell";
import type { AppData } from "@/lib/types";

function CanvasListRoute() {
  const router = useRouter();
  const { folders, links, canvases, dispatch } = useApp();

  const data: AppData = { folders, links, canvases };

  async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers }
    });
    const payload = (await response.json()) as { data?: T; error?: string };
    if (!response.ok || payload.error || !("data" in payload)) throw new Error(payload.error ?? "Request failed");
    return payload.data as T;
  }

  return (
    <CanvasListShell
      data={data}
      onDataChange={(next) => dispatch({ type: "replace-data", data: next })}
      onOpenCanvas={(canvasId) => router.push(`/canvas/${canvasId}`)}
      onCreateCanvas={(name) => requestData("/api/canvases", { method: "POST", body: JSON.stringify({ name }) })}
      onRenameCanvas={(canvasId, name) => requestData(`/api/canvases/${canvasId}`, { method: "PATCH", body: JSON.stringify({ name }) })}
      onDeleteCanvas={async (canvasId) => {
        await requestData(`/api/canvases/${canvasId}`, { method: "DELETE" });
      }}
    />
  );
}

export default function CanvasListPage() {
  return <CanvasListRoute />;
}
