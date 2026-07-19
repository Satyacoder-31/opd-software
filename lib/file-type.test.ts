import { describe, expect, it } from "vitest";
import {
  detectMimeType,
  isAllowedAttachmentMime,
  MAX_ATTACHMENT_BASE64_LENGTH,
} from "@/lib/file-type";

describe("detectMimeType", () => {
  it("detects PDF, JPEG, PNG, and WebP signatures", () => {
    expect(detectMimeType(Buffer.from("%PDF-1.4"))).toBe("application/pdf");
    expect(detectMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg"
    );
    expect(
      detectMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe("image/png");
    expect(
      detectMimeType(
        Buffer.concat([
          Buffer.from("RIFF"),
          Buffer.from([0, 0, 0, 0]),
          Buffer.from("WEBP"),
        ])
      )
    ).toBe("image/webp");
  });

  it("rejects mismatched or unknown content", () => {
    expect(detectMimeType(Buffer.from("not-a-file"))).toBeNull();
    expect(isAllowedAttachmentMime("application/pdf", "image/jpeg")).toBe(
      false
    );
    expect(isAllowedAttachmentMime("application/pdf", "application/pdf")).toBe(
      true
    );
  });

  it("defines a base64 length ceiling above max bytes", () => {
    expect(MAX_ATTACHMENT_BASE64_LENGTH).toBeGreaterThan(5 * 1024 * 1024);
  });
});
