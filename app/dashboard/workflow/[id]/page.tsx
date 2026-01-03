"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  getWorkflow,
  saveWorkflow,
  runWorkflow,
  updateWorkflowStatus,
  type Workflow,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/lib/services/workflow";
import { Logo } from "@/components/ui/logo";

// Inline loading component for instant display
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="flex flex-col items-center justify-center gap-4">
      <Logo width={80} height={80} className="animate-pulse" />
    </div>
  </div>
);

const WorkflowCanvas = dynamic(
  () => import("@/components/workflow/WorkflowCanvas"),
  {
    ssr: false,
    loading: LoadingComponent,
  }
);

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = params.id as string;
  const openSettings = searchParams.get("settings") === "open";

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
      // Auto-publish if in draft mode
      if (workflow?.status === "draft") {
        await updateWorkflowStatus(workflowId, "published");
      }
      await runWorkflow(workflowId);
      toast.success("Workflow run started successfully");
      await loadWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to run workflow");
    }
  };

  const handleStatusChange = async (
    status: "draft" | "published" | "archived"
  ) => {
    try {
      const result = await updateWorkflowStatus(workflowId, status);
      if (status === "archived") {
        if (result.warning) {
          toast.warning(result.warning);
        } else {
          toast.success("Workflow archived and K8s resources cleaned up");
        }
        router.push("/dashboard/workflow");
      } else {
        toast.success(
          `Workflow ${status === "draft" ? "unpublished" : status}`
        );
        await loadWorkflow();
      }
    } catch {
      toast.error(`Failed to update workflow status`);
    }
  };

  // Use callbacks to prevent unnecessary re-renders
  const handleNodesChange = useCallback(
    (newNodes: any[]) => {
      if (isInitialized) {
        setNodes(newNodes);
      }
    },
    [isInitialized]
  );

  const handleEdgesChange = useCallback(
    (newEdges: any[]) => {
      if (isInitialized) {
        setEdges(newEdges);
      }
    },
    [isInitialized]
  );

  // Clear the settings query param from URL when settings panel is closed
  const handleCloseSettings = useCallback(() => {
    router.replace(`/dashboard/workflow/${workflowId}`, { scroll: false });
  }, [router, workflowId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-4">
          <Logo width={80} height={80} className="animate-pulse" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading workflow...
          </p>
        </div>
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
        onStatusChange={handleStatusChange}
        onArchive={() => handleStatusChange("archived")}
        editable={workflow?.status === "draft"}
        openSettings={openSettings}
        onCloseSettings={handleCloseSettings}
      />
    </div>
  );
}
