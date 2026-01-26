import { create } from "zustand";
import api from "@/lib/api";
import {
  Registry,
  CreateRegistryRequest,
  UpdateRegistryRequest,
  RegistryType,
} from "@/lib/types/registry";

interface RegistryStore {
  // State
  registries: Registry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRegistries: () => Promise<void>;
  createRegistry: (data: CreateRegistryRequest) => Promise<Registry>;
  updateRegistry: (id: string, data: UpdateRegistryRequest) => Promise<Registry>;
  deleteRegistry: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<{ status: string; message: string }>;
  setDefault: (id: string) => Promise<void>;
  lookupRegistryForImage: (
    image: string
  ) => Promise<{ found: boolean; registry?: Registry; registryType?: RegistryType }>;

  // Selectors
  getRegistryById: (id: string) => Registry | undefined;
  getRegistriesByType: (type: RegistryType) => Registry[];
  getDefaultRegistry: (type: RegistryType) => Registry | undefined;
}

export const useRegistryStore = create<RegistryStore>((set, get) => ({
  // Initial state
  registries: [],
  isLoading: false,
  error: null,

  // Fetch all registries
  fetchRegistries: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/registries");
      set({ registries: response.data.registries || [], isLoading: false });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch registries";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Create a new registry (admin only)
  createRegistry: async (data: CreateRegistryRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/admin/registries", data);
      const newRegistry = response.data.registry;
      set((state) => ({
        registries: [newRegistry, ...state.registries],
        isLoading: false,
      }));
      return newRegistry;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create registry";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update a registry (admin only)
  updateRegistry: async (id: string, data: UpdateRegistryRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/admin/registries/${id}`, data);
      const updatedRegistry = response.data.registry;
      set((state) => ({
        registries: state.registries.map((r) =>
          r.id === id ? updatedRegistry : r
        ),
        isLoading: false,
      }));
      return updatedRegistry;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update registry";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete a registry (admin only)
  deleteRegistry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/admin/registries/${id}`);
      set((state) => ({
        registries: state.registries.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete registry";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Test registry connection (admin only)
  testConnection: async (id: string) => {
    try {
      const response = await api.post(`/admin/registries/${id}/test`);
      // Update the registry status and updatedAt in the store
      const now = new Date().toISOString();
      set((state) => ({
        registries: state.registries.map((r) =>
          r.id === id
            ? { ...r, status: "connected" as const, updatedAt: now }
            : r
        ),
      }));
      return { status: "connected", message: response.data.message };
    } catch (error: unknown) {
      // Update the registry status to error and updatedAt
      const now = new Date().toISOString();
      set((state) => ({
        registries: state.registries.map((r) =>
          r.id === id ? { ...r, status: "error" as const, updatedAt: now } : r
        ),
      }));
      const errorMessage =
        error instanceof Error ? error.message : "Connection test failed";
      return { status: "error", message: errorMessage };
    }
  },

  // Set a registry as default for its type (admin only)
  setDefault: async (id: string) => {
    try {
      await api.put(`/admin/registries/${id}/default`);
      // Update the store to reflect the new default
      const registry = get().registries.find((r) => r.id === id);
      if (registry) {
        set((state) => ({
          registries: state.registries.map((r) => {
            if (r.registryType === registry.registryType) {
              return { ...r, isDefault: r.id === id };
            }
            return r;
          }),
        }));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to set default registry";
      throw new Error(errorMessage);
    }
  },

  // Lookup registry for an image (returns the matching registry or detection info)
  lookupRegistryForImage: async (image: string) => {
    try {
      const response = await api.get(`/registries/lookup?image=${encodeURIComponent(image)}`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to lookup registry";
      throw new Error(errorMessage);
    }
  },

  // Selectors
  getRegistryById: (id: string) => {
    return get().registries.find((r) => r.id === id);
  },

  getRegistriesByType: (type: RegistryType) => {
    return get().registries.filter((r) => r.registryType === type);
  },

  getDefaultRegistry: (type: RegistryType) => {
    return get().registries.find((r) => r.registryType === type && r.isDefault);
  },
}));
