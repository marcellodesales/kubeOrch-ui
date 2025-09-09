import { create } from "zustand";
import { DeploymentRequest } from "@/lib/services/deployment";

interface WorkflowState {
  nodeUpdateHandler: ((nodeId: string, data: DeploymentRequest) => void) | null;
  settingsOpenHandler:
    | ((nodeId: string, data: DeploymentRequest) => void)
    | null;

  setNodeUpdateHandler: (
    handler: (nodeId: string, data: DeploymentRequest) => void
  ) => void;
  setSettingsOpenHandler: (
    handler: (nodeId: string, data: DeploymentRequest) => void
  ) => void;

  updateNodeData: (nodeId: string, data: DeploymentRequest) => void;
  openNodeSettings: (nodeId: string, data: DeploymentRequest) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodeUpdateHandler: null,
  settingsOpenHandler: null,

  setNodeUpdateHandler: handler => set({ nodeUpdateHandler: handler }),
  setSettingsOpenHandler: handler => set({ settingsOpenHandler: handler }),

  updateNodeData: (nodeId, data) => {
    const { nodeUpdateHandler } = get();
    if (nodeUpdateHandler) {
      nodeUpdateHandler(nodeId, data);
    }
  },

  openNodeSettings: (nodeId, data) => {
    const { settingsOpenHandler } = get();
    if (settingsOpenHandler) {
      settingsOpenHandler(nodeId, data);
    }
  },
}));
