/**
 * Safe client-side bridge for Electron desktop environment capabilities
 */

export interface DesktopEnv {
  isDesktop?: boolean;
  platform?: string;
  version?: string;
  openPdf?: (
    base64Data: string,
    filename?: string
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  printHtml?: (
    htmlContent: string
  ) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    desktopEnv?: DesktopEnv;
  }
}

export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.desktopEnv?.isDesktop);
}

export async function openDesktopPdf(
  base64Data: string,
  filename?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (typeof window !== "undefined" && window.desktopEnv?.openPdf) {
    try {
      return await window.desktopEnv.openPdf(base64Data, filename);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to open PDF in desktop app",
      };
    }
  }
  return { success: false, error: "Desktop environment not available" };
}

export async function printDesktopHtml(
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== "undefined" && window.desktopEnv?.printHtml) {
    try {
      return await window.desktopEnv.printHtml(htmlContent);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to print in desktop app",
      };
    }
  }
  return { success: false, error: "Desktop environment not available" };
}

