import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { todayDateStringInClinic } from "@/lib/date-utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadBase64Pdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}

export function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

/** Clinic calendar "today" (Asia/Kolkata), not the server/browser local TZ. */
export function todayDateString(): string {
  return todayDateStringInClinic();
}
