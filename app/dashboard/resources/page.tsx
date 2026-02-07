"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  ChevronLeft,
  ChevronRight,
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/errorHandling";
import { useResourcesStore } from "@/stores/ResourcesStore";

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

type SortOrder = "asc" | "desc" | "";

const sortableColumns = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "namespace", label: "Namespace" },
  { key: "cluster", label: "Cluster" },
  { key: "status", label: "Status" },
  { key: "created", label: "Created" },
] as const;

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedNamespace, setSelectedNamespace] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalResources, setTotalResources] = useState(0);

  // Use persisted store for hide system resources preference
  const { hideSystemResources, setHideSystemResources } = useResourcesStore();

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Resources" },
  ];

  const fetchResources = useCallback(
    async (syncFirst = false) => {
      try {
        const params = new URLSearchParams();

        if (selectedCluster && selectedCluster !== "all") {
          params.append("cluster", selectedCluster);
        }
        if (selectedNamespace && selectedNamespace !== "all") {
          params.append("namespace", selectedNamespace);
        }
        if (selectedType && selectedType !== "all") {
          params.append("type", selectedType);
        }
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }
        if (syncFirst) {
          params.append("sync", "true");
        }
        if (hideSystemResources) {
          params.append("hideSystem", "true");
        }

        // Sorting
        if (sortBy && sortOrder) {
          params.append("sort_by", sortBy);
          params.append("sort_order", sortOrder);
        }

        // Pagination
        params.append("limit", String(pageSize));
        params.append("offset", String((page - 1) * pageSize));

        const response = await api.get(
          `/resources${params.toString() ? `?${params.toString()}` : ""}`
        );
        setResources(response.data.resources || []);
        setTotalResources(response.data.total ?? 0);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        toast.error(getErrorMessage(error, "Failed to load resources"));
        setResources([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      selectedCluster,
      selectedNamespace,
      selectedType,
      debouncedSearch,
      sortBy,
      sortOrder,
      page,
      pageSize,
      hideSystemResources,
    ]
  );

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const sync = isInitialLoad.current;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    fetchResources(sync);
  }, [fetchResources]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources(true);
  };

  // Get unique values for filter dropdowns from current page results
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

  // Resources are now filtered server-side via hideSystem param
  const filteredResources = resources;

  // Stats from current page
  const resourceStats = useMemo(() => {
    return filteredResources.reduce(
      (acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredResources]);

  const statusStats = useMemo(() => {
    return filteredResources.reduce(
      (acc, resource) => {
        acc[resource.status] = (acc[resource.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredResources]);

  const filteredClusters = useMemo(
    () => [...new Set(filteredResources.map(r => r.clusterName))],
    [filteredResources]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Sort handler: cycles none -> asc -> desc -> none
  const handleSort = (column: string) => {
    if (sortBy !== column) {
      setSortBy(column);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortBy("");
      setSortOrder("");
    }
    setPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return ArrowUpDown;
    if (sortOrder === "asc") return ArrowUp;
    return ArrowDown;
  };

  // Pagination
  const totalPages = Math.ceil(totalResources / pageSize);
  const showingFrom = totalResources === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalResources);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh resources"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
                  onCheckedChange={checked => {
                    setHideSystemResources(checked as boolean);
                    setPage(1);
                  }}
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 md:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or namespace..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-2">
                <Select
                  value={selectedCluster}
                  onValueChange={v => handleFilterChange(setSelectedCluster, v)}
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
                  onValueChange={v =>
                    handleFilterChange(setSelectedNamespace, v)
                  }
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

                <Select
                  value={selectedType}
                  onValueChange={v => handleFilterChange(setSelectedType, v)}
                >
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
                  {totalResources} resource
                  {totalResources !== 1 ? "s" : ""} found
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
              <>
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        {sortableColumns.map(col => {
                          const Icon = getSortIcon(col.key);
                          return (
                            <TableHead
                              key={col.key}
                              className="cursor-pointer select-none"
                              onClick={() => handleSort(col.key)}
                            >
                              <div className="flex items-center gap-1">
                                {col.label}
                                <Icon
                                  className={`h-3.5 w-3.5 ${
                                    sortBy === col.key
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  }`}
                                />
                              </div>
                            </TableHead>
                          );
                        })}
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

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {showingFrom}–{showingTo} of {totalResources}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">
                        Rows:
                      </span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={v => {
                          setPageSize(Number(v));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 25, 50, 100].map(size => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages || 1}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
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
                {filteredClusters.map(cluster => {
                  const count = filteredResources.filter(
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
