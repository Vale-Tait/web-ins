import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  createSupabaseServerClient: vi.fn()
}));

describe("api route auth boundary", () => {
  it("returns 401 when folders are requested without a Supabase user", async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      }
    } as never);

    const { GET } = await import("@/app/api/folders/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when app bootstrap data is requested without a Supabase user", async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      }
    } as never);

    const { GET } = await import("@/app/api/app-data/route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
