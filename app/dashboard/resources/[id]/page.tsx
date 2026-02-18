"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  FileText,
  Activity,
  Settings,
  Clock,
  Database,
  Box,
  Globe,
  Package,
  Server,
  GitBranch,
  Plus,
  TrendingUp,
  Tag,
  RotateCcw,
  Trash2,
  ArrowRight,
  ChevronsUpDown,
  type LucideProps,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { getErrorMessage } from "@/lib/utils/errorHandling";
import { LogsTab } from "@/components/resources/LogsTab";
import { TerminalTab } from "@/components/resources/TerminalTab";
import { useResourceStatusStream } from "@/lib/hooks/useResourceStatusStream";

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
  workflowId?: string;
  workflowName?: string;
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
  changes?: Record<string, unknown>;
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

const resourceIcons: Record<string, React.ComponentType<LucideProps>> = {
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

interface ActionConfig {
  label: string;
  borderColor: string;
  iconColor: string;
  icon: React.ComponentType<LucideProps>;
}

const actionConfigMap: Record<string, ActionConfig> = {
  created: {
    label: "Created",
    borderColor: "border-green-500",
    iconColor: "text-green-500",
    icon: Plus,
  },
  status_changed: {
    label: "Status Changed",
    borderColor: "border-blue-500",
    iconColor: "text-blue-500",
    icon: Activity,
  },
  scaled: {
    label: "Scaled",
    borderColor: "border-purple-500",
    iconColor: "text-purple-500",
    icon: TrendingUp,
  },
  image_changed: {
    label: "Image Changed",
    borderColor: "border-orange-500",
    iconColor: "text-orange-500",
    icon: Package,
  },
  labels_changed: {
    label: "Labels Changed",
    borderColor: "border-cyan-500",
    iconColor: "text-cyan-500",
    icon: Tag,
  },
  container_restarted: {
    label: "Container Restarted",
    borderColor: "border-yellow-500",
    iconColor: "text-yellow-500",
    icon: RotateCcw,
  },
  updated: {
    label: "Updated",
    borderColor: "border-blue-400",
    iconColor: "text-blue-400",
    icon: Activity,
  },
  deleted: {
    label: "Deleted",
    borderColor: "border-red-500",
    iconColor: "text-red-500",
    icon: Trash2,
  },
};

const defaultActionConfig: ActionConfig = {
  label: "Event",
  borderColor: "border-muted-foreground/30",
  iconColor: "text-muted-foreground",
  icon: Activity,
};

function ChangeValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground italic">none</span>;
  if (typeof value === "boolean")
    return <span>{value ? "true" : "false"}</span>;
  if (Array.isArray(value)) return <span>{value.join(", ")}</span>;
  return <span>{String(value)}</span>;
}

function ChangesPanel({ changes }: { changes: Record<string, unknown> }) {
  return (
    <div className="mt-2 space-y-1.5 rounded bg-muted/50 p-3 text-xs">
      {Object.entries(changes).map(([key, value]) => {
        const change = value as Record<string, unknown> | null;
        if (!change) return null;

        // Map diff (labels/annotations with added/removed/changed)
        if ("added" in change || "removed" in change || "changed" in change) {
          return (
            <div key={key}>
              <span className="font-medium text-muted-foreground">{key}:</span>
              {!!change.added &&
                Object.keys(change.added as Record<string, string>).length >
                  0 && (
                  <div className="ml-3">
                    {Object.entries(change.added as Record<string, string>).map(
                      ([k, v]) => (
                        <div
                          key={k}
                          className="text-green-600 dark:text-green-400"
                        >
                          + {k}: {v}
                        </div>
                      )
                    )}
                  </div>
                )}
              {!!change.removed &&
                Object.keys(change.removed as Record<string, string>).length >
                  0 && (
                  <div className="ml-3">
                    {Object.entries(
                      change.removed as Record<string, string>
                    ).map(([k, v]) => (
                      <div key={k} className="text-red-600 dark:text-red-400">
                        - {k}: {v}
                      </div>
                    ))}
                  </div>
                )}
              {!!change.changed &&
                Object.keys(change.changed as Record<string, unknown>).length >
                  0 && (
                  <div className="ml-3">
                    {Object.entries(
                      change.changed as Record<string, Record<string, unknown>>
                    ).map(([k, diff]) => (
                      <div key={k} className="flex items-center gap-1">
                        <span className="text-muted-foreground">{k}:</span>
                        <span className="text-red-600 dark:text-red-400">
                          <ChangeValue value={diff.old} />
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-green-600 dark:text-green-400">
                          <ChangeValue value={diff.new} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          );
        }

        // Field diff with old → new
        if ("old" in change && "new" in change) {
          return (
            <div key={key} className="flex items-center gap-1">
              <span className="font-medium text-muted-foreground">{key}:</span>
              <span className="text-red-600 dark:text-red-400">
                <ChangeValue value={change.old} />
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-green-600 dark:text-green-400">
                <ChangeValue value={change.new} />
              </span>
            </div>
          );
        }

        // Creation snapshot (simple key-value)
        return (
          <div key={key} className="flex items-center gap-1">
            <span className="font-medium text-muted-foreground">{key}:</span>
            <ChangeValue value={value} />
          </div>
        );
      })}
    </div>
  );
}

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [history, setHistory] = useState<ResourceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pods, setPods] = useState<Pod[]>([]);
  const [uptime, setUptime] = useState<string>("");

  const resourceId = params.id as string;

  // Subscribe to real-time status updates
  const { resourceStatus } = useResourceStatusStream(
    resourceId,
    !loading && !!resource
  );

  // Derive the current status from real-time updates or fall back to resource.status
  const currentStatus = resourceStatus?.state || resource?.status || "unknown";

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

  // Types that have child resources
  const hasChildren = [
    "Deployment",
    "StatefulSet",
    "Job",
    "CronJob",
    "DaemonSet",
  ].includes(resource?.type || "");
  const childLabel = resource?.type === "CronJob" ? "Jobs" : "Pods";

  const fetchPods = useCallback(async () => {
    if (!hasChildren) return;

    try {
      const response = await api.get(`/resources/${resourceId}/pods`);
      // Backend returns "pods" for most types, "jobs" for CronJob
      setPods(response.data.pods || response.data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch child resources:", error);
      toast.error(
        getErrorMessage(error, "Failed to fetch associated resources")
      );
    }
  }, [hasChildren, resourceId]);

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
    if (resource && hasChildren) {
      fetchPods();
    }
  }, [resource, hasChildren, fetchPods]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResource();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const calculateUptime = useCallback((createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = now - created;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay}d ${diffHour % 24}h`;
    }
    if (diffHour > 0) {
      return `${diffHour}h ${diffMin % 60}m`;
    }
    if (diffMin > 0) {
      return `${diffMin}m`;
    }
    return `${diffSec}s`;
  }, []);

  useEffect(() => {
    if (resource?.createdAt) {
      // Update uptime immediately
      setUptime(calculateUptime(resource.createdAt));

      // Update every 10 seconds
      const interval = setInterval(() => {
        setUptime(calculateUptime(resource.createdAt));
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [resource?.createdAt, calculateUptime]);

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
  const status = statusConfig[currentStatus] || statusConfig.unknown;

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleFavorite}
        title={
          resource.isFavorite ? "Remove from favorites" : "Add to favorites"
        }
      >
        {resource.isFavorite ? (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ) : (
          <Star className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh resource"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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
                {resourceStatus?.message && (
                  <span className="text-xs text-muted-foreground">
                    {resourceStatus.message}
                  </span>
                )}
                {uptime && (
                  <Badge variant="secondary" className="text-sm">
                    {uptime}
                  </Badge>
                )}
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
              {resource.workflowId && (
                <div>
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <Link
                    href={`/dashboard/workflow/${resource.workflowId}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    {resource.workflowName || "View Workflow"}
                  </Link>
                </div>
              )}
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
              <>
                <TabsTrigger value="logs">
                  <FileText className="mr-2 h-4 w-4" />
                  Logs
                </TabsTrigger>
                {!resource.labels?.["job-name"] && (
                  <TabsTrigger
                    value="terminal"
                    disabled={
                      currentStatus === "completed" ||
                      currentStatus === "failed"
                    }
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Terminal
                  </TabsTrigger>
                )}
              </>
            )}
            {hasChildren && (
              <TabsTrigger value="pods">
                <Box className="mr-2 h-4 w-4" />
                {childLabel}
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
            <>
              <TabsContent value="logs">
                <LogsTab resourceId={resourceId} resourceType={resource.type} />
              </TabsContent>
              <TabsContent value="terminal">
                <TerminalTab
                  resourceId={resourceId}
                  resourceType={resource.type}
                  containers={
                    resource.spec?.containers as
                      | Array<{ name: string }>
                      | undefined
                  }
                />
              </TabsContent>
            </>
          )}

          {hasChildren && (
            <TabsContent value="pods">
              <Card>
                <CardHeader>
                  <CardTitle>Associated {childLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  {pods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No {childLabel.toLowerCase()} found
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
                                {pod.spec?.nodeName || pod.status}
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
                    {history.map(event => {
                      const config =
                        actionConfigMap[event.action] || defaultActionConfig;
                      const ActionIcon = config.icon;
                      const hasChanges =
                        event.changes && Object.keys(event.changes).length > 0;

                      return (
                        <Collapsible key={event.id}>
                          <div
                            className={`border-l-2 ${config.borderColor} pl-3`}
                          >
                            <div className="flex items-start gap-3">
                              <ActionIcon
                                className={`mt-0.5 h-4 w-4 ${config.iconColor}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {config.label}
                                  </span>
                                  {event.oldStatus && event.newStatus && (
                                    <span className="text-xs text-muted-foreground">
                                      {event.oldStatus} → {event.newStatus}
                                    </span>
                                  )}
                                  {hasChanges && (
                                    <CollapsibleTrigger asChild>
                                      <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        <ChevronsUpDown className="h-3 w-3" />
                                        Details
                                      </button>
                                    </CollapsibleTrigger>
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
                                {hasChanges && (
                                  <CollapsibleContent>
                                    <ChangesPanel changes={event.changes!} />
                                  </CollapsibleContent>
                                )}
                              </div>
                            </div>
                          </div>
                        </Collapsible>
                      );
                    })}
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
