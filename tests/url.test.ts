import { describe, expect, it } from "vitest";
import { getDomain, normalizeUrl } from "@/lib/url";

describe("url helpers", () => {
  it("adds https when protocol is omitted", () => {
    expect(normalizeUrl("linear.app")).toBe("https://linear.app/");
  });

  it("normalizes domains without www", () => {
    expect(getDomain("https://www.makemepulse.com/")).toBe("makemepulse.com");
  });
});
