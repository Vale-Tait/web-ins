import { describe, expect, it, vi } from "vitest";
import { ensureDefaultFolder } from "@/lib/supabase-repository";

const folder = { id: "default-id", name: "Unsorted", is_default: true };

function client(existing: unknown, error: { code: string; message: string } | null, concurrent: unknown = folder) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
      .mockResolvedValueOnce({ data: existing, error: null })
      .mockResolvedValueOnce({ data: concurrent, error: null }),
    single: vi.fn().mockResolvedValue({ data: error ? null : folder, error })
  };
  return { db: { from: vi.fn(() => query) }, query };
}

describe("default folder initialization", () => {
  it("reuses an existing default without inserting", async () => {
    const { db, query } = client(folder, null);
    await expect(ensureDefaultFolder(db as never, "user-1")).resolves.toEqual(folder);
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("creates a missing default", async () => {
    const { db } = client(null, null);
    await expect(ensureDefaultFolder(db as never, "user-1")).resolves.toEqual(folder);
  });

  it("recovers from a concurrent insert using the same user's default", async () => {
    const { db, query } = client(null, { code: "23505", message: "duplicate key" });
    await expect(ensureDefaultFolder(db as never, "user-1")).resolves.toEqual(folder);
    expect(query.eq.mock.calls).toEqual([
      ["user_id", "user-1"], ["is_default", true],
      ["user_id", "user-1"], ["is_default", true]
    ]);
  });

  it("preserves a conflict when no default can be found", async () => {
    const { db } = client(null, { code: "23505", message: "duplicate key" }, null);
    await expect(ensureDefaultFolder(db as never, "user-1")).rejects.toThrow("duplicate key");
  });

  it("does not hide other database errors", async () => {
    const { db } = client(null, { code: "42501", message: "permission denied" });
    await expect(ensureDefaultFolder(db as never, "user-1")).rejects.toThrow("permission denied");
  });
});
