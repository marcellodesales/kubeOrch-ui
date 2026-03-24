import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore } from "../SidebarStore";

describe("SidebarStore", () => {
  beforeEach(() => {
    useSidebarStore.setState({ openMenus: {} });
  });

  it("should initialize with empty openMenus", () => {
    const state = useSidebarStore.getState();
    expect(state.openMenus).toEqual({});
  });

  it("should toggle a menu open", () => {
    useSidebarStore.getState().toggleMenu("Workflows");
    expect(useSidebarStore.getState().openMenus["Workflows"]).toBe(true);
  });

  it("should toggle a menu closed", () => {
    useSidebarStore.getState().toggleMenu("Workflows");
    useSidebarStore.getState().toggleMenu("Workflows");
    expect(useSidebarStore.getState().openMenus["Workflows"]).toBe(false);
  });

  it("should handle multiple menus independently", () => {
    const { toggleMenu } = useSidebarStore.getState();
    toggleMenu("Workflows");
    toggleMenu("Clusters");

    const state = useSidebarStore.getState();
    expect(state.openMenus["Workflows"]).toBe(true);
    expect(state.openMenus["Clusters"]).toBe(true);
  });

  it("should set menu open state directly", () => {
    useSidebarStore.getState().setMenuOpen("Settings", true);
    expect(useSidebarStore.getState().openMenus["Settings"]).toBe(true);

    useSidebarStore.getState().setMenuOpen("Settings", false);
    expect(useSidebarStore.getState().openMenus["Settings"]).toBe(false);
  });

  it("should clear all sidebar state", () => {
    const { toggleMenu, clearSidebarState } = useSidebarStore.getState();
    toggleMenu("Workflows");
    toggleMenu("Clusters");
    toggleMenu("Settings");

    clearSidebarState();
    expect(useSidebarStore.getState().openMenus).toEqual({});
  });
});
