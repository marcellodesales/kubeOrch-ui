import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { NetworkPolicyNodeData } from "@/lib/types/nodes";
import { Shield } from "lucide-react";

export type { NetworkPolicyNodeData };

const NetworkPolicyNode = memo(
  ({ data, id }: ReactFlowNodeProps<NetworkPolicyNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean | string[]) => {
        const updatedData = { ...data, [field]: value };
        updateNodeData(id, updatedData);
      },
      [data, id, updateNodeData]
    );

    const handlePolicyTypeToggle = useCallback(
      (type: "Ingress" | "Egress") => {
        const currentTypes = data.policyTypes || [];
        let newTypes: ("Ingress" | "Egress")[];

        if (currentTypes.includes(type)) {
          // Remove if already present (but keep at least one)
          newTypes = currentTypes.filter(t => t !== type);
          if (newTypes.length === 0) {
            newTypes = [type]; // Keep at least one
          }
        } else {
          // Add if not present
          newTypes = [...currentTypes, type];
        }

        handleUpdate("policyTypes", newTypes);
      },
      [data.policyTypes, handleUpdate]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data);
    }, [id, data, openNodeSettings]);

    const hasIngress = data.policyTypes?.includes("Ingress");
    const hasEgress = data.policyTypes?.includes("Egress");

    const fields: NodeField[] = [
      {
        id: `podSelector-info-${id}`,
        label: "Pod Selector",
        type: "text",
        value:
          data.podSelector && Object.keys(data.podSelector).length > 0
            ? Object.entries(data.podSelector)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")
            : "",
        placeholder: data._linkedWorkloads?.length
          ? "Auto-linked"
          : "app=myapp",
        onChange: () => {}, // Read-only, use settings for complex editing
      },
    ];

    return (
      <Node
        title="NetworkPolicy"
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
        icon={Shield}
        iconColor="text-red-600"
        iconBgColor="bg-red-500/10"
        hideTargetHandle
        singleSourceHandle
      >
        <div className="flex gap-2 mt-2 px-2 pb-2">
          <button
            type="button"
            onClick={() => handlePolicyTypeToggle("Ingress")}
            className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
              hasIngress
                ? "bg-blue-500/20 border-blue-500 text-blue-600"
                : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600"
            }`}
            disabled={!editable}
          >
            Ingress
          </button>
          <button
            type="button"
            onClick={() => handlePolicyTypeToggle("Egress")}
            className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
              hasEgress
                ? "bg-green-500/20 border-green-500 text-green-600"
                : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600"
            }`}
            disabled={!editable}
          >
            Egress
          </button>
        </div>
      </Node>
    );
  }
);

NetworkPolicyNode.displayName = "NetworkPolicyNode";

export default NetworkPolicyNode;
