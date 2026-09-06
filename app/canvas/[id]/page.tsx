"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { CanvasWorkspaceShell } from "@/components/canvas/CanvasWorkspaceShell";
import styles from "@/components/canvas/canvas.module.css";
import type { AppData } from "@/lib/types";

function CanvasWorkspaceRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { folders, links, canvases, dispatch } = useApp();

  const data: AppData = { folders, links, canvases };

  async function persistCanvas(canvas: AppData["canvases"][number]) {
    const response = await fetch(`/api/canvases/${canvas.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewport: canvas.viewport, nodes: canvas.nodes, thumbnailUrl: canvas.thumbnailUrl })
    });
    if (!response.ok) throw new Error("Unable to save canvas");
  }

  return (
    <CanvasWorkspaceShell
      canvasId={params.id}
      data={data}
      rootClassName={`app-scale-root ${styles.canvasWorkspaceScaleRoot}`}
      onBack={() => router.push("/canvas")}
      onDataChange={(next) => dispatch({ type: "replace-data", data: next })}
      onPersistCanvas={persistCanvas}
    />
  );
}

export default function CanvasEditorPage() {
  return <CanvasWorkspaceRoute />;
}
