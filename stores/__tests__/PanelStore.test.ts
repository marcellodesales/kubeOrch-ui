import { describe, it, expect, beforeEach } from "vitest";
import { usePanelStore } from "../PanelStore";

describe("PanelStore", () => {
  beforeEach(() => {
    usePanelStore.setState({ nodeSettingsWidth: 320 });
  });

  it("should initialize with default width of 320", () => {
    expect(usePanelStore.getState().nodeSettingsWidth).toBe(320);
  });

  it("should update node settings width", () => {
    usePanelStore.getState().setNodeSettingsWidth(500);
    expect(usePanelStore.getState().nodeSettingsWidth).toBe(500);
  });

  it("should clear panel state to defaults", () => {
    usePanelStore.getState().setNodeSettingsWidth(600);
    usePanelStore.getState().clearPanelState();
    expect(usePanelStore.getState().nodeSettingsWidth).toBe(320);
  });

  it("should handle zero width", () => {
    usePanelStore.getState().setNodeSettingsWidth(0);
    expect(usePanelStore.getState().nodeSettingsWidth).toBe(0);
  });

  it("should handle large width values", () => {
    usePanelStore.getState().setNodeSettingsWidth(1920);
    expect(usePanelStore.getState().nodeSettingsWidth).toBe(1920);
  });
});
