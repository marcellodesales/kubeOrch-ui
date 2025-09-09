import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clusterService,
  type Cluster,
  type ClusterStatus,
  type AddClusterRequest,
  type ClusterCredentials,
} from "@/lib/services/cluster";
import { toast } from "react-toastify";

type ClusterStore = {
  clusters: Cluster[];
  defaultClusterId: string | null;
  selectedCluster: Cluster | null;
  clusterStatuses: Map<string, ClusterStatus>;
  isLoading: boolean;
  error: string | null;

  fetchClusters: () => Promise<void>;
  addCluster: (cluster: AddClusterRequest) => Promise<void>;
  removeCluster: (name: string) => Promise<void>;
  selectCluster: (cluster: Cluster | null) => void;
  setDefaultCluster: (name: string) => Promise<void>;
  testClusterConnection: (name: string) => Promise<void>;
  refreshClusterMetadata: (name: string) => Promise<void>;
  updateClusterStatus: (name: string) => Promise<void>;
  updateClusterCredentials: (
    name: string,
    credentials: ClusterCredentials
  ) => Promise<void>;
  getClusterByName: (name: string) => Cluster | undefined;
  getDefaultCluster: () => Cluster | undefined;
};

export const useClusterStore = create<ClusterStore>()(
  persist(
    (set, get) => ({
      clusters: [],
      defaultClusterId: null,
      selectedCluster: null,
      clusterStatuses: new Map(),
      isLoading: false,
      error: null,

      fetchClusters: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await clusterService.listClusters();
          set({
            clusters: response.clusters,
            defaultClusterId: response.default,
            isLoading: false,
          });

          // Fetch status for each cluster
          const statusPromises = response.clusters.map(cluster =>
            get()
              .updateClusterStatus(cluster.name)
              .catch(() => {})
          );
          await Promise.allSettled(statusPromises);
        } catch (error) {
          const errorMessage =
            (error as Error).message || "Failed to fetch clusters";
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      addCluster: async clusterData => {
        set({ isLoading: true, error: null });
        try {
          await clusterService.addCluster(clusterData);
          toast.success("Cluster added successfully");

          // Refresh clusters list
          await get().fetchClusters();

          // Test connection for the new cluster
          await get().testClusterConnection(clusterData.name);
        } catch (error) {
          const errorMessage =
            (error as Error).message || "Failed to add cluster";
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          throw error;
        }
      },

      removeCluster: async name => {
        set({ isLoading: true, error: null });
        try {
          await clusterService.removeCluster(name);

          // Update local state
          const updatedClusters = get().clusters.filter(c => c.name !== name);
          const selectedCluster = get().selectedCluster;

          set({
            clusters: updatedClusters,
            selectedCluster:
              selectedCluster?.name === name ? null : selectedCluster,
            isLoading: false,
          });

          // Remove from status map
          const statuses = get().clusterStatuses;
          statuses.delete(name);

          toast.success("Cluster removed successfully");
        } catch (error) {
          const errorMessage =
            (error as Error).message || "Failed to remove cluster";
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      selectCluster: cluster => {
        set({ selectedCluster: cluster });
      },

      setDefaultCluster: async name => {
        set({ isLoading: true, error: null });
        try {
          await clusterService.setDefaultCluster(name);

          // Update local state
          const updatedClusters = get().clusters.map(c => ({
            ...c,
            default: c.name === name,
          }));

          set({
            clusters: updatedClusters,
            defaultClusterId: name,
            isLoading: false,
          });

          toast.success(`${name} set as default cluster`);
        } catch (error) {
          const errorMessage =
            (error as Error).message || "Failed to set default cluster";
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },

      testClusterConnection: async name => {
        try {
          const response = await clusterService.testConnection(name);

          // Update cluster status in the list
          const updatedClusters = get().clusters.map(c =>
            c.name === name ? { ...c, status: response.status } : c
          );
          set({ clusters: updatedClusters });

          if (response.status === "connected") {
            toast.success(`Connected to ${name}`);
          } else {
            toast.warning(`Connection to ${name} failed`);
          }
        } catch (error) {
          toast.error(`Failed to test connection: ${(error as Error).message}`);
        }
      },

      refreshClusterMetadata: async name => {
        try {
          const response = await clusterService.refreshMetadata(name);

          // Update cluster in the list
          const updatedClusters = get().clusters.map(c =>
            c.name === name ? { ...c, metadata: response.metadata } : c
          );
          set({ clusters: updatedClusters });

          toast.success(`Metadata refreshed for ${name}`);
        } catch (error) {
          toast.error(
            `Failed to refresh metadata: ${(error as Error).message}`
          );
        }
      },

      updateClusterStatus: async name => {
        try {
          const status = await clusterService.getClusterStatus(name);

          // Update status map
          const statuses = new Map(get().clusterStatuses);
          statuses.set(name, status);
          set({ clusterStatuses: statuses });

          // Update cluster in the list
          const updatedClusters = get().clusters.map(c =>
            c.name === name ? { ...c, status: status.status } : c
          );
          set({ clusters: updatedClusters });
        } catch (error) {
          console.error(`Failed to update status for ${name}:`, error);
        }
      },

      updateClusterCredentials: async (name, credentials) => {
        set({ isLoading: true, error: null });
        try {
          await clusterService.updateCredentials(name, credentials);
          toast.success("Credentials updated successfully");

          // Test connection with new credentials
          await get().testClusterConnection(name);
        } catch (error) {
          const errorMessage =
            (error as Error).message || "Failed to update credentials";
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
          throw error;
        }
      },

      getClusterByName: name => {
        return get().clusters.find(c => c.name === name);
      },

      getDefaultCluster: () => {
        const defaultId = get().defaultClusterId;
        if (!defaultId) return undefined;
        return get().clusters.find(
          c => c.id === defaultId || c.name === defaultId
        );
      },
    }),
    {
      name: "cluster-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        selectedCluster: state.selectedCluster,
        defaultClusterId: state.defaultClusterId,
      }),
    }
  )
);
