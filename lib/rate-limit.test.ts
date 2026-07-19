import { describe, expect, it } from "vitest";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-allow`;

    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `test-${Date.now()}-block`;

    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);

    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("getClientIp", () => {
  it("prefers Vercel / real-ip over spoofable X-Forwarded-For", () => {
    expect(
      getClientIp("1.1.1.1, 2.2.2.2", "9.9.9.9", "8.8.8.8, 7.7.7.7")
    ).toBe("8.8.8.8");
    expect(getClientIp("1.1.1.1", "9.9.9.9", null)).toBe("9.9.9.9");
    expect(getClientIp("1.1.1.1, 2.2.2.2", null, null)).toBe("1.1.1.1");
    expect(getClientIp(null, null, null)).toBe("unknown");
  });
});
