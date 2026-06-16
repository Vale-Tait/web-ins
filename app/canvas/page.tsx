"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { ProductShell } from "@/components/ProductShell";
import { CanvasListShell } from "@/components/canvas/CanvasListShell";
import type { AppData } from "@/lib/types";

function CanvasListRoute() {
  const router = useRouter();
  const { folders, links, canvases, hydrated, dispatch } = useApp();

  if (!hydrated) return <div />;

  const data: AppData = { folders, links, canvases };

  return <CanvasListShell data={data} onDataChange={(next) => dispatch({ type: "replace-data", data: next })} onOpenCanvas={(canvasId) => router.push(`/canvas/${canvasId}`)} />;
}

export default function CanvasListPage() {
  return (
    <ProductShell>
      <CanvasListRoute />
    </ProductShell>
  );
}
