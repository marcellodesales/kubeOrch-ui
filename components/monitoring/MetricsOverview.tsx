"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusterStore } from "@/stores/ClusterStore";
import { MetricCard } from "./MetricCard";
import { AlertRuleBuilder } from "./AlertRuleBuilder";
import { Cpu, MemoryStick, HardDrive, Layers } from "lucide-react";
import api from "@/lib/api";
import type { AlertRuleType } from "@/lib/services/alerts";

interface ClusterMetricsData {
  clusterName: string;
  status: string;
  cpuUsed: number;
  cpuCapacity: number;
  cpuPercent: number;
  memUsed: number;
  memCapacity: number;
  memPercent: number;
  storUsed: number;
  storCapacity: number;
  storPercent: number;
  nodeCount: number;
  podCount: number;
}

interface MetricsOverviewData {
  clusters: ClusterMetricsData[];
  totals: {
    cpuUsed: number;
    cpuCapacity: number;
    cpuPercent: number;
    memoryUsed: number;
    memoryCapacity: number;
    memoryPercent: number;
    storageUsed: number;
    storageCapacity: number;
    storagePercent: number;
    nodeCount: number;
    podCount: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatMillicores(millicores: number): string {
  if (millicores >= 1000) {
    return (millicores / 1000).toFixed(1) + " cores";
  }
  return millicores + "m";
}

export function MetricsOverview() {
  const { clusters } = useClusterStore();
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [data, setData] = useState<MetricsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertBuilderOpen, setAlertBuilderOpen] = useState(false);
  const [prefillMetric, setPrefillMetric] = useState<string>("");
  const [prefillType, setPrefillType] = useState<AlertRuleType>("cluster");
  const [prefillCluster, setPrefillCluster] = useState<string>("");

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/metrics/overview");
      setData(response.data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const openAlertBuilder = (metric: string, cluster?: string) => {
    setPrefillMetric(metric);
    setPrefillType("cluster");
    setPrefillCluster(cluster || "");
    setAlertBuilderOpen(true);
  };

  if (isLoading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  // Get metrics for selected cluster or totals
  let displayMetrics = data?.totals;
  let displayClusterName = "";
  if (selectedCluster !== "all" && data?.clusters) {
    const clusterData = data.clusters.find(
      c => c.clusterName === selectedCluster
    );
    if (clusterData) {
      displayMetrics = {
        cpuUsed: clusterData.cpuUsed,
        cpuCapacity: clusterData.cpuCapacity,
        cpuPercent: clusterData.cpuPercent,
        memoryUsed: clusterData.memUsed,
        memoryCapacity: clusterData.memCapacity,
        memoryPercent: clusterData.memPercent,
        storageUsed: clusterData.storUsed,
        storageCapacity: clusterData.storCapacity,
        storagePercent: clusterData.storPercent,
        nodeCount: clusterData.nodeCount,
        podCount: clusterData.podCount,
      };
      displayClusterName = clusterData.clusterName;
    }
  }

  if (!displayMetrics) {
    displayMetrics = {
      cpuUsed: 0,
      cpuCapacity: 0,
      cpuPercent: 0,
      memoryUsed: 0,
      memoryCapacity: 0,
      memoryPercent: 0,
      storageUsed: 0,
      storageCapacity: 0,
      storagePercent: 0,
      nodeCount: 0,
      podCount: 0,
    };
  }

  return (
    <div className="space-y-4">
      {/* Cluster Selector */}
      {clusters.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cluster:</span>
          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clusters</SelectItem>
              {clusters.map(c => (
                <SelectItem key={c.name} value={c.name}>
                  {c.displayName || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU"
          icon={Cpu}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600"
          percentage={displayMetrics.cpuPercent}
          used={formatMillicores(displayMetrics.cpuUsed)}
          capacity={formatMillicores(displayMetrics.cpuCapacity)}
          onCreateAlert={() =>
            openAlertBuilder("cpu_percentage", displayClusterName)
          }
        />
        <MetricCard
          title="Memory"
          icon={MemoryStick}
          iconBg="bg-purple-100 dark:bg-purple-900/20"
          iconColor="text-purple-600"
          percentage={displayMetrics.memoryPercent}
          used={formatBytes(displayMetrics.memoryUsed)}
          capacity={formatBytes(displayMetrics.memoryCapacity)}
          onCreateAlert={() =>
            openAlertBuilder("memory_percentage", displayClusterName)
          }
        />
        <MetricCard
          title="Storage"
          icon={HardDrive}
          iconBg="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600"
          percentage={displayMetrics.storagePercent}
          used={formatBytes(displayMetrics.storageUsed)}
          capacity={formatBytes(displayMetrics.storageCapacity)}
          onCreateAlert={() =>
            openAlertBuilder("storage_percentage", displayClusterName)
          }
        />
        <MetricCard
          title="Pods"
          icon={Layers}
          iconBg="bg-orange-100 dark:bg-orange-900/20"
          iconColor="text-orange-600"
          percentage={
            displayMetrics.nodeCount > 0
              ? (displayMetrics.podCount / (displayMetrics.nodeCount * 110)) *
                100
              : 0
          }
          used={String(displayMetrics.podCount)}
          capacity={`${displayMetrics.nodeCount} nodes`}
        />
      </div>

      {/* Alert Builder */}
      <AlertRuleBuilder
        open={alertBuilderOpen}
        onOpenChange={setAlertBuilderOpen}
        prefillType={prefillType}
        prefillMetric={prefillMetric}
        prefillCluster={prefillCluster}
      />
    </div>
  );
}
