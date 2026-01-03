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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Save, Rocket, Settings, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/AuthStore";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import DeploymentNode from "./DeploymentNode";
import ServiceNode from "./ServiceNode";
import { DeploymentRequest, ServiceNodeData } from "@/lib/types/nodes";
import DeploymentSettingsPanel from "./DeploymentSettingsPanel";
import ServiceSettingsPanel from "./ServiceSettingsPanel";
import WorkflowSettingsPanel from "./WorkflowSettingsPanel";
import CommandPalette from "./CommandPalette";
import { Workflow } from "@/lib/services/workflow";
import { TemplateMetadata } from "@/lib/services/templates";

const nodeTypes = {
  deployment: DeploymentNode,
  service: ServiceNode,
};

interface WorkflowCanvasProps {
  workflow?: Workflow | null;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onRun?: () => Promise<void>;
  onStatusChange?: (status: "draft" | "published") => Promise<void>;
  onArchive?: () => void;
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
  onStatusChange,
  onArchive,
  editable = true,
}: WorkflowCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [workflowSettingsOpen, setWorkflowSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] =
    useState<WorkflowNodeData | null>(null);
  const { validateAndGetToken } = useAuthStore();
  const {
    setNodeUpdateHandler,
    setSettingsOpenHandler,
    updateNodeData,
    setEditable,
  } = useWorkflowStore();
  const isInitializedRef = useRef(false);

  // Calculate next node ID from existing nodes
  const getNextNodeId = useCallback((existingNodes: Node[]) => {
    let maxId = 0;
    existingNodes.forEach(node => {
      const match = node.id.match(/^node-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    });
    return maxId + 1;
  }, []);

  // Initialize with provided nodes and edges when they become available
  useEffect(() => {
    if (
      !isInitializedRef.current &&
      (initialNodes.length > 0 || initialEdges.length > 0)
    ) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodeId(getNextNodeId(initialNodes));
      isInitializedRef.current = true;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, getNextNodeId]);

  // Sync editable state to store for node components to access
  useEffect(() => {
    setEditable(editable);
  }, [editable, setEditable]);

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
    const handleUpdateNodeData = (nodeId: string, data: WorkflowNodeData) => {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === nodeId) {
            // Auto-generate ID from node ID and image name for deployment nodes
            const deploymentData = data as DeploymentRequest;
            if (deploymentData.parameters?.image) {
              const imageParts = deploymentData.parameters.image.split("/");
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

    const handleOpenNodeSettings = (nodeId: string, data: WorkflowNodeData) => {
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
    (params: Connection) => {
      // Add the edge
      setEdges(eds => addEdge(params, eds));

      // Auto-populate Service targetApp when connected to Deployment
      if (params.source && params.target) {
        setNodes(nds => {
          const sourceNode = nds.find(n => n.id === params.source);
          const targetNode = nds.find(n => n.id === params.target);

          // Service (source) → Deployment (target)
          if (
            sourceNode?.type === "service" &&
            targetNode?.type === "deployment"
          ) {
            return nds.map(n => {
              if (n.id === params.source) {
                const deploymentData = targetNode.data as DeploymentRequest;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    targetApp: deploymentData.name,
                    targetPort: deploymentData.port,
                    _linkedDeployment: params.target,
                  },
                };
              }
              return n;
            });
          }

          // Deployment (source) → Service (target)
          if (
            sourceNode?.type === "deployment" &&
            targetNode?.type === "service"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const deploymentData = sourceNode.data as DeploymentRequest;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    targetApp: deploymentData.name,
                    targetPort: deploymentData.port,
                    _linkedDeployment: params.source,
                  },
                };
              }
              return n;
            });
          }

          return nds;
        });
      }
    },
    [setEdges, setNodes]
  );

  // Handle edge deletion - clear Service's targetApp when disconnected
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setNodes(nds => {
        return nds.map(node => {
          if (node.type === "service") {
            // Check if any deleted edge involves this service node
            const hasDeletedConnection = deletedEdges.some(
              edge => edge.source === node.id || edge.target === node.id
            );
            if (hasDeletedConnection) {
              return {
                ...node,
                data: {
                  ...node.data,
                  targetApp: "",
                  targetPort: undefined,
                  _linkedDeployment: undefined,
                },
              };
            }
          }
          return node;
        });
      });
    },
    [setNodes]
  );

  const handleCommandPaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const handleSelectTemplate = useCallback(
    (template: TemplateMetadata) => {
      const nodeIdStr = `node-${nodeId}`;

      // Create node based on template type
      if (template.name === "deployment") {
        const newNode: Node<DeploymentRequest> = {
          id: nodeIdStr,
          type: "deployment",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `deployment-${nodeId}`,
            namespace: "default",
            image: "",
            replicas: 1,
            port: 8080,
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "service") {
        const newNode: Node<ServiceNodeData> = {
          id: nodeIdStr,
          type: "service",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `service-${nodeId}`,
            namespace: "default",
            serviceType: "ClusterIP",
            targetApp: "",
            port: 80,
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      }

      setNodeId(id => id + 1);
    },
    [nodeId, setNodes]
  );

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

      // TODO: Replace with actual workflow execution API
      // For now, we'll simulate the deployment
      const results = await Promise.allSettled(
        deployments.map(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ success: true }), 1000)
            )
        )
      );

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
    (nodeId: string, data: WorkflowNodeData) => {
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
        onEdgesDelete={onEdgesDelete}
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
          <Button
            onClick={saveWorkflow}
            size="sm"
            variant="outline"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        )}

        {workflow?.status === "published" && (
          <Button
            onClick={() => onStatusChange?.("draft")}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
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
              await deployAll();
            }
          }}
          size="sm"
          variant="default"
          disabled={isDeploying || nodes.length === 0}
        >
          <Rocket className="h-4 w-4 mr-1" />
          {isDeploying ? "Running..." : "Run"}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => setCommandPaletteOpen(true)}
                  size="sm"
                  variant="default"
                  disabled={!editable}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            {!editable && (
              <TooltipContent>
                <p>Switch to edit mode to add</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Settings panels - conditional rendering based on node type */}
      {selectedNodeData && "serviceType" in selectedNodeData && (
        <ServiceSettingsPanel
          isOpen={settingsPanelOpen}
          nodeId={selectedNodeId}
          data={selectedNodeData}
          onClose={handleCloseSettings}
          onUpdate={handleSettingsUpdate}
          onDelete={handleDeleteNode}
          editable={editable}
          workflowId={workflow?.id}
        />
      )}

      {selectedNodeData &&
        !("serviceType" in selectedNodeData) &&
        "image" in selectedNodeData && (
          <DeploymentSettingsPanel
            isOpen={settingsPanelOpen}
            nodeId={selectedNodeId}
            data={selectedNodeData as DeploymentRequest}
            onClose={handleCloseSettings}
            onUpdate={handleSettingsUpdate}
            onDelete={handleDeleteNode}
            editable={editable}
          />
        )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSelectTemplate={handleSelectTemplate}
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
          onArchive={onArchive}
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
