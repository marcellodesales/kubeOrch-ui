"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { 
  getWorkflow, 
  saveWorkflowVersion, 
  updateWorkflowStatus,
  type Workflow 
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
    )
  }
);

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (error) {
      toast.error("Failed to load workflow");
      router.push("/dashboard/workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: any[], edges: any[]) => {
    try {
      await saveWorkflowVersion(workflowId, nodes, edges, "Manual save");
      toast.success("Workflow saved successfully");
      await loadWorkflow(); // Reload to get updated version
    } catch (error) {
      toast.error("Failed to save workflow");
    }
  };

  const handlePublish = async () => {
    try {
      await updateWorkflowStatus(workflowId, "published");
      toast.success("Workflow published successfully");
      await loadWorkflow();
    } catch (error) {
      toast.error("Failed to publish workflow");
    }
  };

  const handleStatusChange = async (status: "draft" | "published" | "archived") => {
    try {
      await updateWorkflowStatus(workflowId, status);
      toast.success(`Workflow ${status === "draft" ? "unpublished" : status}`);
      await loadWorkflow();
    } catch (error) {
      toast.error(`Failed to update workflow status`);
    }
  };

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
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        onSave={handleSave}
        onPublish={handlePublish}
        onStatusChange={handleStatusChange}
        editable={workflow?.status === "draft"}
      />
    </div>
  );
}