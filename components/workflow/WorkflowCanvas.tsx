"use client";

import React, { useCallback, useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Plus, Save, Rocket, FileJson } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/AuthStore";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import DeploymentNode from "./DeploymentNode";
import DeploymentSettingsPanel from "./DeploymentSettingsPanel";
import {
  DeploymentRequest,
  deployApplication,
} from "@/lib/services/deployment";

const nodeTypes = {
  deployment: DeploymentNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function WorkflowCanvasContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] =
    useState<DeploymentRequest | null>(null);
  const { validateAndGetToken } = useAuthStore();
  const { setNodeUpdateHandler, setSettingsOpenHandler, updateNodeData } =
    useWorkflowStore();

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
        templateId: "applications/api/nodejs-api", // Fixed template
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

  const generateJSON = useCallback(() => {
    const deployments = nodes.map(node => node.data as DeploymentRequest);

    console.log(
      "Generated Workflow JSON:",
      JSON.stringify(deployments, null, 2)
    );

    toast.success("JSON Generated - Check console for output");

    return deployments;
  }, [nodes]);

  const saveWorkflow = useCallback(() => {
    const workflow = {
      name: "My Workflow",
      deployments: nodes.map(node => node.data as DeploymentRequest),
      connections: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
      })),
      timestamp: Date.now(),
    };

    localStorage.setItem("workflow-draft", JSON.stringify(workflow));

    toast.success("Workflow saved as draft");
  }, [nodes, edges]);

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

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={generateJSON} size="sm" variant="outline">
          <FileJson className="h-4 w-4 mr-1" />
          JSON
        </Button>

        <Button onClick={saveWorkflow} size="sm" variant="outline">
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        <Button
          onClick={deployAll}
          size="sm"
          variant="default"
          disabled={isDeploying || nodes.length === 0}
        >
          <Rocket className="h-4 w-4 mr-1" />
          {isDeploying ? "Deploying..." : "Deploy All"}
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
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent />
    </ReactFlowProvider>
  );
}
