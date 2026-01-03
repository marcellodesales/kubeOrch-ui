import React, { memo, useCallback } from "react";
import { NodeProps as ReactFlowNodeProps } from "reactflow";
import Node, { NodeField } from "./Node";
import { useWorkflowStore, WorkflowNodeData } from "@/stores/WorkflowStore";
import { ServiceNodeData } from "@/lib/types/nodes";

export type { ServiceNodeData };

const ServiceNode = memo(
  ({ data, id }: ReactFlowNodeProps<ServiceNodeData>) => {
    const { updateNodeData, openNodeSettings, editable } = useWorkflowStore();

    const handleUpdate = useCallback(
      (field: string, value: string | number | boolean) => {
        const paths = field.split(".");
        const updatedData = { ...data } as ServiceNodeData;
        let current: Record<string, unknown> = updatedData as unknown as Record<
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
        updateNodeData(id, updatedData as unknown as WorkflowNodeData);
      },
      [data, id, updateNodeData]
    );

    const openSettings = useCallback(() => {
      openNodeSettings(id, data as unknown as WorkflowNodeData);
    }, [id, data, openNodeSettings]);

    // Check if Service is linked to a Deployment via edge
    const isLinked = !!data._linkedDeployment;

    const fields: NodeField[] = [
      // Only show targetApp field if not linked via edge
      ...(!isLinked
        ? [
            {
              id: `targetApp-${id}`,
              label: "Target App",
              type: "text" as const,
              value: data.targetApp || "",
              placeholder: "my-app",
              hasError: data.hasValidationError && !data.targetApp,
              onChange: (value: string | number | boolean) =>
                handleUpdate("targetApp", value),
            },
          ]
        : []),
      {
        id: `group-${id}`,
        label: "",
        type: "group",
        fields: [
          {
            id: `serviceType-${id}`,
            label: "Type",
            type: "select",
            value: data.serviceType || "ClusterIP",
            options: [
              { value: "ClusterIP", label: "ClusterIP" },
              { value: "NodePort", label: "NodePort" },
              { value: "LoadBalancer", label: "LB" },
            ],
            onChange: value => handleUpdate("serviceType", value),
          },
          {
            id: `port-${id}`,
            label: "Port",
            type: "number",
            value: data.port ?? 80,
            placeholder: "80",
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
        title="Service"
        fields={fields}
        onSettingsClick={openSettings}
        disabled={!editable}
      />
    );
  }
);

ServiceNode.displayName = "ServiceNode";

export default ServiceNode;
