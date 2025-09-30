"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Star,
  StarOff,
  FileText,
  Activity,
  Settings,
  Clock,
  Database,
  Box,
  Globe,
  Package,
  Server,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils/errorHandling";
import { LogsTab } from "@/components/resources/LogsTab";

interface Resource {
  id: string;
  name: string;
  namespace: string;
  type: string;
  uid: string;
  resourceVersion: string;
  status: string;
  createdAt: string;
  clusterName: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  userTags?: string[];
  userNotes?: string;
  isFavorite?: boolean;
  spec?: Record<string, unknown>;
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
    controller: boolean;
  }>;
}

interface ResourceHistory {
  id: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  timestamp: string;
  message?: string;
}

interface Pod {
  id: string;
  name: string;
  namespace: string;
  status: string;
  spec?: {
    nodeName?: string;
  };
}

interface StatusConfig {
  text: string;
  variant: "default" | "outline" | "destructive" | "secondary";
}

const resourceIcons: Record<
  string,
  React.ComponentType<import("lucide-react").LucideProps>
> = {
  Pod: Box,
  Service: Globe,
  Deployment: Package,
  StatefulSet: Database,
  Node: Server,
};

const statusConfig: Record<string, StatusConfig> = {
  running: { text: "Running", variant: "default" },
  pending: { text: "Pending", variant: "outline" },
  failed: { text: "Failed", variant: "destructive" },
  completed: { text: "Completed", variant: "secondary" },
  unknown: { text: "Unknown", variant: "outline" },
  deleted: { text: "Deleted", variant: "outline" },
  warning: { text: "Warning", variant: "outline" },
};

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [history, setHistory] = useState<ResourceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pods, setPods] = useState<Pod[]>([]);

  const resourceId = params.id as string;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Resources", href: "/dashboard/resources" },
    { label: resource?.name || "Loading..." },
  ];

  const fetchResource = useCallback(async () => {
    try {
      const response = await api.get(`/resources/${resourceId}`);
      setResource(response.data.resource);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error("Failed to fetch resource:", error);
      toast.error(getErrorMessage(error, "Failed to load resource"));
      router.push("/dashboard/resources");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resourceId, router]);

  const fetchPods = useCallback(async () => {
    if (resource?.type !== "Deployment" && resource?.type !== "StatefulSet") {
      return;
    }

    try {
      const response = await api.get(`/resources/${resourceId}/pods`);
      setPods(response.data.pods || []);
    } catch (error) {
      console.error("Failed to fetch pods:", error);
      toast.error(getErrorMessage(error, "Failed to fetch associated pods"));
    }
  }, [resource?.type, resourceId]);

  const toggleFavorite = async () => {
    if (!resource) return;

    try {
      await api.patch(`/resources/${resourceId}`, {
        isFavorite: !resource.isFavorite,
        userTags: resource.userTags,
        userNotes: resource.userNotes,
      });

      setResource({ ...resource, isFavorite: !resource.isFavorite });
      toast.success(
        resource.isFavorite ? "Removed from favorites" : "Added to favorites"
      );
    } catch {
      toast.error("Failed to update favorite status");
    }
  };

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  useEffect(() => {
    if (resource) {
      if (resource.type === "Deployment" || resource.type === "StatefulSet") {
        fetchPods();
      }
    }
  }, [resource, fetchPods]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResource();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Loading..." breadcrumbs={breadcrumbs}>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!resource) {
    return null;
  }

  const Icon = resourceIcons[resource.type] || Box;
  const status = statusConfig[resource.status] || statusConfig.unknown;

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggleFavorite}>
        {resource.isFavorite ? (
          <StarOff className="mr-2 h-4 w-4" />
        ) : (
          <Star className="mr-2 h-4 w-4" />
        )}
        {resource.isFavorite ? "Unfavorite" : "Favorite"}
      </Button>
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
        title={resource.name}
        description={`${resource.type} in ${resource.namespace || "cluster"}`}
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <CardTitle className="text-2xl">{resource.name}</CardTitle>
                  <CardDescription>
                    {resource.type} • {resource.namespace || "Cluster Resource"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant} className="text-sm">
                  {status.text}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {resource.clusterName}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="font-mono text-sm">{resource.uid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Resource Version
                </p>
                <p className="font-mono text-sm">{resource.resourceVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(resource.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cluster</p>
                <p className="text-sm">{resource.clusterName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              <Settings className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
            {resource.type === "Pod" && (
              <TabsTrigger value="logs">
                <FileText className="mr-2 h-4 w-4" />
                Logs
              </TabsTrigger>
            )}
            {(resource.type === "Deployment" ||
              resource.type === "StatefulSet") && (
              <TabsTrigger value="pods">
                <Box className="mr-2 h-4 w-4" />
                Pods
              </TabsTrigger>
            )}
            <TabsTrigger value="history">
              <Clock className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Resource Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Labels */}
                {resource.labels && Object.keys(resource.labels).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Labels</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(resource.labels).map(([key, value]) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="text-xs"
                        >
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annotations */}
                {resource.annotations &&
                  Object.keys(resource.annotations).length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Annotations</h4>
                      <div className="space-y-1">
                        {Object.entries(resource.annotations).map(
                          ([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-mono text-muted-foreground">
                                {key}:
                              </span>{" "}
                              <span className="break-all">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Owner References */}
                {resource.ownerReferences &&
                  resource.ownerReferences.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Owner References
                      </h4>
                      {resource.ownerReferences.map(owner => (
                        <div key={owner.uid} className="text-sm">
                          {owner.kind}/{owner.name}{" "}
                          {owner.controller && "(controller)"}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Spec */}
                {resource.spec && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Specification</h4>
                    <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                      {JSON.stringify(resource.spec, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {resource.type === "Pod" && (
            <TabsContent value="logs">
              <LogsTab resourceId={resourceId} resourceType={resource.type} />
            </TabsContent>
          )}

          {(resource.type === "Deployment" ||
            resource.type === "StatefulSet") && (
            <TabsContent value="pods">
              <Card>
                <CardHeader>
                  <CardTitle>Associated Pods</CardTitle>
                </CardHeader>
                <CardContent>
                  {pods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No pods found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pods.map(pod => (
                        <div
                          key={pod.id}
                          className="flex items-center justify-between rounded border p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/dashboard/resources/${pod.id}`)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{pod.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {pod.namespace} •{" "}
                                {pod.spec?.nodeName || "Unscheduled"}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              statusConfig[pod.status]?.variant || "outline"
                            }
                          >
                            {statusConfig[pod.status]?.text || pod.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Resource History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No history available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map(event => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 border-l-2 pl-3"
                      >
                        <Activity className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {event.action}
                            </span>
                            {event.oldStatus && event.newStatus && (
                              <span className="text-xs text-muted-foreground">
                                {event.oldStatus} → {event.newStatus}
                              </span>
                            )}
                          </div>
                          {event.message && (
                            <p className="text-xs text-muted-foreground">
                              {event.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  );
}
