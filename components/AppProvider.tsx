"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  createCanvas,
  createCanvasNode,
  createFolder,
  createLink,
  loadData,
  loadTheme,
  saveData,
  saveTheme
} from "@/lib/demo-store";
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
  | { type: "add-link"; url: string; folderIds: string[]; tags: string[]; note: string; includeAnalysis?: boolean }
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
        links: [createLink(action.url, action.folderIds, action.tags, action.note, action.includeAnalysis ?? true), ...state.links]
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
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "hydrate", data: loadData(), theme: loadTheme() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveData({ folders: state.folders, links: state.links, canvases: state.canvases });
    saveTheme(state.theme);
  }, [state]);

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

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      dispatch,
      findFolder: (id) => state.folders.find((folder) => folder.id === id)?.name ?? "Unknown",
      findLink: (id) => state.links.find((link) => link.id === id),
      findCanvas: (id) => state.canvases.find((canvas) => canvas.id === id)
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
