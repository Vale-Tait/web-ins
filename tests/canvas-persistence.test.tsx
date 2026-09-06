import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasWorkspaceShell } from "@/components/canvas/CanvasWorkspaceShell";
import type { AppData, InspirationCanvas } from "@/lib/types";

const now = "2026-06-18T08:00:00.000Z";

function makeData(): AppData {
  return {
    folders: [
      { id: "all", name: "All Items", description: null, isDefault: true, createdAt: now, updatedAt: now },
      { id: "unsorted", name: "Unsorted", description: null, isDefault: true, createdAt: now, updatedAt: now }
    ],
    links: [],
    canvases: [
      {
        id: "canvas-1",
        name: "Canvas",
        thumbnailUrl: null,
        viewport: { pan: { x: 220, y: 120 }, zoom: 0.5, size: { width: 1200, height: 800 } },
        nodes: [],
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

describe("canvas backend persistence", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces full canvas persistence without delaying local interaction", async () => {
    vi.useFakeTimers();
    let data = makeData();
    const persisted: InspirationCanvas[] = [];

    render(
      <CanvasWorkspaceShell
        canvasId="canvas-1"
        data={data}
        onDataChange={(next) => {
          data = next;
        }}
        onPersistCanvas={async (canvas) => {
          persisted.push(canvas);
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Note" }));

    expect(data.canvases[0].nodes).toHaveLength(1);
    expect(persisted).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(799);
    });
    expect(persisted).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(persisted).toHaveLength(1);
    expect(persisted[0].nodes).toHaveLength(1);
  });
});
