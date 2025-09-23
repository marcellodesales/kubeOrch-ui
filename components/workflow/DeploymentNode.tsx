import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import { DeploymentNodeData } from "@/lib/types/nodes";

export type { DeploymentNodeData };

const DeploymentNode = memo(
  ({ data, id }: ReactFlowNodeProps<DeploymentNodeData>) => {
    const { updateNodeData, openNodeSettings } = useWorkflowStore();

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
        value: data.parameters?.image || "",
        placeholder: "myorg/backend:1.0",
        hasError: data.hasValidationError && !data.parameters?.image,
        onChange: value => handleUpdate("parameters.image", value),
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
            value: data.parameters?.replicas || 1,
            min: 1,
            required: false,
            onChange: value => handleUpdate("parameters.replicas", value),
          },
          {
            id: `port-${id}`,
            label: "Port",
            type: "number",
            value: data.parameters?.port || 8080,
            min: 1,
            max: 65535,
            required: false,
            onChange: value => handleUpdate("parameters.port", value),
          },
        ],
      },
    ];

    return (
      <Node title="Deployment" fields={fields} onSettingsClick={openSettings} />
    );
  }
);

DeploymentNode.displayName = "DeploymentNode";

export default DeploymentNode;
