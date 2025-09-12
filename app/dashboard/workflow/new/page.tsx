"use client";

import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflows", href: "/dashboard/workflow" },
    { label: "New Workflow" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    setLoading(true);
    try {
      const result = await createWorkflow({
        name: formData.name,
        description: formData.description,
      });

      toast.success("Workflow created successfully");
      // Redirect to the workflow editor with the new ID
      router.push(`/dashboard/workflow/${result.id}`);
    } catch (error) {
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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
              <CardDescription>
                Provide basic information about your workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Workflow Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Workflow"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
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
      </PageContainer>
    </AppLayout>
  );
}
