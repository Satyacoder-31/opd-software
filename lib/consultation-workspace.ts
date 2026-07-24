export const WORKSPACE_TABS = [
  { id: "consultation", label: "Consultation", shortcut: "1" },
  { id: "prescription", label: "Prescription", shortcut: "2" },
  { id: "investigations", label: "Investigations", shortcut: "3" },
  { id: "documents", label: "Documents", shortcut: "4" },
] as const;

export type WorkspaceTabId = (typeof WORKSPACE_TABS)[number]["id"];

export type WorkspaceSectionId =
  | "ws-vitals"
  | "ws-essentials"
  | "ws-history"
  | "ws-examination"
  | "ws-notes"
  | "ws-prescription"
  | "ws-advice"
  | "ws-investigations"
  | "ws-documents";

export function isWorkspaceTabId(value: string): value is WorkspaceTabId {
  return WORKSPACE_TABS.some((tab) => tab.id === value);
}

/** Keyboard event shape used by workspace shortcut helpers (DOM-agnostic for tests). */
export type WorkspaceShortcutEvent = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey?: boolean;
};

export function workspaceShortcutTab(
  event: WorkspaceShortcutEvent,
): WorkspaceTabId | null {
  if (!event.altKey || event.ctrlKey || event.metaKey) return null;
  const match = WORKSPACE_TABS.find((tab) => tab.shortcut === event.key);
  return match?.id ?? null;
}

export function isSaveDraftShortcut(event: WorkspaceShortcutEvent): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    event.key.toLowerCase() === "s"
  );
}

export function isCompleteVisitShortcut(
  event: WorkspaceShortcutEvent,
): boolean {
  return (
    (event.ctrlKey || event.metaKey) && !event.altKey && event.key === "Enter"
  );
}

export function tabForWorkspaceSection(
  section: WorkspaceSectionId,
): WorkspaceTabId {
  switch (section) {
    case "ws-vitals":
    case "ws-essentials":
    case "ws-history":
    case "ws-examination":
    case "ws-notes":
      return "consultation";
    case "ws-prescription":
    case "ws-advice":
      return "prescription";
    case "ws-investigations":
      return "investigations";
    case "ws-documents":
      return "documents";
  }
}
