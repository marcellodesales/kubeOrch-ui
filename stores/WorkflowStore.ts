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

  // Secret values storage (nodeId -> { key: value })
  // These are NOT persisted to DB - only used at runtime for pass-through to K8s
  secretValues: Record<string, Record<string, string>>;

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

  // Secret value methods (pass-through - not persisted)
  setSecretValue: (nodeId: string, key: string, value: string) => void;
  removeSecretKey: (nodeId: string, oldKey: string) => void;
  renameSecretKey: (nodeId: string, oldKey: string, newKey: string) => void;
  getSecretValues: () => Record<string, Record<string, string>>;
  clearSecretValues: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodeUpdateHandler: null,
  settingsOpenHandler: null,
  editable: true,
  secretValues: {},

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

  // Secret value methods - these values are NOT persisted to DB
  setSecretValue: (nodeId: string, key: string, value: string) => {
    set(state => ({
      secretValues: {
        ...state.secretValues,
        [nodeId]: {
          ...(state.secretValues[nodeId] || {}),
          [key]: value,
        },
      },
    }));
  },

  removeSecretKey: (nodeId: string, oldKey: string) => {
    set(state => {
      const nodeSecrets = { ...(state.secretValues[nodeId] || {}) };
      delete nodeSecrets[oldKey];
      return {
        secretValues: {
          ...state.secretValues,
          [nodeId]: nodeSecrets,
        },
      };
    });
  },

  renameSecretKey: (nodeId: string, oldKey: string, newKey: string) => {
    set(state => {
      const nodeSecrets = { ...(state.secretValues[nodeId] || {}) };
      const value = nodeSecrets[oldKey] || "";
      delete nodeSecrets[oldKey];
      nodeSecrets[newKey] = value;
      return {
        secretValues: {
          ...state.secretValues,
          [nodeId]: nodeSecrets,
        },
      };
    });
  },

  getSecretValues: () => get().secretValues,

  clearSecretValues: () => set({ secretValues: {} }),
}));

export default useWorkflowStore;
