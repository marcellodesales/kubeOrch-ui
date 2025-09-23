import { create } from "zustand";
import { DeploymentNodeData } from "@/lib/types/nodes";

// Re-export types for convenience
export type { DeploymentNodeData };
export type WorkflowNodeData = DeploymentNodeData;
export type DeploymentRequest = DeploymentNodeData;

interface WorkflowState {
  nodeUpdateHandler: ((nodeId: string, data: WorkflowNodeData) => void) | null;
  settingsOpenHandler:
    | ((nodeId: string, data: WorkflowNodeData) => void)
    | null;

  setNodeUpdateHandler: (
    handler: ((nodeId: string, data: WorkflowNodeData) => void) | null
  ) => void;
  setSettingsOpenHandler: (
    handler: ((nodeId: string, data: WorkflowNodeData) => void) | null
  ) => void;

  // Direct methods for updating nodes
  updateNodeData: (nodeId: string, data: WorkflowNodeData) => void;
  openNodeSettings: (nodeId: string, data: WorkflowNodeData) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodeUpdateHandler: null,
  settingsOpenHandler: null,

  setNodeUpdateHandler: handler => set({ nodeUpdateHandler: handler }),
  setSettingsOpenHandler: handler => set({ settingsOpenHandler: handler }),

  updateNodeData: (nodeId: string, data: WorkflowNodeData) => {
    const handler = get().nodeUpdateHandler;
    if (handler) {
      handler(nodeId, data);
    }
  },

  openNodeSettings: (nodeId: string, data: WorkflowNodeData) => {
    const handler = get().settingsOpenHandler;
    if (handler) {
      handler(nodeId, data);
    }
  },
}));

export default useWorkflowStore;
