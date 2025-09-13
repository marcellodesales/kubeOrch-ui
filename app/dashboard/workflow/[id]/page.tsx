"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import {
  getWorkflow,
  saveWorkflow,
  runWorkflow,
  updateWorkflowStatus,
  type Workflow,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/lib/services/workflow";
import { Skeleton } from "@/components/ui/skeleton";

const WorkflowCanvas = dynamic(
  () => import("@/components/workflow/WorkflowCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Skeleton className="w-32 h-32" />
      </div>
    ),
  }
);

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setIsInitialized(true);
    } catch {
      toast.error("Failed to load workflow");
      router.push("/dashboard/workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: any[], edges: any[]) => {
    try {
      await saveWorkflow(
        workflowId,
        nodes as WorkflowNode[],
        edges as WorkflowEdge[]
      );
      toast.success("Workflow saved successfully");
      await loadWorkflow(); // Reload to get updated workflow
    } catch {
      toast.error("Failed to save workflow");
    }
  };

  const handleRun = async () => {
    try {
      await runWorkflow(workflowId);
      toast.success("Workflow run started successfully");
      // Optionally, you can navigate to a run details page or refresh the workflow
      await loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to run workflow");
    }
  };

  const handlePublish = async () => {
    try {
      await updateWorkflowStatus(workflowId, "published");
      toast.success("Workflow published successfully");
      await loadWorkflow();
    } catch {
      toast.error("Failed to publish workflow");
    }
  };

  const handleStatusChange = async (
    status: "draft" | "published" | "archived"
  ) => {
    try {
      await updateWorkflowStatus(workflowId, status);
      toast.success(`Workflow ${status === "draft" ? "unpublished" : status}`);
      await loadWorkflow();
    } catch {
      toast.error(`Failed to update workflow status`);
    }
  };

  // Use callbacks to prevent unnecessary re-renders
  const handleNodesChange = useCallback((newNodes: any[]) => {
    if (isInitialized) {
      setNodes(newNodes);
    }
  }, [isInitialized]);

  const handleEdgesChange = useCallback((newEdges: any[]) => {
    if (isInitialized) {
      setEdges(newEdges);
    }
  }, [isInitialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50">
      <WorkflowCanvas
        workflow={workflow}
        initialNodes={nodes}
        initialEdges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSave={handleSave}
        onRun={handleRun}
        onPublish={handlePublish}
        onStatusChange={handleStatusChange}
        editable={workflow?.status === "draft"}
      />
    </div>
  );
}
