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
} from "lucide-react";
import { toast } from "react-toastify";
import {
  listWorkflows,
  deleteWorkflow,
  cloneWorkflow,
  type Workflow,
} from "@/lib/services/workflow";

export default function WorkflowPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflow Designer" },
  ];

  const pageActions = (
    <Button onClick={() => router.push("/dashboard/workflow/new")}>
      <Plus className="mr-2 h-4 w-4" />
      New Workflow
    </Button>
  );

  useEffect(() => {
    loadWorkflows();
  }, []);

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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteWorkflow(id);
        toast.success("Workflow deleted successfully");
        loadWorkflows();
      } catch {
        toast.error("Failed to delete workflow");
      }
    }
  };

  const handleClone = async (id: string, name: string) => {
    const newName = prompt(`Enter name for cloned workflow:`, `${name} (Copy)`);
    if (newName) {
      try {
        const result = await cloneWorkflow(id, newName);
        toast.success("Workflow cloned successfully");
        router.push(`/dashboard/workflow/${result.id}`);
      } catch {
        toast.error("Failed to clone workflow");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: string; label: string; icon: typeof Edit }
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
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
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
                  <div className="flex items-center justify-between">
                    <GitBranch className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      {getStatusBadge(workflow.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={e => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              router.push(`/dashboard/workflow/${workflow.id}`);
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
                            className="text-destructive"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(workflow.id, workflow.name);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription>
                    {workflow.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
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
    </AppLayout>
  );
}
