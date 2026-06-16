const STORAGE_KEY = "webinsprition:canvas-mvp:v1";
const MAX_LIVE_IFRAMES = 5;
const WEBSITE_FRAME_MIN_WIDTH = 190;
const WEBSITE_FRAME_MAX_WIDTH = 1400;
const DEFAULT_VIEWPORT = { pan: { x: 220, y: 120 }, zoom: 1, size: { width: 1200, height: 800 } };
const THUMBNAIL_VIEW = { width: 482, height: 270 };

const devices = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 }
};

const mockFolders = [
  { id: "unsorted", name: "Unsorted" },
  { id: "agency", name: "Agency" },
  { id: "portfolio", name: "Portfolio" },
  { id: "motion", name: "Motion" },
  { id: "saas", name: "SaaS" },
  { id: "ecommerce", name: "Ecommerce" },
  { id: "editorial", name: "Editorial" },
  { id: "branding", name: "Branding" },
  { id: "webgl", name: "WebGL" },
  { id: "typography", name: "Typography" },
  { id: "mobile", name: "Mobile" },
  { id: "minimal", name: "Minimal" },
  { id: "archive", name: "Archive" },
  { id: "experiments", name: "Experiments" }
];

const mockWebsites = [
  { id: "site-1", folderId: "agency", title: "MakeMePulse", domain: "makemepulse.com", url: "https://makemepulse.com", color: "#111827", preview: "makemepulse" },
  { id: "site-16", folderId: "agency", title: "Pinterest", domain: "pinterest.com", url: "https://www.pinterest.com", color: "#ffffff", preview: "pinterest" },
  { id: "site-2", folderId: "agency", title: "Studio Freight", domain: "studiofreight.com", url: "https://studiofreight.com", color: "#4b5563", preview: "studio" },
  { id: "site-8", folderId: "agency", title: "Northstar Studio", domain: "northstar.studio", url: "https://northstar.studio", color: "#23262b", preview: "dark" },
  { id: "site-9", folderId: "agency", title: "Matter Works", domain: "matterworks.co", url: "https://matterworks.co", color: "#3d454f", preview: "dark-alt" },
  { id: "site-10", folderId: "agency", title: "Index Supply", domain: "indexsupply.io", url: "https://indexsupply.io", color: "#5f6772", preview: "editorial" },
  { id: "site-11", folderId: "agency", title: "Future Format", domain: "futureformat.com", url: "https://futureformat.com", color: "#1f2937", preview: "makemepulse" },
  { id: "site-12", folderId: "agency", title: "Linear Type", domain: "lineartype.net", url: "https://lineartype.net", color: "#737b86", preview: "studio" },
  { id: "site-13", folderId: "agency", title: "Signal Craft", domain: "signalcraft.design", url: "https://signalcraft.design", color: "#2f3640", preview: "dark" },
  { id: "site-3", folderId: "portfolio", title: "Isa de Burgh", domain: "isadeburgh.com", url: "https://isadeburgh.com", color: "#9ca3af", preview: "isa" },
  { id: "site-4", folderId: "portfolio", title: "Visual Index", domain: "visualindex.co", url: "https://example.com", color: "#6f7886", preview: "editorial" },
  { id: "site-5", folderId: "motion", title: "Motion Lab", domain: "motionlab.dev", url: "https://example.com", color: "#374151", preview: "studio" },
  { id: "site-6", folderId: "motion", title: "Scroll Studio", domain: "scroll.studio", url: "https://example.com", color: "#687282", preview: "dark-alt" },
  { id: "site-7", folderId: "unsorted", title: "Untitled Reference", domain: "example.com", url: "https://example.com", color: "#8a94a3", preview: "editorial" },
  { id: "site-14", folderId: "saas", title: "SaaS Boards", domain: "saasboards.io", url: "https://saasboards.io", color: "#6b7280", preview: "pinterest" },
  { id: "site-15", folderId: "ecommerce", title: "Commerce Grid", domain: "commercegrid.co", url: "https://commercegrid.co", color: "#4b5563", preview: "studio" }
];

const app = document.getElementById("app");

let state = loadState();
let history = [];
let future = [];
let selectedNodeId = null;
let selectedFolderId = "agency";
let importOpen = false;
let searchTerm = "";
let websiteSearchTerm = "";
let pan = { x: 0, y: 0 };
let zoom = 1;
let saveTimer = null;
let contextMenu = null;
let toastTimer = null;
let previewClickMemory = { nodeId: null, at: 0 };
let createDialogOpen = false;
let canvasMenuOpenId = null;
let renameCanvasId = null;
let deleteCanvasId = null;

render();

function defaultState() {
  return {
    view: "list",
    currentCanvasId: null,
    canvases: [
      {
        id: createId("canvas"),
        name: "SaaS Landing Inspiration",
        createdAt: now(),
        updatedAt: now(),
        viewport: cloneViewport(DEFAULT_VIEWPORT),
        nodes: []
      }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch {
    return defaultState();
  }
}

function persistSoon() {
  clearTimeout(saveTimer);
  setSaveStatus("Saving...");
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveStatus("Saved");
  }, 800);
}

function setSaveStatus(text) {
  const el = document.querySelector("[data-save-state]");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-saving", text.toLowerCase().startsWith("saving"));
  el.classList.toggle("is-saved", text.toLowerCase() === "saved");
}

function now() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function currentCanvas() {
  return state.canvases.find((canvas) => canvas.id === state.currentCanvasId) || null;
}

function cloneViewport(viewport) {
  return {
    pan: { x: viewport.pan.x, y: viewport.pan.y },
    zoom: viewport.zoom,
    size: { width: viewport.size.width, height: viewport.size.height }
  };
}

function normalizeViewport(viewport) {
  const source = viewport || DEFAULT_VIEWPORT;
  const size = source.size || DEFAULT_VIEWPORT.size;
  return {
    pan: {
      x: Number.isFinite(source.pan?.x) ? source.pan.x : DEFAULT_VIEWPORT.pan.x,
      y: Number.isFinite(source.pan?.y) ? source.pan.y : DEFAULT_VIEWPORT.pan.y
    },
    zoom: Number.isFinite(source.zoom) ? clamp(source.zoom, 0.35, 2.2) : DEFAULT_VIEWPORT.zoom,
    size: {
      width: Number.isFinite(size.width) && size.width > 0 ? size.width : DEFAULT_VIEWPORT.size.width,
      height: Number.isFinite(size.height) && size.height > 0 ? size.height : DEFAULT_VIEWPORT.size.height
    }
  };
}

function restoreCanvasViewport(canvas) {
  const viewport = normalizeViewport(canvas?.viewport);
  pan = { ...viewport.pan };
  zoom = viewport.zoom;
  if (canvas) canvas.viewport = cloneViewport(viewport);
}

function saveCanvasViewport(options = {}) {
  const canvas = currentCanvas();
  if (!canvas) return;
  const area = app.querySelector("[data-canvas-area]");
  const rect = area?.getBoundingClientRect();
  const size = rect
    ? { width: Math.round(rect.width), height: Math.round(rect.height) }
    : normalizeViewport(canvas.viewport).size;
  canvas.viewport = { pan: { x: pan.x, y: pan.y }, zoom, size };
  if (options.persist) persistSoon();
}

function syncCanvasTransform(world = app.querySelector("[data-world]"), area = app.querySelector("[data-canvas-area]")) {
  if (world) {
    world.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }
  if (area) {
    area.style.setProperty("--grid-size", `${48 * zoom}px`);
    area.style.setProperty("--grid-x", `${pan.x}px`);
    area.style.setProperty("--grid-y", `${pan.y}px`);
  }
}

function commit(mutator, options = {}) {
  if (!options.skipHistory) {
    history.push(JSON.stringify(state));
    if (history.length > 80) history.shift();
    future = [];
  }
  mutator();
  const canvas = currentCanvas();
  if (canvas) canvas.updatedAt = now();
  persistSoon();
  render();
}

function undo() {
  if (!history.length) return;
  future.push(JSON.stringify(state));
  state = JSON.parse(history.pop());
  selectedNodeId = null;
  persistSoon();
  if (state.view === "workspace" && app.querySelector("[data-world]")) syncWorkspaceDom();
  else render();
}

function redo() {
  if (!future.length) return;
  history.push(JSON.stringify(state));
  state = JSON.parse(future.pop());
  selectedNodeId = null;
  persistSoon();
  if (state.view === "workspace" && app.querySelector("[data-world]")) syncWorkspaceDom();
  else render();
}

function render() {
  closeContextMenu();
  if (state.view === "workspace") {
    renderWorkspace();
    requestAnimationFrame(evaluateIframeBudget);
  } else {
    renderList();
  }
}

function renderList() {
  app.onmousedown = null;
  const cards = state.canvases
    .map((canvas) => {
      const websiteCount = canvas.nodes.filter((node) => node.type === "website").length;
      const noteCount = canvas.nodes.filter((node) => node.type === "note").length;
      const menuOpen = canvasMenuOpenId === canvas.id;
      return `
        <div class="canvas-card-shell">
          <button class="canvas-card" data-open-canvas="${canvas.id}">
            ${renderCanvasThumbnail(canvas)}
            <div class="canvas-info">
              <span class="canvas-copy">
                <span class="canvas-title">${escapeHtml(canvas.name)}</span>
                <span class="canvas-edited">Edited ${escapeHtml(formatEditedTime(canvas.updatedAt || canvas.createdAt))}</span>
              </span>
            </div>
          </button>
          <button
            class="canvas-card-edit-button ${menuOpen ? "is-open" : ""}"
            type="button"
            data-toggle-canvas-menu="${canvas.id}"
            aria-expanded="${menuOpen ? "true" : "false"}"
            aria-label="Edit ${escapeAttr(canvas.name)}"
          >
            ${thinPencilIcon()}
            Edit
          </button>
          ${menuOpen ? renderCanvasCardMenu(canvas) : ""}
        </div>
      `;
    })
    .join("");
  const renameCanvas = state.canvases.find((canvas) => canvas.id === renameCanvasId);
  const deleteCanvas = state.canvases.find((canvas) => canvas.id === deleteCanvasId);

  app.innerHTML = `
    <section class="list-page">
      <div class="topline">
        <div class="brand">
          <h1>Canvas History</h1>
          <p>Standalone HTML prototype for arranging saved website frames, notes, and preview states before replacing the product Canvas.</p>
        </div>
      </div>
      <div class="canvas-grid">
        ${cards || `<div class="empty-state">No canvases yet.</div>`}
      </div>
      <button class="bottom-create-canvas" data-open-create-dialog aria-label="Create canvas">
        ${canvasCreateIcon()}
      </button>
      ${createDialogOpen ? renderCreateCanvasDialog() : ""}
      ${renameCanvas ? renderRenameCanvasDialog(renameCanvas) : ""}
      ${deleteCanvas ? renderDeleteCanvasDialog(deleteCanvas) : ""}
    </section>
  `;

  app.onpointerdown = (event) => {
    if (!canvasMenuOpenId) return;
    const target = event.target;
    if (target.closest("[data-canvas-card-menu]") || target.closest("[data-toggle-canvas-menu]")) return;
    canvasMenuOpenId = null;
    renderList();
  };

  app.querySelector("[data-open-create-dialog]").addEventListener("click", () => {
    createDialogOpen = true;
    canvasMenuOpenId = null;
    renderList();
    const input = app.querySelector("[data-create-canvas-input]");
    if (input) input.focus();
  });

  const dialog = app.querySelector("[data-create-canvas-dialog]");
  if (dialog) bindCreateCanvasDialog(dialog);
  const renameDialog = app.querySelector("[data-rename-canvas-dialog]");
  if (renameDialog) bindRenameCanvasDialog(renameDialog);
  const deleteDialog = app.querySelector("[data-delete-canvas-dialog]");
  if (deleteDialog) bindDeleteCanvasDialog(deleteDialog);

  app.querySelectorAll("[data-toggle-canvas-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      canvasMenuOpenId = canvasMenuOpenId === button.dataset.toggleCanvasMenu ? null : button.dataset.toggleCanvasMenu;
      renderList();
    });
  });

  app.querySelectorAll("[data-rename-canvas]").forEach((button) => {
    button.addEventListener("click", () => {
      renameCanvasId = button.dataset.renameCanvas;
      canvasMenuOpenId = null;
      renderList();
      const input = app.querySelector("[data-rename-canvas-input]");
      if (input) {
        input.focus();
        input.select();
      }
    });
  });

  app.querySelectorAll("[data-delete-canvas]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteCanvasId = button.dataset.deleteCanvas;
      canvasMenuOpenId = null;
      renderList();
    });
  });

  app.querySelectorAll("[data-open-canvas]").forEach((button) => {
    button.addEventListener("click", () => {
      canvasMenuOpenId = null;
      state.currentCanvasId = button.dataset.openCanvas;
      state.view = "workspace";
      importOpen = false;
      restoreCanvasViewport(currentCanvas());
      render();
    });
  });
}

function renderCanvasThumbnail(canvas) {
  const canvasNodes = Array.isArray(canvas.nodes) ? canvas.nodes : [];
  const bounds = getCanvasContentBounds(canvasNodes);
  const transform = getCanvasThumbnailTransform(bounds);
  const gridSize = bounds ? clamp(48 * transform.scale, 7, 22) : 20;
  const gridX = bounds ? transform.offsetX % gridSize : 0;
  const gridY = bounds ? transform.offsetY % gridSize : 0;
  const nodes = [...canvasNodes]
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map((node) => renderThumbnailNode(node, transform))
    .filter(Boolean)
    .join("");

  return `
    <div
      class="canvas-thumb"
      style="--thumb-grid-size:${formatCssNumber(gridSize)}px;--thumb-grid-x:${formatCssNumber(gridX)}px;--thumb-grid-y:${formatCssNumber(gridY)}px"
    >
      ${nodes}
    </div>
  `;
}

function getCanvasContentBounds(nodes) {
  if (!nodes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const size = getNodeSize(node);
    const width = Number(size.width);
    const height = Number(node.type === "website" ? size.height + 40 : size.height);
    if (![node.x, node.y, width, height].every(Number.isFinite)) continue;
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + width);
    maxY = Math.max(maxY, node.y + height);
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  return { minX, minY, maxX, maxY };
}

function getCanvasThumbnailTransform(bounds) {
  if (!bounds) return { scale: 1, offsetX: 0, offsetY: 0 };
  const padding = 34;
  const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
  const contentHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = clamp(
    Math.min(
      (THUMBNAIL_VIEW.width - padding * 2) / contentWidth,
      (THUMBNAIL_VIEW.height - padding * 2) / contentHeight
    ),
    0.025,
    0.52
  );

  return {
    scale,
    offsetX: (THUMBNAIL_VIEW.width - contentWidth * scale) / 2 - bounds.minX * scale,
    offsetY: (THUMBNAIL_VIEW.height - contentHeight * scale) / 2 - bounds.minY * scale
  };
}

function renderThumbnailNode(node, transform) {
  const size = getNodeSize(node);
  const nodeHeight = node.type === "website" ? size.height + 40 : size.height;
  const screenX = transform.offsetX + node.x * transform.scale;
  const screenY = transform.offsetY + node.y * transform.scale;
  const screenWidth = size.width * transform.scale;
  const screenHeight = nodeHeight * transform.scale;

  const style = [
    `left:${formatCssNumber(screenX)}px`,
    `top:${formatCssNumber(screenY)}px`,
    `width:${formatCssNumber(Math.max(3, screenWidth))}px`,
    `height:${formatCssNumber(Math.max(3, screenHeight))}px`
  ].join(";");

  if (node.type === "note") {
    const text = node.content?.trim() || "Note";
    return `
      <span class="canvas-thumb-node thumb-note" style="${style}">
        <span class="thumb-note-header"></span>
        <span class="thumb-note-line">${escapeHtml(text)}</span>
      </span>
    `;
  }

  const site = mockWebsites.find((item) => item.id === node.websiteId) || mockWebsites[0];
  return `
    <span class="canvas-thumb-node thumb-website" style="${style}">
      <span class="thumb-website-bar"></span>
      <span class="thumb-website-body">
        ${renderPreviewArt(site)}
      </span>
    </span>
  `;
}

function renderCanvasCardMenu(canvas) {
  return `
    <div class="canvas-card-menu" data-canvas-card-menu>
      <button class="canvas-card-menu-item" type="button" data-rename-canvas="${canvas.id}">
        ${thinPencilIcon()}
        Rename canvas
      </button>
      <div class="canvas-card-menu-divider"></div>
      <button class="canvas-card-menu-item is-danger" type="button" data-delete-canvas="${canvas.id}">
        ${trashIcon()}
        Delete canvas
      </button>
    </div>
  `;
}

function createCanvasFromName(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const canvas = { id: createId("canvas"), name: trimmed, createdAt: now(), updatedAt: now(), viewport: cloneViewport(DEFAULT_VIEWPORT), nodes: [] };
  createDialogOpen = false;
  commit(() => {
    state.canvases.unshift(canvas);
    state.currentCanvasId = canvas.id;
    state.view = "workspace";
    importOpen = true;
    selectedFolderId = "agency";
    restoreCanvasViewport(canvas);
  });
}

function renderRenameCanvasDialog(canvas) {
  return `
    <div class="modal-backdrop" data-rename-canvas-dialog data-canvas-id="${canvas.id}">
      <form class="create-canvas-dialog canvas-name-dialog" data-rename-canvas-form>
        <div class="dialog-title-row">
          <h2>Rename Canvas</h2>
          <button class="dialog-close" type="button" data-close-rename-dialog aria-label="Close">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <label class="dialog-label" for="rename-canvas-input">Canvas Name</label>
        <input
          class="dialog-input"
          id="rename-canvas-input"
          data-rename-canvas-input
          name="name"
          value="${escapeAttr(canvas.name)}"
          maxlength="60"
          placeholder="Enter canvas name"
        />
        <div class="dialog-divider"></div>
        <button class="dialog-submit" type="submit">Save Changes</button>
      </form>
    </div>
  `;
}

function bindRenameCanvasDialog(dialog) {
  dialog.addEventListener("mousedown", (event) => {
    if (event.target === dialog) {
      renameCanvasId = null;
      renderList();
    }
  });
  dialog.querySelector("[data-close-rename-dialog]").addEventListener("click", () => {
    renameCanvasId = null;
    renderList();
  });
  dialog.querySelector("[data-rename-canvas-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    renameCanvas(dialog.dataset.canvasId, event.currentTarget.name.value);
  });
}

function renameCanvas(canvasId, name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const canvas = state.canvases.find((item) => item.id === canvasId);
  if (!canvas) return;
  canvas.name = trimmed;
  canvas.updatedAt = now();
  renameCanvasId = null;
  canvasMenuOpenId = null;
  persistSoon();
  renderList();
}

function renderDeleteCanvasDialog(canvas) {
  return `
    <div class="modal-backdrop" data-delete-canvas-dialog data-canvas-id="${canvas.id}">
      <div class="create-canvas-dialog canvas-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-canvas-title">
        <div class="dialog-title-row">
          <h2 id="delete-canvas-title">Delete Canvas</h2>
          <button class="dialog-close" type="button" data-cancel-delete-canvas aria-label="Close">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <p class="dialog-body">Are you sure you want to delete "${escapeHtml(canvas.name)}"? This action cannot be undone.</p>
        <div class="dialog-action-row">
          <button class="dialog-secondary-submit" type="button" data-cancel-delete-canvas>Cancel</button>
          <button class="dialog-danger-submit" type="button" data-confirm-delete-canvas>Delete canvas</button>
        </div>
      </div>
    </div>
  `;
}

function bindDeleteCanvasDialog(dialog) {
  const closeDialog = () => {
    deleteCanvasId = null;
    renderList();
  };
  dialog.addEventListener("mousedown", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.querySelectorAll("[data-cancel-delete-canvas]").forEach((button) => {
    button.addEventListener("click", closeDialog);
  });
  dialog.querySelector("[data-confirm-delete-canvas]").addEventListener("click", () => {
    deleteCanvas(dialog.dataset.canvasId);
  });
}

function deleteCanvas(canvasId) {
  state.canvases = state.canvases.filter((canvas) => canvas.id !== canvasId);
  if (state.currentCanvasId === canvasId) state.currentCanvasId = null;
  deleteCanvasId = null;
  canvasMenuOpenId = null;
  persistSoon();
  renderList();
}

function renderCreateCanvasDialog() {
  return `
    <div class="modal-backdrop" data-create-canvas-dialog>
      <form class="create-canvas-dialog" data-create-canvas-form>
        <div class="dialog-title-row">
          <h2>CREATE NEW CANVAS</h2>
          <button class="dialog-close dialog-shape-close" type="button" data-close-create-dialog aria-label="Close">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <input class="dialog-input" data-create-canvas-input name="name" placeholder="Enter canvas name" />
        <div class="dialog-divider"></div>
        <button class="dialog-submit" type="submit">Create Canvas</button>
      </form>
    </div>
  `;
}

function bindCreateCanvasDialog(dialog) {
  const closeWithShapeCue = () => {
    const closeButton = dialog.querySelector("[data-close-create-dialog]");
    closeButton?.classList.add("is-closing");
    window.setTimeout(() => {
      createDialogOpen = false;
      renderList();
    }, 120);
  };

  dialog.addEventListener("mousedown", (event) => {
    if (event.target === dialog) {
      closeWithShapeCue();
    }
  });
  const close = dialog.querySelector("[data-close-create-dialog]");
  close.addEventListener("click", closeWithShapeCue);
  const form = dialog.querySelector("[data-create-canvas-form]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    createCanvasFromName(event.currentTarget.name.value);
  });
}

function canvasCreateIcon() {
  return `
    <svg class="bottom-create-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32" aria-hidden="true">
      <path d="M810.666667 170.666667H213.333333a42.666667 42.666667 0 0 0-42.666666 42.666666v597.333334a42.666667 42.666667 0 0 0 42.666666 42.666666h597.333334a42.666667 42.666667 0 0 0 42.666666-42.666666V213.333333a42.666667 42.666667 0 0 0-42.666666-42.666666z m-42.666667 597.333333H256V256h512v512zM170.666667 896h42.666666v128H170.666667v-128zM0 810.666667h128v42.666666H0v-42.666666zM896 810.666667h128v42.666666h-128v-42.666666zM810.666667 896h42.666666v128h-42.666666v-128zM810.666667 0h42.666666v128h-42.666666V0zM896 170.666667h128v42.666666h-128V170.666667zM0 170.666667h128v42.666666H0V170.666667zM170.666667 0h42.666666v128H170.666667V0z" fill="#ffffff"></path>
    </svg>
  `;
}

function thinPencilIcon() {
  return `
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.15 14.7 4.25 11.25 12.85 2.65C13.35 2.15 14.16 2.15 14.66 2.65L15.35 3.34C15.85 3.84 15.85 4.65 15.35 5.15L6.75 13.75 3.15 14.7Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M11.7 3.8 14.2 6.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
    </svg>
  `;
}

function trashIcon() {
  return `
    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
    </svg>
  `;
}

function renderWorkspace() {
  const canvas = currentCanvas();
  if (!canvas) {
    state.view = "list";
    renderList();
    return;
  }
  restoreCanvasViewport(canvas);
  if (normalizeNodeStack(canvas)) persistSoon();

  app.innerHTML = `
    <section class="workspace">
      <header class="workspace-topbar">
        <div class="workspace-title">
          <button class="secondary-button" data-back>Back</button>
          <h2>${escapeHtml(canvas.name)}</h2>
        </div>
        <div class="save-state mono is-saved" data-save-state>Saved</div>
      </header>
      <main class="canvas-area" data-canvas-area>
        <div class="canvas-world" data-world></div>
        ${importOpen ? renderImportDock() : ""}
        <div class="bottom-toolbar">
          <button class="tool-button" data-import>Import Website</button>
          <button class="tool-button" data-add-note>Add Note</button>
          <button class="tool-button" data-undo ${history.length ? "" : "disabled"}>Undo</button>
          <button class="tool-button" data-redo ${future.length ? "" : "disabled"}>Redo</button>
        </div>
      </main>
    </section>
  `;

  const area = app.querySelector("[data-canvas-area]");
  const world = app.querySelector("[data-world]");
  syncCanvasTransform(world, area);
  world.innerHTML = canvas.nodes.map(renderNode).join("");

  bindWorkspaceEvents(area, world, canvas);
}

function renderImportDock() {
  const filteredFolders = mockFolders.filter((folder) => folder.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedFolder = mockFolders.find((folder) => folder.id === selectedFolderId) || mockFolders[0];
  const websiteQuery = websiteSearchTerm.trim().toLowerCase();
  const websites = mockWebsites.filter((site) => {
    if (site.folderId !== selectedFolder.id) return false;
    if (!websiteQuery) return true;
    return [site.title, site.domain, site.url].some((value) => value.toLowerCase().includes(websiteQuery));
  });

  return `
    <div class="import-dock">
      <aside class="panel folder-panel">
        <div class="panel-header">
          <span class="panel-kicker">Folders</span>
          <button class="close-button" data-close-import aria-label="Close import">
            <span aria-hidden="true"></span>
          </button>
        </div>
        <div class="search-wrap">
          <span class="search-icon"></span>
          <input class="search-field" data-folder-search value="${escapeHtml(searchTerm)}" placeholder="Search folders..." />
        </div>
        <div class="folder-list soft-scrollbar">
          ${filteredFolders
            .map(
              (folder) => `
                <button class="folder-row ${folder.id === selectedFolderId ? "is-selected" : ""}" data-folder-id="${folder.id}">
                  <span>${escapeHtml(folder.name)}</span>
                  <span class="check">&#10003;</span>
                </button>
              `
            )
            .join("")}
        </div>
      </aside>
      <aside class="panel website-panel soft-scrollbar">
        <h3 class="website-panel-title">${escapeHtml(selectedFolder.name)}</h3>
        <p class="website-panel-subtitle">Drag a card into the canvas or right click.</p>
        <div class="search-wrap website-search-wrap">
          <span class="search-icon"></span>
          <input class="search-field" data-website-search value="${escapeHtml(websiteSearchTerm)}" placeholder="Search websites..." />
        </div>
        <div class="website-list soft-scrollbar">
          ${websites.map(renderWebsiteCard).join("") || `<p class="website-empty">No websites found.</p>`}
        </div>
      </aside>
    </div>
  `;
}

function syncImportDock(area = app.querySelector("[data-canvas-area]")) {
  if (!area) {
    render();
    return;
  }
  const existing = area.querySelector(".import-dock");
  if (!importOpen) {
    existing?.remove();
    return;
  }
  const toolbar = area.querySelector(".bottom-toolbar");
  if (existing) {
    existing.outerHTML = renderImportDock();
  } else if (toolbar) {
    toolbar.insertAdjacentHTML("beforebegin", renderImportDock());
  }
  bindImportDockEvents(area);
}

function renderWebsiteCard(site) {
  return `
    <button class="website-card" draggable="true" data-site-id="${site.id}">
      <div class="site-preview">
        ${renderPreviewArt(site)}
      </div>
      <div class="website-card-footer">
        <span class="website-card-url">${escapeHtml(site.url)}</span>
      </div>
    </button>
  `;
}

function renderNode(node) {
  if (node.type === "note") return renderNote(node);
  return renderWebsiteFrame(node);
}

function renderWebsiteFrame(node) {
  const site = mockWebsites.find((item) => item.id === node.websiteId) || mockWebsites[0];
  const folder = mockFolders.find((item) => item.id === node.sourceFolderId);
  const size = getNodeSize(node);
  const isSelected = selectedNodeId === node.id;
  const isTop = isTopNode(node);
  const status = node.status || "screenshot";
  const mode = node.interactionMode || "canvas";
  const iframeSrc = buildIframeSrc(site, node);
  const iframe = status === "live" || status === "loading"
    ? `<iframe src="${escapeAttr(iframeSrc)}" title="${escapeAttr(site.title)}" loading="lazy"></iframe>`
    : "";
  const screenshot = status === "live" || status === "loading" ? "" : renderScreenshot(site);

  return `
    <div class="node website-node ${isSelected ? "is-selected" : ""}" data-node-id="${node.id}" style="left:${node.x}px;top:${node.y}px;width:${size.width}px;height:${size.height + 40}px;z-index:${getNodeZIndex(node)}">
      <div class="frame-shell">
        <div class="frame-main">
          <div class="frame-bar" data-drag-handle>
            <div class="frame-left-actions">
              <button class="refresh-button" data-refresh="${node.id}" ${status === "live" ? "" : "disabled"} title="Refresh preview">&#8635;</button>
              <button type="button" class="frame-delete-button" data-delete-node="${node.id}" title="Delete preview" aria-label="Delete preview"><span></span></button>
              <span class="status-pill">${escapeHtml(status)}</span>
            </div>
            <span class="frame-source">${escapeHtml(folder?.name || "Folder")}</span>
            <div class="frame-actions">
              <div class="device-tabs">
                ${Object.keys(devices)
                  .map(
                    (device) => `<button data-device="${device}" data-device-node="${node.id}" class="${node.device === device ? "is-active" : ""}">${device}</button>`
                  )
                  .join("")}
              </div>
            </div>
          </div>
          <div class="frame-viewport" data-mode="${mode}" data-frame-viewport style="width:${size.width}px;height:${size.height}px">
            ${screenshot}
            ${iframe}
            ${mode === "canvas" ? `<button class="preview-hitbox" data-preview-hitbox="${node.id}" aria-label="Enter preview"></button>` : ""}
            ${mode === "canvas" ? `<div class="preview-hint">Double click to preview</div>` : ""}
          </div>
        </div>
        ${mode === "preview" ? `<button class="exit-preview" data-exit-preview="${node.id}">Exit Preview</button>` : ""}
        <span class="resize-handle" data-resize-handle></span>
        ${isTop ? "" : renderActivationShield(node.id)}
      </div>
    </div>
  `;
}

function renderScreenshot(site) {
  return `
    <div class="screenshot-fallback">
      ${renderPreviewArt(site)}
    </div>
  `;
}

function renderPreviewArt(site) {
  const kind = site.preview || inferPreviewKind(site);
  const domain = escapeHtml(site.domain);
  const title = escapeHtml(site.title || site.domain);

  if (kind === "makemepulse") {
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#111111"></rect>
        <text x="78" y="78" fill="#8aa0b7" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="34" font-weight="600">makemepulse.</text>
        <text x="1016" y="82" fill="#f7f7f5" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="19">home</text>
        <text x="1126" y="82" fill="#f7f7f5" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="19">case studies</text>
        <text x="1310" y="82" fill="#f7f7f5" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="19">what we do</text>
        <text x="760" y="306" text-anchor="middle" fill="#ffffff" font-family="Helvetica Neue, Arial, sans-serif" font-size="132" font-weight="300">global</text>
        <text x="870" y="470" text-anchor="middle" fill="#ffffff" font-family="Helvetica Neue, Arial, sans-serif" font-size="132" font-weight="300">creative</text>
        <text x="1080" y="648" text-anchor="middle" fill="#ffffff" font-family="Helvetica Neue, Arial, sans-serif" font-size="132" font-weight="300">studio.</text>
        <text x="716" y="344" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="17">we turn aesthetics into experiences</text>
        <text x="862" y="584" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="17">tech that's light as air</text>
        <circle cx="86" cy="620" r="8" fill="#ffffff"></circle>
        <circle cx="114" cy="620" r="8" fill="#ffffff" opacity="0.76"></circle>
        <circle cx="142" cy="620" r="8" fill="#ffffff" opacity="0.44"></circle>
        <rect x="284" y="760" width="1040" height="320" fill="#a9ada2"></rect>
        <rect x="284" y="760" width="1040" height="320" fill="#ffffff" opacity="0.18"></rect>
      </svg>
    `;
  }

  if (kind === "pinterest") {
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff"></rect>
        <text x="84" y="86" fill="#e60023" font-family="Arial, sans-serif" font-size="33" font-weight="800">Pinterest</text>
        <text x="238" y="86" fill="#111111" font-family="Arial, sans-serif" font-size="20" font-weight="700">Explore</text>
        <text x="338" y="86" fill="#111111" font-family="Arial, sans-serif" font-size="20" font-weight="700">Shop</text>
        <text x="1290" y="86" fill="#111111" font-family="Arial, sans-serif" font-size="20" font-weight="700">About</text>
        <rect x="1420" y="52" width="86" height="52" rx="26" fill="#e60023"></rect>
        <text x="1463" y="86" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="800">Log in</text>
        <text x="204" y="262" fill="#111111" font-family="Arial, sans-serif" font-size="64" font-weight="900">Create the life you love</text>
        <text x="204" y="334" fill="#111111" font-family="Arial, sans-serif" font-size="64" font-weight="900">on Pinterest</text>
        <rect x="204" y="388" width="214" height="54" rx="27" fill="#e60023"></rect>
        <text x="311" y="422" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="19" font-weight="800">Join Pinterest for free</text>
        <rect x="438" y="388" width="224" height="54" rx="27" fill="#e8e8e8"></rect>
        <text x="550" y="422" text-anchor="middle" fill="#111111" font-family="Arial, sans-serif" font-size="19" font-weight="800">I already have an account</text>
        <rect x="982" y="120" width="196" height="236" rx="30" fill="#efc65f"></rect>
        <rect x="1150" y="184" width="260" height="286" rx="34" fill="#71b9d7"></rect>
        <rect x="1274" y="250" width="218" height="294" rx="36" fill="#dd6758"></rect>
        <rect x="1014" y="356" width="188" height="230" rx="36" fill="#afbd7c"></rect>
        <rect x="1392" y="460" width="190" height="150" rx="34" fill="#e4843d"></rect>
        <rect x="0" y="642" width="1600" height="358" fill="#f5f3f0"></rect>
        <text x="800" y="808" text-anchor="middle" fill="#111111" font-family="Arial, sans-serif" font-size="47" font-weight="900">Step into soccer season</text>
        <text x="800" y="864" text-anchor="middle" fill="#111111" font-family="Arial, sans-serif" font-size="22">Flex your fandom and score fresh inspiration for every match.</text>
      </svg>
    `;
  }

  if (kind === "isa") {
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff"></rect>
        <text x="110" y="150" fill="#050505" font-family="Arial, sans-serif" font-size="92" font-weight="900">ISA DE BURGH</text>
        <text x="110" y="410" fill="#050505" font-family="Georgia, serif" font-size="48">Brand Architecture</text>
        <text x="110" y="482" fill="#050505" font-family="Georgia, serif" font-size="48">Creative Content</text>
        <text x="110" y="554" fill="#050505" font-family="Georgia, serif" font-size="48">Storytelling</text>
        <text x="110" y="626" fill="#050505" font-family="Georgia, serif" font-size="48">Art Direction</text>
        <circle cx="1200" cy="594" r="368" fill="#eeeeee"></circle>
        <circle cx="1200" cy="594" r="250" fill="#d7d7d7"></circle>
        <circle cx="1200" cy="594" r="118" fill="#b7b7b7"></circle>
      </svg>
    `;
  }

  if (kind === "studio") {
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff"></rect>
        <text x="80" y="106" fill="#111111" font-family="Georgia, serif" font-size="46" font-weight="800">${domain}</text>
        <text x="600" y="106" fill="#111111" font-family="Georgia, serif" font-size="26">Home</text>
        <text x="1120" y="106" fill="#111111" font-family="Georgia, serif" font-size="26">Work, Info, News</text>
        <text x="1450" y="106" fill="#111111" font-family="Georgia, serif" font-size="26">Contact</text>
        <rect x="92" y="250" width="386" height="180" fill="#d84e19"></rect>
        <rect x="498" y="250" width="386" height="180" fill="#d7ff00"></rect>
        <rect x="904" y="250" width="386" height="180" fill="#111111"></rect>
        <rect x="1310" y="210" width="210" height="220" fill="#d5d5d5"></rect>
        <text x="800" y="588" text-anchor="middle" fill="#111111" font-family="Georgia, serif" font-size="70">Moving Missions Forward</text>
        <rect x="92" y="690" width="286" height="154" fill="#a94321"></rect>
        <rect x="398" y="690" width="286" height="154" fill="#151515"></rect>
        <rect x="704" y="690" width="286" height="154" fill="#567083"></rect>
        <rect x="1010" y="690" width="286" height="154" fill="#e9e9e9"></rect>
        <text x="92" y="940" fill="#111111" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="30">IG / LI</text>
        <text x="760" y="940" fill="#111111" font-family="Georgia, serif" font-size="30" font-weight="800">${title}</text>
      </svg>
    `;
  }

  if (kind === "dark" || kind === "dark-alt") {
    const accent = kind === "dark" ? "#d7ff00" : "#ff552e";
    const accentSoft = kind === "dark" ? "#d84e19" : "#99a5b3";
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#111418"></rect>
        <text x="78" y="94" fill="#d7dde6" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="34">${domain}</text>
        <text x="1110" y="94" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22">Index</text>
        <text x="1240" y="94" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22">Work</text>
        <text x="1370" y="94" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22">Contact</text>
        <text x="96" y="326" fill="#ffffff" font-family="Georgia, serif" font-size="112" font-weight="700">${title}</text>
        <text x="96" y="434" fill="#ffffff" font-family="Georgia, serif" font-size="82">digital reference</text>
        <rect x="96" y="560" width="322" height="250" fill="${accentSoft}"></rect>
        <rect x="450" y="560" width="322" height="250" fill="${accent}"></rect>
        <rect x="804" y="560" width="322" height="250" fill="#f5f5f5"></rect>
        <rect x="1158" y="560" width="322" height="250" fill="#333a44"></rect>
        <circle cx="1300" cy="342" r="132" fill="${accent}" opacity="0.9"></circle>
        <rect x="1246" y="288" width="108" height="108" fill="#ffffff" opacity="0.82"></rect>
      </svg>
    `;
  }

  if (kind === "editorial") {
    return `
      <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#f6f6f4"></rect>
        <rect x="80" y="80" width="1440" height="140" fill="#111111"></rect>
        <text x="122" y="168" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="36">${domain}</text>
        <rect x="82" y="300" width="410" height="500" fill="#dedbd3"></rect>
        <rect x="550" y="300" width="390" height="220" fill="#1f2937"></rect>
        <rect x="550" y="580" width="390" height="220" fill="#aeb5bd"></rect>
        <rect x="1000" y="300" width="520" height="500" fill="#ffffff" stroke="#111111" stroke-width="3"></rect>
        <text x="1048" y="434" fill="#111111" font-family="Georgia, serif" font-size="84">${title}</text>
        <text x="1048" y="518" fill="#111111" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="28">Selected website reference</text>
      </svg>
    `;
  }

  return `
    <svg class="preview-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1600" height="1000" fill="${escapeAttr(site.color || "#27313d")}"></rect>
      <text x="88" y="104" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="36">${domain}</text>
      <text x="92" y="350" fill="#ffffff" font-family="Georgia, serif" font-size="120">${title}</text>
      <rect x="100" y="540" width="350" height="270" fill="#ffffff" opacity="0.22"></rect>
      <rect x="500" y="540" width="350" height="270" fill="#ffffff" opacity="0.36"></rect>
      <rect x="900" y="540" width="350" height="270" fill="#ffffff" opacity="0.14"></rect>
      <circle cx="1280" cy="342" r="150" fill="#ffffff" opacity="0.28"></circle>
    </svg>
  `;
}

function inferPreviewKind(site) {
  if (site.domain.includes("makemepulse")) return "makemepulse";
  if (site.domain.includes("pinterest")) return "pinterest";
  if (site.domain.includes("isa")) return "isa";
  return "dark";
}

function renderNote(node) {
  const isSelected = selectedNodeId === node.id;
  const isTop = isTopNode(node);
  return `
    <div class="node note-node ${isSelected ? "is-selected" : ""}" data-node-id="${node.id}" style="left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;z-index:${getNodeZIndex(node)}">
      <div class="note-shell" style="width:${node.width}px;height:${node.height}px">
        <div class="note-header" data-drag-handle>
          <span>Note</span>
          <div class="note-header-actions">
            <span class="note-char-count">${Math.max(0, node.content.length)} chars</span>
            <button type="button" class="note-delete-button" data-delete-node="${node.id}" title="Delete note" aria-label="Delete note"><span></span></button>
          </div>
        </div>
        <textarea class="note-editor" data-note-editor="${node.id}" placeholder="Write a note...">${escapeHtml(node.content)}</textarea>
      </div>
      <span class="resize-handle" data-resize-handle></span>
      ${isTop ? "" : renderActivationShield(node.id)}
    </div>
  `;
}

function renderActivationShield(nodeId) {
  return `<button type="button" class="node-activation-shield" data-activate-node="${nodeId}" aria-label="Bring window to front"></button>`;
}

function bindWorkspaceEvents(area, world, canvas) {
  app.onmousedown = (event) => {
    if (event.button !== 0 || state.view !== "workspace") return;
    if (event.target.closest("[data-node-id]")) return;
    clearNodeSelection();
  };

  app.querySelector("[data-back]").addEventListener("click", () => {
    saveCanvasViewport({ persist: true });
    state.view = "list";
    selectedNodeId = null;
    render();
  });

  app.querySelector("[data-import]").addEventListener("click", () => {
    importOpen = true;
    syncImportDock(area);
  });

  app.querySelector("[data-add-note]").addEventListener("click", () => addNoteAtCenter());
  app.querySelector("[data-undo]").addEventListener("click", undo);
  app.querySelector("[data-redo]").addEventListener("click", redo);

  bindImportDockEvents(area);
  area.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  area.addEventListener("drop", (event) => {
    const siteId = event.dataTransfer.getData("text/plain");
    if (!siteId) return;
    event.preventDefault();
    const point = screenToCanvas(event.clientX, event.clientY, area);
    addWebsiteNode(siteId, point.x, point.y);
  });

  area.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const rect = area.getBoundingClientRect();
    const before = screenToCanvas(event.clientX, event.clientY, area);
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    zoom = clamp(zoom * factor, 0.35, 2.2);
    pan.x = event.clientX - rect.left - before.x * zoom;
    pan.y = event.clientY - rect.top - before.y * zoom;
    syncCanvasTransform(world, area);
    saveCanvasViewport({ persist: true });
    requestAnimationFrame(evaluateIframeBudget);
  }, { passive: false });

  area.addEventListener("mousedown", (event) => {
    if (event.button === 0 && isCanvasPanTarget(event.target)) {
      clearNodeSelection();
    }
    if (event.button === 1 && isCanvasPanTarget(event.target)) {
      event.preventDefault();
      startPan(event, world);
    }
  });
  area.addEventListener("auxclick", (event) => {
    if (event.button === 1) event.preventDefault();
  });

  app.querySelectorAll("[data-node-id]").forEach((nodeEl) => {
    bindNodeEvents(nodeEl, canvas, area, world);
    bindNodeControlEvents(nodeEl, canvas);
  });
  app.querySelectorAll("[data-activate-node]").forEach((shield) => bindActivationShield(shield));
}

function bindImportDockEvents(area) {
  const closeButton = app.querySelector("[data-close-import]");
  if (closeButton) closeButton.addEventListener("click", () => {
    importOpen = false;
    syncImportDock(area);
  });

  const search = app.querySelector("[data-folder-search]");
  if (search) {
    search.addEventListener("input", (event) => {
      searchTerm = event.target.value;
      syncImportDock(area);
      const next = app.querySelector("[data-folder-search]");
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }

  const websiteSearch = app.querySelector("[data-website-search]");
  if (websiteSearch) {
    websiteSearch.addEventListener("input", (event) => {
      websiteSearchTerm = event.target.value;
      syncImportDock(area);
      const next = app.querySelector("[data-website-search]");
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }

  app.querySelectorAll("[data-folder-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedFolderId = button.dataset.folderId;
      websiteSearchTerm = "";
      syncImportDock(area);
    });
  });

  app.querySelectorAll("[data-site-id]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.siteId);
      event.dataTransfer.effectAllowed = "copy";
    });
    card.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openContextMenu(event.clientX, event.clientY, card.dataset.siteId);
    });
  });
}

function bindActivationShield(shield) {
  shield.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    blurActiveField();
    selectNode(shield.dataset.activateNode, { bringToFront: true });
  });
}

function bindNodeControlEvents(nodeEl, canvas) {
  nodeEl.querySelectorAll("[data-device-node]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectNode(button.dataset.deviceNode, { bringToFront: true });
      setNodeDevice(button.dataset.deviceNode, button.dataset.device);
    });
  });
  nodeEl.querySelectorAll("[data-refresh]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const node = canvas.nodes.find((item) => item.id === button.dataset.refresh);
      if (!node || node.status !== "live") return;
      selectNode(node.id, { bringToFront: true });
      refreshLiveIframe(node);
    });
  });
  nodeEl.querySelectorAll("[data-delete-node]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteNode(button.dataset.deleteNode);
    });
  });
  nodeEl.querySelectorAll("[data-exit-preview]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setPreviewMode(button.dataset.exitPreview, "canvas");
    });
  });
}

function bindNodeEvents(nodeEl, canvas, area, world) {
  const nodeId = nodeEl.dataset.nodeId;
  nodeEl.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("button, input, textarea")) return;
    blurActiveField();
    selectNode(nodeId, { bringToFront: true });
  });

  const dragHandle = nodeEl.querySelector("[data-drag-handle]");
  if (dragHandle) {
    dragHandle.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button")) return;
      event.preventDefault();
      event.stopPropagation();
      blurActiveField();
      selectNode(nodeId, { bringToFront: true });
      startNodeDrag(event, nodeId);
    });
  }

  const resizeHandle = nodeEl.querySelector("[data-resize-handle]");
  if (resizeHandle) {
    resizeHandle.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      blurActiveField();
      selectNode(nodeId, { bringToFront: true });
      startResize(event, nodeId);
    });
  }

  const viewport = nodeEl.querySelector("[data-frame-viewport]");
  if (viewport) {
    viewport.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      blurActiveField();
      selectNode(nodeId, { bringToFront: true });
    });
    viewport.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      enterPreview(nodeId);
    });
  }

  nodeEl.querySelectorAll("[data-preview-hitbox]").forEach((button) => {
    bindPreviewHitbox(button);
  });

  nodeEl.querySelectorAll("[data-note-editor]").forEach((textarea) => {
    textarea.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      selectNode(textarea.dataset.noteEditor, { bringToFront: true });
    });
    textarea.addEventListener("input", () => {
      updateNode(textarea.dataset.noteEditor, { content: textarea.value }, { skipHistory: true, noRender: true });
      const nodeEl = textarea.closest("[data-node-id]");
      const chars = nodeEl?.querySelector(".note-char-count");
      if (chars) chars.textContent = `${Math.max(0, textarea.value.length)} chars`;
    });
  });
}

function isCanvasPanTarget(target) {
  if (!(target instanceof Element)) return false;
  return !target.closest(".node, .import-dock, .bottom-toolbar, button, input, textarea, select, .context-menu");
}

function blurActiveField() {
  const active = document.activeElement;
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) active.blur();
}

function selectNode(nodeId, options = {}) {
  selectedNodeId = nodeId;
  if (options.bringToFront) bringNodeToFront(nodeId);
  document.querySelectorAll("[data-node-id]").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.nodeId === nodeId);
  });
}

function clearNodeSelection() {
  selectedNodeId = null;
  document.querySelectorAll("[data-node-id]").forEach((element) => {
    element.classList.remove("is-selected");
  });
}

function bringNodeToFront(nodeId) {
  const canvas = currentCanvas();
  const node = canvas?.nodes.find((item) => item.id === nodeId);
  if (!canvas || !node) return;
  if (isTopNode(node, canvas)) return;
  const nextZ = getNextNodeZIndex(canvas);
  node.zIndex = nextZ;
  node.updatedAt = now();
  const element = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (element) element.style.zIndex = String(node.zIndex);
  syncActivationShields();
  persistSoon();
}

function getNextNodeZIndex(canvas = currentCanvas()) {
  const maxZ = canvas?.nodes.reduce((max, node) => Math.max(max, getNodeZIndex(node)), 0) || 0;
  return maxZ + 1;
}

function getNodeZIndex(node) {
  return Number.isFinite(node.zIndex) ? node.zIndex : 1;
}

function normalizeNodeStack(canvas) {
  if (!canvas?.nodes?.length) return false;
  let changed = false;
  const ordered = canvas.nodes
    .map((node, index) => ({ node, index, zIndex: getNodeZIndex(node) }))
    .sort((a, b) => a.zIndex - b.zIndex || a.index - b.index);
  ordered.forEach(({ node }, index) => {
    const nextZ = index + 1;
    if (node.zIndex !== nextZ) {
      node.zIndex = nextZ;
      changed = true;
    }
  });
  return changed;
}

function isTopNode(node, canvas = currentCanvas()) {
  if (!canvas || !node) return true;
  return node.id === getTopNodeId(canvas);
}

function getTopNodeId(canvas = currentCanvas()) {
  if (!canvas?.nodes?.length) return null;
  return canvas.nodes.reduce((top, node) => {
    if (!top) return node;
    const nodeZ = getNodeZIndex(node);
    const topZ = getNodeZIndex(top);
    return nodeZ >= topZ ? node : top;
  }, null)?.id || null;
}

function appendNodeElement(node, options = {}) {
  const canvas = currentCanvas();
  const area = app.querySelector("[data-canvas-area]");
  const world = app.querySelector("[data-world]");
  if (!canvas || !area || !world) {
    render();
    return;
  }
  world.insertAdjacentHTML("beforeend", renderNode(node));
  const nodeEl = world.querySelector(`[data-node-id="${node.id}"]`);
  if (!nodeEl) return;
  bindNodeEvents(nodeEl, canvas, area, world);
  bindNodeControlEvents(nodeEl, canvas);
  nodeEl.querySelectorAll("[data-activate-node]").forEach((shield) => bindActivationShield(shield));
  if (options.select !== false) selectNode(node.id, { bringToFront: true });
  syncActivationShields();
  syncToolbarState();
}

function syncToolbarState() {
  const undoButton = app.querySelector("[data-undo]");
  const redoButton = app.querySelector("[data-redo]");
  if (undoButton) undoButton.disabled = history.length === 0;
  if (redoButton) redoButton.disabled = future.length === 0;
}

function syncWorkspaceDom() {
  const canvas = currentCanvas();
  const area = app.querySelector("[data-canvas-area]");
  const world = app.querySelector("[data-world]");
  if (!canvas || !area || !world) {
    render();
    return;
  }
  if (normalizeNodeStack(canvas)) persistSoon();
  const title = app.querySelector(".workspace-title h2");
  if (title) title.textContent = canvas.name;

  const nodeIds = new Set(canvas.nodes.map((node) => node.id));
  world.querySelectorAll("[data-node-id]").forEach((element) => {
    if (!nodeIds.has(element.dataset.nodeId)) element.remove();
  });

  for (const node of canvas.nodes) {
    const existing = world.querySelector(`[data-node-id="${node.id}"]`);
    if (!existing) {
      appendNodeElement(node, { select: false });
      continue;
    }
    syncExistingNodeElement(existing, node);
  }

  clearNodeSelection();
  syncActivationShields();
  syncToolbarState();
  syncImportDock(area);
  requestAnimationFrame(evaluateIframeBudget);
}

function syncExistingNodeElement(element, node) {
  const isWebsite = node.type === "website";
  if (isWebsite !== element.classList.contains("website-node")) {
    element.insertAdjacentHTML("afterend", renderNode(node));
    const replacement = element.nextElementSibling;
    element.remove();
    const canvas = currentCanvas();
    const area = app.querySelector("[data-canvas-area]");
    const world = app.querySelector("[data-world]");
    if (replacement && canvas && area && world) {
      bindNodeEvents(replacement, canvas, area, world);
      bindNodeControlEvents(replacement, canvas);
      replacement.querySelectorAll("[data-activate-node]").forEach((shield) => bindActivationShield(shield));
    }
    return;
  }

  element.classList.toggle("is-selected", selectedNodeId === node.id);
  element.style.left = `${node.x}px`;
  element.style.top = `${node.y}px`;
  element.style.zIndex = String(getNodeZIndex(node));

  if (node.type === "note") {
    element.style.width = `${node.width}px`;
    element.style.height = `${node.height}px`;
    const shell = element.querySelector(".note-shell");
    if (shell) {
      shell.style.width = `${node.width}px`;
      shell.style.height = `${node.height}px`;
    }
    const textarea = element.querySelector("[data-note-editor]");
    if (textarea && document.activeElement !== textarea) textarea.value = node.content;
    const chars = element.querySelector(".note-char-count");
    if (chars) chars.textContent = `${Math.max(0, node.content.length)} chars`;
    return;
  }

  const site = mockWebsites.find((item) => item.id === node.websiteId) || mockWebsites[0];
  const folder = mockFolders.find((item) => item.id === node.sourceFolderId);
  const size = getNodeSize(node);
  const mode = node.interactionMode || "canvas";
  const status = node.status || "screenshot";
  element.style.width = `${size.width}px`;
  element.style.height = `${size.height + 40}px`;
  const viewport = element.querySelector("[data-frame-viewport]");
  if (viewport) {
    viewport.style.width = `${size.width}px`;
    viewport.style.height = `${size.height}px`;
    viewport.dataset.mode = mode;
  }
  const source = element.querySelector(".frame-source");
  if (source) source.textContent = folder?.name || "Folder";
  const statusPill = element.querySelector(".status-pill");
  if (statusPill) statusPill.textContent = status;
  const refresh = element.querySelector("[data-refresh]");
  if (refresh) refresh.disabled = status !== "live";
  element.querySelectorAll("[data-device-node]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.device === (node.device || "desktop"));
  });

  if (viewport) {
    const iframe = viewport.querySelector("iframe");
    const screenshot = viewport.querySelector(".screenshot-fallback");
    if (status === "live" || status === "loading") {
      screenshot?.remove();
      if (!iframe) {
        viewport.insertAdjacentHTML("afterbegin", `<iframe src="${escapeAttr(buildIframeSrc(site, node))}" title="${escapeAttr(site.title)}" loading="lazy"></iframe>`);
      }
    } else {
      iframe?.remove();
      if (!screenshot) viewport.insertAdjacentHTML("afterbegin", renderScreenshot(site));
    }

    if (mode === "canvas") {
      element.querySelector(".exit-preview")?.remove();
      if (!viewport.querySelector("[data-preview-hitbox]")) {
        const hitbox = document.createElement("button");
        hitbox.className = "preview-hitbox";
        hitbox.type = "button";
        hitbox.dataset.previewHitbox = node.id;
        hitbox.setAttribute("aria-label", "Enter preview");
        bindPreviewHitbox(hitbox);
        viewport.appendChild(hitbox);
      }
      if (!viewport.querySelector(".preview-hint")) {
        const hint = document.createElement("div");
        hint.className = "preview-hint";
        hint.textContent = "Double click to preview";
        viewport.appendChild(hint);
      }
    } else {
      viewport.querySelector("[data-preview-hitbox]")?.remove();
      viewport.querySelector(".preview-hint")?.remove();
      if (!element.querySelector(".exit-preview")) {
        const button = document.createElement("button");
        button.className = "exit-preview";
        button.type = "button";
        button.dataset.exitPreview = node.id;
        button.textContent = "Exit Preview";
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          setPreviewMode(node.id, "canvas");
        });
        element.querySelector(".frame-shell")?.appendChild(button);
      }
    }
  }
}

function syncActivationShields() {
  const canvas = currentCanvas();
  if (!canvas) return;
  for (const node of canvas.nodes) {
    const element = document.querySelector(`[data-node-id="${node.id}"]`);
    if (!element) continue;
    const shield = element.querySelector(".node-activation-shield");
    if (isTopNode(node, canvas)) {
      shield?.remove();
      continue;
    }
    if (shield) continue;
    const nextShield = document.createElement("button");
    nextShield.type = "button";
    nextShield.className = "node-activation-shield";
    nextShield.dataset.activateNode = node.id;
    nextShield.setAttribute("aria-label", "Bring window to front");
    bindActivationShield(nextShield);
    const host = element.querySelector(".frame-shell") || element;
    host.appendChild(nextShield);
  }
}

function setNodeDevice(nodeId, device) {
  if (!devices[device]) return;
  const canvas = currentCanvas();
  const node = canvas?.nodes.find((item) => item.id === nodeId);
  if (!node || node.type !== "website" || node.device === device) return;
  history.push(JSON.stringify(state));
  if (history.length > 80) history.shift();
  future = [];
  node.device = device;
  node.updatedAt = now();
  syncNodeElementSize(node);
  document.querySelectorAll(`[data-device-node="${nodeId}"]`).forEach((button) => {
    button.classList.toggle("is-active", button.dataset.device === device);
  });
  refreshLiveIframe(node);
  persistSoon();
  requestAnimationFrame(evaluateIframeBudget);
}

function syncNodeElementSize(node) {
  const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
  if (!nodeElement) return;
  if (node.type === "website") {
    const size = getNodeSize(node);
    nodeElement.style.width = `${size.width}px`;
    nodeElement.style.height = `${size.height + 40}px`;
    const viewport = nodeElement.querySelector("[data-frame-viewport]");
    if (viewport) {
      viewport.style.width = `${size.width}px`;
      viewport.style.height = `${size.height}px`;
    }
    return;
  }
  nodeElement.style.width = `${node.width}px`;
  nodeElement.style.height = `${node.height}px`;
  const shell = nodeElement.querySelector(".note-shell");
  if (shell) {
    shell.style.width = `${node.width}px`;
    shell.style.height = `${node.height}px`;
  }
}

function setPreviewMode(nodeId, mode) {
  const canvas = currentCanvas();
  const node = canvas?.nodes.find((item) => item.id === nodeId);
  if (!node || node.type !== "website") return;
  if (mode === "preview" && node.status !== "live") return;
  node.interactionMode = mode;
  node.updatedAt = now();
  const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
  const viewport = nodeElement?.querySelector("[data-frame-viewport]");
  const shell = nodeElement?.querySelector(".frame-shell");
  if (!nodeElement || !viewport || !shell) return;
  viewport.dataset.mode = mode;
  if (mode === "preview") {
    viewport.querySelector(".preview-hitbox")?.remove();
    viewport.querySelector(".preview-hint")?.remove();
    if (!shell.querySelector(".exit-preview")) {
      const button = document.createElement("button");
      button.className = "exit-preview";
      button.type = "button";
      button.dataset.exitPreview = nodeId;
      button.textContent = "Exit Preview";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        setPreviewMode(nodeId, "canvas");
      });
      shell.appendChild(button);
    }
  } else {
    shell.querySelector(".exit-preview")?.remove();
    if (!viewport.querySelector(".preview-hitbox")) {
      const hitbox = document.createElement("button");
      hitbox.className = "preview-hitbox";
      hitbox.type = "button";
      hitbox.dataset.previewHitbox = nodeId;
      hitbox.setAttribute("aria-label", "Enter preview");
      bindPreviewHitbox(hitbox);
      viewport.appendChild(hitbox);
    }
    if (!viewport.querySelector(".preview-hint")) {
      const hint = document.createElement("div");
      hint.className = "preview-hint";
      hint.textContent = "Double click to preview";
      viewport.appendChild(hint);
    }
  }
  persistSoon();
}

function bindPreviewHitbox(button) {
  button.addEventListener("pointerdown", (event) => {
    const nodeId = button.dataset.previewHitbox;
    const at = Date.now();
    if (previewClickMemory.nodeId === nodeId && at - previewClickMemory.at < 420) {
      event.preventDefault();
      event.stopPropagation();
      previewClickMemory = { nodeId: null, at: 0 };
      enterPreview(nodeId);
      return;
    }
    previewClickMemory = { nodeId, at };
  });
  button.addEventListener("click", (event) => {
    if (event.detail < 2) return;
    event.preventDefault();
    event.stopPropagation();
    enterPreview(button.dataset.previewHitbox);
  });
  button.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    enterPreview(button.dataset.previewHitbox);
  });
}

function startPan(event, world) {
  const area = app.querySelector("[data-canvas-area]");
  if (area) area.classList.add("is-panning");
  const start = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  function onMove(moveEvent) {
    pan.x = start.panX + moveEvent.clientX - start.x;
    pan.y = start.panY + moveEvent.clientY - start.y;
    syncCanvasTransform(world, area);
    requestAnimationFrame(evaluateIframeBudget);
  }
  function onUp() {
    if (area) area.classList.remove("is-panning");
    saveCanvasViewport({ persist: true });
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startNodeDrag(event, nodeId) {
  const canvas = currentCanvas();
  const node = canvas.nodes.find((item) => item.id === nodeId);
  const start = { x: event.clientX, y: event.clientY, nodeX: node.x, nodeY: node.y };
  history.push(JSON.stringify(state));
  future = [];
  function onMove(moveEvent) {
    node.x = start.nodeX + (moveEvent.clientX - start.x) / zoom;
    node.y = start.nodeY + (moveEvent.clientY - start.y) / zoom;
    const el = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) {
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
    }
    persistSoon();
    requestAnimationFrame(evaluateIframeBudget);
  }
  function onUp() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startResize(event, nodeId) {
  const canvas = currentCanvas();
  const node = canvas.nodes.find((item) => item.id === nodeId);
  const start = { x: event.clientX, y: event.clientY, width: node.width, height: node.height, scale: node.scale || 0.28 };
  let resized = false;
  history.push(JSON.stringify(state));
  future = [];
  function onMove(moveEvent) {
    const dx = (moveEvent.clientX - start.x) / zoom;
    if (node.type === "website") {
      const base = devices[node.device || "desktop"];
      const nextWidth = clamp(start.width + dx, WEBSITE_FRAME_MIN_WIDTH, WEBSITE_FRAME_MAX_WIDTH);
      node.scale = nextWidth / base.width;
      node.width = Math.round(base.width * node.scale);
      node.height = Math.round(base.height * node.scale);
    } else {
      node.width = Math.round(clamp(start.width + dx, 190, 520));
      node.height = Math.round(clamp(start.height + (moveEvent.clientY - start.y) / zoom, 120, 420));
    }
    resized = true;
    persistSoon();
    syncNodeElementSize(node);
    requestAnimationFrame(evaluateIframeBudget);
  }
  function onUp() {
    if (resized && node.type === "website") refreshLiveIframe(node);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("pointerup", onUp);
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("pointerup", onUp);
}

function addWebsiteNode(siteId, x, y) {
  const site = mockWebsites.find((item) => item.id === siteId);
  if (!site) return;
  const canvas = currentCanvas();
  if (!canvas) return;
  const base = devices.desktop;
  const scale = 0.28;
  const node = {
    id: createId("node"),
    type: "website",
    websiteId: site.id,
    sourceFolderId: selectedFolderId,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(base.width * scale),
    height: Math.round(base.height * scale),
    scale,
    device: "desktop",
    status: "live",
    interactionMode: "canvas",
    iframeKey: 0,
    zIndex: getNextNodeZIndex(),
    createdAt: now(),
    updatedAt: now()
  };
  history.push(JSON.stringify(state));
  if (history.length > 80) history.shift();
  future = [];
  canvas.nodes.push(node);
  canvas.updatedAt = now();
  persistSoon();
  appendNodeElement(node);
}

function addNoteAtCenter() {
  const canvas = currentCanvas();
  if (!canvas) return;
  const area = app.querySelector("[data-canvas-area]");
  const rect = area.getBoundingClientRect();
  const point = screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2, area);
  const node = {
    id: createId("note"),
    type: "note",
    content: "",
    x: Math.round(point.x - 130),
    y: Math.round(point.y - 75),
    width: 260,
    height: 150,
    zIndex: getNextNodeZIndex(),
    createdAt: now(),
    updatedAt: now()
  };
  history.push(JSON.stringify(state));
  if (history.length > 80) history.shift();
  future = [];
  canvas.nodes.push(node);
  canvas.updatedAt = now();
  persistSoon();
  appendNodeElement(node);
  const editor = document.querySelector(`[data-note-editor="${node.id}"]`);
  if (editor) {
    editor.focus();
    editor.setSelectionRange(0, 0);
  }
}

function updateNode(nodeId, patch, options = {}) {
  const canvas = currentCanvas();
  const node = canvas?.nodes.find((item) => item.id === nodeId);
  if (!node) return;
  if (!options.skipHistory) {
    history.push(JSON.stringify(state));
    if (history.length > 80) history.shift();
    future = [];
  }
  Object.assign(node, patch, { updatedAt: now() });
  persistSoon();
  if (!options.noRender) render();
}

function deleteNode(nodeId) {
  const canvas = currentCanvas();
  if (!canvas) return;
  if (!canvas.nodes.some((node) => node.id === nodeId)) return;
  history.push(JSON.stringify(state));
  if (history.length > 80) history.shift();
  future = [];
  canvas.nodes = canvas.nodes.filter((node) => node.id !== nodeId);
  if (selectedNodeId === nodeId) selectedNodeId = null;
  canvas.updatedAt = now();
  document.querySelector(`[data-node-id="${nodeId}"]`)?.remove();
  clearNodeSelection();
  syncActivationShields();
  syncToolbarState();
  persistSoon();
  requestAnimationFrame(evaluateIframeBudget);
}

function enterPreview(nodeId) {
  const canvas = currentCanvas();
  const node = canvas.nodes.find((item) => item.id === nodeId);
  if (!node) return;
  if (node.status !== "live") {
    if (!promoteToLive(node)) {
      showToast("Live preview limit reached");
      return;
    }
  }
  setPreviewMode(nodeId, "preview");
}

function promoteToLive(node) {
  const canvas = currentCanvas();
  const live = canvas.nodes.filter((item) => item.type === "website" && item.status === "live");
  if (live.length < MAX_LIVE_IFRAMES) {
    node.status = "live";
    return true;
  }
  const releasable = live.find((item) => !isNodeVisible(item));
  if (releasable) {
    releasable.status = "screenshot";
    releasable.interactionMode = "canvas";
    node.status = "live";
    return true;
  }
  return false;
}

function evaluateIframeBudget() {
  const canvas = currentCanvas();
  if (!canvas) return;
  const websiteNodes = canvas.nodes.filter((node) => node.type === "website");
  let changed = false;
  for (const node of websiteNodes) {
    if (!isNodeVisible(node) && node.status === "live") {
      node.status = "screenshot";
      node.interactionMode = "canvas";
      changed = true;
    }
  }
  let liveCount = websiteNodes.filter((node) => node.status === "live").length;
  for (const node of websiteNodes) {
    if (liveCount >= MAX_LIVE_IFRAMES) break;
    if (isNodeVisible(node) && node.status === "screenshot") {
      node.status = "live";
      liveCount += 1;
      changed = true;
    }
  }
  if (changed) persistSoon();
  syncNodeStatuses();
}

function syncNodeStatuses() {
  const canvas = currentCanvas();
  if (!canvas) return;
  for (const node of canvas.nodes.filter((item) => item.type === "website")) {
    const el = document.querySelector(`[data-node-id="${node.id}"] .status-pill`);
    if (el) el.textContent = node.status;
    const refresh = document.querySelector(`[data-refresh="${node.id}"]`);
    if (refresh) refresh.disabled = node.status !== "live";
  }
}

function isNodeVisible(node) {
  const area = app.querySelector("[data-canvas-area]");
  if (!area) return false;
  const rect = area.getBoundingClientRect();
  const size = getNodeSize(node);
  const left = rect.left + pan.x + node.x * zoom;
  const top = rect.top + pan.y + node.y * zoom;
  const right = left + size.width * zoom;
  const bottom = top + (size.height + 40) * zoom;
  return right > rect.left && left < rect.right && bottom > rect.top && top < rect.bottom;
}

function getNodeSize(node) {
  if (node.type === "note") return { width: node.width, height: node.height };
  const base = devices[node.device || "desktop"];
  const scale = node.scale || 0.28;
  return {
    width: Math.round(base.width * scale),
    height: Math.round(base.height * scale)
  };
}

function buildIframeSrc(site, node) {
  const separator = site.url.includes("?") ? "&" : "?";
  return `${site.url}${separator}canvasReload=${node.iframeKey || 0}`;
}

function refreshLiveIframe(node) {
  if (!node || node.type !== "website" || node.status !== "live") return;
  const site = mockWebsites.find((item) => item.id === node.websiteId);
  if (!site) return;
  node.iframeKey = (node.iframeKey || 0) + 1;
  node.updatedAt = now();
  const nextSrc = buildIframeSrc(site, node);
  const iframe = document.querySelector(`[data-node-id="${node.id}"] .frame-viewport iframe`);
  if (iframe) iframe.src = nextSrc;
  persistSoon();
}

function screenToCanvas(clientX, clientY, area) {
  const rect = area.getBoundingClientRect();
  return {
    x: (clientX - rect.left - pan.x) / zoom,
    y: (clientY - rect.top - pan.y) / zoom
  };
}

function openContextMenu(x, y, siteId) {
  closeContextMenu();
  contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.innerHTML = `<button type="button">Import to Canvas</button>`;
  contextMenu.querySelector("button").addEventListener("click", () => {
    const area = app.querySelector("[data-canvas-area]");
    const rect = area.getBoundingClientRect();
    const point = screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2, area);
    addWebsiteNode(siteId, point.x, point.y);
    closeContextMenu();
  });
  document.body.appendChild(contextMenu);
  setTimeout(() => window.addEventListener("click", closeContextMenu, { once: true }), 0);
}

function closeContextMenu() {
  if (contextMenu) contextMenu.remove();
  contextMenu = null;
}

function showToast(message) {
  clearTimeout(toastTimer);
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    app.appendChild(toast);
  }
  toast.textContent = message;
  toastTimer = setTimeout(() => toast.remove(), 2400);
}

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    redo();
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
    return;
  }
  if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId && state.view === "workspace") {
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) return;
    event.preventDefault();
    deleteNode(selectedNodeId);
  }
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatCssNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function formatEditedTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "just now";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
