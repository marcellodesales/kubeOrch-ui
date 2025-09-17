"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { debounce } from "lodash-es";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Save,
  Rocket,
  Settings,
  ArrowLeft,
  Eye,
  Edit,
  Archive,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/AuthStore";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import DeploymentNode from "./DeploymentNode";
import DeploymentSettingsPanel from "./DeploymentSettingsPanel";
import WorkflowSettingsPanel from "./WorkflowSettingsPanel";
import {
  DeploymentRequest,
  deployApplication,
} from "@/lib/services/deployment";
import { Workflow } from "@/lib/services/workflow";

const nodeTypes = {
  deployment: DeploymentNode,
};

interface WorkflowCanvasProps {
  workflow?: Workflow | null;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onRun?: () => Promise<void>;
  onPublish?: () => Promise<void>;
  onStatusChange?: (
    status: "draft" | "published" | "archived"
  ) => Promise<void>;
  editable?: boolean;
}

function WorkflowCanvasContent({
  workflow,
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onSave,
  onRun,
  onPublish,
  onStatusChange,
  editable = true,
}: WorkflowCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [workflowSettingsOpen, setWorkflowSettingsOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] =
    useState<DeploymentRequest | null>(null);
  const { validateAndGetToken } = useAuthStore();
  const { setNodeUpdateHandler, setSettingsOpenHandler, updateNodeData } =
    useWorkflowStore();

  // Initialize with provided nodes and edges
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Create debounced callbacks using useRef to maintain stability
  const debouncedNodesChange = useRef(
    debounce((nodes: Node[]) => {
      onNodesChangeProp?.(nodes);
    }, 300)
  ).current;

  const debouncedEdgesChange = useRef(
    debounce((edges: Edge[]) => {
      onEdgesChangeProp?.(edges);
    }, 300)
  ).current;

  // Notify parent of changes with debouncing
  useEffect(() => {
    debouncedNodesChange(nodes);
  }, [nodes, debouncedNodesChange]);

  useEffect(() => {
    debouncedEdgesChange(edges);
  }, [edges, debouncedEdgesChange]);

  useEffect(() => {
    const handleUpdateNodeData = (nodeId: string, data: DeploymentRequest) => {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === nodeId) {
            // Auto-generate ID from node ID and image name
            if (data.parameters?.image) {
              const imageParts = data.parameters.image.split("/");
              const imageName = imageParts[imageParts.length - 1].split(":")[0];
              const sanitizedImageName = imageName.replace(
                /[^a-zA-Z0-9-]/g,
                "-"
              );
              // Combine node ID with image name to ensure uniqueness
              data.id = `${node.id}-${sanitizedImageName}`.substring(0, 63); // Kubernetes name limit
            } else {
              // Fallback to node ID if no image is specified
              data.id = node.id;
            }
            return { ...node, data };
          }
          return node;
        })
      );
    };

    const handleOpenNodeSettings = (
      nodeId: string,
      data: DeploymentRequest
    ) => {
      setSelectedNodeId(nodeId);
      setSelectedNodeData(data);
      setSettingsPanelOpen(true);
    };

    setNodeUpdateHandler(handleUpdateNodeData);
    setSettingsOpenHandler(handleOpenNodeSettings);

    return () => {
      setNodeUpdateHandler(() => {});
      setSettingsOpenHandler(() => {});
    };
  }, [setNodes, setNodeUpdateHandler, setSettingsOpenHandler]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  const addDeploymentNode = useCallback(() => {
    const nodeIdStr = `node-${nodeId}`;
    const newNode: Node<DeploymentRequest> = {
      id: nodeIdStr,
      type: "deployment",
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        id: nodeIdStr, // Default to node ID, will be updated when image is set
        templateId: "core/deployment", // Use core deployment template
        parameters: {
          image: "",
          replicas: 1,
          port: 8080,
        },
        // metadata will be determined by backend
      },
    };

    setNodes(nds => [...nds, newNode]);
    setNodeId(id => id + 1);
  }, [nodeId, setNodes]);

  const validateDeployment = (deployment: DeploymentRequest): string[] => {
    const errors: string[] = [];

    if (!deployment.id) errors.push("Deployment ID is required");
    if (!deployment.templateId) errors.push("Template ID is required");
    if (!deployment.parameters?.image) errors.push("Docker image is required");
    if (
      !deployment.parameters?.replicas ||
      deployment.parameters.replicas < 1
    ) {
      errors.push("Replicas must be at least 1");
    }
    if (
      !deployment.parameters?.port ||
      deployment.parameters.port < 1 ||
      deployment.parameters.port > 65535
    ) {
      errors.push("Port must be between 1 and 65535");
    }

    return errors;
  };

  const saveWorkflow = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(nodes, edges);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, onSave]);

  const deployAll = useCallback(async () => {
    const deployments = nodes.map(node => node.data as DeploymentRequest);

    // First, mark nodes with validation errors
    let hasErrors = false;
    const updatedNodes = nodes.map(node => {
      const deployment = node.data as DeploymentRequest;
      const errors = validateDeployment(deployment);
      if (errors.length > 0) {
        hasErrors = true;
        return {
          ...node,
          data: {
            ...deployment,
            hasValidationError: true,
          },
        };
      }
      return {
        ...node,
        data: {
          ...deployment,
          hasValidationError: false,
        },
      };
    });

    // Update nodes to show validation state
    setNodes(updatedNodes);

    if (hasErrors) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsDeploying(true);

    try {
      const token = validateAndGetToken();

      if (!token) {
        toast.error("Please login first to deploy");
        setIsDeploying(false);
        return;
      }

      const deploymentPromises = deployments.map(deployment =>
        deployApplication(deployment)
      );

      const results = await Promise.allSettled(deploymentPromises);

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      if (failed === 0) {
        toast.success(`All ${successful} deployments have been queued`);
      } else {
        toast.warning(
          `Partial Success: ${successful} succeeded, ${failed} failed`
        );
      }
    } catch (error) {
      toast.error(
        `Deployment Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsDeploying(false);
    }
  }, [nodes, setNodes, validateAndGetToken]);

  const handleSettingsUpdate = useCallback(
    (nodeId: string, data: DeploymentRequest) => {
      updateNodeData(nodeId, data);
      setSelectedNodeData(data);
    },
    [updateNodeData]
  );

  const handleCloseSettings = useCallback(() => {
    setSettingsPanelOpen(false);
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => nds.filter(node => node.id !== nodeId));
      setEdges(eds =>
        eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      );
      toast.success("Node deleted");
    },
    [setNodes, setEdges]
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "outline", label: "Draft" },
      published: { variant: "default", label: "Published" },
      archived: { variant: "secondary", label: "Archived" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="w-full h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {/* Title bar in top-left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <Button
          onClick={() => router.push("/dashboard/workflow")}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {workflow?.name || "Workflow"}
          </h1>
          {workflow && getStatusBadge(workflow.status)}
        </div>

        <Button
          onClick={() => setWorkflowSettingsOpen(true)}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Action buttons in top-right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {editable && (
          <>
            <Button
              onClick={saveWorkflow}
              size="sm"
              variant="outline"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>

            {workflow?.status === "draft" && (
              <Button onClick={onPublish} size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                Publish
              </Button>
            )}
          </>
        )}

        {workflow?.status === "published" && (
          <>
            <Button
              onClick={() => onStatusChange?.("draft")}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              onClick={() => onStatusChange?.("archived")}
              size="sm"
              variant="outline"
              className="text-destructive"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          </>
        )}

        <Button
          onClick={async () => {
            if (onRun) {
              setIsDeploying(true);
              try {
                await onRun();
              } finally {
                setIsDeploying(false);
              }
            } else {
              // Fallback to deployAll if onRun not provided
              await deployAll();
            }
          }}
          size="sm"
          variant="default"
          disabled={
            isDeploying ||
            nodes.length === 0 ||
            workflow?.status !== "published"
          }
        >
          <Rocket className="h-4 w-4 mr-1" />
          {isDeploying ? "Running..." : "Run"}
        </Button>

        <Button onClick={addDeploymentNode} size="sm" variant="default">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <DeploymentSettingsPanel
        isOpen={settingsPanelOpen}
        nodeId={selectedNodeId}
        data={selectedNodeData}
        onClose={handleCloseSettings}
        onUpdate={handleSettingsUpdate}
        onDelete={handleDeleteNode}
      />

      {workflow && (
        <WorkflowSettingsPanel
          isOpen={workflowSettingsOpen}
          workflow={workflow}
          onClose={() => setWorkflowSettingsOpen(false)}
          onUpdate={async () => {
            // Handle workflow update if needed
            setWorkflowSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
