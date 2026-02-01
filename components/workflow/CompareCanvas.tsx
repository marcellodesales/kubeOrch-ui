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
import ConfigMapNode from "./ConfigMapNode";
import SecretNode from "./SecretNode";
import PersistentVolumeClaimNode from "./PersistentVolumeClaimNode";
import StatefulSetNode from "./StatefulSetNode";
import GenericPluginNode from "./GenericPluginNode";
import JobNode from "./JobNode";
import CronJobNode from "./CronJobNode";
import DaemonSetNode from "./DaemonSetNode";
import HPANode from "./HPANode";
import NetworkPolicyNode from "./NetworkPolicyNode";

const nodeTypes = {
  deployment: DeploymentNode,
  service: ServiceNode,
  ingress: IngressNode,
  configmap: ConfigMapNode,
  secret: SecretNode,
  persistentvolumeclaim: PersistentVolumeClaimNode,
  statefulset: StatefulSetNode,
  plugin: GenericPluginNode,
  job: JobNode,
  cronjob: CronJobNode,
  daemonset: DaemonSetNode,
  hpa: HPANode,
  networkpolicy: NetworkPolicyNode,
};

interface CompareCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

function CompareCanvasContent({ nodes, edges }: CompareCanvasProps) {
  const { fitView } = useReactFlow();

  // Convert workflow nodes/edges to React Flow format
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map(node => ({
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
    return edges.map(edge => ({
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
