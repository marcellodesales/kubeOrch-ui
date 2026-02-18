"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
import { Plus, Save, Rocket, Settings, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/AuthStore";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
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
import { PluginNodeData, PluginFieldDefinition } from "@/lib/types/nodes";
import {
  DeploymentRequest,
  ServiceNodeData,
  IngressNodeData,
  IngressPath,
  ConfigMapNodeData,
  SecretNodeData,
  SecretKeyEntry,
  VolumeMount,
  PersistentVolumeClaimNodeData,
  StatefulSetNodeData,
  JobNodeData,
  CronJobNodeData,
  DaemonSetNodeData,
  HPANodeData,
  NetworkPolicyNodeData,
  NetworkPolicyRule,
  NetworkPolicyPeer,
} from "@/lib/types/nodes";
import NodeSettingsPanel from "./NodeSettingsPanel";
import WorkflowSettingsPanel from "./WorkflowSettingsPanel";
import CommandPalette from "./CommandPalette";
import { MiniLogsPanel } from "./MiniLogsPanel";
import { ImportDialog } from "./ImportDialog";
import { Workflow, updateWorkflow } from "@/lib/services/workflow";
import { TemplateMetadata } from "@/lib/services/templates";
import { ImportAnalysis } from "@/lib/services/import";

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

interface WorkflowCanvasProps {
  workflow?: Workflow | null;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  nodeStatuses?: Map<string, any>; // Real-time status updates from SSE
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onRun?: () => Promise<void>;
  onStatusChange?: (status: "draft" | "published") => Promise<void>;
  onArchive?: () => void;
  onWorkflowUpdate?: (updated: Workflow) => void;
  editable?: boolean;
  openSettings?: boolean;
  onCloseSettings?: () => void;
  executionLogs?: string[];
  showLogs?: boolean;
  onCloseLogs?: () => void;
}

function WorkflowCanvasContent({
  workflow,
  initialNodes = [],
  initialEdges = [],
  nodeStatuses,
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp,
  onSave,
  onRun,
  onStatusChange,
  onArchive,
  onWorkflowUpdate,
  editable = true,
  openSettings = false,
  onCloseSettings,
  executionLogs = [],
  showLogs = false,
  onCloseLogs,
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

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
    if (!isInitializedRef.current) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setNodeId(getNextNodeId(initialNodes));
      // Always set initial snapshot, even for empty workflows
      setInitialSnapshot(
        JSON.stringify({ nodes: initialNodes, edges: initialEdges })
      );
      // Mark as initialized even for empty workflows
      isInitializedRef.current = true;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, getNextNodeId]);

  // Merge real-time status updates from SSE into nodes
  useEffect(() => {
    if (nodeStatuses && nodeStatuses.size > 0 && isInitializedRef.current) {
      setNodes(currentNodes =>
        currentNodes.map(node => {
          const newStatus = nodeStatuses.get(node.id);
          if (newStatus) {
            return {
              ...node,
              data: {
                ...node.data,
                _status: newStatus,
              },
            };
          }
          return node;
        })
      );
    }
  }, [nodeStatuses, setNodes]);

  // Sync editable state to store for node components to access
  useEffect(() => {
    setEditable(editable);
  }, [editable, setEditable]);

  // Open workflow settings panel if openSettings prop is true
  useEffect(() => {
    if (openSettings) {
      setWorkflowSettingsOpen(true);
      setSettingsPanelOpen(false); // Close node settings when opening workflow settings
    }
  }, [openSettings]);

  // Check if there are unsaved changes by comparing with initial snapshot
  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    const currentSnapshot = JSON.stringify({ nodes, edges });
    return currentSnapshot !== initialSnapshot;
  }, [nodes, edges, initialSnapshot]);

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
      setNodes(nds => {
        // First, update the target node
        const updatedNodes = nds.map(node => {
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
        });

        // If this is a deployment node, sync linked services' targetPort
        const updatedNode = updatedNodes.find(n => n.id === nodeId);
        if (updatedNode?.type === "deployment") {
          const deploymentData = data as DeploymentRequest;
          const deploymentPort = deploymentData.port;
          const deploymentName = deploymentData.name;

          // Update any service nodes that are linked to this deployment
          return updatedNodes.map(node => {
            if (node.type === "service") {
              const serviceData = node.data as ServiceNodeData;
              if (serviceData._linkedDeployment === nodeId) {
                return {
                  ...node,
                  data: {
                    ...serviceData,
                    targetPort: deploymentPort,
                    targetApp: deploymentName,
                  },
                };
              }
            }
            return node;
          });
        }

        // If this is a service node, sync linked ingresses' servicePort/serviceName in paths
        if (updatedNode?.type === "service") {
          const serviceData = updatedNode.data as ServiceNodeData;
          const servicePort = serviceData.port;
          const serviceName = serviceData.name;

          // Update any ingress node paths that are linked to this service
          return updatedNodes.map(node => {
            if (node.type === "ingress") {
              const ingressData = node.data as IngressNodeData;
              // Check if any path is linked to this service
              const hasLinkedPath = ingressData.paths?.some(
                p => p._linkedService === nodeId
              );
              if (hasLinkedPath) {
                const updatedPaths = ingressData.paths.map(p =>
                  p._linkedService === nodeId
                    ? { ...p, servicePort, serviceName }
                    : p
                );
                return {
                  ...node,
                  data: {
                    ...ingressData,
                    paths: updatedPaths,
                  },
                };
              }
            }
            return node;
          });
        }

        return updatedNodes;
      });
    };

    const handleOpenNodeSettings = (nodeId: string, data: WorkflowNodeData) => {
      setSelectedNodeId(nodeId);
      setSelectedNodeData(data);
      setSettingsPanelOpen(true);
      setWorkflowSettingsOpen(false); // Close workflow settings when opening node settings
    };

    setNodeUpdateHandler(handleUpdateNodeData);
    setSettingsOpenHandler(handleOpenNodeSettings);

    return () => {
      setNodeUpdateHandler(() => {});
      setSettingsOpenHandler(() => {});
    };
  }, [setNodes, setNodeUpdateHandler, setSettingsOpenHandler]);

  // Keep selectedNodeData in sync when nodes are updated (e.g. from SSE)
  useEffect(() => {
    if (selectedNodeId && settingsPanelOpen) {
      const updatedNode = nodes.find(n => n.id === selectedNodeId);
      if (updatedNode?.data) {
        setSelectedNodeData(updatedNode.data as WorkflowNodeData);
      }
    }
  }, [nodes, selectedNodeId, settingsPanelOpen]);

  // Validate connections - only allow valid Kubernetes resource relationships
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      // Valid connections:
      // 1. Deployment ↔ Service (traffic routing)
      // 2. Service ↔ Ingress (traffic routing)
      // 3. ConfigMap → Deployment (config mounting)
      // 4. Secret → Deployment (secret mounting)
      // Invalid: Deployment ↔ Ingress (must go through Service)

      // Traffic flow: Ingress → Service → Deployment/StatefulSet
      // Config flow: ConfigMap/Secret → Deployment/StatefulSet
      // Storage flow: PVC → Deployment/StatefulSet
      const validPairs = [
        // Traffic flow
        ["ingress", "service"], // Ingress routes to Service
        ["service", "deployment"], // Service routes to Deployment
        ["service", "statefulset"], // Service routes to StatefulSet
        ["service", "daemonset"], // Service routes to DaemonSet
        // Config flow
        ["configmap", "deployment"], // ConfigMap mounts to Deployment
        ["configmap", "statefulset"], // ConfigMap mounts to StatefulSet
        ["configmap", "job"], // ConfigMap mounts to Job
        ["configmap", "cronjob"], // ConfigMap mounts to CronJob
        ["configmap", "daemonset"], // ConfigMap mounts to DaemonSet
        ["secret", "deployment"], // Secret mounts to Deployment
        ["secret", "statefulset"], // Secret mounts to StatefulSet
        ["secret", "job"], // Secret mounts to Job
        ["secret", "cronjob"], // Secret mounts to CronJob
        ["secret", "daemonset"], // Secret mounts to DaemonSet
        // Storage flow
        ["persistentvolumeclaim", "deployment"], // PVC mounts to Deployment
        ["persistentvolumeclaim", "statefulset"], // PVC mounts to StatefulSet
        // HPA scales workloads (HPA is source)
        ["hpa", "deployment"], // HPA scales Deployment
        ["hpa", "statefulset"], // HPA scales StatefulSet
        // NetworkPolicy applies to workloads (NetworkPolicy is source)
        ["networkpolicy", "deployment"], // NetworkPolicy applies to Deployment
        ["networkpolicy", "statefulset"], // NetworkPolicy applies to StatefulSet
        ["networkpolicy", "daemonset"], // NetworkPolicy applies to DaemonSet
      ];

      return validPairs.some(
        ([src, tgt]) => sourceType === src && targetType === tgt
      );
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Add the edge
      setEdges(eds => addEdge(params, eds));

      // Auto-populate data based on connections
      // Flow: Ingress → Service → Deployment
      if (params.source && params.target) {
        setNodes(nds => {
          const sourceNode = nds.find(n => n.id === params.source);
          const targetNode = nds.find(n => n.id === params.target);

          // Ingress (source) → Service (target)
          // Update Ingress path with service name/port
          if (
            sourceNode?.type === "ingress" &&
            targetNode?.type === "service"
          ) {
            const pathId = params.sourceHandle; // The path entry ID
            return nds.map(n => {
              if (n.id === params.source) {
                const serviceData = targetNode.data as ServiceNodeData;
                const ingressData = n.data as IngressNodeData;
                const updatedPaths = (ingressData.paths || []).map(p =>
                  p.id === pathId
                    ? {
                        ...p,
                        serviceName: serviceData.name,
                        servicePort: serviceData.port,
                        _linkedService: params.target,
                      }
                    : p
                );
                return {
                  ...n,
                  data: {
                    ...ingressData,
                    paths: updatedPaths,
                  },
                };
              }
              return n;
            });
          }

          // Service (source) → Deployment (target)
          // Update Service with deployment name/port
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

          // Service (source) → StatefulSet (target)
          // Update Service with statefulset name/port
          if (
            sourceNode?.type === "service" &&
            targetNode?.type === "statefulset"
          ) {
            return nds.map(n => {
              if (n.id === params.source) {
                const statefulSetData = targetNode.data as StatefulSetNodeData;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    targetApp: statefulSetData.name,
                    targetPort: statefulSetData.port,
                    _linkedDeployment: params.target,
                  },
                };
              }
              return n;
            });
          }

          // ConfigMap (source) → Deployment (target)
          // Add volume mount to deployment
          if (
            sourceNode?.type === "configmap" &&
            targetNode?.type === "deployment"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const configMapData = sourceNode.data as ConfigMapNodeData;
                const deploymentData = n.data as DeploymentRequest;
                const existingMounts = deploymentData.volumeMounts || [];
                const existingLinked = deploymentData._linkedConfigMaps || [];

                // Check if already linked
                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "configMap",
                  name: configMapData.name,
                  mountPath: configMapData.mountPath || "/etc/config",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...deploymentData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedConfigMaps: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // ConfigMap (source) → StatefulSet (target)
          // Add volume mount to statefulset
          if (
            sourceNode?.type === "configmap" &&
            targetNode?.type === "statefulset"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const configMapData = sourceNode.data as ConfigMapNodeData;
                const statefulSetData = n.data as StatefulSetNodeData;
                const existingMounts = statefulSetData.volumeMounts || [];
                const existingLinked = statefulSetData._linkedConfigMaps || [];

                // Check if already linked
                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "configMap",
                  name: configMapData.name,
                  mountPath: configMapData.mountPath || "/etc/config",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...statefulSetData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedConfigMaps: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Secret (source) → Deployment (target)
          // Add volume mount to deployment
          if (
            sourceNode?.type === "secret" &&
            targetNode?.type === "deployment"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const secretData = sourceNode.data as SecretNodeData;
                const deploymentData = n.data as DeploymentRequest;
                const existingMounts = deploymentData.volumeMounts || [];
                const existingLinked = deploymentData._linkedSecrets || [];

                // Check if already linked
                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "secret",
                  name: secretData.name,
                  mountPath: secretData.mountPath || "/etc/secrets",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...deploymentData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedSecrets: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Secret (source) → StatefulSet (target)
          // Add volume mount to statefulset
          if (
            sourceNode?.type === "secret" &&
            targetNode?.type === "statefulset"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const secretData = sourceNode.data as SecretNodeData;
                const statefulSetData = n.data as StatefulSetNodeData;
                const existingMounts = statefulSetData.volumeMounts || [];
                const existingLinked = statefulSetData._linkedSecrets || [];

                // Check if already linked
                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "secret",
                  name: secretData.name,
                  mountPath: secretData.mountPath || "/etc/secrets",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...statefulSetData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedSecrets: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // PersistentVolumeClaim (source) → Deployment (target)
          // Add PVC volume mount to deployment
          if (
            sourceNode?.type === "persistentvolumeclaim" &&
            targetNode?.type === "deployment"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const pvcData =
                  sourceNode.data as PersistentVolumeClaimNodeData;
                const deploymentData = n.data as DeploymentRequest;
                const existingMounts = deploymentData.volumeMounts || [];
                const existingLinkedPVCs = deploymentData._linkedPVCs || [];

                // Check if already linked
                if (existingLinkedPVCs.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "persistentVolumeClaim",
                  name: pvcData.name,
                  mountPath: `/data/${pvcData.name}`,
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...deploymentData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedPVCs: [...existingLinkedPVCs, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // PersistentVolumeClaim (source) → StatefulSet (target)
          // Add PVC volume mount to statefulset
          if (
            sourceNode?.type === "persistentvolumeclaim" &&
            targetNode?.type === "statefulset"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const pvcData =
                  sourceNode.data as PersistentVolumeClaimNodeData;
                const statefulSetData = n.data as StatefulSetNodeData;
                const existingMounts = statefulSetData.volumeMounts || [];
                const existingLinkedPVCs = statefulSetData._linkedPVCs || [];

                // Check if already linked
                if (existingLinkedPVCs.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "persistentVolumeClaim",
                  name: pvcData.name,
                  mountPath: `/data/${pvcData.name}`,
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...statefulSetData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedPVCs: [...existingLinkedPVCs, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Service (source) → DaemonSet (target)
          // Update Service with daemonset name/port
          if (
            sourceNode?.type === "service" &&
            targetNode?.type === "daemonset"
          ) {
            return nds.map(n => {
              if (n.id === params.source) {
                const daemonSetData = targetNode.data as DaemonSetNodeData;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    targetApp: daemonSetData.name,
                    targetPort: daemonSetData.port,
                    _linkedDeployment: params.target,
                  },
                };
              }
              return n;
            });
          }

          // ConfigMap (source) → Job (target)
          // Add volume mount to job
          if (sourceNode?.type === "configmap" && targetNode?.type === "job") {
            return nds.map(n => {
              if (n.id === params.target) {
                const configMapData = sourceNode.data as ConfigMapNodeData;
                const jobData = n.data as JobNodeData;
                const existingMounts = jobData.volumeMounts || [];
                const existingLinked = jobData._linkedConfigMaps || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "configMap",
                  name: configMapData.name,
                  mountPath: configMapData.mountPath || "/etc/config",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...jobData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedConfigMaps: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // ConfigMap (source) → CronJob (target)
          // Add volume mount to cronjob
          if (
            sourceNode?.type === "configmap" &&
            targetNode?.type === "cronjob"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const configMapData = sourceNode.data as ConfigMapNodeData;
                const cronJobData = n.data as CronJobNodeData;
                const existingMounts = cronJobData.volumeMounts || [];
                const existingLinked = cronJobData._linkedConfigMaps || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "configMap",
                  name: configMapData.name,
                  mountPath: configMapData.mountPath || "/etc/config",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...cronJobData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedConfigMaps: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // ConfigMap (source) → DaemonSet (target)
          // Add volume mount to daemonset
          if (
            sourceNode?.type === "configmap" &&
            targetNode?.type === "daemonset"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const configMapData = sourceNode.data as ConfigMapNodeData;
                const daemonSetData = n.data as DaemonSetNodeData;
                const existingMounts = daemonSetData.volumeMounts || [];
                const existingLinked = daemonSetData._linkedConfigMaps || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "configMap",
                  name: configMapData.name,
                  mountPath: configMapData.mountPath || "/etc/config",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...daemonSetData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedConfigMaps: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Secret (source) → Job (target)
          // Add volume mount to job
          if (sourceNode?.type === "secret" && targetNode?.type === "job") {
            return nds.map(n => {
              if (n.id === params.target) {
                const secretData = sourceNode.data as SecretNodeData;
                const jobData = n.data as JobNodeData;
                const existingMounts = jobData.volumeMounts || [];
                const existingLinked = jobData._linkedSecrets || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "secret",
                  name: secretData.name,
                  mountPath: secretData.mountPath || "/etc/secrets",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...jobData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedSecrets: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Secret (source) → CronJob (target)
          // Add volume mount to cronjob
          if (sourceNode?.type === "secret" && targetNode?.type === "cronjob") {
            return nds.map(n => {
              if (n.id === params.target) {
                const secretData = sourceNode.data as SecretNodeData;
                const cronJobData = n.data as CronJobNodeData;
                const existingMounts = cronJobData.volumeMounts || [];
                const existingLinked = cronJobData._linkedSecrets || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "secret",
                  name: secretData.name,
                  mountPath: secretData.mountPath || "/etc/secrets",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...cronJobData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedSecrets: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // Secret (source) → DaemonSet (target)
          // Add volume mount to daemonset
          if (
            sourceNode?.type === "secret" &&
            targetNode?.type === "daemonset"
          ) {
            return nds.map(n => {
              if (n.id === params.target) {
                const secretData = sourceNode.data as SecretNodeData;
                const daemonSetData = n.data as DaemonSetNodeData;
                const existingMounts = daemonSetData.volumeMounts || [];
                const existingLinked = daemonSetData._linkedSecrets || [];

                if (existingLinked.includes(params.source!)) {
                  return n;
                }

                const newMount: VolumeMount = {
                  type: "secret",
                  name: secretData.name,
                  mountPath: secretData.mountPath || "/etc/secrets",
                  nodeId: params.source!,
                };

                return {
                  ...n,
                  data: {
                    ...daemonSetData,
                    volumeMounts: [...existingMounts, newMount],
                    _linkedSecrets: [...existingLinked, params.source!],
                  },
                };
              }
              return n;
            });
          }

          // HPA (source) → Deployment/StatefulSet (target)
          // Auto-populate HPA's scaleTargetRef fields
          if (
            sourceNode?.type === "hpa" &&
            (targetNode?.type === "deployment" ||
              targetNode?.type === "statefulset")
          ) {
            return nds.map(n => {
              if (n.id === params.source) {
                const targetData = targetNode.data as
                  | DeploymentRequest
                  | StatefulSetNodeData;
                const targetKind =
                  targetNode.type === "deployment"
                    ? "Deployment"
                    : "StatefulSet";
                return {
                  ...n,
                  data: {
                    ...n.data,
                    scaleTargetKind: targetKind,
                    scaleTargetName: targetData.name,
                    _linkedTarget: params.target,
                  },
                };
              }
              return n;
            });
          }

          // NetworkPolicy (source) → Deployment/StatefulSet/DaemonSet (target)
          if (
            sourceNode?.type === "networkpolicy" &&
            (targetNode?.type === "deployment" ||
              targetNode?.type === "statefulset" ||
              targetNode?.type === "daemonset")
          ) {
            const sourceHandle = params.sourceHandle;

            // Per-rule handle: create a podSelector peer in the matching rule
            if (sourceHandle && sourceHandle !== "output") {
              const ruleId = sourceHandle;
              return nds.map(n => {
                if (n.id === params.source) {
                  const npData = n.data as NetworkPolicyNodeData;
                  const targetData = targetNode.data as
                    | DeploymentRequest
                    | StatefulSetNodeData
                    | DaemonSetNodeData;

                  const newPeer: NetworkPolicyPeer = {
                    id: `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: "podSelector",
                    podSelector: { app: targetData.name },
                    _linkedWorkload: params.target!,
                  };

                  // Try ingress rules first, then egress
                  const updatedIngress = (npData.ingressRules || []).map(
                    (rule: NetworkPolicyRule) => {
                      if (rule.id === ruleId) {
                        const existingPeers = rule.from || [];
                        if (
                          existingPeers.some(
                            p => p._linkedWorkload === params.target
                          )
                        )
                          return rule;
                        return { ...rule, from: [...existingPeers, newPeer] };
                      }
                      return rule;
                    }
                  );

                  const updatedEgress = (npData.egressRules || []).map(
                    (rule: NetworkPolicyRule) => {
                      if (rule.id === ruleId) {
                        const existingPeers = rule.to || [];
                        if (
                          existingPeers.some(
                            p => p._linkedWorkload === params.target
                          )
                        )
                          return rule;
                        return { ...rule, to: [...existingPeers, newPeer] };
                      }
                      return rule;
                    }
                  );

                  return {
                    ...n,
                    data: {
                      ...npData,
                      ingressRules: updatedIngress,
                      egressRules: updatedEgress,
                    },
                  };
                }
                return n;
              });
            }

            // Header "output" handle: auto-populate top-level podSelector
            return nds.map(n => {
              if (n.id === params.source) {
                const targetData = targetNode.data as
                  | DeploymentRequest
                  | StatefulSetNodeData
                  | DaemonSetNodeData;
                const existingLinked =
                  (n.data as NetworkPolicyNodeData)._linkedWorkloads || [];
                if (existingLinked.includes(params.target!)) return n;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    podSelector: { app: targetData.name },
                    _linkedWorkloads: [...existingLinked, params.target!],
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

  // Handle edge deletion - clear linked fields when disconnected
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setNodes(nds => {
        return nds.map(node => {
          // Check if any deleted edge involves this node
          const deletedEdgesForNode = deletedEdges.filter(
            edge => edge.source === node.id || edge.target === node.id
          );

          if (deletedEdgesForNode.length === 0) return node;

          // Clear Service's linked deployment/statefulset fields
          if (node.type === "service") {
            const hasWorkloadEdge = deletedEdgesForNode.some(edge => {
              const otherNodeId =
                edge.source === node.id ? edge.target : edge.source;
              const otherType = nds.find(n => n.id === otherNodeId)?.type;
              return otherType === "deployment" || otherType === "statefulset";
            });
            if (hasWorkloadEdge) {
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

          // Clear Ingress's linked service fields for specific paths
          if (node.type === "ingress") {
            const ingressData = node.data as IngressNodeData;
            // Find which path handles were disconnected
            const disconnectedPathIds = new Set<string>();
            deletedEdgesForNode.forEach(edge => {
              // targetHandle is the path ID when Service → Ingress
              if (edge.target === node.id && edge.targetHandle) {
                disconnectedPathIds.add(edge.targetHandle);
              }
              // sourceHandle is the path ID when Ingress → Service
              if (edge.source === node.id && edge.sourceHandle) {
                disconnectedPathIds.add(edge.sourceHandle);
              }
            });

            if (disconnectedPathIds.size > 0 && ingressData.paths) {
              const updatedPaths = ingressData.paths.map(p =>
                disconnectedPathIds.has(p.id)
                  ? {
                      ...p,
                      serviceName: "",
                      servicePort: undefined,
                      _linkedService: undefined,
                    }
                  : p
              );
              return {
                ...node,
                data: {
                  ...ingressData,
                  paths: updatedPaths,
                },
              };
            }
          }

          // Clear Deployment's linked ConfigMap/Secret fields
          if (node.type === "deployment") {
            const deploymentData = node.data as DeploymentRequest;
            let updated = false;
            let newLinkedConfigMaps = deploymentData._linkedConfigMaps || [];
            let newLinkedSecrets = deploymentData._linkedSecrets || [];
            let newVolumeMounts = deploymentData.volumeMounts || [];

            // Check for deleted ConfigMap edges
            const deletedConfigMapIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type === "configmap"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedConfigMapIds.length > 0) {
              newLinkedConfigMaps = newLinkedConfigMaps.filter(
                id => !deletedConfigMapIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    m.type === "configMap" &&
                    deletedConfigMapIds.includes(m.nodeId)
                  )
              );
              updated = true;
            }

            // Check for deleted Secret edges
            const deletedSecretIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return nds.find(n => n.id === otherNodeId)?.type === "secret";
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedSecretIds.length > 0) {
              newLinkedSecrets = newLinkedSecrets.filter(
                id => !deletedSecretIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(m.type === "secret" && deletedSecretIds.includes(m.nodeId))
              );
              updated = true;
            }

            // Check for deleted PVC edges
            const deletedPVCIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type ===
                  "persistentvolumeclaim"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedPVCIds.length > 0) {
              let newLinkedPVCs = (deploymentData as any)._linkedPVCs || [];
              newLinkedPVCs = newLinkedPVCs.filter(
                (id: string) => !deletedPVCIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    (m.type as string) === "persistentVolumeClaim" &&
                    deletedPVCIds.includes(m.nodeId)
                  )
              );
              (deploymentData as any)._linkedPVCs = newLinkedPVCs;
              updated = true;
            }

            if (updated) {
              return {
                ...node,
                data: {
                  ...deploymentData,
                  _linkedConfigMaps: newLinkedConfigMaps,
                  _linkedSecrets: newLinkedSecrets,
                  _linkedPVCs: (deploymentData as any)._linkedPVCs,
                  volumeMounts: newVolumeMounts,
                },
              };
            }
          }

          // Clear StatefulSet's linked ConfigMap/Secret/PVC fields
          if (node.type === "statefulset") {
            const statefulSetData = node.data as StatefulSetNodeData;
            let updated = false;
            let newLinkedConfigMaps = statefulSetData._linkedConfigMaps || [];
            let newLinkedSecrets = statefulSetData._linkedSecrets || [];
            let newVolumeMounts = statefulSetData.volumeMounts || [];

            // Check for deleted ConfigMap edges
            const deletedConfigMapIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type === "configmap"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedConfigMapIds.length > 0) {
              newLinkedConfigMaps = newLinkedConfigMaps.filter(
                id => !deletedConfigMapIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    m.type === "configMap" &&
                    deletedConfigMapIds.includes(m.nodeId)
                  )
              );
              updated = true;
            }

            // Check for deleted Secret edges
            const deletedSecretIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return nds.find(n => n.id === otherNodeId)?.type === "secret";
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedSecretIds.length > 0) {
              newLinkedSecrets = newLinkedSecrets.filter(
                id => !deletedSecretIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(m.type === "secret" && deletedSecretIds.includes(m.nodeId))
              );
              updated = true;
            }

            // Check for deleted PVC edges
            const deletedPVCIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type ===
                  "persistentvolumeclaim"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedPVCIds.length > 0) {
              let newLinkedPVCs = (statefulSetData as any)._linkedPVCs || [];
              newLinkedPVCs = newLinkedPVCs.filter(
                (id: string) => !deletedPVCIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    (m.type as string) === "persistentVolumeClaim" &&
                    deletedPVCIds.includes(m.nodeId)
                  )
              );
              (statefulSetData as any)._linkedPVCs = newLinkedPVCs;
              updated = true;
            }

            if (updated) {
              return {
                ...node,
                data: {
                  ...statefulSetData,
                  _linkedConfigMaps: newLinkedConfigMaps,
                  _linkedSecrets: newLinkedSecrets,
                  _linkedPVCs: (statefulSetData as any)._linkedPVCs,
                  volumeMounts: newVolumeMounts,
                },
              };
            }
          }

          // Clear Job's linked ConfigMap/Secret fields
          if (node.type === "job") {
            const jobData = node.data as JobNodeData;
            let updated = false;
            let newLinkedConfigMaps = jobData._linkedConfigMaps || [];
            let newLinkedSecrets = jobData._linkedSecrets || [];
            let newVolumeMounts = jobData.volumeMounts || [];

            const deletedConfigMapIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type === "configmap"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedConfigMapIds.length > 0) {
              newLinkedConfigMaps = newLinkedConfigMaps.filter(
                id => !deletedConfigMapIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    m.type === "configMap" &&
                    deletedConfigMapIds.includes(m.nodeId)
                  )
              );
              updated = true;
            }

            const deletedSecretIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return nds.find(n => n.id === otherNodeId)?.type === "secret";
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedSecretIds.length > 0) {
              newLinkedSecrets = newLinkedSecrets.filter(
                id => !deletedSecretIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(m.type === "secret" && deletedSecretIds.includes(m.nodeId))
              );
              updated = true;
            }

            if (updated) {
              return {
                ...node,
                data: {
                  ...jobData,
                  _linkedConfigMaps: newLinkedConfigMaps,
                  _linkedSecrets: newLinkedSecrets,
                  volumeMounts: newVolumeMounts,
                },
              };
            }
          }

          // Clear CronJob's linked ConfigMap/Secret fields
          if (node.type === "cronjob") {
            const cronJobData = node.data as CronJobNodeData;
            let updated = false;
            let newLinkedConfigMaps = cronJobData._linkedConfigMaps || [];
            let newLinkedSecrets = cronJobData._linkedSecrets || [];
            let newVolumeMounts = cronJobData.volumeMounts || [];

            const deletedConfigMapIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type === "configmap"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedConfigMapIds.length > 0) {
              newLinkedConfigMaps = newLinkedConfigMaps.filter(
                id => !deletedConfigMapIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    m.type === "configMap" &&
                    deletedConfigMapIds.includes(m.nodeId)
                  )
              );
              updated = true;
            }

            const deletedSecretIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return nds.find(n => n.id === otherNodeId)?.type === "secret";
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedSecretIds.length > 0) {
              newLinkedSecrets = newLinkedSecrets.filter(
                id => !deletedSecretIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(m.type === "secret" && deletedSecretIds.includes(m.nodeId))
              );
              updated = true;
            }

            if (updated) {
              return {
                ...node,
                data: {
                  ...cronJobData,
                  _linkedConfigMaps: newLinkedConfigMaps,
                  _linkedSecrets: newLinkedSecrets,
                  volumeMounts: newVolumeMounts,
                },
              };
            }
          }

          // Clear DaemonSet's linked ConfigMap/Secret fields
          if (node.type === "daemonset") {
            const daemonSetData = node.data as DaemonSetNodeData;
            let updated = false;
            let newLinkedConfigMaps = daemonSetData._linkedConfigMaps || [];
            let newLinkedSecrets = daemonSetData._linkedSecrets || [];
            let newVolumeMounts = daemonSetData.volumeMounts || [];

            const deletedConfigMapIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return (
                  nds.find(n => n.id === otherNodeId)?.type === "configmap"
                );
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedConfigMapIds.length > 0) {
              newLinkedConfigMaps = newLinkedConfigMaps.filter(
                id => !deletedConfigMapIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(
                    m.type === "configMap" &&
                    deletedConfigMapIds.includes(m.nodeId)
                  )
              );
              updated = true;
            }

            const deletedSecretIds = deletedEdgesForNode
              .filter(edge => {
                const otherNodeId =
                  edge.source === node.id ? edge.target : edge.source;
                return nds.find(n => n.id === otherNodeId)?.type === "secret";
              })
              .map(edge =>
                edge.source === node.id ? edge.target : edge.source
              );

            if (deletedSecretIds.length > 0) {
              newLinkedSecrets = newLinkedSecrets.filter(
                id => !deletedSecretIds.includes(id)
              );
              newVolumeMounts = newVolumeMounts.filter(
                m =>
                  !(m.type === "secret" && deletedSecretIds.includes(m.nodeId))
              );
              updated = true;
            }

            if (updated) {
              return {
                ...node,
                data: {
                  ...daemonSetData,
                  _linkedConfigMaps: newLinkedConfigMaps,
                  _linkedSecrets: newLinkedSecrets,
                  volumeMounts: newVolumeMounts,
                },
              };
            }
          }

          // Clear HPA's linked workload fields
          if (node.type === "hpa") {
            const hpaData = node.data as HPANodeData;
            const hasWorkloadEdge = deletedEdgesForNode.some(edge => {
              const otherNodeId =
                edge.source === node.id ? edge.target : edge.source;
              const otherType = nds.find(n => n.id === otherNodeId)?.type;
              return otherType === "deployment" || otherType === "statefulset";
            });

            if (hasWorkloadEdge) {
              return {
                ...node,
                data: {
                  ...hpaData,
                  scaleTargetKind: undefined,
                  scaleTargetName: "",
                  _linkedTarget: undefined,
                },
              };
            }
          }

          // Clear NetworkPolicy's linked workload fields
          if (node.type === "networkpolicy") {
            const networkPolicyData = node.data as NetworkPolicyNodeData;
            let updatedData = { ...networkPolicyData };
            let changed = false;

            for (const edge of deletedEdgesForNode) {
              const otherNodeId =
                edge.source === node.id ? edge.target : edge.source;
              const otherType = nds.find(n => n.id === otherNodeId)?.type;
              if (
                otherType !== "deployment" &&
                otherType !== "statefulset" &&
                otherType !== "daemonset"
              )
                continue;

              const sourceHandle = edge.sourceHandle;

              if (!sourceHandle || sourceHandle === "output") {
                // Header handle: remove from _linkedWorkloads
                const remainingLinked = (
                  updatedData._linkedWorkloads || []
                ).filter(id => id !== otherNodeId);
                updatedData = {
                  ...updatedData,
                  podSelector:
                    remainingLinked.length > 0 ? updatedData.podSelector : {},
                  _linkedWorkloads:
                    remainingLinked.length > 0 ? remainingLinked : undefined,
                };
                changed = true;
              } else {
                // Per-rule handle: remove the linked peer from that rule
                const ruleId = sourceHandle;
                const targetNodeId = otherNodeId;

                updatedData = {
                  ...updatedData,
                  ingressRules: (updatedData.ingressRules || []).map(
                    (rule: NetworkPolicyRule) => {
                      if (rule.id !== ruleId) return rule;
                      return {
                        ...rule,
                        from: (rule.from || []).filter(
                          (p: NetworkPolicyPeer) =>
                            p._linkedWorkload !== targetNodeId
                        ),
                      };
                    }
                  ),
                  egressRules: (updatedData.egressRules || []).map(
                    (rule: NetworkPolicyRule) => {
                      if (rule.id !== ruleId) return rule;
                      return {
                        ...rule,
                        to: (rule.to || []).filter(
                          (p: NetworkPolicyPeer) =>
                            p._linkedWorkload !== targetNodeId
                        ),
                      };
                    }
                  ),
                };
                changed = true;
              }
            }

            if (changed) {
              return {
                ...node,
                data: updatedData,
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

  const handleImport = useCallback(
    (analysis: ImportAnalysis) => {
      // Calculate offset to avoid overlapping with existing nodes
      const existingMaxX = nodes.reduce(
        (max, n) => Math.max(max, n.position.x),
        0
      );
      const offsetX = existingMaxX > 0 ? existingMaxX + 300 : 0;

      // Find max node ID to avoid collisions
      let maxId = getNextNodeId(nodes);

      // Map old node IDs to new node IDs
      const idMap: Record<string, string> = {};
      const newNodes: Node[] = analysis.suggestedNodes.map(node => {
        const newId = `node-${maxId}`;
        idMap[node.id] = newId;
        maxId++;

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y,
          },
          data: {
            ...node.data,
            id: newId,
          },
        };
      });

      // Update edges to use new node IDs
      const newEdges: Edge[] = analysis.suggestedEdges.map(edge => ({
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        source: idMap[edge.source] || edge.source,
        target: idMap[edge.target] || edge.target,
      }));

      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      setNodeId(maxId);

      toast.success(
        `Imported ${newNodes.length} nodes and ${newEdges.length} connections`
      );
    },
    [nodes, getNextNodeId, setNodes, setEdges]
  );

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
      } else if (template.name === "ingress") {
        const initialPath: IngressPath = {
          id: `path-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          path: "/",
          pathType: "Prefix",
        };
        const newNode: Node<IngressNodeData> = {
          id: nodeIdStr,
          type: "ingress",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `ingress-${nodeId}`,
            namespace: "default",
            host: "",
            paths: [initialPath],
            ingressClassName: "nginx",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "configmap") {
        const newNode: Node<ConfigMapNodeData> = {
          id: nodeIdStr,
          type: "configmap",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `configmap-${nodeId}`,
            namespace: "default",
            data: { [`_new_${Date.now()}`]: "" },
            mountPath: "/etc/config",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "secret") {
        const newNode: Node<SecretNodeData> = {
          id: nodeIdStr,
          type: "secret",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `secret-${nodeId}`,
            namespace: "default",
            secretType: "Opaque",
            keys: [{ id: `key_${Date.now()}`, name: "" }] as SecretKeyEntry[],
            mountPath: "/etc/secrets",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "persistentvolumeclaim") {
        const newNode: Node<PersistentVolumeClaimNodeData> = {
          id: nodeIdStr,
          type: "persistentvolumeclaim",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `pvc-${nodeId}`,
            namespace: "default",
            storage: "10Gi",
            accessModes: ["ReadWriteOnce"],
            volumeMode: "Filesystem",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "statefulset") {
        const newNode: Node<StatefulSetNodeData> = {
          id: nodeIdStr,
          type: "statefulset",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `statefulset-${nodeId}`,
            namespace: "default",
            serviceName: `statefulset-${nodeId}-headless`,
            image: "",
            replicas: 1,
            port: 5432,
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "job") {
        const newNode: Node<JobNodeData> = {
          id: nodeIdStr,
          type: "job",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `job-${nodeId}`,
            namespace: "default",
            image: "",
            completions: 1,
            parallelism: 1,
            backoffLimit: 6,
            restartPolicy: "Never",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "cronjob") {
        const newNode: Node<CronJobNodeData> = {
          id: nodeIdStr,
          type: "cronjob",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `cronjob-${nodeId}`,
            namespace: "default",
            schedule: "0 * * * *",
            image: "",
            concurrencyPolicy: "Allow",
            suspend: false,
            successfulJobsHistoryLimit: 3,
            failedJobsHistoryLimit: 1,
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "daemonset") {
        const newNode: Node<DaemonSetNodeData> = {
          id: nodeIdStr,
          type: "daemonset",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `daemonset-${nodeId}`,
            namespace: "default",
            image: "",
            port: 8080,
            updateStrategy: "RollingUpdate",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "hpa") {
        const newNode: Node<HPANodeData> = {
          id: nodeIdStr,
          type: "hpa",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `hpa-${nodeId}`,
            namespace: "default",
            minReplicas: 1,
            maxReplicas: 10,
            targetCPUUtilization: 80,
            scaleTargetKind: "Deployment",
            scaleTargetName: "",
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.name === "networkpolicy") {
        const newNode: Node<NetworkPolicyNodeData> = {
          id: nodeIdStr,
          type: "networkpolicy",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: {
            id: nodeIdStr,
            name: `networkpolicy-${nodeId}`,
            namespace: "default",
            podSelector: {},
            policyTypes: ["Ingress"],
            templateId: template.id,
          },
        };
        setNodes(nds => [...nds, newNode]);
      } else if (template.isPlugin) {
        // Handle plugin templates dynamically
        const pluginFields: PluginFieldDefinition[] = template.parameters.map(
          param => ({
            id: param.name,
            label: param.label,
            type: param.type,
            required: param.required,
            default: param.default as string | undefined,
            options: param.options,
            placeholder: param.description,
          })
        );

        // Build initial data from template parameters
        const initialData: Record<string, unknown> = {
          id: nodeIdStr,
          name: `${template.name}-${nodeId}`,
          namespace: "default",
          templateId: template.id,
          pluginId: template.pluginId,
          pluginCategory: template.category,
          displayName: template.displayName,
          _pluginFields: pluginFields,
        };

        // Set default values from parameters
        for (const param of template.parameters) {
          if (param.default !== undefined) {
            initialData[param.name] = param.default;
          }
        }

        const newNode: Node<PluginNodeData> = {
          id: nodeIdStr,
          type: "plugin",
          position: {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
          data: initialData as PluginNodeData,
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
      // Update snapshot after successful save
      setInitialSnapshot(JSON.stringify({ nodes, edges }));
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
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {/* Top bar with title and actions */}
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
          onClick={() => {
            setWorkflowSettingsOpen(true);
            setSettingsPanelOpen(false);
          }}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Action buttons */}
        {editable && (
          <Button
            onClick={saveWorkflow}
            size="sm"
            variant="outline"
            disabled={isSaving || !hasChanges}
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

        {editable && (
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
        )}

        {editable && (
          <Button
            onClick={() => setCommandPaletteOpen(true)}
            size="sm"
            variant="default"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Settings panel - unified component for all node types */}
      {selectedNodeData && selectedNodeId && (
        <NodeSettingsPanel
          isOpen={settingsPanelOpen}
          nodeId={selectedNodeId}
          data={selectedNodeData}
          nodeType={
            (nodes.find(n => n.id === selectedNodeId)?.type as
              | "deployment"
              | "service"
              | "ingress"
              | "configmap"
              | "secret"
              | "persistentvolumeclaim"
              | "statefulset") || "deployment"
          }
          onClose={handleCloseSettings}
          onUpdate={handleSettingsUpdate}
          onDelete={handleDeleteNode}
          editable={editable}
          workflowId={workflow?.id}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handleCommandPaletteClose}
        onSelectTemplate={handleSelectTemplate}
      />

      <ImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />

      {workflow && (
        <WorkflowSettingsPanel
          isOpen={workflowSettingsOpen}
          workflow={workflow}
          onClose={() => {
            setWorkflowSettingsOpen(false);
            onCloseSettings?.();
          }}
          onUpdate={async (updatedWorkflow: Workflow) => {
            try {
              const result = await updateWorkflow(workflow.id, {
                name: updatedWorkflow.name,
                description: updatedWorkflow.description,
              });
              onWorkflowUpdate?.(result);
              toast.success("Workflow updated");
              setWorkflowSettingsOpen(false);
              onCloseSettings?.();
            } catch {
              toast.error("Failed to update workflow");
            }
          }}
          onArchive={onArchive}
          onWorkflowRestore={(restoredNodes, restoredEdges) => {
            // Update the canvas with restored version
            setNodes(restoredNodes as Node[]);
            setEdges(restoredEdges as Edge[]);
            // Notify parent of the change
            onNodesChangeProp?.(restoredNodes as Node[]);
            onEdgesChangeProp?.(restoredEdges as Edge[]);
            toast.success("Workflow restored to previous version");
          }}
          onImport={() => {
            setWorkflowSettingsOpen(false);
            setImportDialogOpen(true);
          }}
        />
      )}

      {/* Mini logs panel for execution feedback */}
      <MiniLogsPanel
        logs={executionLogs}
        isVisible={showLogs}
        onClose={() => onCloseLogs?.()}
      />
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
