"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  GitBranch,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import {
  listWorkflows,
  cloneWorkflow,
  updateWorkflowStatus,
  type Workflow,
} from "@/lib/services/workflow";
import { clusterService } from "@/lib/services/cluster";

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasClusters, setHasClusters] = useState(false);
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [isArchiving, setIsArchiving] = useState(false);
  const [cloneDialog, setCloneDialog] = useState<{
    open: boolean;
    id: string;
    originalName: string;
  }>({ open: false, id: "", originalName: "" });
  const [cloneName, setCloneName] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [checkingClusters, setCheckingClusters] = useState(true);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflow Designer" },
  ];

  const pageActions = hasClusters ? (
    <Button onClick={() => router.push("/dashboard/workflow/new")}>
      <Plus className="mr-2 h-4 w-4" />
      New Workflow
    </Button>
  ) : null;

  useEffect(() => {
    checkClustersAndLoadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkClustersAndLoadWorkflows = async () => {
    let hasAnyClusters = false;
    try {
      // First check if any clusters exist
      const clusterData = await clusterService.listClusters();
      hasAnyClusters = clusterData.clusters && clusterData.clusters.length > 0;
      setHasClusters(hasAnyClusters);

      // Only load workflows if clusters exist
      if (hasAnyClusters) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error("Failed to check clusters:", error);
      toast.error("Failed to load data");
    } finally {
      setCheckingClusters(false);
      if (!hasAnyClusters) {
        setLoading(false);
      }
    }
  };

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows();
      setWorkflows(data);
    } catch {
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = (id: string, name: string) => {
    setArchiveDialog({ open: true, id, name });
  };

  const confirmArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await updateWorkflowStatus(archiveDialog.id, "archived");
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Workflow archived and K8s resources cleaned up");
      }
      loadWorkflows();
    } catch {
      toast.error("Failed to archive workflow");
    } finally {
      setIsArchiving(false);
      setArchiveDialog({ open: false, id: "", name: "" });
    }
  };

  const handleClone = (id: string, name: string) => {
    setCloneDialog({ open: true, id, originalName: name });
    setCloneName(`${name} (Copy)`);
  };

  const confirmClone = async () => {
    if (!cloneName.trim()) {
      toast.error("Please enter a name for the cloned workflow");
      return;
    }

    setIsCloning(true);
    try {
      const result = await cloneWorkflow(cloneDialog.id, cloneName);
      toast.success("Workflow cloned successfully");
      setCloneDialog({ open: false, id: "", originalName: "" });
      setCloneName("");
      router.push(`/dashboard/workflow/${result.id}`);
    } catch {
      toast.error("Failed to clone workflow");
    } finally {
      setIsCloning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "outline" | "destructive";
        label: string;
        icon: typeof Edit;
      }
    > = {
      draft: { variant: "outline", label: "Draft", icon: Edit },
      published: { variant: "default", label: "Published", icon: CheckCircle },
      archived: { variant: "secondary", label: "Archived", icon: Archive },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout>
      <PageContainer
        title="Workflow Designer"
        description="Create and manage your deployment workflows"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        {loading || checkingClusters ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !hasClusters ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No clusters configured
              </h3>
              <p className="text-muted-foreground mb-4">
                You need to add a Kubernetes cluster before creating workflows
              </p>
              <Button onClick={() => router.push("/dashboard/clusters/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Cluster
              </Button>
            </CardContent>
          </Card>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workflow to get started
              </p>
              <Button onClick={() => router.push("/dashboard/workflow/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map(workflow => (
              <Card
                key={workflow.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/workflow/${workflow.id}`)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>
                        {workflow.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {getStatusBadge(workflow.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={e => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-4 cursor-pointer hover:bg-transparent focus:bg-transparent active:bg-transparent"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/workflow/${workflow.id}?settings=open`
                              );
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleClone(workflow.id, workflow.name);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              toast.info("Run functionality coming soon");
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Run
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive hover:bg-red-50 focus:bg-red-50 hover:text-destructive focus:text-destructive"
                            onClick={e => {
                              e.stopPropagation();
                              handleArchive(workflow.id, workflow.name);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {workflow.cluster_id && (
                      <div className="flex items-center justify-between">
                        <span>Cluster</span>
                        <div className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          <span className="font-medium">
                            {workflow.cluster_id}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Nodes</span>
                      <span className="font-medium">
                        {workflow.nodes?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Runs</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {workflow.run_count || 0}
                        </span>
                        {workflow.run_count > 0 && (
                          <div className="flex gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs">
                              {workflow.success_count || 0}
                            </span>
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs">
                              {workflow.failure_count || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pt-2 border-t">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        Updated {formatDate(workflow.updated_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={archiveDialog.open}
        onOpenChange={open =>
          !isArchiving && setArchiveDialog(prev => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Workflow</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              Are you sure you want to archive &quot;{archiveDialog.name}&quot;?
              This will also delete all associated Kubernetes resources
              (Deployments, Services).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              disabled={isArchiving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Dialog */}
      <Dialog
        open={cloneDialog.open}
        onOpenChange={open =>
          !isCloning && setCloneDialog(prev => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Workflow</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{cloneDialog.originalName}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clone-name">New Workflow Name</Label>
              <Input
                id="clone-name"
                value={cloneName}
                onChange={e => setCloneName(e.target.value)}
                placeholder="Enter workflow name"
                disabled={isCloning}
                onKeyDown={e => {
                  if (e.key === "Enter" && !isCloning) {
                    confirmClone();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCloneDialog({ open: false, id: "", originalName: "" });
                setCloneName("");
              }}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClone}
              disabled={isCloning || !cloneName.trim()}
            >
              {isCloning ? "Cloning..." : "Clone Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
