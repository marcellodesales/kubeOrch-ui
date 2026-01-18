"use client";

import React, { useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import type { WorkflowNode, WorkflowEdge } from "@/lib/services/workflow";
import DeploymentNode from "./DeploymentNode";
import ServiceNode from "./ServiceNode";
import IngressNode from "./IngressNode";

const nodeTypes = {
  deployment: DeploymentNode,
  service: ServiceNode,
  ingress: IngressNode,
};

interface CompareCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function CompareCanvasContent({ nodes, edges }: CompareCanvasProps) {
  const { fitView } = useReactFlow();

  // Convert workflow nodes/edges to React Flow format
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
      },
      draggable: false,
      selectable: true,
      connectable: false,
    }));
  }, [nodes]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || "default",
      animated: false,
    }));
  }, [edges]);

  // Fit view when nodes change
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [flowNodes, fitView]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function CompareCanvas(props: CompareCanvasProps) {
  return (
    <ReactFlowProvider>
      <CompareCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
