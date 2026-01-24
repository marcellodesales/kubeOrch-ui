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
import { useWorkflowStatusStream } from "@/lib/hooks/useWorkflowStatusStream";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { SecretKeyEntry, EnvVarEntry } from "@/lib/types/nodes";

// Inline loading component for instant display
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-screen bg-background">
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
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Real-time workflow status updates via SSE - returns Map<nodeId, status>
  const { nodeStatuses } = useWorkflowStatusStream(
    workflowId,
    !loading && !!workflow
  );

  useEffect(() => {
    loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // nodeStatuses is passed directly to WorkflowCanvas which handles merging

  const loadWorkflow = async () => {
    try {
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch {
      toast.error("Failed to load workflow");
      router.push("/dashboard/workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: any[], edges: any[]) => {
    try {
      const response = await saveWorkflow(
        workflowId,
        nodes as WorkflowNode[],
        edges as WorkflowEdge[]
      );
      toast.success("Workflow saved successfully");
      // Use the workflow from save response instead of making another GET request
      if (response.workflow) {
        setWorkflow(response.workflow);
        setNodes(response.workflow.nodes || []);
        setEdges(response.workflow.edges || []);
      }
    } catch {
      toast.error("Failed to save workflow");
    }
  };

  const handleRun = async () => {
    try {
      // Auto-publish if in draft mode
      if (workflow?.status === "draft") {
        await updateWorkflowStatus(workflowId, "published");
        // Update local state to reflect published status
        setWorkflow(prev => (prev ? { ...prev, status: "published" } : null));
      }

      // Clear previous logs and show the panel
      setExecutionLogs([]);
      setShowLogs(true);

      // Collect secret values from store (pass-through to K8s, not stored in DB)
      // Transform from { nodeId: { entryId: value } } to { nodeId: { keyName: value } }
      const rawSecretValues = useWorkflowStore.getState().getSecretValues();
      const secretValues: Record<string, Record<string, string>> = {};

      for (const nodeId of Object.keys(rawSecretValues)) {
        const node = nodes.find(n => n.id === nodeId);
        if (node?.type === "secret" && node.data?.keys) {
          const keyEntries = node.data.keys as SecretKeyEntry[];
          secretValues[nodeId] = {};
          for (const entry of keyEntries) {
            const value = rawSecretValues[nodeId][entry.id];
            if (entry.name && value !== undefined) {
              secretValues[nodeId][entry.name] = value;
            }
          }
        }
      }

      // Collect env values from store (pass-through to K8s, not stored in DB)
      // Transform from { nodeId: { entryId: value } } to { nodeId: { keyName: value } }
      const rawEnvValues = useWorkflowStore.getState().getEnvValues();
      const envValues: Record<string, Record<string, string>> = {};

      for (const nodeId of Object.keys(rawEnvValues)) {
        const node = nodes.find(n => n.id === nodeId);
        if (
          (node?.type === "deployment" || node?.type === "statefulset") &&
          node.data?.envKeys
        ) {
          const keyEntries = node.data.envKeys as EnvVarEntry[];
          envValues[nodeId] = {};
          for (const entry of keyEntries) {
            const value = rawEnvValues[nodeId][entry.id];
            if (entry.name && value !== undefined) {
              envValues[nodeId][entry.name] = value;
            }
          }
        }
      }

      const result = await runWorkflow(workflowId, {
        secrets: secretValues,
        envVars: envValues,
      });

      // Update logs from the response
      if (result.logs && result.logs.length > 0) {
        setExecutionLogs(result.logs);
      }

      // Update run count in local state
      setWorkflow(prev =>
        prev ? { ...prev, run_count: (prev.run_count || 0) + 1 } : null
      );
      toast.success("Workflow run started successfully");
      // No need to refetch - SSE stream provides real-time updates
    } catch (error: any) {
      setShowLogs(false);
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
  const handleNodesChange = useCallback((newNodes: any[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: any[]) => {
    setEdges(newEdges);
  }, []);

  // Clear the settings query param from URL when settings panel is closed
  const handleCloseSettings = useCallback(() => {
    router.replace(`/dashboard/workflow/${workflowId}`, { scroll: false });
  }, [router, workflowId]);

  // Close the logs panel
  const handleCloseLogs = useCallback(() => {
    setShowLogs(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
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
    <div className="h-screen w-full bg-background">
      <WorkflowCanvas
        workflow={workflow}
        initialNodes={nodes}
        initialEdges={edges}
        nodeStatuses={nodeStatuses}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSave={handleSave}
        onRun={handleRun}
        onStatusChange={handleStatusChange}
        onArchive={() => handleStatusChange("archived")}
        editable={workflow?.status === "draft"}
        openSettings={openSettings}
        onCloseSettings={handleCloseSettings}
        executionLogs={executionLogs}
        showLogs={showLogs}
        onCloseLogs={handleCloseLogs}
      />
    </div>
  );
}
