import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePluginStore } from "../PluginStore";

vi.mock("@/lib/services/plugins", () => ({
  pluginService: {
    listPlugins: vi.fn(),
    enablePlugin: vi.fn(),
    disablePlugin: vi.fn(),
    getPlugin: vi.fn(),
  },
  PluginCategory: {},
}));

describe("PluginStore", () => {
  beforeEach(() => {
    usePluginStore.setState({
      plugins: [],
      isLoading: false,
      error: null,
    });
  });

  it("should initialize with empty state", () => {
    const state = usePluginStore.getState();
    expect(state.plugins).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should return undefined for non-existent plugin", () => {
    const plugin = usePluginStore.getState().getPluginById("nonexistent");
    expect(plugin).toBeUndefined();
  });

  it("should find plugin by id", () => {
    const mockPlugin = {
      id: "test-plugin",
      name: "Test Plugin",
      description: "A test plugin",
      version: "1.0.0",
      category: "monitoring" as const,
      enabled: true,
    };
    usePluginStore.setState({ plugins: [mockPlugin] });

    const plugin = usePluginStore.getState().getPluginById("test-plugin");
    expect(plugin).toEqual(mockPlugin);
  });

  it("should filter enabled plugins", () => {
    const plugins = [
      { id: "1", name: "P1", enabled: true },
      { id: "2", name: "P2", enabled: false },
      { id: "3", name: "P3", enabled: true },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usePluginStore.setState({ plugins: plugins as any });

    const enabled = usePluginStore.getState().getEnabledPlugins();
    expect(enabled).toHaveLength(2);
    expect(enabled[0].id).toBe("1");
    expect(enabled[1].id).toBe("3");
  });

  it("should check if plugin is enabled", () => {
    const plugins = [
      { id: "1", name: "P1", enabled: true },
      { id: "2", name: "P2", enabled: false },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usePluginStore.setState({ plugins: plugins as any });

    expect(usePluginStore.getState().isPluginEnabled("1")).toBe(true);
    expect(usePluginStore.getState().isPluginEnabled("2")).toBe(false);
    expect(usePluginStore.getState().isPluginEnabled("nonexistent")).toBe(
      false
    );
  });

  it("should filter plugins by category", () => {
    const plugins = [
      { id: "1", name: "P1", category: "monitoring", enabled: true },
      { id: "2", name: "P2", category: "security", enabled: true },
      { id: "3", name: "P3", category: "monitoring", enabled: false },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usePluginStore.setState({ plugins: plugins as any });

    const monitoring = usePluginStore
      .getState()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .getPluginsByCategory("monitoring" as any);
    expect(monitoring).toHaveLength(2);
  });
});
