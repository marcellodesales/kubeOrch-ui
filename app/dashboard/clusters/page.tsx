"use client";

import { useEffect, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  RefreshCw,
  Server,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  Play,
  Star,
  StarOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/errorHandling";

interface ClusterMetadata {
  version?: string;
  nodeCount?: number;
  platform?: string;
  namespaces?: string[];
}

interface Cluster {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  server: string;
  authType: string;
  status: "connected" | "disconnected" | "error" | "unknown";
  default: boolean;
  labels?: Record<string, string>;
  metadata?: ClusterMetadata;
}

const statusConfig = {
  connected: {
    color: "bg-green-500",
    text: "Connected",
    icon: CheckCircle,
    variant: "default" as const,
  },
  disconnected: {
    color: "bg-gray-500",
    text: "Disconnected",
    icon: XCircle,
    variant: "secondary" as const,
  },
  error: {
    color: "bg-red-500",
    text: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
  unknown: {
    color: "bg-yellow-500",
    text: "Unknown",
    icon: Clock,
    variant: "outline" as const,
  },
};

export default function ClustersPage() {
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultClusterId, setDefaultClusterId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clusterToDelete, setClusterToDelete] = useState<string | null>(null);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clusters" },
  ];

  const fetchClusters = async () => {
    try {
      const response = await api.get("/clusters");
      setClusters(response.data.clusters || []);
      setDefaultClusterId(response.data.default || "");
    } catch (error) {
      console.error("Failed to fetch clusters:", error);
      toast.error("Failed to load clusters");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClusters();
  };

  const handleTestConnection = async (clusterName: string) => {
    try {
      await api.post(`/clusters/${clusterName}/test`);
      toast.success(`Connection to ${clusterName} successful`);
      fetchClusters();
    } catch (error) {
      console.error(`Failed to test connection to ${clusterName}:`, error);
      const errorMessage = getErrorMessage(
        error,
        `Failed to test connection to ${clusterName}`
      );
      toast.error(errorMessage);
    }
  };

  const handleSetDefault = async (clusterName: string) => {
    try {
      await api.put(`/clusters/${clusterName}/default`);
      toast.success(`${clusterName} set as default cluster`);
      fetchClusters();
    } catch (error) {
      console.error(`Failed to set ${clusterName} as default:`, error);
      toast.error(`Failed to set ${clusterName} as default`);
    }
  };

  const handleRefreshMetadata = async (clusterName: string) => {
    try {
      await api.post(`/clusters/${clusterName}/refresh`);
      toast.success(`Metadata refreshed for ${clusterName}`);
      fetchClusters();
    } catch (error) {
      console.error(`Failed to refresh metadata for ${clusterName}:`, error);
      toast.error(`Failed to refresh metadata for ${clusterName}`);
    }
  };

  const handleDeleteCluster = (clusterName: string) => {
    setClusterToDelete(clusterName);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCluster = async () => {
    if (!clusterToDelete) return;

    try {
      await api.delete(`/clusters/${clusterToDelete}`);
      toast.success(`Cluster ${clusterToDelete} removed successfully`);
      fetchClusters();
    } catch (error) {
      console.error(`Failed to remove cluster ${clusterToDelete}:`, error);
      toast.error(`Failed to remove cluster ${clusterToDelete}`);
    } finally {
      setDeleteDialogOpen(false);
      setClusterToDelete(null);
    }
  };

  const pageActions = (
    <>
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
      <Button size="sm" onClick={() => router.push("/dashboard/clusters/new")}>
        <Plus className="mr-2 h-4 w-4" />
        Add Cluster
      </Button>
    </>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Kubernetes Clusters"
        description="Manage your Kubernetes cluster connections"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cluster Configurations</CardTitle>
                <CardDescription>
                  {clusters.length} cluster{clusters.length !== 1 ? "s" : ""}{" "}
                  configured
                </CardDescription>
              </div>
              {clusters.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Server className="h-4 w-4" />
                  <span>
                    {clusters.filter(c => c.status === "connected").length}{" "}
                    connected
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : clusters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Server className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  No clusters configured
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add your first Kubernetes cluster to get started
                </p>
                <Button onClick={() => router.push("/dashboard/clusters/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cluster
                </Button>
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Server</TableHead>
                      <TableHead>Auth Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Nodes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusters.map(cluster => {
                      const status = statusConfig[cluster.status];
                      const StatusIcon = status.icon;
                      const isDefault = cluster.id === defaultClusterId;

                      return (
                        <TableRow key={cluster.id}>
                          <TableCell>
                            {isDefault ? (
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {cluster.displayName || cluster.name}
                              </div>
                              {cluster.description && (
                                <div className="text-xs text-muted-foreground">
                                  {cluster.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{cluster.server}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {cluster.authType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cluster.metadata?.version || "-"}
                          </TableCell>
                          <TableCell>
                            {cluster.metadata?.nodeCount || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {status.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!isDefault && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetDefault(cluster.name)
                                    }
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    Set as Default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTestConnection(cluster.name)
                                  }
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Test Connection
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRefreshMetadata(cluster.name)
                                  }
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Refresh Metadata
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/clusters/${cluster.name}/edit`
                                    )
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Configuration
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteCluster(cluster.name)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  Remove Cluster
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {clusters.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Clusters
                    </span>
                    <span className="font-medium">{clusters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="font-medium text-green-600">
                      {clusters.filter(c => c.status === "connected").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With Errors</span>
                    <span className="font-medium text-red-600">
                      {clusters.filter(c => c.status === "error").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Auth Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(
                    clusters.reduce(
                      (acc, cluster) => {
                        acc[cluster.authType] =
                          (acc[cluster.authType] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {type}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Nodes</span>
                    <span className="font-medium">
                      {clusters.reduce(
                        (sum, c) => sum + (c.metadata?.nodeCount || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Namespaces</span>
                    <span className="font-medium">
                      {clusters.reduce(
                        (sum, c) => sum + (c.metadata?.namespaces?.length || 0),
                        0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the cluster &quot;{clusterToDelete}
              &quot; from your configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClusterToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCluster}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
