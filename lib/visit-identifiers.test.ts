import { describe, expect, it } from "vitest";
import { formatEpisodeNo, formatUhid } from "@/lib/visit-identifiers";

describe("formatUhid", () => {
  it("trims the MRN for display as UHID", () => {
    expect(formatUhid("  MRN-2026-0001  ")).toBe("MRN-2026-0001");
  });
});

describe("formatEpisodeNo", () => {
  it("builds clinic/year/token episode numbers", () => {
    expect(
      formatEpisodeNo({
        queueDate: new Date("2026-07-20T00:00:00.000Z"),
        tokenNumber: 3,
      })
    ).toBe("OPD/26/0003");

    expect(
      formatEpisodeNo({
        queueDate: "2026-03-15",
        tokenNumber: 3704,
        clinicCode: "4600",
      })
    ).toBe("4600/26/3704");
  });
});
