"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  Package,
  Loader2,
  ArrowLeft,
  FolderGit2,
  Workflow,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRegistryStore } from "@/stores/RegistryStore";
import { startBuild, StartBuildRequest } from "@/lib/services/build";
import { getWorkflow, Workflow as WorkflowType } from "@/lib/services/workflow";
import { getRegistryTypeInfo } from "@/lib/types/registry";

export default function NewBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from query params
  const prefilledRepoUrl = searchParams.get("repoUrl") || "";
  const prefilledBranch = searchParams.get("branch") || "main";
  const prefilledWorkflowId = searchParams.get("workflowId") || "";
  const isPrefilledFromWorkflow = !!prefilledRepoUrl && !!prefilledWorkflowId;

  // Linked workflow state
  const [linkedWorkflow, setLinkedWorkflow] = useState<WorkflowType | null>(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  // Form state
  const [repoUrl, setRepoUrl] = useState(prefilledRepoUrl);
  const [branch, setBranch] = useState(prefilledBranch);
  const [registryId, setRegistryId] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("latest");
  const [useNixpacks, setUseNixpacks] = useState(true);
  const [dockerfile, setDockerfile] = useState("");
  const [buildContext, setBuildContext] = useState(".");
  const [submitting, setSubmitting] = useState(false);

  // Registry store
  const { registries, isLoading: loadingRegistries, fetchRegistries } = useRegistryStore();

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Builds", href: "/dashboard/workflow" },
    { label: "New Build" },
  ];

  // Fetch registries on mount
  useEffect(() => {
    fetchRegistries();
  }, [fetchRegistries]);

  // Fetch linked workflow details when workflowId is present
  useEffect(() => {
    if (prefilledWorkflowId) {
      setLoadingWorkflow(true);
      getWorkflow(prefilledWorkflowId)
        .then((data) => {
          setLinkedWorkflow(data);
        })
        .catch((err) => {
          console.error("Failed to fetch linked workflow:", err);
        })
        .finally(() => {
          setLoadingWorkflow(false);
        });
    }
  }, [prefilledWorkflowId]);

  // Auto-generate image name from repo URL
  useEffect(() => {
    if (repoUrl && !imageName) {
      try {
        // Extract repo name from URL
        const url = new URL(repoUrl.replace(/\.git$/, ""));
        let pathParts = url.pathname.split("/").filter(Boolean);

        // Remove tree/branch or blob/branch paths
        // e.g., /owner/repo/tree/main/path -> /owner/repo
        const treeIndex = pathParts.indexOf("tree");
        const blobIndex = pathParts.indexOf("blob");
        if (treeIndex > 1) {
          pathParts = pathParts.slice(0, treeIndex);
        } else if (blobIndex > 1) {
          pathParts = pathParts.slice(0, blobIndex);
        }

        if (pathParts.length >= 2) {
          // Format: owner/repo
          const owner = pathParts[0];
          const repo = pathParts[1];
          setImageName(`${owner}/${repo}`);
        }
      } catch {
        // If URL parsing fails, just use the last part
        const parts = repoUrl.split("/").filter(Boolean);
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1].replace(".git", "");
          setImageName(lastPart);
        }
      }
    }
  }, [repoUrl, imageName]);

  // Set default registry when registries load
  useEffect(() => {
    if (registries.length > 0 && !registryId) {
      // Prefer the default registry, otherwise use the first one
      const defaultRegistry = registries.find(r => r.isDefault);
      if (defaultRegistry) {
        setRegistryId(defaultRegistry.id);
      } else {
        setRegistryId(registries[0].id);
      }
    }
  }, [registries, registryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!repoUrl) {
      toast.error("Repository URL is required");
      return;
    }
    if (!registryId) {
      toast.error("Please select a target registry");
      return;
    }
    if (!imageName) {
      toast.error("Image name is required");
      return;
    }

    setSubmitting(true);
    try {
      const request: StartBuildRequest = {
        repoUrl,
        branch,
        registryId,
        imageName,
        imageTag,
        buildContext,
        useNixpacks,
        ...(prefilledWorkflowId && { workflowId: prefilledWorkflowId }),
        ...(!useNixpacks && dockerfile && { dockerfile }),
      };

      const response = await startBuild(request);

      toast.success("Build started successfully");
      router.push(`/dashboard/build/${response.build.id}`);
    } catch (err) {
      console.error("Failed to start build:", err);
      toast.error("Failed to start build");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRegistry = registries.find(r => r.id === registryId);

  // Extract repo name for display
  const repoName = (() => {
    try {
      const url = new URL(repoUrl.replace(/\.git$/, ""));
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
      }
    } catch {
      // ignore
    }
    return repoUrl.split("/").pop() || "Repository";
  })();

  const pageActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );

  return (
    <AppLayout>
      <PageContainer
        title="Start New Build"
        description="Build a container image from source code"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Form - Left Side (Source + Target Registry) */}
          <form
            id="build-form"
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-6"
          >
            {/* Source Repository */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FolderGit2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Source Repository</CardTitle>
                    <CardDescription>Configure the source code to build</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repoUrl">Repository URL <span className="text-destructive">*</span></Label>
                  <Input
                    id="repoUrl"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    required
                    disabled={isPrefilledFromWorkflow}
                    className={isPrefilledFromWorkflow ? "bg-muted" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    HTTPS URL to your Git repository
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildContext">Build Context</Label>
                    <Input
                      id="buildContext"
                      placeholder="."
                      value={buildContext}
                      onChange={(e) => setBuildContext(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Directory containing the source (relative to repo root)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Registry */}
            <Card>
              <CardHeader>
                <CardTitle>Target Registry</CardTitle>
                <CardDescription>
                  Where to push the built image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registry">Container Registry</Label>
                  <Select
                    value={registryId}
                    onValueChange={setRegistryId}
                    disabled={loadingRegistries}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a registry" />
                    </SelectTrigger>
                    <SelectContent>
                      {registries.map((registry) => {
                        const typeInfo = getRegistryTypeInfo(registry.registryType);
                        return (
                          <SelectItem key={registry.id} value={registry.id}>
                            <div className="flex items-center gap-2">
                              <span>{registry.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({typeInfo?.name || registry.registryType})
                              </span>
                              {registry.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {registries.length === 0 && !loadingRegistries && (
                    <p className="text-xs text-muted-foreground">
                      No registries configured.{" "}
                      <a
                        href="/dashboard/integrations/registries/new"
                        className="text-primary underline"
                      >
                        Add one
                      </a>
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imageName">Image Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="imageName"
                      placeholder="owner/app"
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedRegistry?.registryType === "ghcr"
                        ? "Format: github-username/image-name"
                        : selectedRegistry?.registryType === "dockerhub"
                        ? "Format: username/image-name"
                        : "Name for the image"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageTag">Image Tag</Label>
                    <Input
                      id="imageTag"
                      placeholder="latest"
                      value={imageTag}
                      onChange={(e) => setImageTag(e.target.value)}
                    />
                  </div>
                </div>

                {selectedRegistry && imageName && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Final image reference:
                    </p>
                    <code className="text-sm">
                      {selectedRegistry.registryUrl ||
                        (selectedRegistry.registryType === "ghcr" ? "ghcr.io" :
                         selectedRegistry.registryType === "dockerhub" ? "docker.io" :
                         "registry")}
                      /{imageName}:{imageTag || "latest"}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Build Configuration Card */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Build</CardTitle>
                    <CardDescription>Build method</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useNixpacks">Use Nixpacks</Label>
                    <p className="text-xs text-muted-foreground">
                      Auto-detect &amp; generate Dockerfile
                    </p>
                  </div>
                  <Switch
                    id="useNixpacks"
                    checked={useNixpacks}
                    onCheckedChange={setUseNixpacks}
                  />
                </div>

                {!useNixpacks && (
                  <div className="space-y-2">
                    <Label htmlFor="dockerfile" className="text-xs">Dockerfile Path</Label>
                    <Input
                      id="dockerfile"
                      placeholder="Dockerfile"
                      value={dockerfile}
                      onChange={(e) => setDockerfile(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {repoUrl && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Building from</span>
                    </div>
                    <p className="text-sm font-medium mt-1 truncate" title={repoName}>
                      {repoName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Branch: {branch || "main"}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardContent className="pt-0 space-y-2">
                <Button
                  type="submit"
                  form="build-form"
                  className="w-full"
                  disabled={submitting || registries.length === 0 || !repoUrl}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Build"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Linked Workflow Card - shown when coming from workflow creation */}
            {prefilledWorkflowId && (
              <Card className="h-fit border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Workflow className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Linked Workflow</CardTitle>
                      <CardDescription>
                        This build is linked to a workflow
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingWorkflow ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading workflow...
                    </div>
                  ) : linkedWorkflow ? (
                    <>
                      <div>
                        <p className="text-sm font-medium">{linkedWorkflow.name}</p>
                        {linkedWorkflow.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {linkedWorkflow.description}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        After the build completes, you can view your workflow with the built image.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/workflow/${prefilledWorkflowId}`)}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Workflow
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Workflow ID: {prefilledWorkflowId}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
