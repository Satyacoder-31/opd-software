/** Age in whole years from a date of birth, as of a reference date (default today). */
export function ageFromDob(
  dateOfBirth: Date | string,
  asOf: Date = new Date()
): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function formatPatientAge(patient: {
  age?: number | null;
  dateOfBirth?: Date | string | null;
}): string | undefined {
  if (patient.dateOfBirth) {
    return `${ageFromDob(patient.dateOfBirth)} years`;
  }
  if (patient.age != null) {
    return `${patient.age} years`;
  }
  return undefined;
}

/** Clinic calendar timezone for OPD "today" (queue, reports). */
export const CLINIC_TIMEZONE = "Asia/Kolkata";

/**
 * Calendar date parts in the clinic timezone (not the host's local TZ).
 */
export function clinicCalendarParts(
  date: Date = new Date(),
  timeZone: string = CLINIC_TIMEZONE
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

/** YYYY-MM-DD for the clinic's current calendar day. */
export function todayDateStringInClinic(
  date: Date = new Date(),
  timeZone: string = CLINIC_TIMEZONE
): string {
  const { year, month, day } = clinicCalendarParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Midnight local Date representing the clinic's calendar day.
 * Safe for Prisma `@db.Date` fields (date-only semantics).
 */
export function clinicTodayDate(
  date: Date = new Date(),
  timeZone: string = CLINIC_TIMEZONE
): Date {
  const { year, month, day } = clinicCalendarParts(date, timeZone);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function parseLocalDateInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  return date;
}

export function parseLocalDateTimeInput(value: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0
  );
}

export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Format a time for display in the clinic timezone (hydration-safe when timezone is fixed). */
export function formatClinicTime(
  date: Date | string,
  timeZone: string = CLINIC_TIMEZONE
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format an HH:mm string as 12-hour clock, e.g. "09:00" → "9:00 AM". */
export function formatHm12Hour(hm: string): string {
  const match = hm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hm;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return hm;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function zoneParts(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
    hour: Number(parts.find((p) => p.type === "hour")?.value),
    minute: Number(parts.find((p) => p.type === "minute")?.value),
  };
}

/**
 * Convert a wall-clock date/time in `timeZone` to a UTC Date instant.
 * Iteratively corrects for the zone offset (handles IST and DST zones).
 */
export function wallTimeInZoneToDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string = CLINIC_TIMEZONE
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

  for (let i = 0; i < 4; i += 1) {
    const asZone = zoneParts(new Date(utcMs), timeZone);
    const desiredAsMinutes =
      ((year * 12 + month) * 31 + day) * 1440 + hours * 60 + minutes;
    const actualAsMinutes =
      ((asZone.year * 12 + asZone.month) * 31 + asZone.day) * 1440 +
      asZone.hour * 60 +
      asZone.minute;
    const deltaMinutes = desiredAsMinutes - actualAsMinutes;
    if (deltaMinutes === 0) break;
    utcMs += deltaMinutes * 60_000;
  }

  return new Date(utcMs);
}
