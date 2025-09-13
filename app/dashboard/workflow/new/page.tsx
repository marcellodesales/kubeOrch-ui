"use client";

import { useState, useEffect } from "react";
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
import { toast } from "react-toastify";
import { createWorkflow } from "@/lib/services/workflow";
import { ArrowLeft, Server } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clusterService, type Cluster } from "@/lib/services/cluster";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cluster_id: "",
  });
  const [defaultClusterId, setDefaultClusterId] = useState<string>("");

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflows", href: "/dashboard/workflow" },
    { label: "New Workflow" },
  ];

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    try {
      const data = await clusterService.listClusters();
      setClusters(data.clusters || []);
      
      // Find the default cluster using the default ID from the response
      const defaultCluster = data.clusters?.find(c => c.id === data.default || c.default);
      
      if (defaultCluster) {
        // If there's a default cluster, set it as selected using its name
        setFormData(prev => ({ ...prev, cluster_id: defaultCluster.name }));
        setDefaultClusterId(defaultCluster.name);
      } else {
        // No default cluster, leave selection empty
        setFormData(prev => ({ ...prev, cluster_id: "" }));
      }
    } catch (error) {
      console.error("Failed to load clusters:", error);
      toast.error("Failed to load clusters");
    } finally {
      setLoadingClusters(false);
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
    try {
      const result = await createWorkflow({
        name: formData.name,
        description: formData.description,
        cluster_id: formData.cluster_id,
      });

      toast.success("Workflow created successfully");
      // Redirect to the workflow editor with the new ID
      router.push(`/dashboard/workflow/${result.id}`);
    } catch (error: any) {
      console.error("Failed to create workflow:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
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

  return (
    <AppLayout>
      <PageContainer
        title="Create New Workflow"
        description="Set up a new workflow for your deployments"
        breadcrumbs={breadcrumbs}
        actions={pageActions}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>
                  Provide basic information about your workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loadingClusters ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading clusters...</p>
                </div>
              ) : clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Server className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No clusters available. Please add a cluster first.
                  </p>
                  <Button
                    onClick={() => router.push("/dashboard/clusters/new")}
                  >
                    Add Cluster
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cluster">
                      Target Cluster <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.cluster_id}
                      onValueChange={value =>
                        setFormData({ ...formData, cluster_id: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger id="cluster" className="mt-1.5 w-full">
                        <SelectValue placeholder="Select a cluster">
                          {formData.cluster_id ? (
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              <span>
                                {clusters.find(c => c.name === formData.cluster_id)?.displayName || 
                                 clusters.find(c => c.name === formData.cluster_id)?.name || 
                                 formData.cluster_id}
                              </span>
                              {formData.cluster_id === defaultClusterId && (
                                <span className="text-xs text-muted-foreground">
                                  (default)
                                </span>
                              )}
                            </div>
                          ) : (
                            "Select a cluster"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {clusters.map(cluster => (
                          <SelectItem key={cluster.name} value={cluster.name}>
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              <span>{cluster.displayName || cluster.name}</span>
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
                    <p className="text-xs text-muted-foreground">
                      Select the Kubernetes cluster for this workflow
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Workflow Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      className="mt-1.5"
                      placeholder="e.g., Production Deployment"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a descriptive name for your workflow
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      className="mt-1.5"
                      placeholder="Describe what this workflow does..."
                      value={formData.description}
                      onChange={e =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      disabled={loading}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Add more details about the workflow&apos;s purpose
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard/workflow")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !formData.cluster_id}>
                      {loading ? "Creating..." : "Create Workflow"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>What&apos;s Next?</CardTitle>
              <CardDescription>
                After creating your workflow, you&apos;ll be able to:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Add deployment nodes to define your application components
                </li>
                <li>Connect nodes to create execution flow</li>
                <li>Configure conditions and parallel executions</li>
                <li>Save versions and track changes</li>
                <li>Publish and run your workflow on selected clusters</li>
              </ul>
            </CardContent>
          </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}