import { useEffect } from "react";
import { useClusterStore } from "@/stores/ClusterStore";

export function useCluster() {
  const store = useClusterStore();

  // Fetch clusters on mount if not already loaded
  useEffect(() => {
    if (store.clusters.length === 0 && !store.isLoading) {
      store.fetchClusters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh cluster statuses every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      store.clusters.forEach(cluster => {
        store.updateClusterStatus(cluster.name).catch(() => {});
      });
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.clusters]);

  return {
    clusters: store.clusters,
    selectedCluster: store.selectedCluster,
    defaultCluster: store.getDefaultCluster(),
    isLoading: store.isLoading,
    error: store.error,
    clusterStatuses: store.clusterStatuses,

    // Actions
    fetchClusters: store.fetchClusters,
    addCluster: store.addCluster,
    removeCluster: store.removeCluster,
    selectCluster: store.selectCluster,
    setDefaultCluster: store.setDefaultCluster,
    testConnection: store.testClusterConnection,
    refreshMetadata: store.refreshClusterMetadata,
    updateCredentials: store.updateClusterCredentials,
    getClusterByName: store.getClusterByName,

    // Helper methods
    getConnectedClusters: () =>
      store.clusters.filter(c => c.status === "connected"),
    getErrorClusters: () => store.clusters.filter(c => c.status === "error"),
    getTotalNodes: () =>
      store.clusters.reduce((sum, c) => sum + (c.metadata?.nodeCount || 0), 0),
    getTotalNamespaces: () =>
      store.clusters.reduce(
        (sum, c) => sum + (c.metadata?.namespaces?.length || 0),
        0
      ),
  };
}
