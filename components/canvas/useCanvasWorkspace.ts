"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cloneData, replaceCanvas } from "@/components/canvas/canvasUtils";
import type { AppData, InspirationCanvas } from "@/lib/types";

export function useCanvasWorkspace({
  data,
  canvasId,
  onDataChange
}: {
  data: AppData;
  canvasId: string;
  onDataChange: (data: AppData) => void;
}) {
  const [history, setHistory] = useState<AppData[]>([]);
  const [future, setFuture] = useState<AppData[]>([]);
  const [saveState, setSaveState] = useState("Saved");
  const saveTimer = useRef<number | null>(null);
  const dataRef = useRef(data);
  const historyRef = useRef<AppData[]>([]);
  const futureRef = useRef<AppData[]>([]);
  const canvas = data.canvases.find((item) => item.id === canvasId) ?? null;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const persistSoon = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveState("Saving...");
    saveTimer.current = window.setTimeout(() => setSaveState("Saved"), 800);
  }, []);

  const commit = useCallback(
    (updater: (canvas: InspirationCanvas, draft: AppData) => void, options: { history?: boolean } = {}) => {
      const currentData = dataRef.current;
      const activeCanvas = currentData.canvases.find((item) => item.id === canvasId);
      if (!activeCanvas) return;
      if (options.history !== false) {
        const nextHistory = [...historyRef.current.slice(-79), cloneData(currentData)];
        historyRef.current = nextHistory;
        futureRef.current = [];
        setHistory(nextHistory);
        setFuture([]);
      }
      const next = replaceCanvas(currentData, activeCanvas.id, updater);
      dataRef.current = next;
      onDataChange(next);
      persistSoon();
    },
    [canvasId, onDataChange, persistSoon]
  );

  const pushHistory = useCallback(() => {
    const nextHistory = [...historyRef.current.slice(-79), cloneData(dataRef.current)];
    historyRef.current = nextHistory;
    futureRef.current = [];
    setHistory(nextHistory);
    setFuture([]);
  }, []);

  const replaceWithoutHistory = useCallback(
    (next: AppData) => {
      dataRef.current = next;
      onDataChange(next);
      persistSoon();
    },
    [onDataChange, persistSoon]
  );

  const replaceCanvasWithoutHistory = useCallback(
    (updater: (canvas: InspirationCanvas, draft: AppData) => boolean | void) => {
      const currentData = dataRef.current;
      const activeCanvas = currentData.canvases.find((item) => item.id === canvasId);
      if (!activeCanvas) return;
      let shouldUpdate = true;
      const next = replaceCanvas(currentData, activeCanvas.id, (draftCanvas, draft) => {
        if (updater(draftCanvas, draft) === false) shouldUpdate = false;
      });
      if (!shouldUpdate) return;
      dataRef.current = next;
      onDataChange(next);
      persistSoon();
    },
    [canvasId, onDataChange, persistSoon]
  );

  const undo = useCallback(() => {
    const previous = historyRef.current.at(-1);
    if (!previous) return;
    const nextHistory = historyRef.current.slice(0, -1);
    const nextFuture = [cloneData(dataRef.current), ...futureRef.current];
    historyRef.current = nextHistory;
    futureRef.current = nextFuture;
    dataRef.current = previous;
    setHistory(nextHistory);
    setFuture(nextFuture);
    onDataChange(previous);
    persistSoon();
  }, [onDataChange, persistSoon]);

  const redo = useCallback(() => {
    const next = futureRef.current[0];
    if (!next) return;
    const nextHistory = [...historyRef.current.slice(-79), cloneData(dataRef.current)];
    const nextFuture = futureRef.current.slice(1);
    historyRef.current = nextHistory;
    futureRef.current = nextFuture;
    dataRef.current = next;
    setHistory(nextHistory);
    setFuture(nextFuture);
    onDataChange(next);
    persistSoon();
  }, [onDataChange, persistSoon]);

  return {
    canvas,
    commit,
    pushHistory,
    replaceWithoutHistory,
    replaceCanvasWithoutHistory,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    saveState
  };
}
