import { create } from "zustand";
import {
  DeploymentNodeData,
  WorkflowNodeData as WorkflowNodeDataType,
} from "@/lib/types/nodes";

// Re-export types for convenience
export type { DeploymentNodeData };
export type WorkflowNodeData = WorkflowNodeDataType;
export type DeploymentRequest = DeploymentNodeData;

interface WorkflowState {
  nodeUpdateHandler: ((nodeId: string, data: WorkflowNodeData) => void) | null;
  settingsOpenHandler:
    | ((nodeId: string, data: WorkflowNodeData) => void)
    | null;
  editable: boolean;

  setNodeUpdateHandler: (
    handler: ((nodeId: string, data: WorkflowNodeData) => void) | null
  ) => void;
  setSettingsOpenHandler: (
    handler: ((nodeId: string, data: WorkflowNodeData) => void) | null
  ) => void;
  setEditable: (editable: boolean) => void;

  // Direct methods for updating nodes
  updateNodeData: (nodeId: string, data: WorkflowNodeData) => void;
  openNodeSettings: (nodeId: string, data: WorkflowNodeData) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodeUpdateHandler: null,
  settingsOpenHandler: null,
  editable: true,

  setNodeUpdateHandler: handler => set({ nodeUpdateHandler: handler }),
  setSettingsOpenHandler: handler => set({ settingsOpenHandler: handler }),
  setEditable: editable => set({ editable }),

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
