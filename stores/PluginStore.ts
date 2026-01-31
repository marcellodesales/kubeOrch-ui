import { create } from "zustand";
import {
  pluginService,
  Plugin,
  PluginWithStatus,
  PluginCategory,
} from "@/lib/services/plugins";
import { getErrorMessage } from "@/lib/utils/errorHandling";

interface PluginStore {
  // State
  plugins: PluginWithStatus[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlugins: () => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  getPlugin: (id: string) => Promise<{ plugin: Plugin; enabled: boolean }>;

  // Selectors
  getPluginById: (id: string) => PluginWithStatus | undefined;
  getPluginsByCategory: (category: PluginCategory) => PluginWithStatus[];
  getEnabledPlugins: () => PluginWithStatus[];
  isPluginEnabled: (id: string) => boolean;
}

export const usePluginStore = create<PluginStore>((set, get) => ({
  // Initial state
  plugins: [],
  isLoading: false,
  error: null,

  // Fetch all plugins with their enabled status
  fetchPlugins: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await pluginService.listPlugins();
      set({ plugins: response.plugins || [], isLoading: false });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to fetch plugins");
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Enable a plugin
  enablePlugin: async (id: string) => {
    try {
      await pluginService.enablePlugin(id);
      // Update the plugin's enabled status in the store
      set(state => ({
        plugins: state.plugins.map(p =>
          p.id === id
            ? { ...p, enabled: true, enabledAt: new Date().toISOString() }
            : p
        ),
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to enable plugin");
      throw new Error(errorMessage);
    }
  },

  // Disable a plugin
  disablePlugin: async (id: string) => {
    try {
      await pluginService.disablePlugin(id);
      // Update the plugin's enabled status in the store
      set(state => ({
        plugins: state.plugins.map(p =>
          p.id === id ? { ...p, enabled: false, enabledAt: undefined } : p
        ),
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to disable plugin");
      throw new Error(errorMessage);
    }
  },

  // Get a specific plugin
  getPlugin: async (id: string) => {
    try {
      return await pluginService.getPlugin(id);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to get plugin");
      throw new Error(errorMessage);
    }
  },

  // Selectors
  getPluginById: (id: string) => {
    return get().plugins.find(p => p.id === id);
  },

  getPluginsByCategory: (category: PluginCategory) => {
    return get().plugins.filter(p => p.category === category);
  },

  getEnabledPlugins: () => {
    return get().plugins.filter(p => p.enabled);
  },

  isPluginEnabled: (id: string) => {
    const plugin = get().plugins.find(p => p.id === id);
    return plugin?.enabled ?? false;
  },
}));
