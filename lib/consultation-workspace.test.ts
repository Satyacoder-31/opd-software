import { describe, expect, it } from "vitest";
import {
  isCompleteVisitShortcut,
  isSaveDraftShortcut,
  isWorkspaceTabId,
  tabForWorkspaceSection,
  WORKSPACE_TABS,
  workspaceShortcutTab,
} from "@/lib/consultation-workspace";

describe("WORKSPACE_TABS", () => {
  it("exposes the four primary workspace tabs", () => {
    expect(WORKSPACE_TABS.map((tab) => tab.id)).toEqual([
      "consultation",
      "prescription",
      "investigations",
      "documents",
    ]);
    expect(WORKSPACE_TABS.map((tab) => tab.label)).toEqual([
      "Consultation",
      "Prescription",
      "Investigations",
      "Documents",
    ]);
    expect(WORKSPACE_TABS.map((tab) => tab.shortcut)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("validates tab ids", () => {
    expect(isWorkspaceTabId("consultation")).toBe(true);
    expect(isWorkspaceTabId("billing")).toBe(false);
  });
});

describe("workspace shortcuts", () => {
  it("maps Alt+1…4 to workspace tabs", () => {
    expect(
      workspaceShortcutTab({
        key: "1",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe("consultation");
    expect(
      workspaceShortcutTab({
        key: "2",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe("prescription");
    expect(
      workspaceShortcutTab({
        key: "3",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe("investigations");
    expect(
      workspaceShortcutTab({
        key: "4",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe("documents");
  });

  it("ignores tab shortcuts without Alt or with Ctrl/Meta", () => {
    expect(
      workspaceShortcutTab({
        key: "1",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBeNull();
    expect(
      workspaceShortcutTab({
        key: "1",
        altKey: true,
        ctrlKey: true,
        metaKey: false,
      }),
    ).toBeNull();
  });

  it("detects save draft and complete visit shortcuts", () => {
    expect(
      isSaveDraftShortcut({
        key: "s",
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      }),
    ).toBe(true);
    expect(
      isSaveDraftShortcut({
        key: "S",
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      }),
    ).toBe(true);
    expect(
      isCompleteVisitShortcut({
        key: "Enter",
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      }),
    ).toBe(true);
    expect(
      isCompleteVisitShortcut({
        key: "Enter",
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      }),
    ).toBe(false);
  });

  it("maps section anchors to tabs", () => {
    expect(tabForWorkspaceSection("ws-vitals")).toBe("consultation");
    expect(tabForWorkspaceSection("ws-prescription")).toBe("prescription");
    expect(tabForWorkspaceSection("ws-investigations")).toBe("investigations");
    expect(tabForWorkspaceSection("ws-documents")).toBe("documents");
  });
});
