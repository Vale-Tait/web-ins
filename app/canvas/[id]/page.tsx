"use client";

import { useParams, useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/components/AppProvider";
import { AuthGate } from "@/components/AuthGate";
import { CanvasWorkspaceShell } from "@/components/canvas/CanvasWorkspaceShell";
import styles from "@/components/canvas/canvas.module.css";
import type { AppData } from "@/lib/types";

function CanvasWorkspaceRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { folders, links, canvases, hydrated, dispatch } = useApp();

  if (!hydrated) return <div />;

  const data: AppData = { folders, links, canvases };

  return (
    <CanvasWorkspaceShell
      canvasId={params.id}
      data={data}
      rootClassName={`app-scale-root ${styles.canvasWorkspaceScaleRoot}`}
      onBack={() => router.push("/canvas")}
      onDataChange={(next) => dispatch({ type: "replace-data", data: next })}
    />
  );
}

export default function CanvasEditorPage() {
  return (
    <AuthGate>
      <AppProvider>
        <CanvasWorkspaceRoute />
      </AppProvider>
    </AuthGate>
  );
}
