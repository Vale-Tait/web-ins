# Canvas MVP Handoff

Last updated: 2026-06-14

## Task Goal

Build an isolated Canvas MVP prototype for WebInsprition without changing the existing Next/React product canvas route. The prototype is used to validate UI and interaction before deciding whether to migrate the feature into the product codebase.

The prototype lives in `canvas-mvp/` and is intentionally plain `HTML + CSS + JavaScript`:

- `canvas-mvp/index.html`
- `canvas-mvp/styles.css`
- `canvas-mvp/app.js`

Do not wire this prototype into the existing app yet. The agreed direction is to keep it independent until the user approves the MVP.

Design direction follows the existing WebInsprition style:

- low-saturation tool UI
- mono labels
- small radius
- light glass panels
- restrained hover states
- no large gradients or decorative effects

The latest cache-bust version in `canvas-mvp/index.html` is `20260613-05`.

## Completed Work

### Canvas List Page

Implemented the Canvas history/list view in `renderList()` in `canvas-mvp/app.js`.

Current behavior:

- Shows historical canvases as large card components.
- Each card shows:
  - real canvas thumbnail
  - canvas name
  - last edited time via `formatEditedTime()`
- Bottom-center create button opens `Create New Canvas` dialog.
- Canvas card hover shows an `Edit` button.
- Edit menu has:
  - `Rename canvas`
  - `Delete canvas`
- Rename opens a rename modal.
- Delete opens a confirm modal.

Important implementation details:

- Canvas cards are rendered by `renderList()`.
- Canvas card menu is rendered by `renderCanvasCardMenu(canvas)`.
- Rename modal:
  - `renderRenameCanvasDialog(canvas)`
  - `bindRenameCanvasDialog(dialog)`
- Delete modal:
  - `renderDeleteCanvasDialog(canvas)`
  - `bindDeleteCanvasDialog(dialog)`
- Create modal:
  - `renderCreateCanvasDialog()`
  - `bindCreateCanvasDialog(dialog)`

### Real Canvas Thumbnail

The Canvas list thumbnail no longer uses a fake placeholder or a cropped last viewport screenshot.

Current behavior:

- `renderCanvasThumbnail(canvas)` fits all canvas nodes into the thumbnail.
- It computes all node bounds with `getCanvasContentBounds(nodes)`.
- It computes a thumbnail transform with `getCanvasThumbnailTransform(bounds)`.
- It renders notes and website frames in their true relative positions.
- It preserves z-order by sorting nodes by `zIndex`.
- Empty canvases still show only the grid.

Why this matters:

- The user explicitly requested the list preview to show the full real canvas content, including all website frames and notes, not a simulated preview image.

Relevant code:

- `canvas-mvp/app.js`
  - `renderCanvasThumbnail(canvas)`
  - `getCanvasContentBounds(nodes)`
  - `getCanvasThumbnailTransform(bounds)`
  - `renderThumbnailNode(node, transform)`

Relevant style:

- `canvas-mvp/styles.css`
  - `.canvas-thumb`
  - `.canvas-thumb-node`
  - `.thumb-website`
  - `.thumb-note`

### Workspace

Implemented a standalone infinite canvas workspace.

Current behavior:

- Top bar:
  - `Back`
  - canvas name
  - save state
- Main area:
  - grid background
  - draggable nodes
  - zoomable world
- Bottom toolbar:
  - `Import Website`
  - `Add Note`
  - `Undo`
  - `Redo`
- Canvas pan:
  - hold middle mouse button and drag
  - cursor becomes `grabbing` only while middle mouse drag is active
- Canvas zoom:
  - `Ctrl + wheel`
  - background grid scales with zoom
- Auto-save:
  - `persistSoon()` saves after 800ms
  - localStorage key: `webinsprition:canvas-mvp:v1`

Important implementation details:

- Workspace render entry: `renderWorkspace()`.
- Canvas viewport state:
  - `pan`
  - `zoom`
  - `canvas.viewport.pan`
  - `canvas.viewport.zoom`
  - `canvas.viewport.size`
- Viewport persistence:
  - `restoreCanvasViewport(canvas)`
  - `saveCanvasViewport(options = {})`
- `Back` calls `saveCanvasViewport({ persist: true })` before returning to the list.

### Import Dock

Implemented Folder Select Panel and Website Card Preview Panel.

Current behavior:

- `Import Website` opens a floating import dock under the top bar.
- Folder panel appears above website panel.
- Folder panel:
  - simple folder names only
  - search input: `Search folders...`
  - right-side checkmark for current folder
  - does not close when folder is selected
  - scrolls only when more than 4 folder rows are visible
- Website panel:
  - appears below folder panel
  - title is the selected folder name
  - helper text: `Drag a card into the canvas or right click.`
  - website search input: `Search websites...`
  - two columns
  - card preview width follows panel width
  - preview aspect ratio is now `16 / 9`
  - scrolls when more than 3 rows of website cards are visible
  - no `LINK` badge below cards

Important implementation details:

- `mockFolders` contains more folders than the UI needs so scrollbar behavior can be tested.
- `mockWebsites` contains multiple Agency websites so the website list scroll behavior can be tested.
- Import dock render:
  - `renderImportDock()`
  - `syncImportDock(area)`
  - `bindImportDockEvents(area)`
- Website card render:
  - `renderWebsiteCard(site)`
- Folder and website search terms:
  - `searchTerm`
  - `websiteSearchTerm`

Relevant style:

- `canvas-mvp/styles.css`
  - `.import-dock`
    - `--folder-panel-width: 440px`
    - `--website-panel-width: 660px`
    - the website panel is 1.5x the folder panel width
  - `.folder-list`
    - `max-height: 202px`
    - based on 4 rows
  - `.website-list`
    - `grid-template-columns: repeat(2, minmax(0, 1fr))`
    - `max-height: 594px`
    - based on 3 rows after the wider 16:9 cards
  - `.site-preview`
    - `aspect-ratio: 16 / 9`

### Website Preview Art

The prototype no longer uses skeleton bars for website previews.

Current behavior:

- Import list cards use preview art.
- Canvas list website thumbnails use preview art.
- Non-live/screenshot website frames use preview art.
- Preview art is generated by one helper: `renderPreviewArt(site)`.

Implemented preview variants:

- `makemepulse`
- `pinterest`
- `isa`
- `studio`
- `dark`
- `dark-alt`
- `editorial`

Important detail:

- Existing product `components/PreviewArt.tsx` only has real custom visuals for `makemepulse` and `isa`; other domains fall back to `Loading preview...`.
- In this MVP, additional SVG-based generated previews were added so the website list and screenshot frames do not look like loading placeholders.
- These are generated SVG/HTML previews, not real screenshot files.

Relevant code:

- `canvas-mvp/app.js`
  - `mockWebsites`
  - `renderPreviewArt(site)`
  - `inferPreviewKind(site)`
  - `renderWebsiteCard(site)`
  - `renderScreenshot(site)`
  - `renderThumbnailNode(node, transform)`

### Website Frame

Implemented draggable/resizable website preview windows.

Current behavior:

- Default device: `desktop`
- Devices:
  - `desktop`: `1440 x 900`
  - `tablet`: `1024 x 768`
  - `mobile`: `390 x 844`
- Tablet is landscape only.
- Top frame bar:
  - refresh button on left
  - delete button on left
  - status pill next to delete
  - folder/source name centered
  - device tabs on right
- Refresh button:
  - only enabled when frame status is `live`
- Device tabs:
  - `Desktop`
  - `Tablet`
  - `Mobile`
  - hover effect added
  - switching device calls `refreshLiveIframe(node)` when possible
- Resizing:
  - constrained by `WEBSITE_FRAME_MIN_WIDTH = 190`
  - constrained by `WEBSITE_FRAME_MAX_WIDTH = 1400`
  - preserves device aspect ratio
  - refreshes live iframe only when resize completes
- Preview mode:
  - default canvas mode: iframe has `pointer-events: none`
  - double-click enters preview mode
  - preview mode sets iframe interaction to active
  - `Exit Preview` appears outside the frame at bottom-left

Refresh decision:

- The user clarified that preview iframe auto-refresh must only happen after:
  - website frame resize completes
  - user changes device ratio via top-right device tabs
- Other actions must not refresh iframes:
  - Add Note
  - Import Website panel interactions
  - Undo / Redo
  - Delete note
  - Delete website frame
  - Folder/website search
  - Refreshing the import panel

Relevant code:

- `renderWebsiteFrame(node)`
- `setNodeDevice(nodeId, device)`
- `startResize(event, nodeId)`
- `refreshLiveIframe(node)`
- `evaluateIframeBudget()`
- `tryPromoteToLive(node)`

### Smart Iframe Strategy

Implemented an MVP version of the intelligent iframe policy.

Current behavior:

- Max live iframe count: `MAX_LIVE_IFRAMES = 5`
- Node statuses include:
  - `loading`
  - `live`
  - `screenshot`
  - `blocked`
  - `failed`
- New website nodes start as `live` when live slots are available.
- Nodes outside the viewport can be downgraded to `screenshot`.
- Visible screenshot nodes can be promoted back to `live` if budget is available.
- Double-click screenshot frame attempts to load iframe.
- If live count is full, the system tries to release a candidate.
- If no candidate can be released, it shows the toast:
  - `当前实时预览数量已达上限`

Known limitation:

- Real websites can still refuse iframe embedding because of `X-Frame-Options` or CSP. This is expected for a prototype. Screenshot fallback uses `renderPreviewArt(site)`.

### Note Node

Implemented editable note nodes.

Current behavior:

- `Add Note` creates a note at the current viewport center.
- Empty note uses textarea placeholder `Write a note...`.
- Caret appears because the text is a real placeholder, not node content.
- Note supports:
  - edit
  - drag
  - resize
  - delete button
  - keyboard delete
  - auto-save

Important implementation details:

- `renderNote(node)` uses `<textarea class="note-editor" placeholder="Write a note...">`.
- Delete button uses `.note-delete-button`.
- Node selection border clears when clicking blank canvas or other controls.

### Z-Index And Overlap Fixes

Several fixes were made for overlapping windows.

Current behavior:

- Clicking an exposed area of a lower window brings that window to the front.
- Non-top nodes get an activation shield so the lower node can receive a click even when overlapped.
- The selected border disappears when clicking blank canvas or another window.
- Right-click no longer leaves a black focus outline on website cards.
- Website frame selected border has rounded corners instead of sharp corners.
- Resize handles and frame top controls have corrected stacking.

Relevant code:

- `normalizeNodeStack(canvas)`
- `isTopNode(node, canvas)`
- `getTopNodeId(canvas)`
- `bringNodeToFront(nodeId)`
- `renderActivationShield(node.id)`
- `syncActivationShields()`

### Dialog And Close Button Styling

Several close/delete icon refinements were made.

Current behavior:

- Import panel close button, Rename Canvas close button, Delete Canvas close button:
  - `32px x 32px`
  - no border
  - `border-radius: 3px`
  - CSS-drawn centered X
  - hover background: `var(--muted-panel)` / `rgb(247, 247, 248)`
- Create New Canvas close button:
  - matches the product `Create New Folder` dialog close button
  - `32px x 32px`
  - `2px` accent border
  - default square corners
  - hover gray background
  - click/closing state briefly changes to rounded and scaled down
  - the dialog closes after 120ms

Relevant code:

- `canvas-mvp/app.js`
  - `renderCreateCanvasDialog()`
  - `bindCreateCanvasDialog(dialog)`
- `canvas-mvp/styles.css`
  - `.dialog-close`
  - `.close-button`
  - `.dialog-close.dialog-shape-close`

## Key Decisions And Reasons

### Keep The Prototype Isolated

Decision:

- Build everything in `canvas-mvp/`.
- Do not integrate into existing `/canvas`.
- Do not modify existing Next/React canvas code.

Reason:

- The user wants to validate UI and interaction first. Integrating too early would add migration risk and make iteration slower.

### Use Plain HTML/CSS/JS

Decision:

- No React, Next, React Flow, Supabase, API, or new dependencies.

Reason:

- This keeps the prototype fast to open, easy to inspect, and independent of product architecture.

### Use Mock Data And LocalStorage

Decision:

- Use mock folders/websites/canvases in `app.js`.
- Persist to `localStorage` key `webinsprition:canvas-mvp:v1`.

Reason:

- The goal is UI/interaction validation, not backend correctness.

### Render Real Canvas Contents In List Preview

Decision:

- Fit all canvas nodes into a thumbnail instead of using a fake static image or last viewport crop.

Reason:

- The user explicitly requested Canvas list previews to show the complete true canvas state.

### Use Generated Preview Art Instead Of Skeletons

Decision:

- Replace skeleton bars with generated SVG preview art through `renderPreviewArt(site)`.

Reason:

- The user requested the website list and canvas thumbnails to use card-preview-like visuals from the product, not placeholder skeletons.

Tradeoff:

- These are still generated preview visuals, not real screenshot captures. Real screenshot data should replace this later if integrating with the product.

### Iframe Refresh Must Be Narrowly Scoped

Decision:

- Auto-refresh live iframe only when:
  - website frame resize finishes
  - device tab changes

Reason:

- The user observed that unrelated canvas operations were causing preview reloads. This was disorienting and made iframe state unstable.

### Remove Browser Back/Forward From Frame

Decision:

- Browser-like back/forward controls were removed.

Reason:

- Cross-origin iframe navigation state is not reliably observable from the parent page. The user decided to drop the feature.

### Tablet Is Landscape Only

Decision:

- Tablet dimensions are `1024 x 768`.

Reason:

- The user requested tablet preview default to horizontal and not support portrait.

## Modified Files

### Created

- `canvas-mvp/index.html`
- `canvas-mvp/styles.css`
- `canvas-mvp/app.js`
- `docs/HANDOFF.md`

### Existing Product Files Read For Reference

These were used only as references; they should not be treated as modified MVP implementation files:

- `design.md`
- `components/PreviewArt.tsx`
- `components/CreateFolderDialog.tsx`
- `components/LinkTile.tsx`
- `app/globals.css`

## Current Issues

No blocking issue is known at the time of this handoff. The latest requested change was completed:

- `Create New Canvas` close button now matches the product `Create New Folder` close button behavior.

Known prototype limitations remain:

1. This is still a standalone prototype, not product-integrated code.
2. Data is mock-only and stored in localStorage.
3. Website preview art is generated SVG/HTML, not real screenshot URLs.
4. Live iframe behavior depends on target websites allowing embedding.
5. There is no committed automated test suite; verification has been done with `node --check` and ad hoc Playwright scripts.
6. If the user sees stale UI after changes, check the cache-bust version in `index.html` and browser localStorage key `webinsprition:canvas-mvp:v1`.

## Verification Already Run

Verification commands and checks used during the work:

- Syntax:
  - `node --check .\canvas-mvp\app.js`
- Browser verification with Playwright scripts:
  - Canvas list thumbnail contains all test nodes inside the thumbnail bounds.
  - Import cards use `.preview-art`.
  - Screenshot fallback uses `.preview-art`.
  - Old skeleton selectors are gone from generated UI.
  - Website card preview ratio is `16:9`.
  - Dialog close buttons are centered and have correct hover/click states.
  - Console has no page errors in those checks.

Generated local screenshots from validation are under:

- `output/playwright/canvas-mvp-real-preview-art.png`
- `output/playwright/canvas-mvp-list-real-content.png`
- `output/playwright/canvas-mvp-close-buttons.png`
- `output/playwright/canvas-mvp-website-list-16-9.png`

These are verification artifacts, not product assets.

## Next Step Plan

Recommended next steps:

1. Let the user do visual QA in `canvas-mvp/index.html`.
2. Fix any remaining MVP UI details in `canvas-mvp/` only.
3. When the user approves the prototype, create a separate migration plan before touching the existing product canvas route.
4. For migration planning, map prototype concepts to product data:
   - mock folders -> real folders
   - mock websites -> real links / screenshots
   - `renderPreviewArt()` -> real screenshot URL or product `PreviewArt`
   - localStorage state -> product persistence model
   - canvas nodes -> product canvas node schema
5. Before integration, decide whether the product should use:
   - existing React Flow canvas
   - a custom canvas layer like this MVP
   - hybrid approach
6. Add real automated tests only after the implementation direction is stable.

## Practical Notes For The Next Conversation

Open the prototype directly:

```text
C:\Users\L\work\WebInsprition\canvas-mvp\index.html
```

Or use a local static server if browser file restrictions become annoying.

Main implementation entry points:

- List view:
  - `renderList()`
  - `renderCanvasThumbnail(canvas)`
- Workspace:
  - `renderWorkspace()`
  - `bindWorkspaceEvents(area, world, canvas)`
- Import panel:
  - `renderImportDock()`
  - `bindImportDockEvents(area)`
- Website frames:
  - `renderWebsiteFrame(node)`
  - `renderScreenshot(site)`
  - `setNodeDevice(nodeId, device)`
  - `refreshLiveIframe(node)`
- Notes:
  - `renderNote(node)`
  - `addNoteAtCenter()`
- Preview art:
  - `renderPreviewArt(site)`
- Persistence:
  - `persistSoon()`
  - `saveCanvasViewport(options)`
  - `restoreCanvasViewport(canvas)`

Be careful with these requirements because they were explicitly corrected by the user:

- Folder selection should not close the folder panel.
- Website preview panel is below the folder panel.
- Website list cards are two columns and preview ratio is `16:9`.
- Folder list scrolls only beyond 4 rows.
- Website list scrolls only beyond 3 rows.
- Website frame refresh should not be triggered by unrelated operations.
- Delete note/frame should not refresh iframe previews.
- Canvas list thumbnail must show all real canvas contents, not a fake placeholder and not just the last viewport crop.
- The Create New Canvas dialog close button should match the product Create New Folder close button, not the generic close button style.
