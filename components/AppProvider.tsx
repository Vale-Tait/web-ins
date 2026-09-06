"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import {
  createCanvas,
  createCanvasNode,
  createFolder,
  createLink,
  loadTheme,
  saveTheme
} from "@/lib/demo-store";
import { upsertLinkInList } from "@/lib/link-dedupe";
import type { AppData, CanvasNodeData, DeviceView, InspirationCanvas, LinkItem, ThemeName } from "@/lib/types";

type State = AppData & {
  theme: ThemeName;
  hydrated: boolean;
};

type Action =
  | { type: "hydrate"; data: AppData; theme: ThemeName }
  | { type: "replace-data"; data: AppData }
  | { type: "set-theme"; theme: ThemeName }
  | { type: "add-folder"; name: string }
  | { type: "add-folder-to-link"; name: string; linkId: string }
  | { type: "update-folder"; id: string; name: string; description?: string | null }
  | { type: "add-link"; url: string; folderIds: string[]; tags: string[]; note: string; includeAnalysis?: boolean; analysis?: Partial<LinkItem["analysis"]> }
  | { type: "delete-link"; id: string; folderId?: string }
  | { type: "update-link"; id: string; patch: Partial<LinkItem> }
  | { type: "add-canvas"; name: string }
  | { type: "rename-canvas"; id: string; name: string }
  | { type: "delete-canvas"; id: string }
  | { type: "update-canvas"; id: string; patch: Partial<InspirationCanvas> }
  | { type: "add-canvas-node"; canvasId: string; nodeType: CanvasNodeData["type"]; content: string; linkId?: string; patch?: Partial<CanvasNodeData> }
  | { type: "update-canvas-node"; canvasId: string; nodeId: string; patch: Partial<CanvasNodeData> }
  | { type: "delete-canvas-node"; canvasId: string; nodeId: string }
  | { type: "set-node-device"; canvasId: string; nodeId: string; deviceView: DeviceView };

const initialState: State = {
  folders: [],
  links: [],
  canvases: [],
  theme: "light",
  hydrated: false
};

type ApiEnvelope<T> = { data: T } | { error: string };

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Request failed");
  return payload.data;
}

async function loadRemoteData(): Promise<AppData> {
  return apiRequest<AppData>("/api/app-data");
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...action.data, theme: action.theme, hydrated: true };
    case "replace-data":
      return { ...state, ...action.data };
    case "set-theme":
      return { ...state, theme: action.theme };
    case "add-folder":
      return { ...state, folders: [...state.folders, createFolder(action.name)] };
    case "update-folder":
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder.id === action.id
            ? { ...folder, name: action.name, description: action.description ?? null, updatedAt: new Date().toISOString() }
            : folder
        )
      };
    case "add-folder-to-link": {
      const folder = createFolder(action.name);
      return {
        ...state,
        folders: [...state.folders, folder],
        links: state.links.map((link) =>
          link.id === action.linkId ? { ...link, folderIds: [...link.folderIds, folder.id], updatedAt: new Date().toISOString() } : link
        )
      };
    }
    case "add-link":
      return {
        ...state,
        links: [createLink(action.url, action.folderIds, action.tags, action.note, action.includeAnalysis ?? true, action.analysis), ...state.links]
      };
    case "delete-link":
      if (!action.folderId || action.folderId === "all") {
        return { ...state, links: state.links.filter((link) => link.id !== action.id) };
      }
      return {
        ...state,
        links: state.links.map((link) =>
          link.id === action.id
            ? { ...link, folderIds: link.folderIds.filter((folderId) => folderId !== action.folderId), updatedAt: new Date().toISOString() }
            : link
        )
      };
    case "update-link":
      return {
        ...state,
        links: state.links.map((link) => (link.id === action.id ? { ...link, ...action.patch, updatedAt: new Date().toISOString() } : link))
      };
    case "add-canvas":
      return { ...state, canvases: [createCanvas(action.name), ...state.canvases] };
    case "rename-canvas":
      return {
        ...state,
        canvases: state.canvases.map((canvas) =>
          canvas.id === action.id ? { ...canvas, name: action.name, updatedAt: new Date().toISOString() } : canvas
        )
      };
    case "delete-canvas":
      return { ...state, canvases: state.canvases.filter((canvas) => canvas.id !== action.id) };
    case "update-canvas":
      return {
        ...state,
        canvases: state.canvases.map((canvas) =>
          canvas.id === action.id ? { ...canvas, ...action.patch, updatedAt: new Date().toISOString() } : canvas
        )
      };
    case "add-canvas-node":
      return {
        ...state,
        canvases: state.canvases.map((canvas) =>
          canvas.id === action.canvasId
            ? {
                ...canvas,
                nodes: [...canvas.nodes, createCanvasNode(action.canvasId, action.nodeType, action.content, action.linkId, action.patch)]
              }
            : canvas
        )
      };
    case "update-canvas-node":
      return {
        ...state,
        canvases: state.canvases.map((canvas) =>
          canvas.id === action.canvasId
            ? {
                ...canvas,
                nodes: canvas.nodes.map((node) =>
                  node.id === action.nodeId ? { ...node, ...action.patch, updatedAt: new Date().toISOString() } : node
                )
              }
            : canvas
        )
      };
    case "delete-canvas-node":
      return {
        ...state,
        canvases: state.canvases.map((canvas) =>
          canvas.id === action.canvasId
            ? { ...canvas, nodes: canvas.nodes.filter((node) => node.id !== action.nodeId), updatedAt: new Date().toISOString() }
            : canvas
        )
      };
    case "set-node-device":
      return reducer(state, {
        type: "update-canvas-node",
        canvasId: action.canvasId,
        nodeId: action.nodeId,
        patch: { deviceView: action.deviceView }
      });
    default:
      return state;
  }
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type AppContextValue = State & {
  dispatch: React.Dispatch<Action>;
  findFolder: (id: string) => string;
  findLink: (id: string) => LinkItem | undefined;
  findCanvas: (id: string) => InspirationCanvas | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;
    loadRemoteData()
      .then((data) => {
        if (active) baseDispatch({ type: "hydrate", data, theme: loadTheme() });
      })
      .catch((error) => {
        console.error(error);
        if (active) baseDispatch({ type: "hydrate", data: { folders: [], links: [], canvases: [] }, theme: loadTheme() });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveTheme(state.theme);
  }, [state.hydrated, state.theme]);

  useEffect(() => {
    if (!state.hydrated) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      document.documentElement.dataset.theme = state.theme === "system" ? getSystemTheme() : state.theme;
    }

    applyTheme();
    if (state.theme !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [state.hydrated, state.theme]);

  const dispatch = useCallback((action: Action) => {
    const currentData = () => {
      const current = stateRef.current;
      return { folders: current.folders, links: current.links, canvases: current.canvases };
    };

    const replaceData = (data: AppData) => baseDispatch({ type: "replace-data", data });

    switch (action.type) {
      case "set-theme":
      case "replace-data":
      case "update-canvas":
      case "add-canvas-node":
      case "update-canvas-node":
      case "delete-canvas-node":
      case "set-node-device":
        baseDispatch(action);
        return;
      case "hydrate":
        baseDispatch(action);
        return;
      case "add-folder":
        apiRequest<AppData["folders"][number]>("/api/folders", { method: "POST", body: JSON.stringify({ name: action.name }) })
          .then((folder) => {
            const data = currentData();
            replaceData({ ...data, folders: [...data.folders, folder] });
          })
          .catch(console.error);
        return;
      case "update-folder":
        apiRequest<AppData["folders"][number]>(`/api/folders/${action.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: action.name, description: action.description ?? null })
        })
          .then((folder) => {
            const data = currentData();
            replaceData({ ...data, folders: data.folders.map((item) => (item.id === folder.id ? folder : item)) });
          })
          .catch(console.error);
        return;
      case "add-folder-to-link":
        apiRequest<AppData["folders"][number]>("/api/folders", { method: "POST", body: JSON.stringify({ name: action.name }) })
          .then((folder) => {
            const data = currentData();
            const link = data.links.find((item) => item.id === action.linkId);
            if (!link) return null;
            return apiRequest<LinkItem>(`/api/links/${action.linkId}`, {
              method: "PATCH",
              body: JSON.stringify({ folderIds: [...link.folderIds, folder.id] })
            }).then((updatedLink) => ({ folder, updatedLink }));
          })
          .then((result) => {
            if (!result) return;
            const data = currentData();
            replaceData({
              ...data,
              folders: [...data.folders, result.folder],
              links: data.links.map((item) => (item.id === result.updatedLink.id ? result.updatedLink : item))
            });
          })
          .catch(console.error);
        return;
      case "add-link":
        apiRequest<LinkItem>("/api/links", {
          method: "POST",
          body: JSON.stringify({
            url: action.url,
            folderIds: action.folderIds,
            tags: action.tags,
            note: action.note,
            includeAnalysis: action.includeAnalysis ?? true,
            analysis: action.analysis
          })
        })
          .then((link) => {
            const data = currentData();
            replaceData({ ...data, links: upsertLinkInList(data.links, link) });
          })
          .catch(console.error);
        return;
      case "update-link":
        {
          const previousLink = stateRef.current.links.find((item) => item.id === action.id);
          baseDispatch(action);
          apiRequest<LinkItem>(`/api/links/${action.id}`, { method: "PATCH", body: JSON.stringify(action.patch) })
            .then((link) => {
              const data = currentData();
              replaceData({ ...data, links: data.links.map((item) => (item.id === link.id ? link : item)) });
            })
            .catch((error) => {
              console.error(error);
              if (!previousLink) return;
              const data = currentData();
              replaceData({ ...data, links: data.links.map((item) => (item.id === previousLink.id ? previousLink : item)) });
            });
        }
        return;
      case "delete-link":
        apiRequest<LinkItem | { id: string; deleted: true }>(
          `/api/links/${action.id}${action.folderId ? `?folderId=${encodeURIComponent(action.folderId)}` : ""}`,
          { method: "DELETE" }
        )
          .then((result) => {
            const data = currentData();
            if ("deleted" in result) {
              replaceData({ ...data, links: data.links.filter((item) => item.id !== result.id) });
              return;
            }
            replaceData({ ...data, links: data.links.map((item) => (item.id === result.id ? result : item)) });
          })
          .catch(console.error);
        return;
      case "add-canvas":
      case "rename-canvas":
      case "delete-canvas":
        baseDispatch(action);
        return;
      default:
        baseDispatch(action);
    }
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      dispatch,
      findFolder: (id) => state.folders.find((folder) => folder.id === id)?.name ?? "Unknown",
      findLink: (id) => state.links.find((link) => link.id === id),
      findCanvas: (id) => state.canvases.find((canvas) => canvas.id === id)
    }),
    [dispatch, state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
