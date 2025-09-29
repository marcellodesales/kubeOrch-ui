"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Box,
  Database,
  Globe,
  HardDrive,
  Key,
  Layers,
  Network,
  Package,
  RefreshCw,
  Search,
  Server,
  Shield,
  Activity,
  Settings,
  Cloud,
  Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/errorHandling";

interface Resource {
  id: string;
  name: string;
  namespace: string;
  type: string;
  status:
    | "running"
    | "pending"
    | "failed"
    | "completed"
    | "unknown"
    | "deleted"
    | "warning";
  createdAt: string;
  clusterName: string;
  labels?: Record<string, string>;
  userTags?: string[];
  userNotes?: string;
  isFavorite?: boolean;
  spec?: {
    replicas?: number;
    availableReplicas?: number;
    containers?: Array<{
      name: string;
      image: string;
      resources?: {
        requestsCPU?: string;
        requestsMemory?: string;
      };
    }>;
  };
}

const resourceIcons: Record<
  string,
  React.ComponentType<import("lucide-react").LucideProps>
> = {
  Pod: Box,
  Service: Globe,
  Deployment: Package,
  StatefulSet: Database,
  DaemonSet: Server,
  Job: Activity,
  CronJob: Activity,
  ConfigMap: Settings,
  Secret: Key,
  Namespace: Layers,
  Node: Server,
  PersistentVolume: HardDrive,
  PersistentVolumeClaim: HardDrive,
  Ingress: Network,
  NetworkPolicy: Shield,
  ServiceAccount: Shield,
  Role: Shield,
  ClusterRole: Shield,
  HorizontalPodAutoscaler: Cpu,
  VerticalPodAutoscaler: Cpu,
  StorageClass: Database,
  VolumeSnapshot: HardDrive,
  Custom: Cloud,
};

const statusConfig = {
  running: {
    color: "bg-green-500",
    text: "Running",
    variant: "default" as const,
  },
  pending: {
    color: "bg-yellow-500",
    text: "Pending",
    variant: "outline" as const,
  },
  failed: {
    color: "bg-red-500",
    text: "Failed",
    variant: "destructive" as const,
  },
  completed: {
    color: "bg-blue-500",
    text: "Completed",
    variant: "secondary" as const,
  },
  unknown: {
    color: "bg-gray-500",
    text: "Unknown",
    variant: "outline" as const,
  },
  deleted: {
    color: "bg-gray-500",
    text: "Deleted",
    variant: "outline" as const,
  },
  warning: {
    color: "bg-yellow-500",
    text: "Warning",
    variant: "outline" as const,
  },
};

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSystemResources, setHideSystemResources] = useState(true);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Resources" },
  ];

  const fetchResources = useCallback(
    async (syncFirst = false) => {
      try {
        const params = new URLSearchParams();

        // Only add filters if they're not the initial/default values
        if (selectedCluster && selectedCluster !== "all") {
          params.append("cluster", selectedCluster);
        }
        if (selectedNamespace && selectedNamespace !== "all") {
          params.append("namespace", selectedNamespace);
        }
        if (selectedType && selectedType !== "all") {
          params.append("type", selectedType);
        }

        // Only sync on initial load or manual refresh
        if (syncFirst) {
          params.append("sync", "true");
        }

        const response = await api.get(
          `/resources${params.toString() ? `?${params.toString()}` : ""}`
        );
        setResources(response.data.resources || []);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        toast.error(getErrorMessage(error, "Failed to load resources"));
        setResources([]); // Set empty array on error
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCluster, selectedNamespace, selectedType]
  );

  useEffect(() => {
    // Sync with clusters on initial load
    fetchResources(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (without sync)
  useEffect(() => {
    if (!loading) {
      // Only refetch after initial load
      fetchResources(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCluster, selectedNamespace, selectedType]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources(true); // Sync when manually refreshing
  };

  // System namespaces to filter out
  const systemNamespaces = useMemo(
    () => ["kube-system", "kube-public", "kube-node-lease", "kube-flannel"],
    []
  );

  // Get unique values for filters
  const clusters = useMemo(
    () => [...new Set(resources.map(r => r.clusterName))],
    [resources]
  );
  const namespaces = useMemo(
    () => [...new Set(resources.map(r => r.namespace))].filter(ns => ns),
    [resources]
  );
  const types = useMemo(
    () => [...new Set(resources.map(r => r.type))],
    [resources]
  );

  // Filter resources - only apply client-side filters (search and hideSystem)
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      // Filter out system resources if checkbox is checked
      if (hideSystemResources) {
        // Hide resources in system namespaces
        if (systemNamespaces.includes(resource.namespace)) {
          return false;
        }
        // Hide system ConfigMaps that appear in user namespaces
        if (
          resource.type === "ConfigMap" &&
          resource.name === "kube-root-ca.crt"
        ) {
          return false;
        }
        // Hide the kubernetes service in default namespace
        if (resource.type === "Service" && resource.name === "kubernetes") {
          return false;
        }
      }

      const matchesSearch =
        searchQuery === "" ||
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.namespace &&
          resource.namespace.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [resources, hideSystemResources, searchQuery, systemNamespaces]);

  // Group resources by type for statistics
  const resourceStats = useMemo(() => {
    return resources.reduce(
      (acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [resources]);

  const statusStats = useMemo(() => {
    return resources.reduce(
      (acc, resource) => {
        acc[resource.status] = (acc[resource.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [resources]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        />
        Refresh
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Kubernetes Resources"
        description="View and manage resources across your clusters"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Filter resources by cluster, namespace, and type
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideSystem"
                  checked={hideSystemResources}
                  onCheckedChange={checked =>
                    setHideSystemResources(checked as boolean)
                  }
                />
                <label
                  htmlFor="hideSystem"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Hide system resources
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop: Search takes more space, filters are compact in one row */}
            {/* Mobile: Search full width, filters below */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search - takes remaining space on desktop, full width on mobile */}
              <div className="relative flex-1 md:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, namespace, or type..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>

              {/* Filters - compact on desktop, stack on mobile */}
              <div className="flex flex-col sm:flex-row gap-4 md:gap-2">
                <Select
                  value={selectedCluster}
                  onValueChange={setSelectedCluster}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clusters</SelectItem>
                    {clusters.map(cluster => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedNamespace}
                  onValueChange={setSelectedNamespace}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Namespace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Namespaces</SelectItem>
                    {namespaces.map(namespace => (
                      <SelectItem key={namespace} value={namespace}>
                        {namespace}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resources</CardTitle>
                <CardDescription>
                  {filteredResources.length} resource
                  {filteredResources.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No resources found
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Cluster</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map(resource => {
                      const Icon =
                        resourceIcons[resource.type] || resourceIcons.Custom;
                      const status = statusConfig[resource.status];

                      return (
                        <TableRow
                          key={resource.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/dashboard/resources/${resource.id}`)
                          }
                        >
                          <TableCell>
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{resource.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{resource.namespace}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {resource.clusterName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(resource.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resource Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(resourceStats)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => {
                    const Icon = resourceIcons[type] || resourceIcons.Custom;
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{type}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(statusStats).map(([status, count]) => {
                  const config =
                    statusConfig[status as keyof typeof statusConfig];
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {config?.text || status}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cluster Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {clusters.map(cluster => {
                  const count = resources.filter(
                    r => r.clusterName === cluster
                  ).length;
                  return (
                    <div key={cluster} className="flex justify-between">
                      <span className="text-muted-foreground">{cluster}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
