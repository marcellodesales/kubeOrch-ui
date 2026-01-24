import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { DeploymentNodeData } from "@/lib/types/nodes";
import { Package } from "lucide-react";

export type { DeploymentNodeData };

const DeploymentNode = memo(
  ({ data, id }: ReactFlowNodeProps<DeploymentNodeData>) => {
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
        placeholder: "myorg/backend:1.0",
        hasError: data.hasValidationError && !data.image,
        onChange: value => handleUpdate("image", value),
      },
      {
        id: `group-${id}`,
        label: "",
        type: "group",
        fields: [
          {
            id: `replicas-${id}`,
            label: "Replicas",
            type: "number",
            value: data.replicas,
            placeholder: "1",
            min: 0,
            required: false,
            onChange: value => handleUpdate("replicas", value),
          },
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
        ],
      },
    ];

    return (
      <Node
        title="Deployment"
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
        icon={Package}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-500/10"
      />
    );
  }
);

DeploymentNode.displayName = "DeploymentNode";

export default DeploymentNode;
