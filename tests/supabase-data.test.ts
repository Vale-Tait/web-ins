import { describe, expect, it } from "vitest";
import { getSupabasePublicConfig, hasSupabasePublicEnv } from "@/lib/env";
import {
  buildFolderIdMap,
  mapCanvasRowsToApp,
  mapFolderRowsToApp,
  mapFolderIdsToDatabase,
  mapLinkRowsToApp
} from "@/lib/supabase-data";

const now = "2026-06-18T08:00:00.000Z";

describe("supabase data mapping", () => {
  it("accepts the publishable key env var and keeps anon key as a fallback", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousPublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(hasSupabasePublicEnv()).toBe(true);
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://example.supabase.co",
      key: "sb_publishable_test"
    });

    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon_test";

    expect(getSupabasePublicConfig()).toEqual({
      url: "https://example.supabase.co",
      key: "legacy_anon_test"
    });

    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousPublishable;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnon;
  });

  it("maps database folders to stable app folder ids", () => {
    const rows = [
      {
        id: "uuid-unsorted",
        name: "Unsorted",
        description: null,
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        id: "uuid-agency",
        name: "Agency",
        description: "References",
        is_default: false,
        created_at: now,
        updated_at: now
      }
    ];

    expect(mapFolderRowsToApp(rows)).toEqual([
      { id: "all", name: "All Items", description: null, isDefault: true, createdAt: now, updatedAt: now },
      { id: "unsorted", name: "Unsorted", description: null, isDefault: true, createdAt: now, updatedAt: now },
      { id: "uuid-agency", name: "Agency", description: "References", isDefault: false, createdAt: now, updatedAt: now }
    ]);

    const idMap = buildFolderIdMap(rows);
    expect(mapFolderIdsToDatabase(["all", "unsorted", "uuid-agency"], idMap)).toEqual(["uuid-unsorted", "uuid-agency"]);
  });

  it("round-trips full canvas viewport and node interaction state", () => {
    const canvases = [
      {
        id: "canvas-db-id",
        name: "Agency Research",
        thumbnail_url: null,
        viewport: { pan: { x: 120, y: 80 }, zoom: 0.5, size: { width: 1440, height: 900 } },
        created_at: now,
        updated_at: now,
        canvas_nodes: [
          {
            id: "node-db-id",
            canvas_id: "canvas-db-id",
            type: "website",
            link_id: "link-db-id",
            source_folder_id: "uuid-agency",
            content: "makemepulse.com",
            x: 20,
            y: 40,
            width: 871,
            height: 544,
            scale: 0.5,
            device_view: "tablet",
            status: "screenshot",
            interaction_mode: "canvas",
            iframe_key: 3,
            load_failed: true,
            z_index: 9,
            created_at: now,
            updated_at: now
          }
        ]
      }
    ];

    expect(mapCanvasRowsToApp(canvases, { "uuid-agency": "agency" })).toEqual([
      {
        id: "canvas-db-id",
        name: "Agency Research",
        thumbnailUrl: null,
        viewport: { pan: { x: 120, y: 80 }, zoom: 0.5, size: { width: 1440, height: 900 } },
        nodes: [
          {
            id: "node-db-id",
            canvasId: "canvas-db-id",
            type: "website",
            linkId: "link-db-id",
            sourceFolderId: "agency",
            content: "makemepulse.com",
            x: 20,
            y: 40,
            width: 871,
            height: 544,
            scale: 0.5,
            deviceView: "tablet",
            status: "screenshot",
            interactionMode: "canvas",
            iframeKey: 3,
            loadFailed: true,
            zIndex: 9,
            createdAt: now,
            updatedAt: now
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ]);
  });

  it("maps link relationship rows into app links", () => {
    const links = mapLinkRowsToApp(
      [
        {
          id: "link-db-id",
          url: "https://makemepulse.com/",
          domain: "makemepulse.com",
          title: "makemepulse.com",
          description: "Saved reference",
          screenshot_url: "data:image/svg+xml",
          note: "Nice motion",
          status: "ready",
          created_at: now,
          updated_at: now,
          link_folders: [{ folder_id: "uuid-unsorted" }, { folder_id: "uuid-agency" }],
          link_tags: [{ tags: { name: "Agency" } }],
          analysis_results: {
            id: "analysis-db-id",
            link_id: "link-db-id",
            fonts: ["Suisse"],
            animations: ["GSAP"],
            tech_stack: ["Next.js"],
            colors: ["#111111"],
            created_at: now,
            updated_at: now
          }
        }
      ],
      { "uuid-unsorted": "unsorted", "uuid-agency": "agency" }
    );

    expect(links[0]).toEqual({
      id: "link-db-id",
      url: "https://makemepulse.com/",
      domain: "makemepulse.com",
      title: "makemepulse.com",
      description: "Saved reference",
      screenshotUrl: "data:image/svg+xml",
      note: "Nice motion",
      status: "ready",
      folderIds: ["unsorted", "agency"],
      tags: ["Agency"],
      analysis: {
        id: "analysis-db-id",
        linkId: "link-db-id",
        fonts: ["Suisse"],
        animations: ["GSAP"],
        techStack: ["Next.js"],
        colors: ["#111111"],
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now
    });
  });

  it("deduplicates repeated link rows by normalized URL", () => {
    const links = mapLinkRowsToApp(
      [
        {
          id: "link-newer",
          url: "https://editorialnew.com/",
          domain: "editorialnew.com",
          title: "editorialnew.com",
          description: "Saved reference",
          screenshot_url: "/api/screenshots?url=https%3A%2F%2Feditorialnew.com%2F&w=1200",
          note: "Saved from Analyze.",
          status: "ready",
          created_at: "2026-06-18T09:00:00.000Z",
          updated_at: "2026-06-18T09:00:00.000Z",
          link_folders: [{ folder_id: "uuid-unsorted" }],
          link_tags: [{ tags: { name: "Analyzed" } }],
          analysis_results: null
        },
        {
          id: "link-older",
          url: "https://editorialnew.com/#intro",
          domain: "editorialnew.com",
          title: "editorialnew.com",
          description: "Saved reference",
          screenshot_url: "/api/screenshots?url=https%3A%2F%2Feditorialnew.com%2F&w=1200",
          note: "",
          status: "ready",
          created_at: "2026-06-18T08:00:00.000Z",
          updated_at: "2026-06-18T08:00:00.000Z",
          link_folders: [{ folder_id: "uuid-agency" }],
          link_tags: [{ tags: { name: "Editorial" } }],
          analysis_results: null
        }
      ],
      { "uuid-unsorted": "unsorted", "uuid-agency": "agency" }
    );

    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("link-newer");
    expect(links[0].folderIds).toEqual(["unsorted", "agency"]);
    expect(links[0].tags).toEqual(["Analyzed", "Editorial"]);
  });
});
