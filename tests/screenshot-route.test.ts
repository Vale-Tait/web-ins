import { beforeEach, describe, expect, it, vi } from "vitest";

const captureHomepageScreenshot = vi.fn();

vi.mock("@/lib/screenshot-capture", () => ({
  captureHomepageScreenshot
}));

describe("screenshot route", () => {
  beforeEach(() => {
    vi.resetModules();
    captureHomepageScreenshot.mockReset();
  });

  it("captures the normalized homepage instead of the submitted deep URL", async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    captureHomepageScreenshot.mockResolvedValue(png);

    const { GET } = await import("@/app/api/screenshots/route");
    const response = await GET(
      new Request("http://localhost/api/screenshots?url=https%3A%2F%2Fisadeburgh.com%2Fwork%3Fref%3Donepagelove&w=900")
    );

    expect(captureHomepageScreenshot).toHaveBeenCalledWith("https://isadeburgh.com/", {
      width: 900,
      height: 570
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    await expect(response.arrayBuffer()).resolves.toEqual(png.buffer);
  });

  it("returns an unavailable preview instead of a loading screenshot when capture fails", async () => {
    captureHomepageScreenshot.mockRejectedValue(new Error("Blocking loader still visible"));

    const { GET } = await import("@/app/api/screenshots/route");
    const response = await GET(new Request("http://localhost/api/screenshots?url=https%3A%2F%2Fexample.com%2F"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(body).toContain("Preview unavailable");
  });

  it("reuses cached captures for the same homepage and width", async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    captureHomepageScreenshot.mockResolvedValue(png);

    const { GET } = await import("@/app/api/screenshots/route");
    const first = await GET(new Request("http://localhost/api/screenshots?url=https%3A%2F%2Fexample.com%2Fdeep&w=900"));
    const second = await GET(new Request("http://localhost/api/screenshots?url=https%3A%2F%2Fexample.com%2Fother&w=900"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(captureHomepageScreenshot).toHaveBeenCalledTimes(1);
  });
});
