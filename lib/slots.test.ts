import { describe, expect, it } from "vitest";
import { applyOccupancy, generateDaySlots } from "@/lib/slots";
import { wallTimeInZoneToDate } from "@/lib/date-utils";

describe("generateDaySlots", () => {
  it("builds 15-minute slots inside a morning window and skips the past", () => {
    const date = wallTimeInZoneToDate(2030, 6, 3, 12, 0, "Asia/Kolkata"); // Monday
    const now = wallTimeInZoneToDate(2030, 6, 3, 8, 0, "Asia/Kolkata");
    const slots = generateDaySlots({
      date,
      now,
      timeZone: "Asia/Kolkata",
      onLeave: false,
      windows: [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          slotDuration: 15,
          maxPerSlot: 1,
        },
      ],
    });
    expect(slots).toHaveLength(4);
    expect(slots[0]?.label).toMatch(/9:00\s*(am|AM)/i);
    expect(slots[0]?.start.getTime()).toBe(
      wallTimeInZoneToDate(2030, 6, 3, 9, 0, "Asia/Kolkata").getTime(),
    );
    expect(slots[0]?.end.getTime()).toBe(
      wallTimeInZoneToDate(2030, 6, 3, 9, 15, "Asia/Kolkata").getTime(),
    );
  });

  it("returns no slots on leave days", () => {
    const slots = generateDaySlots({
      date: wallTimeInZoneToDate(2030, 6, 3, 12, 0, "Asia/Kolkata"),
      timeZone: "Asia/Kolkata",
      onLeave: true,
      windows: [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "12:00",
          slotDuration: 15,
          maxPerSlot: 1,
        },
      ],
    });
    expect(slots).toEqual([]);
  });
});

describe("applyOccupancy", () => {
  it("hides fully booked slots", () => {
    const start = wallTimeInZoneToDate(2030, 6, 3, 9, 0, "Asia/Kolkata");
    const end = wallTimeInZoneToDate(2030, 6, 3, 9, 15, "Asia/Kolkata");
    const offers = applyOccupancy(
      [{ start, end, label: "09:00" }],
      [{ scheduledAt: start }],
      1,
    );
    expect(offers).toEqual([]);
  });
});
