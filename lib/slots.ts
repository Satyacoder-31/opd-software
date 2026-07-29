import {
  CLINIC_TIMEZONE,
  clinicCalendarParts,
  wallTimeInZoneToDate,
} from "@/lib/date-utils";

export type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPerSlot: number;
};

export type SlotOffer = {
  start: Date;
  end: Date;
  label: string;
  remaining: number;
};

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseHm(hm: string): { hours: number; minutes: number } | null {
  const match = hm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function dayOfWeekInZone(date: Date, timeZone: string): number {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return WEEKDAY_MAP[weekdayName] ?? 0;
}

/** Build Date at clinic calendar day + HH:mm in the given timezone. */
export function combineDateAndTime(
  date: Date,
  hm: string,
  timeZone: string = CLINIC_TIMEZONE
): Date | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;
  const { year, month, day } = clinicCalendarParts(date, timeZone);
  return wallTimeInZoneToDate(
    year,
    month,
    day,
    parsed.hours,
    parsed.minutes,
    timeZone
  );
}

/**
 * Generate candidate slots for a calendar day from recurring weekly windows,
 * excluding leaves and past times. Occupancy is applied via `applyOccupancy`.
 */
export function generateDaySlots(args: {
  date: Date;
  windows: AvailabilityWindow[];
  onLeave: boolean;
  now?: Date;
  timeZone?: string;
}): Omit<SlotOffer, "remaining">[] {
  const {
    date,
    windows,
    onLeave,
    now = new Date(),
    timeZone = CLINIC_TIMEZONE,
  } = args;
  if (onLeave) return [];

  const parts = clinicCalendarParts(date, timeZone);
  const dayAnchor = wallTimeInZoneToDate(
    parts.year,
    parts.month,
    parts.day,
    12,
    0,
    timeZone
  );
  const dayOfWeek = dayOfWeekInZone(dayAnchor, timeZone);

  const slots: Omit<SlotOffer, "remaining">[] = [];

  for (const window of windows) {
    if (window.dayOfWeek !== dayOfWeek) continue;
    const start = combineDateAndTime(dayAnchor, window.startTime, timeZone);
    const end = combineDateAndTime(dayAnchor, window.endTime, timeZone);
    if (!start || !end || end <= start) continue;

    const duration = Math.max(5, window.slotDuration);
    for (
      let cursor = new Date(start);
      cursor.getTime() + duration * 60_000 <= end.getTime();
      cursor = new Date(cursor.getTime() + duration * 60_000)
    ) {
      if (cursor.getTime() <= now.getTime()) continue;
      const slotEnd = new Date(cursor.getTime() + duration * 60_000);
      slots.push({
        start: new Date(cursor),
        end: slotEnd,
        label: cursor.toLocaleTimeString("en-IN", {
          timeZone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function applyOccupancy(
  slots: Omit<SlotOffer, "remaining">[],
  bookings: { scheduledAt: Date; count?: number }[],
  maxPerSlotDefault: number,
  maxByStart?: Map<number, number>,
): SlotOffer[] {
  const counts = new Map<number, number>();
  for (const booking of bookings) {
    const key = booking.scheduledAt.getTime();
    counts.set(key, (counts.get(key) ?? 0) + (booking.count ?? 1));
  }

  return slots
    .map((slot) => {
      const taken = counts.get(slot.start.getTime()) ?? 0;
      const max =
        maxByStart?.get(slot.start.getTime()) ?? maxPerSlotDefault;
      return { ...slot, remaining: Math.max(0, max - taken) };
    })
    .filter((slot) => slot.remaining > 0);
}
