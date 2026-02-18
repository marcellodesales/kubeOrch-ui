"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusterStore } from "@/stores/ClusterStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface ResourceMetric {
  name: string;
  namespace: string;
  type: string;
  clusterName: string;
  status: string;
  restarts: number;
}

const statusConfig: Record<string, string> = {
  connected:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  running:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
  disconnected:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function ResourceMetricsTable() {
  const { clusters } = useClusterStore();
  const router = useRouter();
  const [clusterFilter, setClusterFilter] = useState("all");
  const [resources, setResources] = useState<ResourceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (clusterFilter !== "all") params.cluster = clusterFilter;
      const response = await api.get("/metrics/resources", { params });
      setResources(response.data.resources || []);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [clusterFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              Resource status across your clusters
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {clusters.length > 1 && (
              <Select value={clusterFilter} onValueChange={setClusterFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All clusters" />
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
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No resources found. Connect a cluster to view resource metrics.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Restarts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource, i) => (
                <TableRow
                  key={`${resource.clusterName}-${resource.name}-${i}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(
                      `/dashboard/clusters/${encodeURIComponent(resource.clusterName)}`
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {resource.name}
                    {resource.namespace && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({resource.namespace})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{resource.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {resource.clusterName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        statusConfig[resource.status] || statusConfig.pending
                      }
                    >
                      {resource.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{resource.restarts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
