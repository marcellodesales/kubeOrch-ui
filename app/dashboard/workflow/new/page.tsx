"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { createWorkflow } from "@/lib/services/workflow";
import {
  ArrowLeft,
  Server,
  Upload,
  Link,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Box,
  Globe,
  Key,
  HardDrive,
  Database,
  FileCode,
  Layers,
  X,
  Hammer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clusterService, type Cluster } from "@/lib/services/cluster";
import {
  ImportAnalysis,
  SourceBuildConfig,
  uploadComposeFile,
  analyzeImport,
  createWorkflowFromImport,
  detectSourceFromUrl,
} from "@/lib/services/import";
import { useImportStream } from "@/lib/hooks/useImportStream";

const nodeTypeIcons: Record<string, React.ReactNode> = {
  deployment: <Box className="h-4 w-4" />,
  service: <Globe className="h-4 w-4" />,
  configmap: <FileCode className="h-4 w-4" />,
  secret: <Key className="h-4 w-4" />,
  persistentvolumeclaim: <HardDrive className="h-4 w-4" />,
  statefulset: <Database className="h-4 w-4" />,
  ingress: <Layers className="h-4 w-4" />,
};

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [defaultClusterId, setDefaultClusterId] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cluster_id: "",
  });

  // Import state - support multiple imports
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<
    Array<{ id: string; source: string; analysis: ImportAnalysis }>
  >([]);

  // Async import state
  const [asyncSessionId, setAsyncSessionId] = useState<string | null>(null);
  const [pendingSourceName, setPendingSourceName] = useState<string>("");
  const processedSessionsRef = useRef<Set<string>>(new Set());

  // Subscribe to async import stream when we have a session ID
  const {
    session: importSession,
    analysis: asyncAnalysis,
    error: streamError,
  } = useImportStream(asyncSessionId || "", !!asyncSessionId);

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // URL state
  const [importUrl, setImportUrl] = useState("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflows", href: "/dashboard/workflow" },
    { label: "New Workflow" },
  ];

  useEffect(() => {
    loadClusters();
  }, []);

  // Handle async import completion
  useEffect(() => {
    // Guard: only process if we have a valid session ID that hasn't been processed yet
    if (!asyncSessionId || processedSessionsRef.current.has(asyncSessionId)) {
      return;
    }

    if (importSession?.status === "completed" && asyncAnalysis) {
      // Mark as processed to prevent re-running
      processedSessionsRef.current.add(asyncSessionId);

      // Validate the analysis has required data
      if (
        asyncAnalysis.suggestedNodes &&
        asyncAnalysis.suggestedNodes.length > 0
      ) {
        setAnalyses(prev => {
          // Auto-fill workflow name from first import (when prev is empty)
          if (prev.length === 0 && asyncAnalysis.services?.length > 0) {
            const firstName = (asyncAnalysis.services[0] as { name: string })
              .name;
            setFormData(formPrev => ({
              ...formPrev,
              name: formPrev.name || `${firstName}-workflow`,
            }));
          }

          return [
            ...prev,
            {
              id: `url-${Date.now()}`,
              source: pendingSourceName,
              analysis: asyncAnalysis as ImportAnalysis,
            },
          ];
        });
      } else {
        setImportError("Analysis completed but no deployable resources found");
      }

      // Clear async state
      setAsyncSessionId(null);
      setPendingSourceName("");
      setIsAnalyzing(false);
    } else if (importSession?.status === "failed") {
      // Mark as processed to prevent re-running
      processedSessionsRef.current.add(asyncSessionId);

      setImportError(importSession.errorMessage || "Import analysis failed");
      setAsyncSessionId(null);
      setPendingSourceName("");
      setIsAnalyzing(false);
    }
  }, [asyncSessionId, importSession?.status, asyncAnalysis, pendingSourceName]);

  // Handle stream errors
  useEffect(() => {
    if (streamError && asyncSessionId) {
      setImportError(streamError);
      setAsyncSessionId(null);
      setPendingSourceName("");
      setIsAnalyzing(false);
    }
  }, [streamError, asyncSessionId]);

  const loadClusters = async () => {
    try {
      const data = await clusterService.listClusters();
      setClusters(data.clusters || []);

      const defaultCluster = data.clusters?.find(
        c => c.id === data.default || c.default
      );
      if (defaultCluster) {
        setFormData(prev => ({ ...prev, cluster_id: defaultCluster.name }));
        setDefaultClusterId(defaultCluster.name);
      }
    } catch (error) {
      console.error("Failed to load clusters:", error);
      toast.error("Failed to load clusters");
    } finally {
      setLoadingClusters(false);
    }
  };

  const removeImport = useCallback((id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAllImports = useCallback(() => {
    setAnalyses([]);
    setImportError(null);
    setSelectedFile(null);
    setImportUrl("");
    setIsAnalyzing(false);
  }, []);

  // File handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setImportError(null);
    setImportUrl("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
        setSelectedFile(file);
        // Auto-analyze on drop
        analyzeFile(file);
      } else {
        setImportError("Please upload a .yml or .yaml file");
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImportError(null);
      setImportUrl("");
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.name.endsWith(".yml") || file.name.endsWith(".yaml")) {
          setSelectedFile(file);
          // Auto-analyze on select
          analyzeFile(file);
        } else {
          setImportError("Please upload a .yml or .yaml file");
        }
      }
    },
    []
  );

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setImportError(null);

    try {
      const result = await uploadComposeFile(file);

      // Validate result has proper analysis data
      if (!result.analysis || !result.analysis.suggestedNodes) {
        throw new Error(
          "Failed to analyze file - no deployable resources found"
        );
      }

      // Add to analyses array
      setAnalyses(prev => [
        ...prev,
        {
          id: `file-${Date.now()}`,
          source: file.name,
          analysis: result.analysis,
        },
      ]);

      // Auto-fill workflow name from first import
      if (analyses.length === 0 && result.analysis.services?.length > 0) {
        const firstName = result.analysis.services[0].name;
        setFormData(prev => ({
          ...prev,
          name: prev.name || `${firstName}-workflow`,
        }));
      }

      // Clear file input for next import
      setSelectedFile(null);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        "Failed to analyze file";
      setImportError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    if (!importUrl) return;

    setIsAnalyzing(true);
    setImportError(null);
    setSelectedFile(null);

    try {
      const source = detectSourceFromUrl(importUrl);
      const result = await analyzeImport({
        source,
        url: importUrl,
        branch: "main",
      });

      // Extract repo/file name from URL for display
      const urlParts = importUrl.split("/");
      const sourceName =
        urlParts[urlParts.length - 1] ||
        urlParts[urlParts.length - 2] ||
        importUrl;

      // Check if this is an async import (requires SSE streaming)
      if (result.async && result.sessionId) {
        // Store session ID and source name, let useEffect handle completion
        setAsyncSessionId(result.sessionId);
        setPendingSourceName(sourceName);
        setImportUrl(""); // Clear URL input
        // Note: Don't set isAnalyzing to false - the useEffect will do that when complete
        return;
      }

      // Sync response - validate result has proper analysis data
      if (!result.analysis || !result.analysis.suggestedNodes) {
        throw new Error(
          result.analysis?.errors?.[0]?.message ||
            "Failed to analyze repository - no deployable resources found"
        );
      }

      // Add to analyses array
      setAnalyses(prev => [
        ...prev,
        {
          id: `url-${Date.now()}`,
          source: sourceName,
          analysis: result.analysis!,
        },
      ]);

      // Auto-fill workflow name from first import
      if (analyses.length === 0 && result.analysis.services?.length > 0) {
        const firstName = result.analysis.services[0].name;
        setFormData(prev => ({
          ...prev,
          name: prev.name || `${firstName}-workflow`,
        }));
      }

      // Clear URL input for next import
      setImportUrl("");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        "Failed to analyze URL";
      setImportError(message);
    } finally {
      // Only set analyzing to false if not async (async is handled by useEffect)
      if (!asyncSessionId) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    if (!formData.cluster_id) {
      toast.error("Please select a cluster");
      return;
    }

    setLoading(true);

    // If build is required, create workflow first then redirect to build page
    if (buildRequired && buildConfig) {
      try {
        // Merge all analyses (should only be one when build is required)
        const mergedAnalysis: ImportAnalysis = {
          detectedType: analyses.map(a => a.analysis.detectedType).join(", "),
          services: analyses.flatMap(a => a.analysis.services),
          warnings: analyses.flatMap(a => a.analysis.warnings || []),
          suggestedNodes: analyses.flatMap(a => a.analysis.suggestedNodes),
          suggestedEdges: analyses.flatMap(a => a.analysis.suggestedEdges),
          layoutPositions: analyses.reduce(
            (acc, a) => ({ ...acc, ...a.analysis.layoutPositions }),
            {}
          ),
        };

        // Create workflow first (with placeholder image - backend will update after build)
        const result = await createWorkflowFromImport({
          name: formData.name,
          clusterId: formData.cluster_id,
          analysis: mergedAnalysis,
        });

        // Now redirect to build page with workflowId
        const buildParams = new URLSearchParams({
          repoUrl: buildConfig.repoUrl,
          branch: buildConfig.branch || "main",
          workflowId: result.workflow.id,
        });

        toast.success("Workflow created! Now configure your build.");
        router.push(`/dashboard/build/new?${buildParams.toString()}`);
      } catch (error: unknown) {
        console.error("Failed to create workflow:", error);
        const err = error as {
          response?: { data?: { error?: string } };
          message?: string;
        };
        const errorMessage =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create workflow";
        toast.error(errorMessage);
        setLoading(false);
      }
      return;
    }

    try {
      if (analyses.length > 0) {
        // Merge all analyses into one
        const mergedAnalysis: ImportAnalysis = {
          detectedType: analyses.map(a => a.analysis.detectedType).join(", "),
          services: analyses.flatMap(a => a.analysis.services),
          warnings: analyses.flatMap(a => a.analysis.warnings || []),
          suggestedNodes: analyses.flatMap(a => a.analysis.suggestedNodes),
          suggestedEdges: analyses.flatMap(a => a.analysis.suggestedEdges),
          layoutPositions: analyses.reduce(
            (acc, a) => ({ ...acc, ...a.analysis.layoutPositions }),
            {}
          ),
        };

        // Create from merged imports
        const result = await createWorkflowFromImport({
          name: formData.name,
          clusterId: formData.cluster_id,
          analysis: mergedAnalysis,
        });
        toast.success("Workflow created successfully");
        router.push(`/dashboard/workflow/${result.workflow.id}`);
      } else {
        // Create blank workflow
        const result = await createWorkflow({
          name: formData.name,
          description: formData.description,
          cluster_id: formData.cluster_id,
        });
        toast.success("Workflow created successfully");
        router.push(`/dashboard/workflow/${result.id}`);
      }
    } catch (error: unknown) {
      console.error("Failed to create workflow:", error);
      const err = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create workflow";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const pageActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/dashboard/workflow")}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Workflows
    </Button>
  );

  // Count nodes by type for preview (aggregate across all imports)
  const nodeCountsByType = analyses.reduce(
    (acc, { analysis }) => {
      if (analysis?.suggestedNodes) {
        analysis.suggestedNodes.forEach(node => {
          acc[node.type] = (acc[node.type] || 0) + 1;
        });
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const totalNodes = Object.values(nodeCountsByType).reduce(
    (sum, count) => sum + count,
    0
  );

  // Check if any analysis requires a build
  const buildRequired = analyses.some(
    ({ analysis }) => analysis?.needsBuild === true
  );
  const buildConfig = analyses.find(
    ({ analysis }) => analysis?.needsBuild && analysis?.sourceBuildConfig
  )?.analysis?.sourceBuildConfig as SourceBuildConfig | undefined;

  return (
    <AppLayout>
      <PageContainer
        title="Create New Workflow"
        description="Set up a new workflow for your deployments"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="max-w-6xl mx-auto">
          {loadingClusters ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">
                  Loading clusters...
                </span>
              </CardContent>
            </Card>
          ) : clusters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No clusters available. Please add a cluster first.
                </p>
                <Button onClick={() => router.push("/dashboard/clusters/new")}>
                  Add Cluster
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <form
                id="workflow-form"
                onSubmit={handleSubmit}
                className="lg:col-span-3"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Details</CardTitle>
                    <CardDescription>
                      Configure your workflow settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cluster">
                          Target Cluster{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.cluster_id}
                          onValueChange={value =>
                            setFormData({ ...formData, cluster_id: value })
                          }
                          disabled={loading}
                        >
                          <SelectTrigger id="cluster" className="w-full">
                            <SelectValue placeholder="Select a cluster">
                              {formData.cluster_id && (
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4" />
                                  <span>
                                    {clusters.find(
                                      c => c.name === formData.cluster_id
                                    )?.displayName || formData.cluster_id}
                                  </span>
                                  {formData.cluster_id === defaultClusterId && (
                                    <span className="text-xs text-muted-foreground">
                                      (default)
                                    </span>
                                  )}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {clusters.map(cluster => (
                              <SelectItem
                                key={cluster.name}
                                value={cluster.name}
                              >
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4" />
                                  <span>
                                    {cluster.displayName || cluster.name}
                                  </span>
                                  {cluster.default && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      (default)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Workflow Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., my-app-deployment"
                          value={formData.name}
                          onChange={e =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="What does this workflow deploy?"
                        value={formData.description}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        disabled={loading}
                        rows={2}
                      />
                    </div>

                    {/* Import Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground font-normal">
                          Import Configuration{" "}
                          <span className="text-xs">(optional)</span>
                        </Label>
                        {analyses.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAllImports}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Clear all
                          </Button>
                        )}
                      </div>

                      {/* List of imported sources */}
                      {analyses.length > 0 && (
                        <div className="space-y-2">
                          {analyses.map(({ id, source, analysis }) => (
                            <div
                              key={id}
                              className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium truncate max-w-[200px]">
                                  {source}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {analysis?.services?.length || 0} services
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeImport(id)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {/* Summary of all imports */}
                          {totalNodes > 0 && (
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground px-1">
                              <span className="text-xs font-medium">
                                Total:
                              </span>
                              {Object.entries(nodeCountsByType).map(
                                ([type, count]) => (
                                  <div
                                    key={type}
                                    className="flex items-center gap-1"
                                  >
                                    {nodeTypeIcons[type] || (
                                      <Box className="h-3 w-3" />
                                    )}
                                    <span className="text-xs">
                                      {count} {type}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Import inputs - hidden when build is required (only 1 repo allowed for builds) */}
                      {!buildRequired && (
                        <div className="space-y-3">
                          {/* File Upload - Full width */}
                          <div
                            className={`
                              border rounded-lg p-4 text-center cursor-pointer transition-colors
                              ${
                                dragActive
                                  ? "border-primary bg-primary/5"
                                  : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                              }
                              ${isAnalyzing && selectedFile ? "pointer-events-none opacity-60" : ""}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() =>
                              document.getElementById("file-input")?.click()
                            }
                          >
                            <input
                              id="file-input"
                              type="file"
                              accept=".yml,.yaml"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            {isAnalyzing && selectedFile ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Analyzing {selectedFile.name}...
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Upload className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {analyses.length > 0
                                    ? "Add another YAML file"
                                    : "Drop YAML file here or click to browse"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Or divider */}
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">
                              or
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          {/* URL Input - Full width */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder={
                                  analyses.length > 0
                                    ? "Add another GitHub repository URL"
                                    : "Paste GitHub repository URL"
                                }
                                value={importUrl}
                                onChange={e => setImportUrl(e.target.value)}
                                className="pl-9"
                                disabled={isAnalyzing && !selectedFile}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAnalyzeUrl}
                              disabled={!importUrl || isAnalyzing}
                            >
                              {isAnalyzing && !selectedFile ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Import"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {importError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {importError}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Build Required indicator */}
                      {buildRequired && buildConfig && (
                        <Alert className="py-2 border-amber-500/50 bg-amber-500/10">
                          <Hammer className="h-4 w-4 text-amber-500" />
                          <AlertDescription className="text-sm">
                            <strong className="text-amber-600 dark:text-amber-400">
                              Build Required:
                            </strong>{" "}
                            This repository needs to be built into a container
                            image before deployment. You&apos;ll be redirected
                            to the build page when you create the workflow.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </form>

              {/* Info Card */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">What&apos;s Next?</CardTitle>
                  <CardDescription>
                    After creating your workflow:
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Add deployment nodes for your application components
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Connect nodes to define execution flow
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Configure services, secrets, and volumes
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Deploy to your Kubernetes cluster
                    </li>
                  </ul>
                </CardContent>
                <CardContent className="pt-0 space-y-2">
                  <Button
                    type="submit"
                    form="workflow-form"
                    className="w-full"
                    disabled={loading || !formData.cluster_id || !formData.name}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : buildRequired ? (
                      <>
                        <Hammer className="mr-2 h-4 w-4" />
                        Build & Create Workflow
                      </>
                    ) : (
                      "Create Workflow"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard/workflow")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
