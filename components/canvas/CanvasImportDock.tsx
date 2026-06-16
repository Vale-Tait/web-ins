"use client";

import { CanvasWebsiteCard } from "@/components/canvas/CanvasWebsiteCard";
import styles from "@/components/canvas/canvas.module.css";
import { canvasGlassStyle } from "@/components/canvas/canvasStyles";
import type { Folder, LinkItem } from "@/lib/types";

export function CanvasImportDock({
  folders,
  links,
  selectedFolderId,
  folderSearch,
  websiteSearch,
  onFolderSearch,
  onWebsiteSearch,
  onSelectFolder,
  onClose,
  onOpenContextMenu
}: {
  folders: Folder[];
  links: LinkItem[];
  selectedFolderId: string;
  folderSearch: string;
  websiteSearch: string;
  onFolderSearch: (value: string) => void;
  onWebsiteSearch: (value: string) => void;
  onSelectFolder: (folderId: string) => void;
  onClose: () => void;
  onOpenContextMenu: (x: number, y: number, linkId: string) => void;
}) {
  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(folderSearch.toLowerCase()));
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? folders[0];
  const query = websiteSearch.trim().toLowerCase();
  const visibleLinks = links.filter((link) => {
    const inFolder = selectedFolder?.id === "all" ? true : link.folderIds.includes(selectedFolder?.id ?? "");
    if (!inFolder) return false;
    if (!query) return true;
    return [link.title, link.domain, link.url].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <div className={styles.importDock}>
      <aside className={`${styles.panel} ${styles.folderPanel}`} style={canvasGlassStyle}>
        <div className={styles.panelHeader}>
          <span className={styles.panelKicker}>Folders</span>
          <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close import">
            <span aria-hidden="true" />
          </button>
        </div>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true" />
          <input className={styles.searchField} value={folderSearch} onChange={(event) => onFolderSearch(event.target.value)} placeholder="Search folders..." />
        </div>
        <div className={`${styles.folderList} ${styles.softScrollbar}`}>
          {filteredFolders.map((folder) => (
            <button
              key={folder.id}
              className={`${styles.folderRow} ${folder.id === selectedFolderId ? styles.folderRowSelected : ""}`}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
            >
              <span>{folder.name}</span>
              <span className={styles.check}>{"\u2713"}</span>
            </button>
          ))}
        </div>
      </aside>
      <aside className={`${styles.panel} ${styles.websitePanel} ${styles.softScrollbar}`} style={canvasGlassStyle}>
        <h3 className={styles.websitePanelTitle}>{selectedFolder?.name ?? "Folder"}</h3>
        <p className={styles.websitePanelSubtitle}>Drag a card into the canvas or right click.</p>
        <div className={`${styles.searchWrap} ${styles.websiteSearchWrap}`}>
          <span className={styles.searchIcon} aria-hidden="true" />
          <input className={styles.searchField} value={websiteSearch} onChange={(event) => onWebsiteSearch(event.target.value)} placeholder="Search websites..." />
        </div>
        <div className={`${styles.websiteList} ${styles.softScrollbar}`}>
          {visibleLinks.map((link) => (
            <CanvasWebsiteCard
              key={link.id}
              link={link}
              onContextMenu={(event, linkId) => {
                event.preventDefault();
                onOpenContextMenu(event.clientX, event.clientY, linkId);
              }}
            />
          ))}
          {!visibleLinks.length ? <p className={styles.websiteEmpty}>No websites found.</p> : null}
        </div>
      </aside>
    </div>
  );
}
