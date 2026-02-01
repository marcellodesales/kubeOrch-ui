import { useState, useEffect, useCallback, useRef } from "react";
import { clusterService, ClusterMetrics } from "@/lib/services/cluster";

interface UseClusterMetricsOptions {
  pollInterval?: number;
  enabled?: boolean;
}

export function useClusterMetrics(
  clusterName: string | null | undefined,
  options: UseClusterMetricsOptions = {}
) {
  const { pollInterval = 30000, enabled = true } = options;

  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchMetrics = useCallback(async () => {
    if (!clusterName || !enabled) return;

    setIsLoading(true);
    try {
      const data = await clusterService.getClusterMetrics(clusterName);
      if (isMountedRef.current) {
        setMetrics(data);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch metrics";
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [clusterName, enabled]);

  // Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true;

    if (clusterName && enabled) {
      fetchMetrics();
    }

    const interval = setInterval(() => {
      if (clusterName && enabled) {
        fetchMetrics();
      }
    }, pollInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [clusterName, enabled, pollInterval, fetchMetrics]);

  // Reset state when cluster changes
  useEffect(() => {
    if (!clusterName) {
      setMetrics(null);
      setError(null);
      setIsLoading(false);
    }
  }, [clusterName]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
