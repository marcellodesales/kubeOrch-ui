"use client";

import { useState, useEffect } from "react";
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
import {
  Activity,
  Server,
  Database,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Loader2,
  XCircle,
  FileText,
} from "lucide-react";
import { useCluster } from "@/hooks/useCluster";
import { useClusterMetrics } from "@/hooks/useClusterMetrics";
import { ComponentHealth } from "@/lib/services/cluster";
import {
  getRecentWorkflows,
  RecentWorkflow,
  getDashboardStats,
  DashboardStatsResponse,
} from "@/lib/services/workflow";

const statCardConfig = [
  {
    key: "total_workflows" as const,
    title: "Total Workflows",
    icon: Server,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    key: "published_workflows" as const,
    title: "Published Workflows",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    key: "total_runs" as const,
    title: "Total Runs",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    key: "success_rate" as const,
    title: "Success Rate",
    icon: CheckCircle,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
];

const workflowStatusConfig = {
  draft: {
    color: "bg-yellow-500",
    text: "Draft",
    icon: Clock,
    variant: "secondary" as const,
  },
  published: {
    color: "bg-green-500",
    text: "Active",
    icon: CheckCircle,
    variant: "default" as const,
  },
  archived: {
    color: "bg-gray-500",
    text: "Archived",
    icon: XCircle,
    variant: "outline" as const,
  },
};

function formatRelativeTime(dateString: string): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return rtf.format(-diffDays, "day");
  }

  return date.toLocaleDateString();
}

// Helper to get health status badge
function getHealthBadge(status: ComponentHealth["status"]) {
  switch (status) {
    case "healthy":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Healthy
        </Badge>
      );
    case "unhealthy":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Unhealthy
        </Badge>
      );
    case "unknown":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Unknown
        </Badge>
      );
  }
}

// Helper to get resource bar color
function getResourceBarColor(percentage: number) {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  return "bg-primary";
}

export default function DashboardPage() {
  const breadcrumbs = [{ label: "Dashboard" }];
  const { defaultCluster, clusters, isLoading: clusterLoading } = useCluster();
  const [recentWorkflows, setRecentWorkflows] = useState<RecentWorkflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] =
    useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getRecentWorkflows()
      .then(setRecentWorkflows)
      .catch(() => setRecentWorkflows([]))
      .finally(() => setWorkflowsLoading(false));
    getDashboardStats()
      .then(setDashboardStats)
      .catch(() => setDashboardStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  // Use default cluster, or fall back to first available cluster
  const activeCluster = defaultCluster || clusters[0] || null;

  const {
    metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useClusterMetrics(activeCluster?.name);

  const isLoading = clusterLoading || metricsLoading;

  const pageActions = (
    <>
      <Button size="sm" asChild>
        <Link href="/dashboard/workflow/new">
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Link>
      </Button>
    </>
  );

  // Default health data when no cluster is connected
  const defaultHealth: ComponentHealth[] = [
    { name: "API Server", status: "unknown" },
    { name: "Scheduler", status: "unknown" },
    { name: "Controller", status: "unknown" },
    { name: "etcd", status: "unknown" },
  ];

  const healthData = metrics?.health || defaultHealth;

  // Resource data - keep as undefined if not available
  const cpuPercentage = metrics?.resources?.cpu?.percentage;
  const memoryPercentage = metrics?.resources?.memory?.percentage;
  const storagePercentage = metrics?.resources?.storage?.percentage;

  return (
    <AppLayout>
      <PageContainer
        title="Dashboard"
        description="Monitor your Kubernetes deployments and resources"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCardConfig.map(card => {
              const Icon = card.icon;
              const stat = dashboardStats?.[card.key];
              const TrendIcon =
                stat?.trend === "down" ? TrendingDown : TrendingUp;

              return (
                <Card key={card.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex items-center h-8">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {stat?.value ?? "0"}
                        </div>
                        {stat && stat.trend !== "neutral" ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendIcon className="h-3 w-3" />
                            <span
                              className={
                                stat.trend === "up"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {stat.change > 0 ? "+" : ""}
                              {stat.change}%
                            </span>
                            <span>from last month</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No previous data
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Workflows</CardTitle>
                    <CardDescription>
                      Your most recently updated workflows
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/workflow">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workflowsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentWorkflows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No workflows yet. Create your first workflow to get
                      started.
                    </p>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/workflow/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workflow
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentWorkflows.map(workflow => {
                      const status = workflowStatusConfig[workflow.status];
                      const StatusIcon = status.icon;

                      return (
                        <Link
                          key={workflow.id}
                          href={`/dashboard/workflow/${workflow.id}`}
                          className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-2 w-2 rounded-full ${status.color}`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {workflow.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  v{workflow.current_version}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {workflow.cluster_id && (
                                  <span className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    {workflow.cluster_id}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatRelativeTime(workflow.updated_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.text}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/dashboard/workflow/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Workflow
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/dashboard/build/new">
                    <Server className="mr-2 h-4 w-4" />
                    Build Application
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/dashboard/resources">
                    <Database className="mr-2 h-4 w-4" />
                    Manage Resources
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/dashboard/monitoring/metrics">
                    <Activity className="mr-2 h-4 w-4" />
                    View Metrics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>
                      {activeCluster
                        ? `Cluster: ${activeCluster.displayName || activeCluster.name}`
                        : "No cluster connected"}
                    </CardDescription>
                  </div>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {metricsError ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load metrics</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {healthData.map(component => (
                      <div
                        key={component.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{component.name}</span>
                        {getHealthBadge(component.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resource Usage</CardTitle>
                    <CardDescription>
                      {metrics
                        ? `${metrics.nodeCount} nodes, ${metrics.podCount} pods`
                        : "Current cluster utilization"}
                    </CardDescription>
                  </div>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {metricsError ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load metrics</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">
                          {cpuPercentage !== undefined
                            ? `${cpuPercentage.toFixed(1)}%`
                            : "Not available"}
                        </span>
                      </div>
                      {cpuPercentage !== undefined ? (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${getResourceBarColor(cpuPercentage)}`}
                            style={{
                              width: `${Math.min(cpuPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Memory</span>
                        <span className="font-medium">
                          {memoryPercentage !== undefined
                            ? `${memoryPercentage.toFixed(1)}%`
                            : "Not available"}
                        </span>
                      </div>
                      {memoryPercentage !== undefined ? (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${getResourceBarColor(memoryPercentage)}`}
                            style={{
                              width: `${Math.min(memoryPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Storage</span>
                        <span className="font-medium">
                          {storagePercentage !== undefined
                            ? `${storagePercentage.toFixed(1)}%`
                            : "Not available"}
                        </span>
                      </div>
                      {storagePercentage !== undefined ? (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${getResourceBarColor(storagePercentage)}`}
                            style={{
                              width: `${Math.min(storagePercentage, 100)}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1 h-2 w-full rounded-full bg-muted" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
