"use client";

import { useEffect, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Package,
  GitBranch,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuildStream } from "@/lib/hooks/useBuildStream";
import {
  cancelBuild,
  getBuild,
  getBuildStatusColor,
  getBuildStatusLabel,
  isBuildInProgress,
  isBuildTerminal,
  Build,
} from "@/lib/services/build";
import { useState } from "react";

export default function BuildProgressPage() {
  const params = useParams();
  const router = useRouter();
  const buildId = params.id as string;

  const [initialBuild, setInitialBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use SSE streaming for real-time updates
  const { build: streamBuild, logs, isConnected, error, reconnect } = useBuildStream(
    buildId,
    !loading
  );

  // Use streamed build data if available, otherwise use initial build
  const build = streamBuild || initialBuild;

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Builds", href: "/dashboard/workflow" },
    { label: build?.imageName || "Build" },
  ];

  // Fetch initial build data
  const fetchBuild = useCallback(async () => {
    try {
      const response = await getBuild(buildId);
      setInitialBuild(response.build);
    } catch (err) {
      console.error("Failed to fetch build:", err);
      toast.error("Failed to load build");
      router.push("/dashboard/workflow");
    } finally {
      setLoading(false);
    }
  }, [buildId, router]);

  useEffect(() => {
    fetchBuild();
  }, [fetchBuild]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Update elapsed time every second while build is in progress
  useEffect(() => {
    if (!build?.startedAt || isBuildTerminal(build.status)) {
      return;
    }

    const startTime = new Date(build.startedAt).getTime();

    const updateElapsed = () => {
      setElapsedTime(Date.now() - startTime);
    };

    // Update immediately
    updateElapsed();

    // Then update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [build?.startedAt, build?.status]);

  const handleCancel = async () => {
    if (!build || !isBuildInProgress(build.status)) return;

    setCancelling(true);
    try {
      await cancelBuild(buildId);
      toast.success("Build cancelled");
    } catch (err) {
      console.error("Failed to cancel build:", err);
      toast.error("Failed to cancel build");
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = () => {
    // Navigate to new build page with same parameters
    if (!build) return;
    const params = new URLSearchParams({
      repoUrl: build.repoUrl,
      branch: build.branch,
      ...(build.workflowId && { workflowId: build.workflowId }),
    });
    router.push(`/dashboard/build/new?${params.toString()}`);
  };

  const handleCopyImageRef = () => {
    if (build?.finalImageRef) {
      navigator.clipboard.writeText(build.finalImageRef);
      toast.success("Image reference copied to clipboard");
    }
  };

  const handleGoToWorkflow = () => {
    if (build?.workflowId) {
      router.push(`/dashboard/workflow/${build.workflowId}`);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Get duration to display - elapsed time for in-progress, final duration for completed
  const displayDuration = build?.duration || (isBuildInProgress(build?.status || "pending") ? elapsedTime : 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer title="Loading..." breadcrumbs={breadcrumbs}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!build) {
    return null;
  }

  const isInProgress = isBuildInProgress(build.status);
  const isTerminal = isBuildTerminal(build.status);
  const statusColor = getBuildStatusColor(build.status);
  const statusLabel = getBuildStatusLabel(build.status);

  const pageActions = (
    <div className="flex items-center gap-2">
      {isInProgress && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Cancel Build
        </Button>
      )}
      {build.status === "failed" && (
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
      {build.status === "completed" && build.workflowId && (
        <Button variant="default" size="sm" onClick={handleGoToWorkflow}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Go to Workflow
        </Button>
      )}
    </div>
  );

  return (
    <AppLayout>
      <PageContainer
        title={`Build: ${build.imageName}:${build.imageTag}`}
        description={`Building from ${build.repoUrl}`}
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Build Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <CardTitle>Build Status</CardTitle>
                    <CardDescription>{build.currentStage}</CardDescription>
                  </div>
                </div>
                <Badge className={statusColor}>{statusLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{build.progress}%</span>
                </div>
                <Progress value={build.progress} className="h-2" />
              </div>

              {/* Build Info Grid */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    Branch
                  </div>
                  <p className="text-sm font-medium">{build.branch}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="h-4 w-4" />
                    Method
                  </div>
                  <p className="text-sm font-medium">
                    {build.useNixpacks ? "Nixpacks" : "Dockerfile"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Started
                  </div>
                  <p className="text-sm font-medium">{formatDate(build.startedAt)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                  <p className="text-sm font-medium">{formatDuration(displayDuration)}</p>
                </div>
              </div>

              {/* Completed Build Info */}
              {build.status === "completed" && build.finalImageRef && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Build Successful</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Image</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyImageRef}
                        className="h-7 px-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <code className="block w-full p-2 bg-muted rounded text-xs break-all">
                      {build.finalImageRef}
                    </code>
                  </div>
                  {build.imageDigest && (
                    <div className="text-xs text-muted-foreground">
                      Digest: {build.imageDigest.substring(0, 20)}...
                    </div>
                  )}
                  {build.imageSize && (
                    <div className="text-xs text-muted-foreground">
                      Size: {formatBytes(build.imageSize)}
                    </div>
                  )}
                </div>
              )}

              {/* Failed Build Info */}
              {build.status === "failed" && build.errorMessage && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Build Failed</span>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-sm text-red-500">{build.errorMessage}</p>
                    {build.errorStage && (
                      <p className="text-xs text-red-400 mt-1">
                        Failed at: {build.errorStage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Status */}
              {!isTerminal && (
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  {isConnected ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Live updates connected
                    </>
                  ) : error ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Disconnected
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={reconnect}
                        className="h-6 px-2 text-xs"
                      >
                        Reconnect
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Connecting...
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Build Logs Card */}
          <Card className="flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Build Logs</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {logs.length} lines
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <div className="h-[400px] overflow-auto bg-zinc-950 rounded-lg p-4 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isInProgress ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Waiting for logs...
                      </>
                    ) : (
                      "No logs available"
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {logs.map((log, index) => (
                      <div key={index} className="flex">
                        <span className="text-zinc-600 w-20 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-zinc-500 w-16 flex-shrink-0">
                          [{log.stage}]
                        </span>
                        <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
