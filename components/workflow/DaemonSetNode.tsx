import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { DaemonSetNodeData } from "@/lib/types/nodes";
import { Layers } from "lucide-react";

export type { DaemonSetNodeData };

const DaemonSetNode = memo(
  ({ data, id }: ReactFlowNodeProps<DaemonSetNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean) => {
        const paths = field.split(".");
        const updatedData = { ...data };
        let current: Record<string, unknown> = updatedData as Record<
          string,
          unknown
        >;

        for (let i = 0; i < paths.length - 1; i++) {
          if (!current[paths[i]]) {
            current[paths[i]] = {};
          }
          current = current[paths[i]] as Record<string, unknown>;
        }

        current[paths[paths.length - 1]] = value;
        updateNodeData(id, updatedData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data);
    }, [id, data, openNodeSettings]);

    const fields: NodeField[] = [
      {
        id: `image-${id}`,
        label: "Docker Image",
        type: "text",
        value: data.image || "",
        placeholder: "fluentd:v1.16",
        hasError: data.hasValidationError && !data.image,
        onChange: value => handleUpdate("image", value),
      },
      {
        id: `group-${id}`,
        label: "",
        type: "group",
        fields: [
          {
            id: `port-${id}`,
            label: "Port",
            type: "number",
            value: data.port,
            placeholder: "8080",
            min: 1,
            max: 65535,
            required: false,
            onChange: value => handleUpdate("port", value),
          },
          {
            id: `updateStrategy-${id}`,
            label: "Update",
            type: "select",
            value: data.updateStrategy || "RollingUpdate",
            options: [
              { value: "RollingUpdate", label: "Rolling" },
              { value: "OnDelete", label: "OnDelete" },
            ],
            onChange: value => handleUpdate("updateStrategy", value),
          },
        ],
      },
    ];

    return (
      <Node
        title="DaemonSet"
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
        icon={Layers}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-500/10"
      />
    );
  }
);

DaemonSetNode.displayName = "DaemonSetNode";

export default DaemonSetNode;
