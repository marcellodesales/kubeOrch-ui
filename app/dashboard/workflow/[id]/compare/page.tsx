"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  getWorkflow,
  getWorkflowVersion,
  type Workflow,
  type WorkflowVersion,
  type WorkflowNode,
} from "@/lib/services/workflow";
import { toast } from "sonner";
import CompareCanvas from "@/components/workflow/CompareCanvas";
import NodeSettingsPanel from "@/components/workflow/NodeSettingsPanel";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import type { WorkflowNodeData } from "@/lib/types/nodes";

type NodeType = "deployment" | "service" | "ingress";

export default function WorkflowComparePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = params.id as string;

  const v1 = searchParams.get("v1");
  const v2 = searchParams.get("v2");

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [version1, setVersion1] = useState<WorkflowVersion | null>(null);
  const [version2, setVersion2] = useState<WorkflowVersion | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings panel state (centralized for both canvases)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] =
    useState<WorkflowNodeData | null>(null);
  const [selectedNodeType, setSelectedNodeType] =
    useState<NodeType>("deployment");

  const { setSettingsOpenHandler, setEditable } = useWorkflowStore();

  // Set up the store for read-only mode
  useEffect(() => {
    setEditable(false);

    return () => {
      setSettingsOpenHandler(null);
      setEditable(true);
    };
  }, [setSettingsOpenHandler, setEditable]);

  // Set up the settings handler after versions are loaded
  useEffect(() => {
    if (!version1 || !version2) return;

    const allNodes: WorkflowNode[] = [...version1.nodes, ...version2.nodes];

    setSettingsOpenHandler((nodeId: string, data: any) => {
      // Find the node in either version to get its type
      const node = allNodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNodeId(nodeId);
        setSelectedNodeData(data);
        setSelectedNodeType(node.type as NodeType);
        setSettingsPanelOpen(true);
      }
    });
  }, [version1, version2, setSettingsOpenHandler]);

  const handleCloseSettings = useCallback(() => {
    setSettingsPanelOpen(false);
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!v1 || !v2) {
        toast.error("Missing version parameters");
        router.push(`/dashboard/workflow/${workflowId}`);
        return;
      }

      try {
        const [workflowData, ver1Data, ver2Data] = await Promise.all([
          getWorkflow(workflowId),
          getWorkflowVersion(workflowId, parseInt(v1)),
          getWorkflowVersion(workflowId, parseInt(v2)),
        ]);

        setWorkflow(workflowData);
        setVersion1(ver1Data);
        setVersion2(ver2Data);
      } catch (error) {
        console.error("Failed to load versions for comparison:", error);
        toast.error("Failed to load versions");
        router.push(`/dashboard/workflow/${workflowId}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workflowId, v1, v2, router]);

  const handleBack = () => {
    router.push(`/dashboard/workflow/${workflowId}?settings=open`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center justify-center gap-4">
          <Logo width={80} height={80} className="animate-pulse" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading versions...
          </p>
        </div>
      </div>
    );
  }

  if (!version1 || !version2) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-sm font-medium">
            Comparing versions of{" "}
            <span className="text-muted-foreground">{workflow?.name}</span>
          </h1>
        </div>
      </div>

      {/* Split Canvas */}
      <div className="flex-1 flex">
        {/* Left side - older version */}
        <div className="flex-1 border-r flex flex-col">
          <div className="px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">v{version1.version}</span>
              <span className="text-xs text-muted-foreground">
                {version1.name || version1.description || "No description"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(version1.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex-1">
            <CompareCanvas nodes={version1.nodes} edges={version1.edges} />
          </div>
        </div>

        {/* Right side - newer version */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">v{version2.version}</span>
              <span className="text-xs text-muted-foreground">
                {version2.name || version2.description || "No description"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(version2.created_at).toLocaleString()}
            </div>
          </div>
          <div className="flex-1">
            <CompareCanvas nodes={version2.nodes} edges={version2.edges} />
          </div>
        </div>
      </div>

      {/* Centralized Settings Panel - Read Only */}
      <NodeSettingsPanel
        isOpen={settingsPanelOpen}
        nodeId={selectedNodeId}
        nodeType={selectedNodeType}
        data={selectedNodeData}
        onClose={handleCloseSettings}
        onUpdate={() => {}} // No-op for read-only
        onDelete={() => {}} // No-op for read-only
        editable={false}
      />
    </div>
  );
}
