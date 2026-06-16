"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { CanvasImportDock } from "@/components/canvas/CanvasImportDock";
import { CanvasNote } from "@/components/canvas/CanvasNote";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { WebsiteFrame } from "@/components/canvas/WebsiteFrame";
import {
  MAX_LIVE_IFRAMES,
  WEBSITE_FRAME_MAX_WIDTH,
  WEBSITE_FRAME_MIN_WIDTH,
  clamp,
  cloneViewport,
  createNoteNode,
  createWebsiteNode,
  findInitialFolder,
  getNextNodeZIndex,
  getNodeSize,
  getWebsiteFrameChromeHeight,
} from "@/components/canvas/canvasUtils";
import { canvasGlassStyle } from "@/components/canvas/canvasStyles";
import { canvasDeviceSizes, canvasMaxZoom, canvasMinZoom, defaultCanvasViewport, defaultWebsiteFrameScale } from "@/lib/demo-store";
import { canvasZoomStep } from "@/lib/canvas-defaults";
import { useCanvasWorkspace } from "@/components/canvas/useCanvasWorkspace";
import styles from "@/components/canvas/canvas.module.css";
import type { AppData, CanvasNodeData, CanvasViewport, DeviceView, InspirationCanvas } from "@/lib/types";

type ContextMenuState = { x: number; y: number; linkId: string } | null;

export function CanvasWorkspaceShell({
  canvasId,
  data,
  onDataChange,
  onBack,
  rootClassName = ""
}: {
  canvasId: string;
  data: AppData;
  onDataChange: (data: AppData) => void;
  onBack?: () => void;
  rootClassName?: string;
}) {
  const areaRef = useRef<HTMLElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState(() => findInitialFolder(data.folders));
  const [importOpen, setImportOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = `wim:canvas-open-import:${canvasId}`;
    const shouldOpen = window.sessionStorage.getItem(key) === "1";
    if (shouldOpen) window.sessionStorage.removeItem(key);
    return shouldOpen;
  });
  const [folderSearch, setFolderSearch] = useState("");
  const [websiteSearch, setWebsiteSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [toast, setToast] = useState("");
  const [isPanning, setIsPanning] = useState(false);
  const { canvas, commit, pushHistory, replaceCanvasWithoutHistory, undo, redo, canUndo, canRedo, saveState } = useCanvasWorkspace({
    data,
    canvasId,
    onDataChange
  });
  const [pan, setPanState] = useState(canvas?.viewport.pan ?? { x: 220, y: 120 });
  const [zoom, setZoomState] = useState(canvas?.viewport.zoom ?? defaultCanvasViewport.zoom);
  const [screenScale, setScreenScale] = useState(1);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const activeCanvasIdRef = useRef<string | null>(null);
  const deleteNode = useCallback(
    (nodeId: string) => {
      commit((draftCanvas) => {
        draftCanvas.nodes = draftCanvas.nodes.filter((node) => node.id !== nodeId);
      });
      setSelectedNodeId(null);
    },
    [commit]
  );

  useEffect(() => {
    function closeContext() {
      setContextMenu(null);
    }
    if (contextMenu) window.addEventListener("click", closeContext, { once: true });
    return () => window.removeEventListener("click", closeContext);
  }, [contextMenu]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canvas) {
      activeCanvasIdRef.current = null;
      return;
    }
    if (activeCanvasIdRef.current === canvas.id) return;
    activeCanvasIdRef.current = canvas.id;
    setPanValue({ x: canvas.viewport.pan.x, y: canvas.viewport.pan.y });
    setZoomValue(canvas.viewport.zoom);
  }, [canvas]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setSelectedNodeId(null);
        redo();
        return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setSelectedNodeId(null);
        undo();
        return;
      }
      if (!selectedNodeId || (event.key !== "Delete" && event.key !== "Backspace")) return;
      const active = document.activeElement;
      if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) return;
      event.preventDefault();
      deleteNode(selectedNodeId);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode, redo, selectedNodeId, undo]);

  useEffect(() => {
    evaluateIframeBudget();
  });

  useEffect(() => {
    function updateScreenScale() {
      setScreenScale(getCanvasScreenScale(areaRef.current));
    }
    updateScreenScale();
    window.addEventListener("resize", updateScreenScale);
    return () => window.removeEventListener("resize", updateScreenScale);
  }, [canvas?.id, rootClassName]);

  useEffect(() => {
    const canvasArea = areaRef.current;
    if (!canvasArea) return;
    const activeArea: HTMLElement = canvasArea;
    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const before = screenToCanvas(event.clientX, event.clientY);
      const point = screenPointInArea(event.clientX, event.clientY, activeArea);
      const nextZoom = clamp(zoomRef.current * (event.deltaY < 0 ? canvasZoomStep : 1 / canvasZoomStep), canvasMinZoom, canvasMaxZoom);
      const nextPan = {
        x: point.x - before.x * nextZoom,
        y: point.y - before.y * nextZoom
      };
      setZoomValue(nextZoom);
      setPanValue(nextPan);
      window.setTimeout(() => saveViewport({ persist: true }), 0);
      window.requestAnimationFrame(evaluateIframeBudget);
    }
    activeArea.addEventListener("wheel", handleWheel, { passive: false });
    return () => activeArea.removeEventListener("wheel", handleWheel);
  });

  const topNodeId = useMemo(() => {
    if (!canvas?.nodes.length) return null;
    return canvas.nodes.reduce((top, node) => ((node.zIndex ?? 1) >= (top.zIndex ?? 1) ? node : top), canvas.nodes[0]).id;
  }, [canvas?.nodes]);

  if (!canvas) {
    return (
      <div className={`${styles.canvasRoot} ${rootClassName}`}>
        <section className={styles.workspace}>
          <header className={styles.workspaceTopbar}>
            <button className={styles.secondaryButton} type="button" onClick={handleBack}>
              Back
            </button>
            <span className={styles.mono}>Canvas not found.</span>
          </header>
        </section>
      </div>
    );
  }

  function handleBack() {
    if (canvas) saveViewport({ persist: true });
    if (onBack) onBack();
    else window.location.href = "/canvas";
  }

  function screenToCanvas(clientX: number, clientY: number) {
    const point = screenPointInArea(clientX, clientY);
    const currentPan = panRef.current;
    const currentZoom = zoomRef.current;
    return {
      x: (point.x - currentPan.x) / currentZoom,
      y: (point.y - currentPan.y) / currentZoom
    };
  }

  function getCanvasScreenScale(area = areaRef.current) {
    if (!area) return 1;
    const root = area.closest(".app-scale-root");
    const appScale = root ? Number.parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) : Number.NaN;
    if (Number.isFinite(appScale) && appScale > 0) return appScale;
    const rect = area.getBoundingClientRect();
    const width = area.offsetWidth;
    if (!width || !rect.width) return 1;
    return rect.width / width;
  }

  function getCanvasAreaSize(area = areaRef.current) {
    if (!area) return cloneViewport(canvas!.viewport).size;
    const rect = area.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  function screenPointInArea(clientX: number, clientY: number, area = areaRef.current) {
    const rect = area?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function screenPointInRoot(clientX: number, clientY: number) {
    const root = areaRef.current?.closest(".app-scale-root") as HTMLElement | null;
    if (!root) return { x: clientX, y: clientY };
    const rect = root.getBoundingClientRect();
    const appScale = Number.parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--app-scale"));
    const scale = Number.isFinite(appScale) && appScale > 0 ? appScale : root.offsetWidth && rect.width ? rect.width / root.offsetWidth : 1;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  }

  function setPanValue(nextPan: { x: number; y: number }) {
    panRef.current = nextPan;
    setPanState(nextPan);
  }

  function setZoomValue(nextZoom: number) {
    zoomRef.current = nextZoom;
    setZoomState(nextZoom);
  }

  function blurActiveField() {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur();
  }

  function isCanvasPanTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return !target.closest(
      `.${styles.node}, .${styles.importDock}, .${styles.bottomToolbar}, .${styles.contextMenu}, button, input, textarea, select`
    );
  }

  function nextViewport(nextPan = panRef.current, nextZoom = zoomRef.current): CanvasViewport {
    const size = areaRef.current ? getCanvasAreaSize(areaRef.current) : cloneViewport(canvas!.viewport).size;
    return {
      pan: { x: nextPan.x, y: nextPan.y },
      zoom: nextZoom,
      size
    };
  }

  function saveViewport({ persist }: { persist: boolean }) {
    const viewport = nextViewport();
    if (!persist || !canvas) return;
    replaceCanvasWithoutHistory((draftCanvas) => {
      draftCanvas.viewport = viewport;
    });
  }

  function selectNode(nodeId: string, bringToFront = true) {
    setSelectedNodeId(nodeId);
    if (!bringToFront || topNodeId === nodeId) return;
    commit(
      (draftCanvas) => {
        const node = draftCanvas.nodes.find((item) => item.id === nodeId);
        if (node) {
          node.zIndex = getNextNodeZIndex(draftCanvas);
          node.updatedAt = new Date().toISOString();
        }
      },
      { history: false }
    );
  }

  function addWebsiteNode(linkId: string, x: number, y: number) {
    const link = data.links.find((item) => item.id === linkId);
    if (!link || !canvas) return;
    const node = createWebsiteNode(canvas, link, selectedFolderId, x, y);
    commit((draftCanvas) => {
      draftCanvas.nodes.push(node);
    });
    setSelectedNodeId(node.id);
  }

  function addWebsiteNodeAtCenter(linkId: string) {
    const rect = areaRef.current?.getBoundingClientRect();
    const point = rect ? screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2) : { x: 0, y: 0 };
    addWebsiteNode(linkId, point.x, point.y);
  }

  function addNoteAtCenter() {
    if (!canvas) return;
    const rect = areaRef.current?.getBoundingClientRect();
    const point = rect ? screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2) : { x: 0, y: 0 };
    const node = createNoteNode(canvas, point.x - 130, point.y - 75);
    commit((draftCanvas) => {
      draftCanvas.nodes.push(node);
    });
    setSelectedNodeId(node.id);
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>(`[data-note-id="${node.id}"]`)?.focus(), 0);
  }

  function updateNode(nodeId: string, patch: Partial<CanvasNodeData>, history = false) {
    commit(
      (draftCanvas) => {
        const node = draftCanvas.nodes.find((item) => item.id === nodeId);
        if (node) Object.assign(node, patch, { updatedAt: new Date().toISOString() });
      },
      { history }
    );
  }

  function setNodeDevice(nodeId: string, deviceView: DeviceView) {
    commit(
      (draftCanvas) => {
        const node = draftCanvas.nodes.find((item) => item.id === nodeId);
        if (!node || node.type !== "website" || node.deviceView === deviceView) return;
        const base = canvasDeviceSizes[deviceView];
        const scale = node.scale ?? defaultWebsiteFrameScale;
        node.deviceView = deviceView;
        node.width = Math.round(base.width * scale);
        node.height = Math.round(base.height * scale);
        node.iframeKey = (node.iframeKey ?? 0) + 1;
        node.updatedAt = new Date().toISOString();
      },
      { history: true }
    );
  }

  function refreshNode(nodeId: string) {
    commit(
      (draftCanvas) => {
        const node = draftCanvas.nodes.find((item) => item.id === nodeId);
        if (!node || node.type !== "website" || node.status !== "live") return;
        node.iframeKey = (node.iframeKey ?? 0) + 1;
        node.updatedAt = new Date().toISOString();
      },
      { history: false }
    );
  }

  function setPreviewMode(nodeId: string, mode: "canvas" | "preview") {
    if (!canvas) return;
    const node = canvas.nodes.find((item) => item.id === nodeId);
    if (!node || node.type !== "website") return;
    if (mode === "preview" && node.status !== "live") {
      const live = canvas.nodes.filter((item) => item.type === "website" && item.status === "live");
      if (live.length >= MAX_LIVE_IFRAMES && !live.some((item) => !isNodeVisible(item))) {
        showToast("Live preview limit reached");
        return;
      }
    }
    commit(
      (draftCanvas) => {
        const node = draftCanvas.nodes.find((item) => item.id === nodeId);
        if (!node || node.type !== "website") return;
        if (mode === "preview" && node.status !== "live") {
          const live = draftCanvas.nodes.filter((item) => item.type === "website" && item.status === "live");
          if (live.length >= MAX_LIVE_IFRAMES) {
            const releasable = live.find((item) => !isNodeVisible(item));
            if (releasable) {
              releasable.status = "screenshot";
              releasable.interactionMode = "canvas";
              releasable.loadFailed = false;
            }
          }
          node.status = "live";
          node.loadFailed = false;
        }
        node.interactionMode = mode;
      },
      { history: false }
    );
  }

  function showToast(message: string) {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToast("");
    }, 2400);
  }

  function isNodeVisible(node: CanvasNodeData) {
    if (!areaRef.current) return false;
    const areaSize = getCanvasAreaSize();
    const size = getNodeSize(node);
    const currentPan = panRef.current;
    const currentZoom = zoomRef.current;
    const left = currentPan.x + node.x * currentZoom;
    const top = currentPan.y + node.y * currentZoom;
    const right = left + size.width * currentZoom;
    const chromeHeight = node.type === "website" ? getWebsiteFrameChromeHeight(currentZoom) : 0;
    const bottom = top + (size.height + chromeHeight) * currentZoom;
    return right > 0 && left < areaSize.width && bottom > 0 && top < areaSize.height;
  }

  function evaluateIframeBudget() {
    if (!canvas) return;
    const websiteNodes = canvas.nodes.filter((node) => node.type === "website");
    let liveCount = 0;
    let changed = false;
    replaceCanvasWithoutHistory((draftCanvas) => {
      for (const node of draftCanvas.nodes.filter((item) => item.type === "website")) {
        const visible = isNodeVisible(node);
        if (node.status !== "live") continue;
        if (!visible || liveCount >= MAX_LIVE_IFRAMES) {
          node.status = "screenshot";
          node.interactionMode = "canvas";
          node.loadFailed = false;
          changed = true;
          continue;
        }
        liveCount += 1;
      }

      for (const node of draftCanvas.nodes.filter((item) => item.type === "website")) {
        if (liveCount >= MAX_LIVE_IFRAMES) break;
        if (isNodeVisible(node) && node.status === "screenshot" && !node.loadFailed) {
          node.status = "live";
          liveCount += 1;
          changed = true;
        }
      }
      return changed || false;
    });
  }

  function startPan(event: ReactMouseEvent) {
    setIsPanning(true);
    const currentPan = panRef.current;
    const start = { x: event.clientX, y: event.clientY, panX: currentPan.x, panY: currentPan.y };
    function onMove(moveEvent: MouseEvent) {
      const nextPan = { x: start.panX + (moveEvent.clientX - start.x), y: start.panY + (moveEvent.clientY - start.y) };
      setPanValue(nextPan);
    }
    function onUp() {
      setIsPanning(false);
      saveViewport({ persist: true });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startNodeDrag(event: ReactMouseEvent, node: CanvasNodeData) {
    blurActiveField();
    pushHistory();
    selectNode(node.id);
    const start = { x: event.clientX, y: event.clientY, nodeX: node.x, nodeY: node.y };
    function onMove(moveEvent: MouseEvent) {
      const currentZoom = zoomRef.current;
      updateNode(node.id, { x: start.nodeX + (moveEvent.clientX - start.x) / currentZoom, y: start.nodeY + (moveEvent.clientY - start.y) / currentZoom }, false);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startResize(event: ReactMouseEvent | ReactPointerEvent, node: CanvasNodeData) {
    blurActiveField();
    pushHistory();
    selectNode(node.id);
    const start = { x: event.clientX, y: event.clientY, width: node.width, height: node.height, scale: node.scale ?? defaultWebsiteFrameScale };
    let resized = false;
    function onMove(moveEvent: MouseEvent | PointerEvent) {
      const currentZoom = zoomRef.current;
      const dx = (moveEvent.clientX - start.x) / currentZoom;
      if (node.type === "website") {
        const base = canvasDeviceSizes[node.deviceView] ?? canvasDeviceSizes.desktop;
        const nextWidth = clamp(start.width + dx, WEBSITE_FRAME_MIN_WIDTH, WEBSITE_FRAME_MAX_WIDTH);
        const scale = nextWidth / base.width;
        updateNode(node.id, { scale, width: Math.round(base.width * scale), height: Math.round(base.height * scale) }, false);
        resized = true;
        return;
      }
      updateNode(node.id, { width: Math.round(clamp(start.width + dx, 190, 520)), height: Math.round(clamp(start.height + (moveEvent.clientY - start.y) / currentZoom, 120, 420)) }, false);
      resized = true;
    }
    function onUp() {
      if (resized && node.type === "website") refreshNode(node.id);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const renderScreenScale = Number.isFinite(screenScale) && screenScale > 0 ? screenScale : 1;
  const renderPan = { x: pan.x / renderScreenScale, y: pan.y / renderScreenScale };
  const renderZoom = zoom / renderScreenScale;

  return (
    <div className={`${styles.canvasRoot} ${rootClassName}`}>
      <section className={styles.workspace}>
        <header className={styles.workspaceTopbar} style={canvasGlassStyle}>
          <div className={styles.workspaceTitle}>
            <button className={styles.secondaryButton} type="button" onClick={handleBack}>
              Back
            </button>
            <h2>{canvas.name}</h2>
          </div>
          <div className={`${styles.saveState} ${saveState === "Saving..." ? styles.saveStateSaving : ""}`}>{saveState}</div>
        </header>
        <main
          ref={areaRef}
          className={`${styles.canvasArea} ${isPanning ? styles.canvasAreaPanning : ""}`}
          style={
            {
              "--grid-size": `${48 * renderZoom}px`,
              "--grid-x": `${renderPan.x}px`,
              "--grid-y": `${renderPan.y}px`
            } as CSSProperties
          }
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            const linkId = event.dataTransfer.getData("text/plain");
            if (!linkId) return;
            event.preventDefault();
            const point = screenToCanvas(event.clientX, event.clientY);
            addWebsiteNode(linkId, point.x, point.y);
          }}
          onMouseDown={(event) => {
            const canPan = isCanvasPanTarget(event.target);
            if (event.button === 0 && canPan) setSelectedNodeId(null);
            if (event.button === 1 && canPan) {
              event.preventDefault();
              startPan(event);
            }
          }}
          onAuxClick={(event) => {
            if (event.button === 1) event.preventDefault();
          }}
        >
          <div ref={worldRef} className={styles.canvasWorld} style={{ transform: `translate(${renderPan.x}px, ${renderPan.y}px) scale(${renderZoom})` }}>
            {[...canvas.nodes]
              .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1))
              .map((node) => {
                if (node.type === "note") {
                  return (
                    <CanvasNote
                      key={node.id}
                      node={node}
                      selected={selectedNodeId === node.id}
                      isTop={topNodeId === node.id}
                      onSelect={() => {
                        blurActiveField();
                        selectNode(node.id);
                      }}
                      onEditSelect={() => selectNode(node.id)}
                      onStartDrag={(event) => startNodeDrag(event, node)}
                      onStartResize={(event) => startResize(event, node)}
                      onChange={(content) => updateNode(node.id, { content }, false)}
                      onDelete={() => deleteNode(node.id)}
                    />
                  );
                }
                const link = data.links.find((item) => item.id === node.linkId);
                return (
                  <WebsiteFrame
                    key={node.id}
                    node={node}
                    link={link}
                    sourceFolder={data.folders.find((folder) => folder.id === node.sourceFolderId)}
                    selected={selectedNodeId === node.id}
                    isTop={topNodeId === node.id}
                    onSelect={() => {
                      blurActiveField();
                      selectNode(node.id);
                    }}
                    onStartDrag={(event) => startNodeDrag(event, node)}
                    onStartResize={(event) => startResize(event, node)}
                    onDelete={() => deleteNode(node.id)}
                    onRefresh={() => {
                      blurActiveField();
                      selectNode(node.id);
                      refreshNode(node.id);
                    }}
                    onDevice={(device) => {
                      blurActiveField();
                      selectNode(node.id);
                      setNodeDevice(node.id, device);
                    }}
                    onFrameError={() => {
                      updateNode(node.id, { status: "screenshot", interactionMode: "canvas", loadFailed: true }, false);
                    }}
                    onPreviewMode={(mode) => setPreviewMode(node.id, mode)}
                  />
                );
              })}
          </div>
          {importOpen ? (
            <CanvasImportDock
              folders={data.folders}
              links={data.links}
              selectedFolderId={selectedFolderId}
              folderSearch={folderSearch}
              websiteSearch={websiteSearch}
              onFolderSearch={setFolderSearch}
              onWebsiteSearch={setWebsiteSearch}
              onSelectFolder={(folderId) => {
                setSelectedFolderId(folderId);
                setWebsiteSearch("");
              }}
              onClose={() => setImportOpen(false)}
              onOpenContextMenu={(x, y, linkId) => setContextMenu({ ...screenPointInRoot(x, y), linkId })}
            />
          ) : null}
          <CanvasToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onImport={() => setImportOpen(true)}
            onAddNote={addNoteAtCenter}
            onUndo={() => {
              setSelectedNodeId(null);
              undo();
            }}
            onRedo={() => {
              setSelectedNodeId(null);
              redo();
            }}
          />
          {contextMenu ? (
            <div className={styles.contextMenu} style={{ ...canvasGlassStyle, left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  addWebsiteNodeAtCenter(contextMenu.linkId);
                  setContextMenu(null);
                }}
              >
                Import to Canvas
              </button>
            </div>
          ) : null}
          {toast ? <div className={styles.toast}>{toast}</div> : null}
        </main>
      </section>
    </div>
  );
}
